const Claim = require('../models/Claim');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to get item model by type
const getItemModel = (itemType) => itemType === 'found' ? FoundItem : LostItem;

// @desc    Create a new Claim
// @route   POST /api/claims/:itemType/:itemId
// @access  Private
exports.createClaim = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        const claimantId = req.user._id;

        if (!['found', 'lost'].includes(itemType)) {
            return res.status(400).json({ success: false, message: 'Invalid item type' });
        }

        const ItemModel = getItemModel(itemType);
        const item = await ItemModel.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Items that are already claimed cannot accept new claims
        if (item.status === 'Claimed') {
            return res.status(400).json({ success: false, message: 'This item has already been claimed' });
        }

        if (item.isArchived) {
            return res.status(400).json({ success: false, message: 'This item is archived and cannot be claimed' });
        }

        // Post owner cannot submit a claim on their own post
        if (item.postedBy.toString() === claimantId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot claim an item you posted' });
        }

        // Only one pending or approved claim can exist at a time
        const activeClaim = await Claim.findOne({ itemId, itemType, status: { $in: ['pending', 'approved'] } });
        if (activeClaim) {
            return res.status(400).json({
                success: false,
                message: 'A claim is already being reviewed for this item. Please wait for the post owner to respond.'
            });
        }

        const proofImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

        const claim = await Claim.create({
            itemId,
            itemType,
            claimantId,
            proofDescription: req.body.proofDescription,
            uniqueIdentifiers: req.body.uniqueIdentifiers || '',
            descriptionDetails: req.body.descriptionDetails || '',
            proofImages
        });

        // Track the active claim on the item
        item.activeClaim = claim._id;
        await item.save();

        // Create notification for the post owner
        const claimant = await User.findById(claimantId).select('fullName');
        const notification = await Notification.create({
            recipient: item.postedBy,
            type: 'claim',
            title: 'New Claim on Your Post',
            message: `${claimant?.fullName || 'Someone'} submitted a claim on "${item.title}"`,
            relatedId: claim._id,
            itemType,
            itemId: itemId
        });

        // Push real-time notification via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(item.postedBy.toString()).emit('new_notification', notification);
        }

        res.status(201).json({ success: true, data: claim });
    } catch (error) {
        console.error('createClaim error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all claims for a specific item (for the post owner to review)
// @route   GET /api/claims/:itemType/:itemId
// @access  Private
exports.getClaimsForItem = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        const ItemModel = getItemModel(itemType);
        const item = await ItemModel.findById(itemId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        if (item.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the post owner can view claims for this item' });
        }

        const claims = await Claim.find({ itemId, itemType })
            .populate('claimantId', 'fullName studentId email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: claims });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get claims submitted by the current user
// @route   GET /api/claims/mine
// @access  Private
exports.getMyClaims = async (req, res) => {
    try {
        const claims = await Claim.find({ claimantId: req.user._id })
            .sort({ createdAt: -1 });

        // Populate each claim with item details
        const populated = await Promise.all(claims.map(async (claim) => {
            const ItemModel = getItemModel(claim.itemType);
            const item = await ItemModel.findById(claim.itemId).populate('postedBy', 'fullName email profilePhoto');
            return { ...claim.toObject(), item };
        }));

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get claims received by the current user (claims on their posts)
// @route   GET /api/claims/received
// @access  Private
exports.getReceivedClaims = async (req, res) => {
    try {
        // Find all items posted by this user, then find claims on those items
        const [myFoundIds, myLostIds] = await Promise.all([
            FoundItem.find({ postedBy: req.user._id }).distinct('_id'),
            LostItem.find({ postedBy: req.user._id }).distinct('_id'),
        ]);

        const claims = await Claim.find({
            $or: [
                { itemId: { $in: myFoundIds }, itemType: 'found' },
                { itemId: { $in: myLostIds }, itemType: 'lost' },
            ]
        }).populate('claimantId', 'fullName studentId email').sort({ createdAt: -1 });

        // Enrich each claim with item details
        const populated = await Promise.all(claims.map(async (claim) => {
            const ItemModel = getItemModel(claim.itemType);
            const item = await ItemModel.findById(claim.itemId).populate('postedBy', 'fullName email profilePhoto');
            return { ...claim.toObject(), item };
        }));

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a single claim
// @route   GET /api/claims/:id
// @access  Private
exports.getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id)
            .populate('claimantId', 'fullName studentId email')
            .populate('chatId');

        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        // Only the claimant or the post owner can view a claim
        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);

        if (
            claim.claimantId._id.toString() !== req.user._id.toString() &&
            item?.postedBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: { ...claim.toObject(), item } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve a claim (post owner only)
// @route   PUT /api/claims/:id/approve
// @access  Private
exports.approveClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);

        if (!item || item.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the post owner can approve claims' });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending claims can be approved' });
        }

        claim.status = 'approved';
        await claim.save();

        // Reject all other pending claims for this item
        await Claim.updateMany(
            { itemId: claim.itemId, itemType: claim.itemType, _id: { $ne: claim._id }, status: 'pending' },
            { status: 'rejected' }
        );

        // Auto-create a chat between the two parties
        const chat = await Chat.create({
            claimId: claim._id,
            participants: [item.postedBy, claim.claimantId],
            itemId: claim.itemId,
            itemType: claim.itemType,
            status: 'ACTIVE'
        });

        // Save chatId back to the claim
        claim.chatId = chat._id;
        await claim.save();

        // System message to kick off the conversation
        const action = claim.itemType === 'found' ? 'returning' : 'retrieving';
        await Message.create({
            chatId: chat._id,
            senderId: item.postedBy,
            content: `✅ Claim approved! You can now coordinate ${action} the item here.`,
            type: 'SYSTEM'
        });

        // Notify the claimant that their claim was approved
        const ownerName = req.user.fullName || 'The post owner';
        const notification = await Notification.create({
            recipient: claim.claimantId,
            type: 'message',
            title: 'Claim Approved',
            message: `${ownerName} approved your claim on "${item.title}". A chat has been started.`,
            relatedId: chat._id
        });

        const io = req.app.get('io');
        if (io) {
            io.to(claim.claimantId.toString()).emit('new_notification', notification);
        }

        res.status(200).json({
            success: true,
            message: 'Claim approved and chat created',
            data: claim,
            chatId: chat._id
        });
    } catch (error) {
        console.error('approveClaim error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject a claim (post owner only)
// @route   PUT /api/claims/:id/reject
// @access  Private
exports.rejectClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);

        if (!item || item.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the post owner can reject claims' });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending claims can be rejected' });
        }

        claim.status = 'rejected';
        claim.rejectionReason = req.body.reason || '';
        await claim.save();

        // Clear the activeClaim on the item so new claims can be submitted
        item.activeClaim = null;
        await item.save();

        res.status(200).json({ success: true, message: 'Claim rejected', data: claim });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Confirm return/retrieval (both parties must confirm)
// @route   POST /api/claims/:id/confirm-return
// @access  Private
exports.confirmReturn = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        if (claim.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Only approved claims can be confirmed' });
        }

        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);

        const userId = req.user._id.toString();
        const isOwner = item?.postedBy.toString() === userId;
        const isClaimant = claim.claimantId.toString() === userId;

        if (!isOwner && !isClaimant) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (isOwner) claim.ownerConfirmed = true;
        if (isClaimant) claim.claimantConfirmed = true;

        // If both have confirmed, finalize
        if (claim.ownerConfirmed && claim.claimantConfirmed) {
            claim.status = 'claimed';
            claim.resolvedAt = new Date();

            if (item) {
                item.status = 'Claimed';
                item.claimedBy = claim.claimantId;
                item.isArchived = true; // auto-archive so it leaves public board
                await item.save();
            }

            // Award 100 points to the finder (person who physically held & returned the item)
            // Found item: post owner IS the finder  |  Lost item: claimant IS the finder
            const finderId = claim.itemType === 'found'
                ? item.postedBy   // finder posted the found item
                : claim.claimantId; // finder submitted a claim on the lost item

            await User.findByIdAndUpdate(finderId, { $inc: { points: 100 } });

            // Lock the chat
            if (claim.chatId) {
                await Chat.findByIdAndUpdate(claim.chatId, { status: 'LOCKED', lockedAt: new Date() });
                await Message.create({
                    chatId: claim.chatId,
                    senderId: req.user._id,
                    content: '🎉 Both parties confirmed! The item has been successfully returned. The finder has been awarded 100 points for their contribution. This chat is now closed.',
                    type: 'SYSTEM'
                });
            }
        }

        await claim.save();

        const bothConfirmed = claim.ownerConfirmed && claim.claimantConfirmed;
        res.status(200).json({
            success: true,
            message: bothConfirmed ? 'Item marked as claimed!' : 'Confirmation recorded. Waiting for the other party.',
            data: claim,
            bothConfirmed
        });
    } catch (error) {
        console.error('confirmReturn error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
