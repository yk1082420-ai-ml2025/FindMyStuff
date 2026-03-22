const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
        },
        category: {
            type: String,
            enum: ['alert', 'event', 'general', 'tips'],
            default: 'general',
            required: [true, 'Category is required'],
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        attachments: [
            {
                type: String, // file path or URL
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for searching and filtering
noticeSchema.index({ title: 'text', content: 'text' });
noticeSchema.index({ category: 1, priority: 1, isActive: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
