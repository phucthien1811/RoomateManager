const mongoose = require("mongoose");
const { BILL_DETAIL_STATUS } = require("../constants/bill.constant");

// Mỗi document = phần tiền một thành viên phải trả trong một hóa đơn
// Quan hệ: room_bills (1) ---< (nhiều) bill_details

const billDetailSchema = new mongoose.Schema(
  {
    bill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomBill",
      required: [true, "bill_id là bắt buộc"],
      index: true,
    },
    member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "member_id là bắt buộc"],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: false,
    },
    // Số tiền gốc tính theo Largest Remainder Method
    amount_due: {
      type: Number,
      required: [true, "amount_due là bắt buộc"],
      min: [0, "amount_due không được âm"],
    },
    // Alias cho amount_due để dễ sử dụng
    original_amount: {
      type: Number,
      required: false,
      min: [0, "original_amount không được âm"],
    },
    // Số tiền thực tế phải trả (sau khi trừ vắng mặt)
    actual_amount: {
      type: Number,
      required: false,
      min: [0, "actual_amount không được âm"],
    },
    // Số tiền giảm do vắng mặt
    absence_discount: {
      type: Number,
      default: 0,
      min: [0, "absence_discount không được âm"],
    },
    // Tỷ lệ chi phí phải trả (0-1). Ví dụ: 0.71 = 71% phải trả
    cost_ratio: {
      type: Number,
      default: 1,
      min: [0, "cost_ratio phải >= 0"],
      max: [1, "cost_ratio phải <= 1"],
    },
    status: {
      type: String,
      enum: Object.values(BILL_DETAIL_STATUS),
      default: BILL_DETAIL_STATUS.PENDING,
    },
    paid_at: {
      type: Date,
      default: null,
    },
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

// Tránh tạo trùng: mỗi thành viên chỉ xuất hiện 1 lần trong mỗi hóa đơn
billDetailSchema.index(
  { bill_id: 1, member_id: 1 },
  { unique: true, name: "unique_member_per_bill" }
);

billDetailSchema.virtual("is_paid").get(function () {
  return this.status === BILL_DETAIL_STATUS.PAID;
});

const BillDetail = mongoose.model("BillDetail", billDetailSchema);

module.exports = BillDetail;

