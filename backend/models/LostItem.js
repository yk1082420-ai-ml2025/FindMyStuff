const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: ['Electronics', 'Documents', 'Clothing', 'Accessories', 'Books', 'Keys', 'Bags', 'Sports', 'Other'],
            default: 'Other',
        },
        lastSeenLocation: {
            type: String,
            required: [true, 'Last seen location is required'],
            trim: true,
        },
        dateLost: {
            type: Date,
            required: [true, 'Date lost is required'],
        },
        color: {
            type: String,
            trim: true,
            default: '',
        },
        brand: {
            type: String,
            trim: true,
            default: '',
        },
        images: [
            {
                type: String, // file path or URL
            },
        ],
        status: {
            type: String,
            enum: ['Lost', 'Found', 'Claimed', 'Returned', 'Archived'],
            default: 'Lost',
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        linkedFoundPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LostItem', // can be linked to a found post later
            default: null,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        },
    },
    {
        timestamps: true,
    }
);

// Index for search
lostItemSchema.index({ title: 'text', description: 'text', lastSeenLocation: 'text' });
lostItemSchema.index({ category: 1, status: 1, isArchived: 1 });

module.exports = mongoose.model('LostItem', lostItemSchema);
