const express = require("express");
const router = express.Router();
const choreController = require("../controllers/chore.controller");

// TODO: thay bằng middleware auth thật khi có
const authenticate = (req, res, next) => next();
const authorizeAdmin = (req, res, next) => next();

// POST   /api/chores                      — Tạo lịch trực nhật (admin)
// PATCH  /api/chores/:choreId/complete    — RM-19: Đánh dấu hoàn thành + ảnh
// GET    /api/chores?room_id=...          — Lấy danh sách trực nhật của phòng

router.post("/", authenticate, authorizeAdmin, choreController.createChore);
router.patch("/:choreId/complete", authenticate, choreController.completeChore);
router.get("/", authenticate, choreController.getChoresByRoom);

module.exports = router;
