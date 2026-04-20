const express = require('express');
const router = express.Router();

// Auth routes
router.use('/auth', require('./auth.route'));

// Room routes - Quản lý phòng
router.use('/rooms', require('./room.route'));

// Member routes - Tham gia phòng, quản lý thành viên
router.use('/members', require('./member.route'));

// Bill routes - Quản lý hóa đơn, chi phí
router.use('/bills', require('./bill.route'));

// Absence routes - Báo cáo vắng mặt
router.use('/absence-reports', require('./absence.route'));

// Chore routes - Công việc nhà
router.use('/chores', require('./chore.route'));

// Fund routes - Quỹ nhà
router.use('/fund', require('./fund.route'));

// Notification routes - Thông báo
router.use('/notifications', require('./notification.route'));

// Post routes - Bảng tin nội bộ
router.use('/posts', require('./post.route'));

// Example route
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from Roommate Manager API!' });
});

module.exports = router;
