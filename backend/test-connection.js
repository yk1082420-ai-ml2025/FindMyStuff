require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Atlas Connection Test');
console.log('================================\n');

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('❌ MONGO_URI not found in .env file');
  console.log('Please add MONGO_URI to your .env file');
  process.exit(1);
}

console.log('📡 Connection string:', mongoURI.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://<credentials>@'));
console.log('⏳ Attempting to connect...\n');

mongoose.connect(mongoURI)
.then(() => {
  console.log('✅ Connection successful!');
  console.log(`📚 Database: ${mongoose.connection.name}`);
  console.log(`🔗 Host: ${mongoose.connection.host}`);
  console.log(`🆔 Connection ID: ${mongoose.connection.id}`);
  
  // List all collections
  return mongoose.connection.db.listCollections().toArray();
})
.then(collections => {
  console.log(`\n📁 Collections found: ${collections.length}`);
  if (collections.length > 0) {
    collections.forEach(col => console.log(`   - ${col.name}`));
  } else {
    console.log('   (No collections yet)');
  }
  
  console.log('\n✨ Ready to start the server!');
  process.exit(0);
})
.catch(err => {
  console.error('\n❌ Connection failed:', err.message);
  
  if (err.message.includes('bad auth')) {
    console.error('\n🔐 Authentication Error:');
    console.error('   Username or password is incorrect');
    console.error('   Please check your credentials in .env file');
  } else if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
    console.error('\n🌐 Network Error:');
    console.error('   Cannot reach MongoDB Atlas');
    console.error('   Check your internet connection');
  } else if (err.message.includes('querySrv')) {
    console.error('\n📡 DNS Error:');
    console.error('   Cannot resolve MongoDB Atlas hostname');
    console.error('   Try using local MongoDB instead');
  } else {
    console.error('\n❓ Unknown Error:', err.message);
  }
  
  console.error('\n💡 Quick Fix Options:');
  console.error('   1. Whitelist your IP in MongoDB Atlas:');
  console.error('      - Go to https://cloud.mongodb.com');
  console.error('      - Network Access → Add IP Address → 0.0.0.0/0');
  console.error('   2. Or switch to local MongoDB:');
  console.error('      - Update .env: MONGO_URI=mongodb://localhost:27017/Back2U');
  console.error('      - Install MongoDB locally from: https://www.mongodb.com/try/download/community');
  
  process.exit(1);
});
