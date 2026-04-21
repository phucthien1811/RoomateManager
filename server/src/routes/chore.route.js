const express = require("express");
const router = express.Router();
const choreController = require("../controllers/chore.controller");
const { authenticate } = require("../middleware/auth.middleware");

const authorizeAdmin = (req, res, next) => next();

// POST   /api/chores                           — Tạo công việc chung
// GET    /api/chores?room_id=...               — Lấy danh sách công việc chung của phòng
// GET    /api/chores/my-duty?room_id=...       — Lấy nhiệm vụ của tôi từ lịch trực
// PATCH  /api/chores/:choreId/complete         — Hoàn thành công việc chung + ảnh minh chứng
// PATCH  /api/chores/duty/:dutyId/complete     — Hoàn thành nhiệm vụ lịch trực + ảnh minh chứng
// DELETE /api/chores/:choreId                  — Xóa công việc chung

router.post("/", authenticate, authorizeAdmin, choreController.createChore);
router.get("/", authenticate, choreController.getChoresByRoom);
router.get("/my-duty", authenticate, choreController.getMyDutyTasks);
router.patch("/duty/:dutyId/complete", authenticate, choreController.completeDutyTask);
router.patch("/:choreId/complete", authenticate, choreController.completeChore);
router.delete("/:choreId", authenticate, choreController.deleteChore);

module.exports = router;
