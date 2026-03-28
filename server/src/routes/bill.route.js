const express = require("express");
const router = express.Router();
const billController = require("../controllers/bill.controller");

// TODO: thay bằng middleware auth thật khi có
const authenticate = (req, res, next) => next();
const authorizeAdmin = (req, res, next) => next();

// POST   /api/bills                           — RM-7 & RM-9: Tạo hóa đơn + chia tiền
// PATCH  /api/bills/details/:detailId/confirm — RM-11: Xác nhận thanh toán
// GET    /api/bills/:billId                   — Lấy chi tiết hóa đơn

// ⚠️ Route tĩnh (/details/...) phải đặt trước route động (/:billId)
router.post("/", authenticate, authorizeAdmin, billController.createBill);
router.patch("/details/:detailId/confirm", authenticate, billController.confirmPayment);
router.get("/:billId", authenticate, billController.getBillDetail);

module.exports = router;
