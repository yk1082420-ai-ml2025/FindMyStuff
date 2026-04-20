const Notification = require('../models/Notification');

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Notification.countDocuments({ recipient: req.user._id });

        res.status(200).json({
            success: true,
            data: notifications,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('getNotifications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('getUnreadCount error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('markAllAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('deleteNotification error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete all notifications for a user
// @route   DELETE /api/notifications
// @access  Private
exports.deleteAllNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.user._id });

        res.status(200).json({ success: true, message: 'All notifications deleted' });
    } catch (error) {
        console.error('deleteAllNotifications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
