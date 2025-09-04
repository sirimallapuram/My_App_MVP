const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads')
});

// upload file + create message
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  const { channelId, text } = req.body;
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;
  const msg = new Message({
    channel: channelId,
    sender: req.userId,
    text: text || '',
    file: filePath
  });
  await msg.save();
  // Ideally broadcast to channel via socket.io - front-end will show new message
  res.json(msg);
});

// get messages for a channel
router.get('/channel/:id', auth, async (req, res) => {
  const msgs = await Message.find({ channel: req.params.id }).sort('createdAt').populate('sender', 'name email');
  res.json(msgs);
});

module.exports = router;
