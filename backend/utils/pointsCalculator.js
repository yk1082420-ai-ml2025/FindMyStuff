/**
 * Points calculation utility for gamification module
 * Centralizes all points-related business logic
 */

const POINTS_CONFIG = {
    STANDARD_RETURN: 100,      // Points for a successful return
    FIRST_RETURN_BONUS: 0,     // Set to 5 if you want first-time bonus (optional)
};

/**
 * Calculate points to award for a successful return
 * @param {number} currentSuccessfulReturns - User's current successful returns count
 * @returns {number} - Total points to award
 */
const calculatePointsForReturn = (currentSuccessfulReturns = 0) => {
    let points = POINTS_CONFIG.STANDARD_RETURN;
    
    // Optional: first return bonus
    if (currentSuccessfulReturns === 0 && POINTS_CONFIG.FIRST_RETURN_BONUS > 0) {
        points += POINTS_CONFIG.FIRST_RETURN_BONUS;
    }
    
    return points;
};

/**
 * Get the configured points value (for display)
 */
const getStandardPoints = () => POINTS_CONFIG.STANDARD_RETURN;

module.exports = {
    calculatePointsForReturn,
    getStandardPoints,
    POINTS_CONFIG,
};