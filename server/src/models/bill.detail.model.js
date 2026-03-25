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
    // Số tiền đã được tính theo Largest Remainder Method (số nguyên, không xu lẻ)
    amount_due: {
      type: Number,
      required: [true, "amount_due là bắt buộc"],
      min: [0, "amount_due không được âm"],
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
feat: refactor comments bill.detail.model
