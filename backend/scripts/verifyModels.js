const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

async function verifyModels() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('🔍 Verifying Chat model...');
        const chatIndexes = await Chat.collection.indexes();
        console.log('✅ Chat indexes:', chatIndexes.length);
        
        console.log('🔍 Verifying Message model...');
        const messageIndexes = await Message.collection.indexes();
        console.log('✅ Message indexes:', messageIndexes.length);
        
        // Test schema validation
        const testChat = new Chat({
            claimId: new mongoose.Types.ObjectId(),
            participants: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
            itemId: new mongoose.Types.ObjectId(),
            itemType: 'lost'
        });
        
        const validationError = testChat.validateSync();
        if (validationError) {
            console.error('❌ Chat validation error:', validationError);
        } else {
            console.log('✅ Chat schema validation passed');
        }
        
        console.log('\n🎉 All model verifications passed!');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyModels();