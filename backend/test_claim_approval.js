const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./Models/User');
const Item = require('./Models/Item');
const Claim = require('./Models/Claim');
const Chat = require('./Models/Chat');
const Message = require('./Models/Message');
const { approveClaim } = require('./controllers/claimController');

dotenv.config();

async function runTest() {
    try {
        console.log("🔄 Connecting to Database...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // 1. Create Dummy Users
        const owner = await User.create({
            studentId: 'STU' + Date.now(),
            fullName: 'Test Owner',
            email: `owner${Date.now()}@test.com`,
            passwordHash: 'hashed123'
        });
        
        const finder = await User.create({
            studentId: 'STU' + (Date.now() + 1),
            fullName: 'Test Finder',
            email: `finder${Date.now()}@test.com`,
            passwordHash: 'hashed123'
        });

        // 2. Create Dummy Item (Found) by Owner
        const item = await Item.create({
            title: 'Lost Wallet Test',
            description: 'A black wallet',
            category: 'accessories',
            type: 'found',
            location: 'Library',
            date: new Date(),
            reportedBy: owner._id,
            status: 'open'
        });

        // 3. Create Pending Claim by Finder
        const claim = await Claim.create({
            itemId: item._id,
            claimantId: finder._id,
            itemType: item.type,
            status: 'pending',
            message: 'I think this is my wallet!',
            proofDetails: 'test_image.jpg'
        });

        console.log("\n📦 Created Test Data:");
        console.log(`- Item ID: ${item._id} (Status: ${item.status})`);
        console.log(`- Pending Claim ID: ${claim._id} by Finder ${finder.fullName}`);

        // 4. Mock Express req/res
        console.log("\n🚀 Triggering 'approveClaim' Controller as Owner...");
        const req = {
            params: { id: claim._id.toString() },
            user: { id: owner._id.toString() }
        };

        const res = {
            status: function(statusCode) {
                this.statusCode = statusCode;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };

        // 5. Execute
        await approveClaim(req, res);

        console.log(`\n📬 Controller Response (Status ${res.statusCode}):`);
        console.log(JSON.stringify(res.data, null, 2));

        // 6. Verify Chat and Message creation directly from DB
        if (res.data && res.data.chatDetails) {
            console.log("\n🔎 Verifying Chat Collection in Database...");
            const chatFromDB = await Chat.findById(res.data.chatDetails.chatId).populate('participants', 'fullName');
            if (chatFromDB) {
                console.log(`✅ Chat successfully found in DB!`);
                console.log(`   Participants: ${chatFromDB.participants.map(p => p.fullName).join(' and ')}`);
                console.log(`   Item ID: ${chatFromDB.itemId}`);

                const msgFromDB = await Message.findOne({ chatId: chatFromDB._id });
                if (msgFromDB) {
                    console.log(`✅ Automated System Message found: "${msgFromDB.content}"`);
                } else {
                    console.log(`❌ No initial message found!`);
                }
            } else {
                console.log(`❌ Chat was NOT found in DB!`);
            }
        }

        // Cleanup
        await User.deleteMany({ _id: { $in: [owner._id, finder._id] } });
        await Item.deleteOne({ _id: item._id });
        await Claim.deleteOne({ _id: claim._id });
        if (res.data && res.data.chatDetails) {
            await Chat.deleteOne({ _id: res.data.chatDetails.chatId });
            await Message.deleteMany({ chatId: res.data.chatDetails.chatId });
        }
        
        console.log("\n🧹 Test clean up complete.");
        process.exit(0);

    } catch (error) {
        console.error("Test Error:", error);
        process.exit(1);
    }
}

runTest();
