const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    returnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    returnedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        default: ''
    },
    returnedAt: {
        type: Date,
        default: Date.now
    },
    pointsAwarded: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);