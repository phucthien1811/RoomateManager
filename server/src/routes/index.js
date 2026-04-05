const express = require('express');
const router = express.Router();

// Auth routes
router.use('/auth', require('./auth.route'));

// Member routes - Tham gia phòng, quản lý thành viên
router.use('/members', require('./member.route'));

// Bill routes - Quản lý hóa đơn, chi phí
router.use('/bills', require('./bill.route'));

// Absence routes - Báo cáo vắng mặt
router.use('/absence-reports', require('./absence.route'));

// Example route
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Roommate Manager API!' });
});

// TODO: Add more routes here
// router.use('/rooms', require('./room.route'));

module.exports = router;
