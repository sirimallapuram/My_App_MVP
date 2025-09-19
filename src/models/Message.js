const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  file: String, // path to the uploaded file
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
