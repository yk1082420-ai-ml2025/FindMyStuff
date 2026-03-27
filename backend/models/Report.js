const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter is required']
    },
    targetType: {
        type: String,
        enum: ['post', 'comment', 'user'],
        required: [true, 'Target type is required']
    },
    targetId: {
        type: String,
        required: [true, 'Target ID is required']
    },
    targetModel: {
        type: String,
        required: true,
        enum: ['Post', 'Comment', 'User']
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        enum: [
            'spam',
            'harassment',
            'hate_speech',
            'false_claim',
            'misinformation',
            'inappropriate_content',
            'other'
        ]
    },
    title: {
        type: String,
        default: function() {
            return `${this.targetType} reported for ${this.reason}`;
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    screenshotUrls: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
        default: 'pending'
    },
    adminResponse: {
        actionTaken: {
            type: String,
            enum: ['warning', 'content_removed', 'user_suspended', 'user_banned', 'no_action', 'other'],
            default: null
        },
        message: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date
    },
    auditLog: [{
        action: {
            type: String,
            enum: ['created', 'status_updated', 'admin_responded', 'escalated'],
            required: true
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: mongoose.Schema.Types.Mixed
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);