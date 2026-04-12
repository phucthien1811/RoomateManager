const mongoose = require("mongoose");
const { FUND_TRANSACTION_TYPES } = require("../constants/fund.constant");

// Mỗi document = 1 giao dịch (nạp/rút) của quỹ
// Dùng để hiển thị lịch sử và ghi nhận người đóng góp
const fundTransactionSchema = new mongoose.Schema(
  {
    fund_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fund",
      required: [true, "fund_id là bắt buộc"],
      index: true,
    },
    // Loại giao dịch: deposit (nạp) hoặc withdraw (rút)
    type: {
      type: String,
      enum: Object.values(FUND_TRANSACTION_TYPES),
      required: [true, "type là bắt buộc"],
    },
    amount: {
      type: Number,
      required: [true, "amount là bắt buộc"],
      min: [1000, "amount phải lớn hơn 1,000 VNĐ"],
    },
    // Người thực hiện giao dịch (đóng góp hoặc rút)
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "performed_by là bắt buộc"],
    },
    // Mô tả mục đích giao dịch, ví dụ: "mua rau tháng 6"
    description: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: "Chưa phân loại",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "fund_transactions",
  }
);

const FundTransaction = mongoose.model("FundTransaction", fundTransactionSchema);

module.exports = FundTransaction;
