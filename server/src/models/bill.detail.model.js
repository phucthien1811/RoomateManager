/**
 * @file bill.detail.model.js
 * @description Schema chi tiết hóa đơn cho từng thành viên trong phòng.
 * Mỗi document là phần tiền mà một thành viên cụ thể phải trả
 * cho một hóa đơn phòng (room_bill).
 *
 * Quan hệ: room_bills (1) ---< (nhiều) bill_details
 */

const mongoose = require("mongoose");
const { BILL_DETAIL_STATUS } = require("../constants/bill.constant");

const billDetailSchema = new mongoose.Schema(
  {
    // Tham chiếu tới hóa đơn tổng của phòng
    bill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomBill",
      required: [true, "bill_id là bắt buộc"],
      index: true,
    },

    // Tham chiếu tới thành viên phải trả
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "member_id là bắt buộc"],
    },

    // Số tiền thành viên này phải trả (đã được tính bằng Largest Remainder Method)
    // Đây là số nguyên (VNĐ, làm tròn xuống, phần dư cộng vào người đầu)
    amount_due: {
      type: Number,
      required: [true, "amount_due là bắt buộc"],
      min: [0, "amount_due không được âm"],
    },

    // Trạng thái thanh toán của thành viên: pending | paid
    status: {
      type: String,
      enum: Object.values(BILL_DETAIL_STATUS),
      default: BILL_DETAIL_STATUS.PENDING,
    },

    // Thời điểm thành viên xác nhận thanh toán (null nếu chưa trả)
    paid_at: {
      type: Date,
      default: null,
    },

    // Người xác nhận thanh toán (admin hoặc chính thành viên đó)
    confirmed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "bill_details",
  }
);

// ============================================================
// Index tổng hợp: Mỗi thành viên chỉ xuất hiện 1 lần trong
// mỗi hóa đơn → tránh tạo trùng khi insert hàng loạt
// ============================================================
billDetailSchema.index(
  { bill_id: 1, member_id: 1 },
  { unique: true, name: "unique_member_per_bill" }
);

// ============================================================
// Virtual: Kiểm tra nhanh trạng thái đã trả chưa
// ============================================================
billDetailSchema.virtual("is_paid").get(function () {
  return this.status === BILL_DETAIL_STATUS.PAID;
});

const BillDetail = mongoose.model("BillDetail", billDetailSchema);

module.exports = BillDetail;
