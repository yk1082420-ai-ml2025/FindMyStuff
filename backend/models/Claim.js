const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    claimantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemType: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'resolved'],
        default: 'pending'
    },
    message: {
        type: String,
        required: true
    },
    proofDetails: {
        type: String,
        default: ''
    },
    adminNotes: {
        type: String,
        default: ''
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
claimSchema.index({ itemId: 1, status: 1 });
claimSchema.index({ claimantId: 1, status: 1 });

module.exports = mongoose.model('Claim', claimSchema);