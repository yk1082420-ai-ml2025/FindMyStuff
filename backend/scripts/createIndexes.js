// Run this once to create indexes
const User = require('../models/User');
const ContactRequest = require('../models/ContactRequest');

async function createIndexes() {
    try {
        // User indexes
        await User.collection.createIndex({ phone: 1 }, { sparse: true });
        await User.collection.createIndex({ isPhoneVerified: 1 });
        
        // Contact request indexes
        await ContactRequest.collection.createIndex({ chatId: 1, status: 1 });
        await ContactRequest.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        
        console.log('✅ All indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

module.exports = createIndexes;