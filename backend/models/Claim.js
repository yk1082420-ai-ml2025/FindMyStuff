const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    claimantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'claimed'],
        default: 'pending'
    },
    // Proof submitted by the claimant
    proofDescription: {
        type: String,
        required: true,
        trim: true
    },
    uniqueIdentifiers: {
        type: String,
        default: '',
        trim: true
    },
    descriptionDetails: {
        type: String,
        default: '',
        trim: true
    },
    proofImages: [{ type: String }], // Array of uploaded file paths

    // Reference to the auto-created chat (set after approval)
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },

    // Dual-confirmation for handover
    ownerConfirmed: { type: Boolean, default: false },
    claimantConfirmed: { type: Boolean, default: false },

    // Rejection reason (optional, set by post owner)
    rejectionReason: { type: String, default: '' },

    resolvedAt: { type: Date },

    // ⭐ NEW GAMIFICATION FIELDS (start)
    pointsAwarded: {
        type: Boolean,
        default: false,
        comment: 'Prevents awarding points more than once for this claim'
    },
    pointsAwardedAt: {
        type: Date,
        default: null,
        comment: 'Timestamp when points were awarded'
    },
    returnConfirmedBy: {
        type: String,
        enum: ['owner', 'finder', null],
        default: null,
        comment: 'Who confirmed the return (owner or finder)'
    },
   
}, {
    timestamps: true
});

claimSchema.index({ itemId: 1, itemType: 1, status: 1 });
claimSchema.index({ claimantId: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);