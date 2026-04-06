const Claim = require('../models/Claim');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const FoundItem = require('../models/FoundItem');
const LostItem = require('../models/LostItem');
const User = require('../models/User');
const { awardPointsForReturn } = require('./gamificationController');
const Notification = require('../models/Notification');
const getItemModel = (itemType) => (itemType === 'found' ? FoundItem : LostItem);

// ========== CREATE CLAIM ==========
exports.createClaim = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        const claimantId = req.user._id;

        if (!['found', 'lost'].includes(itemType)) {
            return res.status(400).json({ success: false, message: 'Invalid item type' });
        }

        const ItemModel = getItemModel(itemType);
        const item = await ItemModel.findById(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (item.status === 'Claimed') return res.status(400).json({ success: false, message: 'Item already claimed' });
        if (item.isArchived) return res.status(400).json({ success: false, message: 'Item is archived' });
        if (item.postedBy.toString() === claimantId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot claim your own item' });
        }

        const activeClaim = await Claim.findOne({ itemId, itemType, status: { $in: ['pending', 'approved'] } });
        if (activeClaim) {
            return res.status(400).json({ success: false, message: 'A claim is already in progress' });
        }

        const proofImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        const claim = await Claim.create({
            itemId,
            itemType,
            claimantId,
            proofDescription: req.body.proofDescription,
            uniqueIdentifiers: req.body.uniqueIdentifiers || '',
            descriptionDetails: req.body.descriptionDetails || '',
            proofImages,
        });

        item.activeClaim = claim._id;
        await item.save();

        const claimantName = req.user.fullName || 'Someone';
        const notification = await Notification.create({
            recipient: item.postedBy,
            type: 'claim',
            title: 'New Claim Received',
            message: `${claimantName} submitted a claim for your post "${item.title}".`,
            relatedId: claim._id,
            relatedModel: 'Claim',
            itemType: itemType,
            itemId: item._id,
        });

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

// ========== GET CLAIMS FOR ITEM ==========
exports.getClaimsForItem = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        const ItemModel = getItemModel(itemType);
        const item = await ItemModel.findById(itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        if (item.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only post owner can view claims' });
        }
        const claims = await Claim.find({ itemId, itemType }).populate('claimantId', 'fullName studentId email').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: claims });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== GET MY CLAIMS (SUBMITTED) ==========
