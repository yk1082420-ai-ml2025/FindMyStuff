const User = require('../models/User');

// Get current month leaderboard (sorted by monthlyPoints)
const getCurrentLeaderboard = async (req, res) => {
    try {
        const users = await User.find({ role: 'student' })
            .select('fullName faculty profilePhoto monthlyPoints points successfulReturns')
            .sort({ monthlyPoints: -1 })
            .limit(50);

        // Add rank
        const rankedUsers = users.map((user, index) => ({
            ...user.toObject(),
            rank: index + 1
        }));

        res.json({ success: true, data: rankedUsers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all-time leaderboard (sorted by total points)
getAllTimeLeaderboard = async (req, res) => {
    try {
        const users = await User.find({ role: 'student' })
            .select('fullName faculty profilePhoto points successfulReturns')
            .sort({ points: -1 })
            .limit(50);

        const rankedUsers = users.map((user, index) => ({
            ...user.toObject(),
            rank: index + 1
        }));

        res.json({ success: true, data: rankedUsers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get logged-in user's rank and points
const getMyRank = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('points monthlyPoints successfulReturns');
        
        // Calculate rank among all students (monthly)
        const monthlyRank = await User.countDocuments({
            role: 'student',
            monthlyPoints: { $gt: user.monthlyPoints }
        });
        
        res.json({
            success: true,
            data: {
                points: user.points,
                monthlyPoints: user.monthlyPoints,
                successfulReturns: user.successfulReturns,
                monthlyRank: monthlyRank + 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCurrentLeaderboard,
    getAllTimeLeaderboard,
    getMyRank
};