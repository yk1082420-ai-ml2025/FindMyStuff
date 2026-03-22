const FoundItem = require('../models/FoundItem');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// @desc    Create a found item post
// @route   POST /api/found
// @access  Private
const createFoundItem = async (req, res) => {
    try {
        const { title, description, category, foundLocation, dateFound, color, brand } = req.body;

        // Handle uploaded images
        const images = req.files ? req.files.map(f => `/uploads/found/${f.filename}`) : [];

        const foundItem = await FoundItem.create({
            title,
            description,
            category: category || 'Other',
            foundLocation,
            dateFound: dateFound ? new Date(dateFound) : new Date(),
            color: color || '',
            brand: brand || '',
            images,
            status: 'Found',
            postedBy: req.user._id,
        });

        // Update user activity history
        await User.findByIdAndUpdate(req.user._id, {
            $push: { 'activityHistory.foundPosts': foundItem._id },
        });

        const populated = await foundItem.populate('postedBy', 'fullName studentId email');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Create found item error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all found items with search & filter
// @route   GET /api/found
// @access  Public
const getFoundItems = async (req, res) => {
    try {
        const {
            q,
            category,
            status,
            location,
            color,
            brand,
            dateFrom,
            dateTo,
            page = 1,
            limit = 12,
            myPosts,
        } = req.query;

        const query = { isArchived: false };

        // Keyword search (Title starts with)
        if (q) {
            query.title = { $regex: '^' + q, $options: 'i' };
        }

        // Filters
        if (category && category !== 'All') query.category = category;
        if (location) query.foundLocation = { $regex: location, $options: 'i' };
        if (color) query.color = { $regex: color, $options: 'i' };
        if (brand) query.brand = { $regex: brand, $options: 'i' };

        // Status filter
        const VALID_STATUSES = ['Lost', 'Found', 'Claimed', 'Returned', 'Archived'];
        if (status && VALID_STATUSES.includes(status)) {
            // Specific status selected
            query.status = status;
        } else {
            // 'All', 'All Active', or undefined → show all non-archived
            query.status = { $in: ['Lost', 'Found', 'Claimed', 'Returned'] };
        }

        // Date filter
        if (dateFrom || dateTo) {
            query.dateFound = {};
            if (dateFrom) query.dateFound.$gte = new Date(dateFrom);
            if (dateTo) query.dateFound.$lte = new Date(dateTo);
        }

        // My posts only
        if (myPosts === 'true' && req.user) {
            query.postedBy = req.user._id;
        }

        const total = await FoundItem.countDocuments(query);
        const items = await FoundItem.find(query)
            .populate('postedBy', 'fullName studentId email')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            items,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
        });
    } catch (error) {
        console.error('Get found items error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single found item
// @route   GET /api/found/:id
// @access  Public
const getFoundItemById = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id).populate('postedBy', 'fullName studentId email');
        if (!item) return res.status(404).json({ message: 'Found item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a found item
// @route   PUT /api/found/:id
// @access  Private (owner or admin)
const updateFoundItem = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Found item not found' });

        // Only owner or admin can update
        if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        // Block edits on returned/archived items (unless admin)
        if ((item.status === 'Returned' || item.isArchived) && req.user.role !== 'admin') {
            return res.status(400).json({ message: 'Cannot edit a returned or archived item' });
        }

        const { title, description, category, foundLocation, dateFound, color, brand, status } = req.body;

        if (title) item.title = title;
        if (description) item.description = description;
        if (category) item.category = category;
        if (foundLocation) item.foundLocation = foundLocation;
        if (dateFound) item.dateFound = new Date(dateFound);
        if (color !== undefined) item.color = color;
        if (brand !== undefined) item.brand = brand;
        if (status) item.status = status;

        // Handle new images (append)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => `/uploads/found/${f.filename}`);
            item.images = [...item.images, ...newImages];
        }

        const updated = await item.save();
        const populated = await updated.populate('postedBy', 'fullName studentId email');
        res.json(populated);
    } catch (error) {
        console.error('Update found item error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update status of a found item
// @route   PATCH /api/found/:id/status
// @access  Private (owner or admin)
const updateFoundItemStatus = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Found item not found' });

        if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { status } = req.body;
        const validStatuses = ['Lost', 'Found', 'Claimed', 'Returned', 'Archived'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        item.status = status;
        if (status === 'Archived') item.isArchived = true;

        const updated = await item.save();
        const populated = await updated.populate('postedBy', 'fullName studentId email');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Archive (soft-delete) a found item
// @route   DELETE /api/found/:id
// @access  Private (owner or admin)
const deleteFoundItem = async (req, res) => {
    try {
        const item = await FoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Found item not found' });

        if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        item.isArchived = true;
        item.status = 'Archived';
        await item.save();

        res.json({ message: 'Item archived successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get keyword suggestions
// @route   GET /api/found/suggestions
// @access  Public
const getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 1) return res.json([]);

        // Find unique titles matching the query
        const items = await FoundItem.find({
            title: { $regex: q, $options: 'i' },
            isArchived: false
        })
        .limit(10)
        .select('title category');

        // Extract unique formatted suggestions
        const suggestions = [...new Set(items.map(item => item.title))];
        
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createFoundItem,
    getFoundItems,
    getFoundItemById,
    updateFoundItem,
    updateFoundItemStatus,
    deleteFoundItem,
    getSuggestions,
};
