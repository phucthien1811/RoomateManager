const mongoose = require("mongoose");
const { BILL_TYPES, BILL_STATUS } = require("../constants/bill.constant");

const roomBillSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "room_id là bắt buộc"],
      index: true,
    },
    bill_type: {
      type: String,
      enum: Object.values(BILL_TYPES),
      required: [true, "bill_type là bắt buộc"],
    },
    total_amount: {
      type: Number,
      required: [true, "total_amount là bắt buộc"],
      min: [1000, "total_amount phải lớn hơn 1,000 VNĐ"],
    },
    // Định dạng YYYY-MM, ví dụ: "2025-06"
    billing_month: {
      type: String,
      required: [true, "billing_month là bắt buộc"],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, "billing_month phải theo định dạng YYYY-MM"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được vượt quá 500 ký tự"],
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(BILL_STATUS),
      default: BILL_STATUS.PENDING,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "created_by là bắt buộc"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "room_bills",
  }
);

// Mỗi phòng chỉ được có 1 hóa đơn cùng loại trong cùng tháng
roomBillSchema.index(
  { room_id: 1, bill_type: 1, billing_month: 1 },
  { unique: true, name: "unique_bill_per_room_per_month" }
);

const RoomBill = mongoose.model("RoomBill", roomBillSchema);

module.exports = RoomBill;
feat: refactor comments room.bill.model
