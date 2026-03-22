const Notice = require('../models/Notice');
const User = require('../models/User');

// Helper to auto-archive expired notices before fetch operations
const autoArchiveExpiredNotices = async () => {
    try {
        await Notice.updateMany(
            { expiryDate: { $lt: new Date() }, isActive: true },
            { $set: { isActive: false } }
        );
    } catch (error) {
        console.error('Error auto-archiving notices:', error);
    }
};

// @desc    Create a new campus notice
// @route   POST /api/notices
// @access  Private (Admin only)
const createNotice = async (req, res) => {
    try {
        // Only admins can create a notice
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create notices' });
        }

        const { title, content, category, priority, expiryDate, isActive } = req.body;

        // Handle uploaded attachments/images
        const attachments = req.files ? req.files.map(f => `/uploads/notices/${f.filename}`) : [];

        const notice = await Notice.create({
            title,
            content,
            category: category || 'general',
            priority: priority || 'low',
            expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
            isActive: isActive !== undefined ? isActive : true,
            attachments,
            createdBy: req.user._id,
        });

        // Push to admin activity history
        await User.findByIdAndUpdate(req.user._id, {
            $push: { 'activityHistory.noticePosts': notice._id },
        });

        const populated = await notice.populate('createdBy', 'fullName email');
        res.status(201).json(populated);
    } catch (error) {
        console.error('Create notice error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all notices
// @route   GET /api/notices
// @access  Public
const getNotices = async (req, res) => {
    try {
        await autoArchiveExpiredNotices();

        const {
            q,
            category,
            priority,
            active,
            page = 1,
            limit = 12,
            sortBy = 'newest'
        } = req.query;

        const query = {};

        // Keyword search (Title/Content matching)
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } }
            ];
        }

        // Filters
        if (category && category !== 'All') query.category = category;
        if (priority && priority !== 'All') query.priority = priority;

        // Active status filtering
        if (active !== undefined) {
            query.isActive = active === 'true';
        } else {
            // Default to only showing active notices for non-admins, unless specified
            if (!req.user || req.user.role !== 'admin') {
                query.isActive = true;
            }
        }

        // Sorting configuration
        let sortConfig = { createdAt: -1 }; // newest by default
        if (sortBy === 'priority') {
            // MongoDB sorts alphabetically if enum, which breaks "high" > "medium" > "low" implicitly. 
            // Often we manually sort or just leave it for date since standard enum sorting is tricky.
            // Using standard fields for now. 
            sortConfig = { priority: 1, createdAt: -1 }; 
        } else if (sortBy === 'oldest') {
            sortConfig = { createdAt: 1 };
        }

        const total = await Notice.countDocuments(query);
        const notices = await Notice.find(query)
            .populate('createdBy', 'fullName email')
            .sort(sortConfig)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({
            notices,
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
        });
    } catch (error) {
        console.error('Get notices error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a single notice by ID
// @route   GET /api/notices/:id
// @access  Public
const getNoticeById = async (req, res) => {
    try {
        await autoArchiveExpiredNotices();

        const notice = await Notice.findById(req.params.id).populate('createdBy', 'fullName email');
        if (!notice) return res.status(404).json({ message: 'Notice not found' });
        res.json(notice);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a notice
// @route   PUT /api/notices/:id
// @access  Private (Admin only)
const updateNotice = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update notices' });
        }

        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        const { title, content, category, priority, expiryDate, isActive } = req.body;

        if (title) notice.title = title;
        if (content) notice.content = content;
        if (category) notice.category = category;
        if (priority) notice.priority = priority;
        if (expiryDate) notice.expiryDate = new Date(expiryDate);
        if (isActive !== undefined) notice.isActive = isActive;

        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(f => `/uploads/notices/${f.filename}`);
            notice.attachments = [...notice.attachments, ...newAttachments];
        }

        const updated = await notice.save();
        const populated = await updated.populate('createdBy', 'fullName email');
        
        res.json(populated);
    } catch (error) {
        console.error('Update notice error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin only)
const deleteNotice = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete notices' });
        }

        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Notice not found' });

        // Hard delete pattern for notices or soft delete if required
        await Notice.findByIdAndDelete(req.params.id);

        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createNotice,
    getNotices,
    getNoticeById,
    updateNotice,
    deleteNotice,
};
