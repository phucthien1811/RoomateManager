const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Tham gia phòng bằng mã mời
router.post('/join', authenticate, memberController.joinRoomByCode);

// Lấy danh sách phòng của người dùng
router.get('/my-rooms', authenticate, memberController.getUserRooms);

// Lấy danh sách thành viên trong phòng
router.get('/:roomId/members', authenticate, memberController.getRoomMembers);

// Rời khỏi phòng
router.put('/:roomId/leave', authenticate, memberController.leaveRoom);

// Cập nhật biệt danh
router.put('/:roomId/nickname', authenticate, memberController.updateMemberNickname);

module.exports = router;
