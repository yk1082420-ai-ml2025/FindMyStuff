const User = require('../models/User');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');

const POINTS_PER_RETURN = 10;

/**
 * Award points to both parties after successful return
 */
const awardPointsForReturn = async (claimId, ownerId, finderId) => {
    try {
        const claim = await Claim.findById(claimId);
        if (!claim) return { success: false, message: 'Claim not found' };
        if (claim.pointsAwarded) return { success: false, message: 'Points already awarded' };

        let actualFinderId;
        if (claim.itemType === 'found') {
            // In a 'found' post, the post creator is the finder
            actualFinderId = ownerId; 
        } else {
            // In a 'lost' post, the claimant is the finder
            actualFinderId = finderId;
        }

        await User.findByIdAndUpdate(actualFinderId, {
            $inc: { points: POINTS_PER_RETURN, monthlyPoints: POINTS_PER_RETURN, successfulReturns: 1 }
        });

        claim.pointsAwarded = true;
        await claim.save();

        const finderNotification = await Notification.create({
            recipient: actualFinderId,
            type: 'system',
            title: 'Points Awarded!',
            message: `You have been awarded ${POINTS_PER_RETURN} points for a successful return!`,
            relatedId: claimId,
            relatedModel: 'Claim'
        });

        return { success: true, notifications: [finderNotification] };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * GET /api/leaderboard
 * Top users by total points
 */
const getLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await User.find({})
            .select('fullName points profilePicture faculty')
            .sort({ points: -1 })
            .limit(limit);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/leaderboard/history
 * Monthly leaderboard history (current month top users)
 */
const getLeaderboardHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        // For history, you can store monthly snapshots. For now, return current monthly points.
        const history = await User.find({})
            .select('fullName monthlyPoints profilePicture faculty')
            .sort({ monthlyPoints: -1 })
            .limit(limit);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/leaderboard/faculty/:faculty
 * Leaderboard filtered by faculty
 */
const getFacultyLeaderboard = async (req, res) => {
    try {
        const { faculty } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await User.find({ faculty: { $regex: new RegExp(faculty, 'i') } })
            .select('fullName points profilePicture faculty')
            .sort({ points: -1 })
            .limit(limit);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/leaderboard/me  (protected)
 * Get current user's stats and rank
 */
const getUserStats = async (req, res) => {
    try {
        let userId = req.params.userId || req.user.id;
        const user = await User.findById(userId).select('fullName points monthlyPoints successfulReturns profilePicture faculty');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;

        res.json({
            rank,
            points: user.points,
            monthlyPoints: user.monthlyPoints,
            successfulReturns: user.successfulReturns,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            faculty: user.faculty
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/admin/reset-monthly (admin only)
 * Reset monthly points for all users (start of new month)
 */
const resetMonthlyPoints = async (req, res) => {
    try {
        // Optional: save snapshot to history collection before resetting
        await User.updateMany({}, { $set: { monthlyPoints: 0 } });
        res.json({ message: 'Monthly points reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    awardPointsForReturn,
    getLeaderboard,
    getLeaderboardHistory,
    getFacultyLeaderboard,
    getUserStats,
    resetMonthlyPoints
};