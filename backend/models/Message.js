const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    chatId: {
        type: String,
        ref: 'Chat',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: { 
        type: String, 
        required: true 
    },
    type: {
        type: String,
        enum: ['TEXT', 'SYSTEM'],
        default: 'TEXT'
    },
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: Date
    }],
    // New fields for edit/delete
    isEdited: { 
        type: Boolean, 
        default: false 
    },
    editedAt: { 
        type: Date, 
        default: null 
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

// Index for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Message', messageSchema);