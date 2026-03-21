const Claim = require('../Models/Claim');
const Item = require('../Models/Item');
const Chat = require('../Models/Chat');
const Message = require('../Models/Message');

// @desc    Create a new Claim
// @route   POST /api/claims/:itemId
// @access  Private
exports.createClaim = async (req, res) => {
    try {
        const { itemId } = req.params;
        const claimantId = req.user.id;
        
        // Check if item exists
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }
        
        // Cannot claim if item is not open
        if (item.status !== 'open') {
            return res.status(400).json({ success: false, message: 'This item is no longer claimable' });
        }

        // Users shouldn't claim items they reported
        if (item.reportedBy.toString() === claimantId) {
            return res.status(400).json({ success: false, message: 'You cannot claim an item you reported' });
        }

        // Ensure user hasn't already submitted a pending claim
        const existingClaim = await Claim.findOne({ itemId, claimantId, status: 'pending' });
        if (existingClaim) {
            return res.status(400).json({ success: false, message: 'You already have a pending claim for this item' });
        }

        const claimData = {
            itemId,
            claimantId,
            itemType: item.type,
            message: req.body.message,
            proofDetails: req.body.proofDetails || ''
        };

        // If file uploaded via multer
        if (req.file) {
            claimData.proofDetails = req.file.filename; 
        }

        const newClaim = await Claim.create(claimData);

        res.status(201).json({
            success: true,
            data: newClaim
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all claims for a specific item (for the item owner)
// @route   GET /api/claims/item/:itemId
// @access  Private
exports.getClaimsByItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // Verify user is the reporter of the item
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        if (item.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the item reporter can view its claims' });
        }

        const claims = await Claim.find({ itemId })
            .populate('claimantId', 'fullName profilePhoto')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: claims.length,
            data: claims
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get a specific claim
// @route   GET /api/claims/:id
// @access  Private
exports.getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id)
            .populate('itemId')
            .populate('claimantId', 'fullName profilePhoto email');

        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        // Check if the user is authorized to view it (either claimant or item owner)
        if (claim.claimantId._id.toString() !== req.user.id && claim.itemId.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this claim' });
        }

        res.status(200).json({
            success: true,
            data: claim
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve a claim
// @route   PUT /api/claims/:id/approve
// @access  Private
exports.approveClaim = async (req, res) => {
    try {
        const { id } = req.params;
        
        const claim = await Claim.findById(id).populate('itemId');
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        // Verify that the logged in user is the owner (reporter) of the item
        if (claim.itemId.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the item reporter can approve claims' });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending claims can be approved' });
        }

        // Update claim status
        claim.status = 'approved';
        await claim.save();

        // Update item status to 'claimed'
        claim.itemId.status = 'claimed';
        claim.itemId.claimedBy = claim.claimantId;
        await claim.itemId.save();

        // Reject all other pending claims for this item
        await Claim.updateMany(
            { itemId: claim.itemId._id, _id: { $ne: id }, status: 'pending' },
            { status: 'rejected' }
        );

        // Auto-create Chat between item reporter and claimant
        const chat = await Chat.create({
            claimId: claim._id,
            participants: [req.user.id, claim.claimantId._id],
            itemId: claim.itemId._id.toString(),
            itemType: claim.itemId.type,
            status: 'ACTIVE'
        });

        // Add an initial automated system message
        await Message.create({
            chatId: chat._id,
            senderId: req.user.id, // technically a system message, but we assign to approver
            content: '✅ Claim approved! You can now coordinate ' + (claim.itemId.type === 'found' ? 'returning' : 'retrieving') + ' the item here.',
            type: 'SYSTEM'
        });

        res.status(200).json({
            success: true,
            message: 'Claim approved successfully and chat automatically created',
            data: claim,
            chatDetails: {
                chatId: chat._id,
                claimId: claim._id,
                itemId: claim.itemId._id,
                itemType: claim.itemId.type,
                otherUserId: claim.claimantId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject a claim
// @route   PUT /api/claims/:id/reject
// @access  Private
exports.rejectClaim = async (req, res) => {
    try {
        const { id } = req.params;
        
        const claim = await Claim.findById(id).populate('itemId');
        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        // Verify that the logged in user is the owner (reporter) of the item
        if (claim.itemId.reportedBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the item reporter can reject claims' });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending claims can be rejected' });
        }

        claim.status = 'rejected';
        await claim.save();

        res.status(200).json({
            success: true,
            message: 'Claim rejected',
            data: claim
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
