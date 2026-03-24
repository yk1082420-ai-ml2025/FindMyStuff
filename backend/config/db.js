const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGO_URI exists
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    console.log('📡 Connecting to MongoDB...');
    console.log('Connection string:', mongoURI.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://<credentials>@'));
    
    // Connect with only supported options
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed:`);
    console.error(`   Error: ${error.message}`);
    console.error(`\n🔧 Troubleshooting Steps:`);
    console.error(`   1. Check if your IP is whitelisted in MongoDB Atlas`);
    console.error(`   2. Verify username and password in .env file`);
    console.error(`   3. Ensure the database name "Back2U" exists`);
    console.error(`   4. Check your internet connection`);
    console.error(`\n💡 For quick testing, you can use local MongoDB:`);
    console.error(`   Update .env file with: MONGO_URI=mongodb://localhost:27017/Back2U`);
    throw error;
  }
};

module.exports = connectDB;
