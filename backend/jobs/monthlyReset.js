const cron = require('node-cron');
const User = require('../models/User');
const LeaderboardHistory = require('../models/LeaderboardHistory'); // optional, create if needed

const resetMonthlyPoints = async () => {
    console.log('Running monthly points reset...');
    try {
        // Optional: Save current leaderboard snapshot to history
        const topUsers = await User.find({ role: 'student' })
            .select('fullName studentId monthlyPoints')
            .sort({ monthlyPoints: -1 })
            .limit(100);
        
        // If you have LeaderboardHistory model, save it
        // await LeaderboardHistory.create({ month: new Date().toISOString().slice(0,7), rankings: topUsers });

        // Reset monthlyPoints for all users
        await User.updateMany({}, { monthlyPoints: 0 });
        console.log('Monthly points reset completed.');
    } catch (error) {
        console.error('Error resetting monthly points:', error);
    }
};

// Schedule: Run at 00:00 on the 1st day of every month
cron.schedule('0 0 1 * *', resetMonthlyPoints);

module.exports = resetMonthlyPoints;