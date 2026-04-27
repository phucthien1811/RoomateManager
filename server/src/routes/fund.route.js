const express = require("express");
const router = express.Router();
const fundController = require("../controllers/fund.controller");
const { authenticate } = require("../middleware/auth.middleware");

const authorizeAdmin = (req, res, next) => next();

// GET  /api/funds?room_id=...  — RM-22: Xem số dư + lịch sử giao dịch
// POST /api/funds/deposit      — RM-22: Nạp tiền (ghi nhận người đóng góp)
// POST /api/funds/withdraw     — Rút tiền từ quỹ (admin)

router.get("/", authenticate, fundController.getFundDetail);
router.post("/deposit", authenticate, fundController.deposit);
router.post("/withdraw", authenticate, fundController.withdraw);
router.patch("/transactions/:transactionId/approve", authenticate, fundController.approveTransaction);
router.patch("/transactions/:transactionId/reject", authenticate, fundController.rejectTransaction);
router.post("/categories", authenticate, fundController.createCategory);

module.exports = router;
