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
    assigned_members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Ngày trực nhật
    chore_date: {
      type: Date,
      required: [true, "chore_date là bắt buộc"],
    },
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    start_hour: {
      type: Number,
      min: 1,
      max: 23,
      default: null,
    },
    end_hour: {
      type: Number,
      min: 2,
      max: 24,
      default: null,
    },
    source_type: {
      type: String,
      enum: ["manual", "duty"],
      default: "manual",
      index: true,
    },
    duty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DutySchedule",
      default: null,
      index: true,
    },
    duty_day_label: {
      type: String,
      trim: true,
      default: "",
    },
    week_start: {
      type: Date,
      default: null,
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

choreLogSchema.pre("validate", function () {
  if (!this.title && this.note) {
    this.title = String(this.note).trim();
  }
  if ((!this.assigned_members || this.assigned_members.length === 0) && this.assigned_to) {
    this.assigned_members = [this.assigned_to];
  }
});

choreLogSchema.index({ room_id: 1, source_type: 1, chore_date: 1 });
choreLogSchema.index(
  { room_id: 1, duty_id: 1, assigned_to: 1 },
  {
    unique: true,
    partialFilterExpression: {
      duty_id: { $type: "objectId" },
    },
  }
);

const ChoreLog = mongoose.model("ChoreLog", choreLogSchema);

module.exports = ChoreLog;
