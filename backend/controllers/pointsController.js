const User = require('../models/User');
const Claim = require('../models/Claim');

/**
 * Award points to the finder after a successful return
 * @param {string} claimId - ID of the completed claim
 * @param {string} confirmedBy - 'owner' or 'finder'
 */
exports.awardPoints = async (claimId, confirmedBy) => {
    try {
        const claim = await Claim.findById(claimId)
            .populate('claimantId', 'studentId fullName')
            .populate('itemId', 'postedBy');

        if (!claim) throw new Error('Claim not found');
        if (claim.status !== 'claimed') throw new Error('Claim is not marked as claimed');
        if (claim.pointsAwarded) throw new Error('Points already awarded for this claim');

        const POINTS = 100; // Adjust as needed

        // Determine the finder
        let finderId;
        if (claim.itemType === 'found') {
            // For found items, the poster is the finder
            finderId = claim.itemId.postedBy;
        } else {
            // For lost items, the claimant is the finder
            finderId = claim.claimantId._id;
        }

        const finder = await User.findById(finderId);
        if (!finder) throw new Error('Finder user not found');

        // Award points
        finder.points += POINTS;
        finder.monthlyPoints += POINTS;
        finder.successfulReturns += 1;
        finder.pointsLastUpdated = new Date();
        await finder.save();

        // Mark claim as points awarded
        claim.pointsAwarded = true;
        claim.pointsAwardedAt = new Date();
        claim.returnConfirmedBy = confirmedBy;
        await claim.save();

        return { success: true, message: `Awarded ${POINTS} points to ${finder.fullName}` };
    } catch (error) {
        console.error('Error awarding points:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Get user's points summary
 * @param {string} userId - User ID
 */
exports.getUserPoints = async (userId) => {
    try {
        const user = await User.findById(userId)
            .select('points monthlyPoints successfulReturns pointsLastUpdated');
        if (!user) throw new Error('User not found');
        
        return {
            success: true,
            data: {
                totalPoints: user.points,
                monthlyPoints: user.monthlyPoints,
                successfulReturns: user.successfulReturns,
                lastUpdated: user.pointsLastUpdated
            }
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Get user's current rank (overall and monthly)
 * @param {string} userId - User ID
 */
exports.getUserRank = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Overall rank (higher points = better rank)
        const overallRank = await User.countDocuments({
            role: 'student',
            isActive: true,
            points: { $gt: user.points }
        }) + 1;

        // Monthly rank
        const monthlyRank = await User.countDocuments({
            role: 'student',
            isActive: true,
            monthlyPoints: { $gt: user.monthlyPoints }
        }) + 1;

        return {
            success: true,
            data: {
                overallRank,
                monthlyRank,
                totalPoints: user.points,
                monthlyPoints: user.monthlyPoints
            }
        };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

// Express route handlers (if you want to expose as API)
exports.getUserPointsHandler = async (req, res) => {
    const userId = req.params.userId || req.user._id;
    const result = await exports.getUserPoints(userId);
    res.status(result.success ? 200 : 404).json(result);
};

exports.getUserRankHandler = async (req, res) => {
    const userId = req.params.userId || req.user._id;
    const result = await exports.getUserRank(userId);
    res.status(result.success ? 200 : 404).json(result);
};