exports.getMyClaims = async (req, res) => {
    try {
        const claims = await Claim.find({ claimantId: req.user._id }).sort({ createdAt: -1 });
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

// ========== GET RECEIVED CLAIMS (ON USER'S POSTS) ==========
exports.getReceivedClaims = async (req, res) => {
    try {
        const [myFoundIds, myLostIds] = await Promise.all([
            FoundItem.find({ postedBy: req.user._id }).distinct('_id'),
            LostItem.find({ postedBy: req.user._id }).distinct('_id'),
        ]);
        const claims = await Claim.find({
            $or: [
                { itemId: { $in: myFoundIds }, itemType: 'found' },
                { itemId: { $in: myLostIds }, itemType: 'lost' },
            ],
        }).populate('claimantId', 'fullName studentId email').sort({ createdAt: -1 });
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

// ========== GET SINGLE CLAIM ==========
exports.getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id).populate('claimantId', 'fullName studentId email').populate('chatId');
        if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);
        if (claim.claimantId._id.toString() !== req.user._id.toString() && item?.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        res.status(200).json({ success: true, data: { ...claim.toObject(), item } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== APPROVE CLAIM ==========
exports.approveClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);
        if (!item || item.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only post owner can approve' });
        }
        if (claim.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending claims can be approved' });

        claim.status = 'approved';
        await claim.save();

        await Claim.updateMany(
            { itemId: claim.itemId, itemType: claim.itemType, _id: { $ne: claim._id }, status: 'pending' },
            { status: 'rejected' }
        );

        const chat = await Chat.create({
            claimId: claim._id,
            participants: [item.postedBy, claim.claimantId],
            itemId: claim.itemId,
            itemType: claim.itemType,
            status: 'ACTIVE',
        });
        claim.chatId = chat._id;
        await claim.save();

        const action = claim.itemType === 'found' ? 'returning' : 'retrieving';
        await Message.create({
            chatId: chat._id,
            senderId: item.postedBy,
            content: `✅ Claim approved! You can now coordinate ${action} the item here.`,
            type: 'SYSTEM',
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

        res.status(200).json({ success: true, message: 'Claim approved', data: claim, chatId: chat._id });
    } catch (error) {
        console.error('approveClaim error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== REJECT CLAIM ==========
exports.rejectClaim = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
        const ItemModel = getItemModel(claim.itemType);
        const item = await ItemModel.findById(claim.itemId);
        if (!item || item.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only post owner can reject' });
        }
        if (claim.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending claims can be rejected' });

        claim.status = 'rejected';
        claim.rejectionReason = req.body.reason || '';
        await claim.save();
        item.activeClaim = null;
        await item.save();
        res.status(200).json({ success: true, message: 'Claim rejected', data: claim });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ========== CONFIRM RETURN (BOTH PARTIES) – FINAL CORRECTED VERSION ==========
exports.confirmReturn = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
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

        // Record the confirmation
        if (isOwner) claim.ownerConfirmed = true;
        if (isClaimant) claim.claimantConfirmed = true;

        let bothConfirmed = claim.ownerConfirmed && claim.claimantConfirmed;

        if (bothConfirmed) {
            // Finalize claim
            claim.status = 'claimed';
            claim.resolvedAt = new Date();
            if (item) {
                item.status = 'Claimed';
                item.claimedBy = claim.claimantId;
                item.isArchived = true;
                await item.save();
            }

            // Award points (this also sets claim.pointsAwarded = true and saves the claim)
            const ownerId = item.postedBy.toString();
            const finderId = claim.claimantId.toString();
            console.log(`Awarding points for claim ${claim._id}, owner ${ownerId}, finder ${finderId}`);
            const awardResult = await awardPointsForReturn(claim._id, ownerId, finderId);
            if (!awardResult.success) {
                console.error('Points award failed:', awardResult.message);
                // Still continue – claim is already resolved, but we log the error
            } else {
                console.log('Points awarded successfully');
                // Re-fetch the claim to get the updated pointsAwarded flag
                const updatedClaim = await Claim.findById(claim._id);
                if (updatedClaim) {
                    claim.pointsAwarded = updatedClaim.pointsAwarded;
                    claim.pointsAwardedAt = updatedClaim.pointsAwardedAt;
                }

                if (awardResult.notifications && awardResult.notifications.length > 0) {
                    const io = req.app.get('io');
                    if (io) {
                        awardResult.notifications.forEach(notif => {
                            io.to(notif.recipient.toString()).emit('new_notification', notif);
                        });
                    }
                }
            }

            // Lock chat
            if (claim.chatId) {
                await Chat.findByIdAndUpdate(claim.chatId, { status: 'LOCKED', lockedAt: new Date() });
                await Message.create({
                    chatId: claim.chatId,
                    senderId: req.user._id,
                    content: '🎉 Both parties confirmed! The item has been successfully returned. This chat is now closed.',
                    type: 'SYSTEM',
                });
            }
            // Do NOT save the claim here – awardPointsForReturn already saved it.
        } else {
            // Only one party confirmed so far – save the claim
            await claim.save();
            console.log(`First confirmation saved for claim ${claim._id}`);
        }

        // Send response using the updated claim object
        res.status(200).json({
            success: true,
            message: bothConfirmed ? 'Item marked as claimed!' : 'Confirmation recorded. Waiting for the other party.',
            data: claim,
            bothConfirmed,
        });
    } catch (error) {
        console.error('confirmReturn error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};