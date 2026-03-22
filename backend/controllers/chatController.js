const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Claim = require('../models/Claim');
const mongoose = require('mongoose');

// @desc    Create a new chat
// @route   POST /api/chats
// @access  Private
const createChat = async (req, res) => {
    try {
        const { claimId, itemId, itemType, otherUserId } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!itemId || !itemType || !otherUserId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: itemId, itemType, and otherUserId are required'
            });
        }

        // Check if other user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Handle claimId - only validate if it's a valid ObjectId
        if (claimId) {
            // Check if claimId is a valid MongoDB ObjectId (24 hex chars)
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(claimId);
            
            if (isValidObjectId) {
                // Only query Claim if it's a real ObjectId
                const claim = await Claim.findById(claimId);
                if (!claim) {
                    return res.status(404).json({
                        success: false,
                        message: 'Claim not found'
                    });
                }
            }
            // If claimId is a custom string like "CLAIM001", skip validation
            // This allows testing without actual claims
        }

        // Check if chat already exists
        const existingChat = await Chat.findOne({
            participants: { $all: [userId, otherUserId] },
            itemId: itemId,
            status: { $ne: 'ARCHIVED' }
        });

        if (existingChat) {
            return res.status(400).json({
                success: false,
                message: 'Chat already exists between these users for this item',
                data: {
                    chatId: existingChat._id,
                    isLocked: existingChat.status === 'LOCKED'
                }
            });
        }

        // Create new chat - accept any claimId (string or null)
        const chat = await Chat.create({
            claimId: claimId || null,
            participants: [userId, otherUserId],
            itemId,
            itemType,
            status: 'ACTIVE',
            lastMessage: 'Chat created',
            lastMessageAt: new Date()
        });

        // Populate participant details
        const populatedChat = await Chat.findById(chat._id)
            .populate('participants', 'fullName profilePhoto');

        res.status(201).json({
            success: true,
            data: {
                _id: populatedChat._id,
                participants: populatedChat.participants,
                itemId: populatedChat.itemId,
                itemType: populatedChat.itemType,
                status: populatedChat.status,
                claimId: populatedChat.claimId,
                createdAt: populatedChat.createdAt
            }
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating chat',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all chats for logged in user
// @route   GET /api/chats
// @access  Private
const getChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await Chat.find({
            participants: userId,
            status: { $ne: 'ARCHIVED' }
        })
            .populate('participants', 'fullName profilePhoto')
            .sort({ lastMessageAt: -1 });

        // Format response - hide email
        const formattedChats = chats.map(chat => {
            const otherUser = chat.participants.find(
                p => p._id.toString() !== userId
            );
            
            // Get unread count for this user
            const unreadCount = chat.unreadCount?.get(userId.toString()) || 0;
            
            return {
                _id: chat._id,
                otherUser: {
                    id: otherUser._id,
                    fullName: otherUser.fullName,
                    profilePhoto: otherUser.profilePhoto
                },
                item: {
                    id: chat.itemId,
                    title: null,
                    image: null
                },
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
                status: chat.status,
                isLocked: chat.status === 'LOCKED',
                unreadCount: unreadCount
            };
        });

        res.status(200).json({
            success: true,
            count: formattedChats.length,
            data: formattedChats
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get single chat with messages
// @route   GET /api/chats/:id
// @access  Private
const getChatById = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid chat ID format'
            });
        }

        const chat = await Chat.findById(chatId)
            .populate('participants', 'fullName profilePhoto');

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        const isParticipant = chat.participants.some(p => p._id.toString() === userId);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this chat'
            });
        }

        // Get messages
        const messages = await Message.find({ chatId })
            .populate('senderId', 'fullName profilePhoto')
            .sort({ createdAt: 1 });

        // Hide email from participants
        const safeParticipants = chat.participants.map(participant => ({
            _id: participant._id,
            fullName: participant.fullName,
            profilePhoto: participant.profilePhoto
        }));

        // Mark unread messages as read for current user
        if (chat.unreadCount && chat.unreadCount.get(userId) > 0) {
            chat.unreadCount.set(userId, 0);
            await chat.save();
        }

        res.status(200).json({
            success: true,
            data: {
                chat: {
                    _id: chat._id,
                    claimId: chat.claimId,
                    participants: safeParticipants,
                    status: chat.status,
                    itemId: chat.itemId,
                    itemType: chat.itemType,
                    createdAt: chat.createdAt
                },
                messages: messages.map(msg => ({
                    _id: msg._id,
                    content: msg.content,
                    senderId: msg.senderId,
                    type: msg.type,
                    isEdited: msg.isEdited || false,
                    editedAt: msg.editedAt,
                    isDeleted: msg.isDeleted || false,
                    createdAt: msg.createdAt
                })),
                isLocked: chat.status === 'LOCKED',
                lockMessage: chat.status === 'LOCKED' ? 'This chat is locked. Item has been returned.' : null
            }
        });
    } catch (error) {
        console.error('Get chat by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Lock a chat
// @route   PUT /api/chats/:id/lock
// @access  Private
const lockChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid chat ID format'
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        if (!chat.participants.includes(userId.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to lock this chat'
            });
        }

        // Check if already locked
        if (chat.status === 'LOCKED') {
            return res.status(400).json({
                success: false,
                message: 'Chat is already locked',
                data: {
                    lockedAt: chat.lockedAt
                }
            });
        }

        // Update chat status
        chat.status = 'LOCKED';
        chat.lockedAt = new Date();
        await chat.save();

        // Add system message
        await Message.create({
            chatId: chat._id,
            senderId: userId,
            content: '🔒 This chat has been locked. Item has been returned.',
            type: 'SYSTEM'
        });

        res.status(200).json({
            success: true,
            data: {
                _id: chat._id,
                status: chat.status,
                lockedAt: chat.lockedAt
            },
            message: 'Chat locked successfully'
        });
    } catch (error) {
        console.error('Lock chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error locking chat',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get locked chats
// @route   GET /api/chats/locked
// @access  Private
const getLockedChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const chats = await Chat.find({
            participants: userId,
            status: 'LOCKED'
        })
            .populate('participants', 'fullName profilePhoto')
            .sort({ lockedAt: -1 });

        const formattedChats = chats.map(chat => {
            const otherUser = chat.participants.find(
                p => p._id.toString() !== userId
            );
            
            return {
                _id: chat._id,
                otherUser: {
                    id: otherUser._id,
                    fullName: otherUser.fullName,
                    profilePhoto: otherUser.profilePhoto
                },
                item: {
                    id: chat.itemId,
                    title: null,
                    image: null
                },
                lockedAt: chat.lockedAt,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt
            };
        });

        res.status(200).json({
            success: true,
            count: formattedChats.length,
            data: formattedChats
        });
    } catch (error) {
        console.error('Get locked chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching locked chats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get chat status
// @route   GET /api/chats/:id/status
// @access  Private
const getChatStatus = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid chat ID format'
            });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        if (!chat.participants.includes(userId.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: chat._id,
                status: chat.status,
                isLocked: chat.status === 'LOCKED',
                lockedAt: chat.lockedAt,
                canSendMessages: chat.status !== 'LOCKED',
                participants: chat.participants.length,
                itemId: chat.itemId,
                itemType: chat.itemType
            }
        });
    } catch (error) {
        console.error('Get chat status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createChat,
    getChats,
    getChatById,
    lockChat,
    getLockedChats,
    getChatStatus
};