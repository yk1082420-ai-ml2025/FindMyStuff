const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    claimId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Claim',
        required: true
    },
    claimCode: { // human-readable
        type: String
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'LOCKED'],
        default: 'ACTIVE'
    },
    lockedAt: { type: Date, default: null },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    itemId: {
        type: String,  // Changed from ObjectId to String
        required: true
    },
    itemType: {
        type: String,
        enum: ['lost', 'found']
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);