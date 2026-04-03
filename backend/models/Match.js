const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
    {
        lostItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LostItem',
            required: true,
        },
        foundItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoundItem',
            required: true,
        },
        score: {
            type: Number, // 1–4
            required: true,
        },
        matchedOn: {
            type: [String], // e.g. ['Category', 'Title', 'Date', 'Location']
            default: [],
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'dismissed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

// Prevent duplicate pairs
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
