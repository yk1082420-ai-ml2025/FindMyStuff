const mongoose = require('mongoose');

const LeaderboardHistorySchema = new mongoose.Schema({
    month: { type: String, required: true }, // format: "2025-04"
    rankings: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fullName: String,
        studentId: String,
        monthlyPoints: Number,
        rank: Number
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LeaderboardHistory', LeaderboardHistorySchema);