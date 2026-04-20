const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, content } = req.body;

        // Optionally validate that chatId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ success: false, message: 'Invalid chat ID format' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        // Debug logs (remove in production)
        console.log('Chat participants:', chat.participants.map(p => p.toString()));
        console.log('Current user ID:', req.user._id.toString());

        // Use .equals() for robust comparison (handles both ObjectId and string)
        const isParticipant = chat.participants.some(p => p.equals(req.user._id));
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'You are not a participant in this chat' });
        }

        if (chat.status === 'LOCKED') {
            return res.status(400).json({ success: false, message: 'This chat is closed and no longer accepts messages' });
        }

        const message = await Message.create({
            chatId,
            senderId: req.user._id,
            content: content.trim(),
            type: 'TEXT'
        });

        // Update chat's last message
        chat.lastMessage = content.trim().substring(0, 100);
        chat.lastMessageAt = new Date();

        // Increment unread for all other participants
        const unreadCount = chat.unreadCount || new Map();
        chat.participants.forEach(pId => {
            if (!pId.equals(req.user._id)) {
                unreadCount.set(pId.toString(), (unreadCount.get(pId.toString()) || 0) + 1);
            }
        });
        chat.unreadCount = unreadCount;
        await chat.save();

        const populated = await message.populate('senderId', 'fullName studentId');

        // Emit via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(chatId).emit('message_received', populated);
        }

        // Create notifications for other participants (throttled: one per chat)
        const senderName = req.user.fullName || 'Someone';
        for (const pId of chat.participants) {
            if (pId.toString() === req.user._id.toString()) continue;

            // Only create if there's no existing unread message notification for this chat
            const existing = await Notification.findOne({
                recipient: pId,
                type: 'message',
                relatedId: chat._id,
                isRead: false
            });

            if (!existing) {
                const notification = await Notification.create({
                    recipient: pId,
                    type: 'message',
                    title: 'New Message',
                    message: `${senderName}: ${content.trim().substring(0, 80)}`,
                    relatedId: chat._id
                });

                if (io) {
                    io.to(pId.toString()).emit('new_notification', notification);
                }
            }
        }

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ success: false, message: 'Invalid chat ID format' });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found' });
        }

        const isParticipant = chat.participants.some(p => p.equals(req.user._id));
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const messages = await Message.find({ chatId })
            .populate('senderId', 'fullName studentId')
            .sort({ createdAt: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments({ chatId });

        res.status(200).json({
            success: true,
            data: messages,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Edit a message (sender only, within 15 minutes)
// @route   PUT /api/messages/:id/edit
// @access  Private
exports.editMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (!message.senderId.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
        }

        if (message.type === 'SYSTEM') {
            return res.status(400).json({ success: false, message: 'System messages cannot be edited' });
        }

        if (message.isDeleted) {
            return res.status(400).json({ success: false, message: 'Deleted messages cannot be edited' });
        }

        // 15-minute edit window
        const ageInMinutes = (Date.now() - new Date(message.createdAt).getTime()) / 60000;
        if (ageInMinutes > 15) {
            return res.status(400).json({ success: false, message: 'Messages can only be edited within 15 minutes of sending' });
        }

        message.content = req.body.content.trim();
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        const populated = await message.populate('senderId', 'fullName studentId');

        const io = req.app.get('io');
        if (io) {
            io.to(message.chatId.toString()).emit('message_updated', populated);
        }

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        console.error('editMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a message (soft delete, sender only)
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (!message.senderId.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        if (message.type === 'SYSTEM') {
            return res.status(400).json({ success: false, message: 'System messages cannot be deleted' });
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deletedBy = req.user._id;
        message.content = '[Message deleted]';
        await message.save();

        const io = req.app.get('io');
        if (io) {
            io.to(message.chatId.toString()).emit('message_deleted', { messageId: message._id });
        }

        res.status(200).json({ success: true, data: message });
    } catch (error) {
        console.error('deleteMessage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};