const express = require('express');
const router = express.Router();

// Member routes - Tham gia phòng, quản lý thành viên
router.use('/members', require('./member.route'));

// Example route
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Roommate Manager API!' });
});

// TODO: Add more routes here
// router.use('/rooms', require('./room.route'));

module.exports = router;
