const User = require('../models/User');

// Helper function to generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to format phone number (Sri Lanka format)
const formatPhoneNumber = (phone) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Sri Lanka numbers: 07XXXXXXXX or 947XXXXXXXX
    if (cleaned.startsWith('0')) {
        cleaned = '94' + cleaned.substring(1);
    }
    
    return cleaned;
};

// @desc    Send phone verification code
// @route   POST /api/phone/send-verification
// @access  Private
exports.sendVerificationCode = async (req, res) => {
    try {
        const { phone } = req.body;
        const userId = req.user.id;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Validate Sri Lankan phone number format
        const phoneRegex = /^(?:(?:94|\+94)?0?)(7[0-9]{8})$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid Sri Lankan phone number (e.g., 0712345678)'
            });
        }

        const formattedPhone = formatPhoneNumber(phone);
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Update user with verification code
        await User.findByIdAndUpdate(userId, {
            phone: formattedPhone,
            phoneVerificationCode: verificationCode,
            phoneVerificationExpires: expiresAt,
            isPhoneVerified: false
        });

        // TODO: Send SMS via SMS service (Twilio, etc.)
        // For development, return the code in response
        // In production, remove this and use actual SMS gateway
        console.log(`📱 Verification code for ${formattedPhone}: ${verificationCode}`);

        // For testing only - remove in production
        res.status(200).json({
            success: true,
            message: 'Verification code sent to your phone',
            // ⚠️ Remove this in production!
            devCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
        });

    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification code',
            error: error.message
        });
    }
};

// @desc    Verify phone number with code
// @route   POST /api/phone/verify
// @access  Private
exports.verifyPhone = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Verification code is required'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if code exists
        if (!user.phoneVerificationCode) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found. Please request a new code.'
            });
        }

        // Check if code has expired
        if (new Date() > user.phoneVerificationExpires) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new code.'
            });
        }

        // Check if code matches
        if (user.phoneVerificationCode !== code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Verify phone number
        user.isPhoneVerified = true;
        user.phoneVerifiedAt = new Date();
        user.phoneVerificationCode = null;
        user.phoneVerificationExpires = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Phone number verified successfully',
            data: {
                isPhoneVerified: true,
                phoneVerifiedAt: user.phoneVerifiedAt
            }
        });

    } catch (error) {
        console.error('Verify phone error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying phone number',
            error: error.message
        });
    }
};

// @desc    Check phone verification status
// @route   GET /api/phone/status
// @access  Private
exports.getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('isPhoneVerified phoneVerifiedAt phone');

        res.status(200).json({
            success: true,
            data: {
                isPhoneVerified: user.isPhoneVerified,
                phoneVerifiedAt: user.phoneVerifiedAt,
                // Only show last 4 digits of phone number
                phoneMasked: user.phone ? `******${user.phone.slice(-4)}` : null
            }
        });

    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching verification status',
            error: error.message
        });
    }
};