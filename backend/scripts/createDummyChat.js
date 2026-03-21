const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        let users = await User.find().limit(2);
        
        let user1, user2;
        if (users.length === 0) {
            console.log('No users found in database. Please register a user first through the UI.');
            process.exit(0);
        } else if (users.length === 1) {
            console.log('Only 1 user found. Creating a dummy second user...');
            user1 = users[0];
            user2 = await User.create({
                fullName: 'Test Dummy User',
                email: 'dummy@test.com',
                password: 'password123',
                studentId: 'DUMMY001',
                phone: '0000000000',
                faculty: 'Computing',
                role: 'student'
            });
        } else {
            user1 = users[0];
            user2 = users[1];
        }

        console.log(`Creating chat between ${user1.fullName} and ${user2.fullName}...`);

        let chat = await Chat.findOne({
            participants: { $all: [user1._id, user2._id] }
        });

        if (!chat) {
            chat = await Chat.create({
                claimId: new mongoose.Types.ObjectId(),
                participants: [user1._id, user2._id],
                itemId: new mongoose.Types.ObjectId().toString(),
                itemType: 'lost',
                status: 'ACTIVE'
            });
            console.log('Created new chat:', chat._id);
        } else {
            console.log('Chat already exists between them. ID:', chat._id);
        }

        // Add a message
        const message = await Message.create({
            chatId: chat._id,
            senderId: user2._id,
            content: 'Hey there! This is an automated dummy test message. Is the UI working properly?',
            readBy: [{ userId: user2._id, readAt: new Date() }]
        });

        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        await chat.save();

        console.log('Added dummy message from', user2.fullName);
        console.log('\n✅ DUMMY CHAT CREATED SUCCESSFULLY!');
        console.log('Go to your browser and refresh the Messages page to see it.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

run();
