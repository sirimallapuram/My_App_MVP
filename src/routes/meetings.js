const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');

// Create meeting
router.post('/', auth, async (req, res) => {
  const { title, startTime, endTime, participants = [] } = req.body;
  const m = new Meeting({ title, startTime, endTime, participants });
  await m.save();
  res.json(m);
});

// List meetings
router.get('/', auth, async (req, res) => {
  const list = await Meeting.find().populate('participants', 'name email').sort('-startTime');
  res.json(list);
});

// Update
router.put('/:id', auth, async (req, res) => {
  const m = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(m);
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  await Meeting.findByIdAndDelete(req.params.id);
  res.json({ msg: 'deleted' });
});

module.exports = router;
