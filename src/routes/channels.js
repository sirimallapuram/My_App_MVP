// src/routes/channels.js
const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');

// Create channel
router.post('/', auth, async (req, res) => {
  const { name, members = [] } = req.body;
  const ch = new Channel({ name, members });
  await ch.save();
  res.json(ch);
});

// List channels
router.get('/', auth, async (req, res) => {
  const list = await Channel.find().populate('members', 'name email');
  res.json(list);
});

// Get channel details
router.get('/:id', auth, async (req, res) => {
  const ch = await Channel.findById(req.params.id).populate('members', 'name email');
  res.json(ch);
});

module.exports = router;
