/**
 * @file bill.route.js
 * @description Định nghĩa các route cho module Bill.
 *
 * Danh sách endpoints:
 *   POST   /api/bills                          → RM-7 & RM-9: Tạo hóa đơn + chia tiền
 *   PATCH  /api/bills/details/:detailId/confirm → RM-11: Xác nhận thanh toán
 *   GET    /api/bills/:billId                  → Lấy chi tiết hóa đơn (bonus)
 *
 * Lưu ý thứ tự route:
 *   Route tĩnh (/details/...) phải đặt TRƯỚC route động (/:billId)
 *   để tránh Express hiểu nhầm "details" là một billId.
 */

const express = require("express");
const router = express.Router();
const billController = require("../controllers/bill.controller");

// ============================================================
// MIDDLEWARE (Placeholder - thay bằng middleware thực tế của dự án)
// ============================================================
// Ví dụ: const { authenticate, authorize } = require("../middlewares/auth.middleware");
// Dùng middleware giả để code có thể chạy ngay cả khi chưa có auth

/**
 * Middleware xác thực giả - thay thế bằng JWT verify thực tế
 * Inject req.user để controller có thể dùng
 */
const authenticate = (req, res, next) => {
  // TODO: Thay bằng: verifyJwtToken(req, res, next)
  // Tạm thời cho phép pass qua để dev/test
  next();
};

/**
 * Middleware phân quyền - chỉ admin hoặc room leader mới tạo được bill
 */
const authorizeAdmin = (req, res, next) => {
  // TODO: Thay bằng kiểm tra role thực tế
  // if (req.user?.role !== 'admin') return res.status(403).json({ ... })
  next();
};

// ============================================================
// ROUTE ĐỊNH NGHĨA
// ============================================================

/**
 * @route   POST /api/bills
 * @desc    RM-7 & RM-9: Tạo hóa đơn phòng và tự động chia tiền
 * @access  Private - Admin / Room Leader
 */
router.post("/", authenticate, authorizeAdmin, billController.createBill);

/**
 * @route   PATCH /api/bills/details/:detailId/confirm
 * @desc    RM-11: Xác nhận thanh toán - đổi status pending → paid, lưu paid_at
 * @access  Private - Admin hoặc chính thành viên đó
 *
 * ⚠️ Route này phải đặt TRƯỚC route GET /:billId
 * để tránh conflict với dynamic segment
 */
router.patch(
  "/details/:detailId/confirm",
  authenticate,
  billController.confirmPayment
);

/**
 * @route   GET /api/bills/:billId
 * @desc    Lấy thông tin hóa đơn kèm chi tiết từng thành viên
 * @access  Private - Thành viên trong phòng
 */
router.get("/:billId", authenticate, billController.getBillDetail);

module.exports = router;
