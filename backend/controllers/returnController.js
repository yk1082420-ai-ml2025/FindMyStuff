const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Item = require('../models/Item');
const Claim = require('../models/Claim');

// @desc    Mark item as returned and auto-lock chat
// @route   POST /api/return
// @access  Private
exports.markItemReturned = async (req, res) => {
    try {
        const { itemId, chatId } = req.body;
        const userId = req.user.id;

        // 1. Item එක සොයන්න
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // 2. User එකට අයිතිය තියෙනවද? (Item owner පමණයි return කරන්න පුළුවන්)
        if (item.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only item owner can mark as returned'
            });
        }

        // 3. Item status එක update කරන්න
        item.status = 'RETURNED';
        item.returnedAt = new Date();
        await item.save();

        // 4. 🔒 AUTO-LOCK THE CHAT
        const chat = await Chat.findById(chatId);
        if (chat && chat.status === 'ACTIVE') {
            chat.status = 'LOCKED';
            chat.lockedAt = new Date();
            await chat.save();

            // 5. System message එකක් එකතු කරන්න
            await Message.create({
                chatId: chatId,
                senderId: userId,
                content: '✅ Item has been returned. This chat is now locked and read-only.',
                type: 'SYSTEM'
            });

            // 6. Claim එකත් update කරන්න (if exists)
            const claim = await Claim.findOne({ 
                itemId: itemId,
                status: 'approved' 
            });
            if (claim) {
                claim.status = 'resolved';
                claim.resolvedAt = new Date();
                claim.resolvedBy = userId;
                await claim.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Item marked as returned and chat locked',
            data: {
                itemId: itemId,
                chatId: chatId,
                itemStatus: item.status,
                chatStatus: chat?.status || 'NOT_FOUND',
                lockedAt: chat?.lockedAt || null
            }
        });

    } catch (error) {
        console.error('Return error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing return',
            error: error.message
        });
    }
};

// @desc    Check if item is returned
// @route   GET /api/return/check/:itemId
// @access  Private
exports.checkReturnStatus = async (req, res) => {
    try {
        const item = await Item.findById(req.params.itemId);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        const chat = await Chat.findOne({ itemId: req.params.itemId });

        res.status(200).json({
            success: true,
            data: {
                isReturned: item.status === 'RETURNED',
                returnedAt: item.returnedAt || null,
                itemStatus: item.status,
                chatStatus: chat?.status || null,
                chatLocked: chat?.status === 'LOCKED'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking return status',
            error: error.message
        });
    }
};