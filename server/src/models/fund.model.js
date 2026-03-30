const mongoose = require("mongoose");

// Mỗi phòng có 1 quỹ duy nhất — lưu số dư hiện tại
const fundSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "room_id là bắt buộc"],
      unique: true, // 1 phòng chỉ có 1 quỹ
    },
    // Số dư hiện tại (VNĐ, số nguyên)
    balance: {
      type: Number,
      default: 0,
      min: [0, "Số dư không được âm"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "funds",
  }
);

const Fund = mongoose.model("Fund", fundSchema);

module.exports = Fund;
