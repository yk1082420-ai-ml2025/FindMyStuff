const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: { type: String, required: true },
    type: {
        type: String,
        enum: ['TEXT', 'SYSTEM'],
        default: 'TEXT'
    },
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: Date
    }],
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);