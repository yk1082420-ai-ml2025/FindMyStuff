const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: [true, 'Student ID is required'],
            unique: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        profilePhoto: {
            type: String,
            default: '',
        },
        points: {
            type: Number,
            default: 0,
        },
        // ⭐ NEW GAMIFICATION FIELDS (start)
        monthlyPoints: {
            type: Number,
            default: 0,
            comment: 'Points earned in the current month (resets monthly)'
        },
        pointsLastUpdated: {
            type: Date,
            default: Date.now,
            comment: 'Last time points were updated (for cooldown logic)'
        },
        successfulReturns: {
            type: Number,
            default: 0,
            comment: 'Count of successful item returns (used for badges)'
        },
        lastMonthlyReset: {
            type: Date,
            default: Date.now,
            comment: 'Timestamp of last monthly points reset'
        },
        // ⭐ END GAMIFICATION FIELDS
        activityHistory: {
            lostPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LostItem' }],
            foundPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoundItem' }],
            claims: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Claim' }],
            noticePosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notice' }],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        notificationsEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) {
        return;
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
        throw error;
    }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Remove passwordHash from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.passwordHash;
    return user;
};

module.exports = mongoose.model('User', userSchema);