const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Claim = require('../models/Claim');
const Item = require('../models/Item');

// @desc    Create a new chat
// @route   POST /api/chats
// @access  Private
const createChat = async (req, res) => {
    try {
        const { claimId, itemId, itemType, otherUserId } = req.body;
        const userId = req.user.id;

        // Check if other user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify claim exists if provided
        if (claimId) {
            const claim = await Claim.findById(claimId);
            if (!claim) {
                return res.status(404).json({
                    success: false,
                    message: 'Claim not found'
                });
            }
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
                message: 'Chat already exists between these users for this item'
            });
        }

        // Create new chat
        const chat = await Chat.create({
            claimId: claimId || null,
            participants: [userId, otherUserId],
            itemId,
            itemType,
            status: 'ACTIVE'
        });

        // Populate participant details
        const populatedChat = await Chat.findById(chat._id)
            .populate('participants', 'fullName email profilePhoto');

        res.status(201).json({
            success: true,
            data: populatedChat
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating chat',
            error: error.message
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
            .populate('participants', 'fullName profilePhoto email') // email එක populate වෙනවා
            .sort({ lastMessageAt: -1 });

        // 🔒 Format response - hide email
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
                    // ❌ email එක නැහැ
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
                unreadCount: 0
            };
        });

        res.status(200).json({
            success: true,
            count: formattedChats.length,
            data: formattedChats
        });
    } catch (error) {
        // error handling
    }
};
// @desc    Get single chat with messages
// @route   GET /api/chats/:id
// @access  Private
// ඔබගේ existing getChatById function එකේ participants return කරන කොටස වෙනස් කරන්න

const getChatById = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        const chat = await Chat.findById(chatId)
            .populate('participants', 'fullName profilePhoto email'); // email එක populate වෙනවා

        // ... existing validation ...

        const messages = await Message.find({ chatId }).populate('senderId', 'fullName profilePhoto').sort({ createdAt: 1 });

        // 🔒 NEW: Hide email from participants
        const safeParticipants = chat.participants.map(participant => {
            const safeParticipant = {
                _id: participant._id,
                fullName: participant.fullName,
                profilePhoto: participant.profilePhoto
                // ❌ email එක exclude කරනවා
            };
            return safeParticipant;
        });

        res.status(200).json({
            success: true,
            data: {
                chat: {
                    _id: chat._id,
                    claimId: chat.claimId,
                    participants: safeParticipants,  // ✅ Safe version
                    status: chat.status
                },
                messages: messages,
                isLocked: chat.status === 'LOCKED',
                lockMessage: chat.status === 'LOCKED' ? 'This chat is locked. Item has been returned.' : null
            }
        });
    } catch (error) {
        // error handling
    }
};

// @desc    Lock a chat
// @route   PUT /api/chats/:id/lock
// @access  Private
const lockChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user.id;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        if (!chat.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to lock this chat'
            });
        }

        // Update chat status
        chat.status = 'LOCKED';
        chat.lockedAt = new Date();
        await chat.save();

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
            error: error.message
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
                lastMessage: chat.lastMessage
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
            error: error.message
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

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        if (!chat.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                status: chat.status,
                isLocked: chat.status === 'LOCKED',
                lockedAt: chat.lockedAt,
                canSendMessages: chat.status !== 'LOCKED'
            }
        });
    } catch (error) {
        console.error('Get chat status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat status',
            error: error.message
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