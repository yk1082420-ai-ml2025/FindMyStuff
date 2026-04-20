const Chat = require('../models/Chat');
const Message = require('../models/Message');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');

// @desc    Get all chats for the authenticated user
// @route   GET /api/chats
// @access  Private
exports.getMyChats = async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user._id })
            .populate('participants', 'fullName studentId')
            .sort({ lastMessageAt: -1 });

        // Enrich each chat with item details
        const enriched = await Promise.all(chats.map(async (chat) => {
            const ItemModel = chat.itemType === 'found' ? FoundItem : LostItem;
            const item = await ItemModel.findById(chat.itemId)
                .select('title images status postedBy');
            const otherUser = chat.participants.find(p => p._id.toString() !== req.user._id.toString());
            return {
                ...chat.toObject(),
                item,
                otherUser
            };
        }));

        res.status(200).json({ success: true, data: enriched });
    } catch (error) {
        console.error('getMyChats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single chat by ID with messages
// @route   GET /api/chats/:id
// @access  Private
exports.getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
            .populate('participants', 'fullName studentId');

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
            });
        }

        const isParticipant = chat.participants.some(
            (p) => p._id.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this chat',
            });
        }

        const ItemModel = chat.itemType === 'found' ? FoundItem : LostItem;
        const item = await ItemModel.findById(chat.itemId)
            .select('title images status postedBy');
        const otherUser = chat.participants.find(p => p._id.toString() !== req.user._id.toString());

        // Reset unread count for this user
        const unreadCount = chat.unreadCount || new Map();
        unreadCount.set(req.user._id.toString(), 0);
        chat.unreadCount = unreadCount;

        await chat.save();

        res.status(200).json({
            success: true,
            data: {
                ...chat.toObject(),
                item,
                otherUser,
            },
        });
    } catch (error) {
        console.error('getChatById error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};