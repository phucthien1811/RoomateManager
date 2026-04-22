const express = require("express");
const router = express.Router();
const billController = require("../controllers/bill.controller");
const billAbsenceController = require("../controllers/bill.absence.controller");
const { authenticate } = require("../middleware/auth.middleware");

const authorizeAdmin = (req, res, next) => next();

// POST   /api/bills                                    — RM-7 & RM-9: Tạo hóa đơn + chia tiền
// GET    /api/bills/history/:roomId                     — RM-6: Lấy lịch sử hóa đơn
// PATCH  /api/bills/details/:detailId/confirm          — RM-11: Xác nhận thanh toán
// PATCH  /api/bills/:billId/images                     — RM-8: Cập nhật ảnh hóa đơn thực tế
// DELETE /api/bills/:billId                            — Xóa hóa đơn
// GET    /api/bills/:billId                            — Lấy chi tiết hóa đơn

// ⚠️ Route tĩnh phải đặt trước route động
router.post("/", authenticate, authorizeAdmin, billController.createBill);
router.get("/history/:roomId", authenticate, billController.getBillHistory);
router.patch("/details/:detailId/confirm", authenticate, billController.confirmPayment);
router.post("/:bill_id/apply-absence", authenticate, billAbsenceController.applyAbsenceToBill);
router.patch("/:billId/images", authenticate, billController.uploadBillImages);
router.delete("/:billId", authenticate, billController.deleteBill);
router.get("/:billId", authenticate, billController.getBillDetail);

module.exports = router;
