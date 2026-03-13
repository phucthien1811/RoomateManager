/**
 * @file room.bill.model.js
 * @description Schema hóa đơn tổng của một phòng.
 * Mỗi document đại diện cho một hóa đơn (điện/nước/nhà/mạng)
 * được tạo ra cho một phòng trong một tháng cụ thể.
 */

const mongoose = require("mongoose");
const { BILL_TYPES, BILL_STATUS } = require("../constants/bill.constant");

const roomBillSchema = new mongoose.Schema(
  {
    // ID của phòng (tham chiếu tới collection rooms)
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "room_id là bắt buộc"],
      index: true,
    },

    // Loại hóa đơn: electricity | water | rent | internet
    bill_type: {
      type: String,
      enum: Object.values(BILL_TYPES),
      required: [true, "bill_type là bắt buộc"],
    },

    // Tổng số tiền hóa đơn (VNĐ, số nguyên, không có phần thập phân)
    total_amount: {
      type: Number,
      required: [true, "total_amount là bắt buộc"],
      min: [1000, "total_amount phải lớn hơn 1,000 VNĐ"],
    },

    // Tháng hóa đơn áp dụng (YYYY-MM), ví dụ: "2025-06"
    billing_month: {
      type: String,
      required: [true, "billing_month là bắt buộc"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "billing_month phải theo định dạng YYYY-MM"],
    },

    // Ghi chú thêm (tùy chọn)
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được vượt quá 500 ký tự"],
      default: null,
    },

    // Trạng thái tổng của hóa đơn: pending | partial | completed
    status: {
      type: String,
      enum: Object.values(BILL_STATUS),
      default: BILL_STATUS.PENDING,
    },

    // Người tạo hóa đơn (tham chiếu tới collection users)
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "created_by là bắt buộc"],
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    // Tên collection trong MongoDB dùng snake_case
    collection: "room_bills",
  }
);

// ============================================================
// Index tổng hợp: Đảm bảo mỗi phòng chỉ có 1 hóa đơn
// cùng loại trong cùng một tháng
// ============================================================
roomBillSchema.index(
  { room_id: 1, bill_type: 1, billing_month: 1 },
  { unique: true, name: "unique_bill_per_room_per_month" }
);

const RoomBill = mongoose.model("RoomBill", roomBillSchema);

module.exports = RoomBill;
