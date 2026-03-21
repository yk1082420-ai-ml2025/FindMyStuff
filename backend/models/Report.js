const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetType: {
        type: String,
        enum: ['POST_LOST', 'POST_FOUND', 'USER', 'CLAIM', 'MESSAGE'],
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'SPAM',
            'HARASSMENT',
            'FALSE_INFO',
            'INAPPROPRIATE_CONTENT',
            'SCAM',
            'OTHER'
        ]
    },
    description: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'],
        default: 'PENDING'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
module.exports = Report;