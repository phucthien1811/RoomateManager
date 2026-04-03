const mongoose = require('mongoose');

const absenceReportSchema = new mongoose.Schema(
  {
    // Thành viên báo cáo
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },

    // Phòng của thành viên
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },

    // Ngày bắt đầu vắng mặt
    startDate: {
      type: Date,
      required: true,
    },

    // Ngày kết thúc vắng mặt
    endDate: {
      type: Date,
      required: true,
    },

    // Lý do vắng mặt
    reason: {
      type: String,
      enum: ['Về quê', 'Công tác', 'Khác'],
      required: true,
    },

    // Ghi chú thêm
    note: {
      type: String,
      trim: true,
      default: '',
    },

    // Trạng thái báo cáo
    status: {
      type: String,
      enum: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'],
      default: 'Chờ duyệt',
    },

    // Người phê duyệt (chủ trọ)
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },

    // Lý do từ chối
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },

    // Ngày phê duyệt
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'absence_reports',
  }
);

module.exports = mongoose.model('AbsenceReport', absenceReportSchema);
