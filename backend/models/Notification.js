const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['claim', 'message', 'return', 'system', 'match'],
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        relatedModel: {
            type: String,
            enum: ['Claim', 'Message', 'FoundItem', 'LostItem'],
            default: null
        },
        itemType: {
            type: String,
            enum: ['lost', 'found', ''],
            default: ''
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        link: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);