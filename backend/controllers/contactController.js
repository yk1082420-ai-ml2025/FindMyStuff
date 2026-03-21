const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Item = require('../models/Item');  // Item model එක import කරන්න
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Contact user about an item (auto-create chat)
// @route   POST /api/contact
// @access  Private
exports.contactUser = async (req, res) => {
    try {
        const { itemId, itemType } = req.body; // itemType: 'lost' or 'found'
        const currentUserId = req.user.id;

        // 1. Item එක සොයන්න
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const otherUserId = item.userId; // Item එකේ හිමිකරු

        // 2. ඔයාම ඔයාට contact කරන්න හදනවාද?
        if (currentUserId === otherUserId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot contact yourself'
            });
        }

        // 3. දැනටමත් chat එකක් තිබේද?
        let existingChat = await Chat.findOne({
            participants: { $all: [currentUserId, otherUserId] },
            itemId: itemId,
            status: { $ne: 'ARCHIVED' }
        });

        if (existingChat) {
            return res.status(200).json({
                success: true,
                message: 'Chat already exists',
                chatId: existingChat._id,
                isNew: false
            });
        }

        // 4. අලුත් chat එකක් හදන්න
        const newChat = await Chat.create({
            claimId: new mongoose.Types.ObjectId(), // Temporary claim ID
            participants: [currentUserId, otherUserId],
            status: 'ACTIVE',
            itemId: itemId,
            itemType: itemType,
            lastMessage: 'Chat created - Start messaging!',
            lastMessageAt: new Date(),
            unreadCount: new Map()
        });

        // 5. System message එකක් එකතු කරන්න
        await Message.create({
            chatId: newChat._id,
            senderId: currentUserId,
            content: '💬 Chat started. You can now message each other about this item.',
            type: 'SYSTEM'
        });

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            chatId: newChat._id,
            isNew: true
        });

    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating chat',
            error: error.message
        });
    }
};