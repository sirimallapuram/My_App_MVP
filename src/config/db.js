const mongoose = require('mongoose');
const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';

mongoose.set('strictQuery', true);

mongoose.connect(MONGO, { useNewUrlParser: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error', err);
    process.exit(1);
  });

module.exports = mongoose;
