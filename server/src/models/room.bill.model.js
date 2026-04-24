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
    bill_type_other: {
      type: String,
      trim: true,
      maxlength: [120, "bill_type_other không được vượt quá 120 ký tự"],
      default: null,
    },
    total_amount: {
      type: Number,
      required: [true, "total_amount là bắt buộc"],
      min: [1000, "total_amount phải lớn hơn 1,000 VNĐ"],
    },
    bill_date: {
      type: Date,
      default: Date.now,
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
    // RM-8: Ảnh hóa đơn thực tế để đối chiếu (base64 data URL hoặc URL ảnh, tối đa 5)
    bill_images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Tối đa 5 ảnh hóa đơn",
      },
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
    payer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    is_paid_by_fund: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "room_bills",
  }
);

// Mỗi phòng chỉ được có 1 hóa đơn cùng loại trong cùng tháng (riêng loại 'khác' sẽ phân biệt bằng bill_type_other)
roomBillSchema.index(
  { room_id: 1, bill_type: 1, bill_type_other: 1, billing_month: 1 },
  { unique: true, name: "unique_bill_per_room_per_month_custom" }
);

const RoomBill = mongoose.model("RoomBill", roomBillSchema);

module.exports = RoomBill;
