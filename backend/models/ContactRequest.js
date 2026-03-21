const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
        },
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['phone', 'email', 'both'],
            default: 'both',
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'expired'],
            default: 'pending',
        },
        requesterPhoneShared: {
            type: Boolean,
            default: false,
        },
        targetPhoneShared: {
            type: Boolean,
            default: false,
        },
        requesterEmailShared: {
            type: Boolean,
            default: false,
        },
        targetEmailShared: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        respondedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
contactRequestSchema.index({ chatId: 1, status: 1 });
contactRequestSchema.index({ requesterId: 1, targetId: 1 });
contactRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete expired

module.exports = mongoose.model('ContactRequest', contactRequestSchema);