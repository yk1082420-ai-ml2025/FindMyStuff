const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use correct environment variable
    const mongoURI = process.env.MONGO_DB_URI;

    if (!mongoURI) {
      throw new Error('MONGO_DB_URI is not defined in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    console.log(
      'Connection string:',
      mongoURI.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://<credentials>@')
    );

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
    console.error(`   2. Verify username and password in environment variables`);
    console.error(`   3. Ensure your database exists in MongoDB Atlas`);
    console.error(`   4. Check your internet connection`);

    throw error;
  }
};

module.exports = connectDB;