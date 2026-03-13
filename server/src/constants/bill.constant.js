/**
 * @file bill.constant.js
 * @description Định nghĩa các hằng số dùng trong toàn bộ module Bill.
 * Tập trung tại đây để tránh "magic string" rải rác trong codebase.
 */

// ============================================================
// LOẠI HÓA ĐƠN (Bill Types)
// ============================================================
const BILL_TYPES = {
  ELECTRICITY: "electricity", // Tiền điện
  WATER: "water",             // Tiền nước
  RENT: "rent",               // Tiền nhà
  INTERNET: "internet",       // Tiền mạng
};

// ============================================================
// TRẠNG THÁI HÓA ĐƠN TỔNG (Bill Status)
// Trạng thái của toàn bộ hóa đơn phòng
// ============================================================
const BILL_STATUS = {
  PENDING: "pending",   // Chưa ai thanh toán hoặc đang thanh toán dở
  PARTIAL: "partial",   // Một số thành viên đã trả
  COMPLETED: "completed", // Tất cả thành viên đã trả đủ
};

// ============================================================
// TRẠNG THÁI CHI TIẾT HÓA ĐƠN (Bill Detail Status)
// Trạng thái của từng thành viên trong hóa đơn
// ============================================================
const BILL_DETAIL_STATUS = {
  PENDING: "pending", // Chưa thanh toán
  PAID: "paid",       // Đã thanh toán
};

module.exports = {
  BILL_TYPES,
  BILL_STATUS,
  BILL_DETAIL_STATUS,
};
