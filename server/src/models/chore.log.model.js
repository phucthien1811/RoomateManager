const mongoose = require("mongoose");
const { CHORE_STATUS } = require("../constants/chore.constant");

// Mỗi document = 1 lượt trực nhật của 1 thành viên trong phòng
const choreLogSchema = new mongoose.Schema(
  {
    room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "room_id là bắt buộc"],
      index: true,
    },
    // Thành viên được phân công trực nhật
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "assigned_to là bắt buộc"],
    },
    // Ngày trực nhật
    chore_date: {
      type: Date,
      required: [true, "chore_date là bắt buộc"],
    },
    status: {
      type: String,
      enum: Object.values(CHORE_STATUS),
      default: CHORE_STATUS.PENDING,
    },
    // Thời điểm bấm "Hoàn thành"
    completed_at: {
      type: Date,
      default: null,
    },
    // Ảnh minh chứng — lưu dạng mảng URL
    // TODO: tích hợp Cloudinary/S3 khi có, hiện tại để URL string
    proof_images: {
      type: [String],
      default: [],
    },
    // Ghi chú thêm (tùy chọn)
    note: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "chore_logs",
  }
);

const ChoreLog = mongoose.model("ChoreLog", choreLogSchema);

module.exports = ChoreLog;
