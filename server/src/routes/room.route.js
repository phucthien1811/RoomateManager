const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const postController = require('../controllers/post.controller');
const dutyScheduleController = require('../controllers/duty.schedule.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/rooms - Lấy danh sách phòng của user
router.get('/', authenticate, roomController.getRooms);

// GET /api/rooms/:roomId - Lấy chi tiết phòng
router.get('/:roomId', authenticate, roomController.getRoomDetail);

// POST /api/rooms - Tạo phòng mới
router.post('/', authenticate, roomController.createRoom);

// PUT /api/rooms/:roomId - Cập nhật phòng
router.put('/:roomId', authenticate, roomController.updateRoom);

// DELETE /api/rooms/:roomId - Xóa phòng
router.delete('/:roomId', authenticate, roomController.deleteRoom);

// GET /api/rooms/:roomId/members - Lấy danh sách thành viên
router.get('/:roomId/members', authenticate, roomController.getRoomMembers);

// POST /api/rooms/:roomId/members - Thêm thành viên vào phòng
router.post('/:roomId/members', authenticate, roomController.addMember);

// DELETE /api/rooms/:roomId/members/:memberId - Xóa thành viên khỏi phòng
router.delete('/:roomId/members/:memberId', authenticate, roomController.removeMember);

// GET /api/rooms/:roomId/posts - Lấy bài viết trong phòng
router.get('/:roomId/posts', authenticate, postController.listRoomPosts);

// POST /api/rooms/:roomId/posts - Tạo bài viết mới trong phòng
router.post('/:roomId/posts', authenticate, postController.createRoomPost);

// GET /api/rooms/:roomId/duties?week_start=YYYY-MM-DD - Lấy lịch trực nhật theo tuần
router.get('/:roomId/duties', authenticate, dutyScheduleController.listByRoomAndWeek);

// POST /api/rooms/:roomId/duties - Tạo lịch trực nhật
router.post('/:roomId/duties', authenticate, dutyScheduleController.createDuty);

module.exports = router;
