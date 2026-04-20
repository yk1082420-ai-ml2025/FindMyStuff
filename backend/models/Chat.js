const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    claimId: {
        type: String,
        ref: 'Claim',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'LOCKED'],
        default: 'ACTIVE'
    },
    lockedAt: { type: Date, default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

chatSchema.index({ participants: 1 });
chatSchema.index({ claimId: 1 });

module.exports = mongoose.model('Chat', chatSchema);