const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    // Thuộc phòng nào
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },

    // User nào
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Vai trò trong phòng
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },

    // Biệt danh trong phòng (tuỳ chọn)
    nickname: {
      type: String,
      trim: true,
      default: '',
    },

    // Trạng thái thành viên
    status: {
      type: String,
      enum: ['active', 'inactive', 'left'],
      default: 'active',
    },

    // Ngày tham gia phòng
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'room_members',
  }
);

// Đảm bảo 1 user chỉ tham gia 1 phòng 1 lần
memberSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Member', memberSchema);
