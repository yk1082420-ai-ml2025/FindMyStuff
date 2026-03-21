const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'documents', 'accessories', 'clothing', 'books', 'other']
    },
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    images: [{
        type: String,
        default: []
    }],
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'claimed', 'resolved'],
        default: 'open'
    },
    isReturned: {
        type: Boolean,
        default: false
    },
    returnedAt: {
        type: Date
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pointsAwarded: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for better performance
itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ reportedBy: 1 });
itemSchema.index({ location: 1 });
itemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Item', itemSchema);