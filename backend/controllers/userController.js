const { validationResult } = require("express-validator");
const User = require("../models/User");

// ==================== STUDENT ROUTES ====================

// @desc    Get own profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { fullName, email, password, profilePhoto, notificationsEnabled } = req.body;

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (password) {
      user.passwordHash = password;
      user.markModified("passwordHash");
    }
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      return res.status(400).json({
        message: field === 'email' ? "Email already in use" : "Student ID already in use"
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Server error during profile update",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete own account
// @route   DELETE /api/users/profile
// @access  Private
const deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN ROUTES ====================

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status !== undefined) query.isActive = status === "true";

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      users,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a user (admin)
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, fullName, email, password, role, isActive } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (userExists) {
      return res.status(400).json({
        message:
          userExists.email === email
            ? "Email already registered"
            : "Student ID already registered",
      });
    }

    const user = await User.create({
      studentId,
      fullName,
      email,
      passwordHash: password,
      role: role || "student",
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a user (admin)
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { studentId, fullName, email, password, role, isActive, points, profilePhoto } =
      req.body;

    if (studentId) user.studentId = studentId;
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (password) {
      user.passwordHash = password;
      user.markModified("passwordHash");
    }
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (points !== undefined) user.points = points;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error("User update error (admin):", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
      return res.status(400).json({
        message: field === 'email' ? "Email already in use" : "Student ID already in use"
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Server error during user update",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete a user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
