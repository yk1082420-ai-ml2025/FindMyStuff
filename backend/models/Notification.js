const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['claim', 'message', 'match'],
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
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
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
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: null
    }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
