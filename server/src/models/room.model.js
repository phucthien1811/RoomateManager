const mongoose = require('mongoose');

const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const roomSchema = new mongoose.Schema(
  {
    // Tên phòng trọ / nhà
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên phòng'],
      trim: true,
      maxlength: [100, 'Tên phòng không quá 100 ký tự'],
    },

    // Địa chỉ phòng trọ
    address: {
      type: String,
      trim: true,
      default: '',
    },

    // Người tạo phòng (chủ phòng)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Mã mời để tham gia phòng (unique, random)
    inviteCode: {
      type: String,
      unique: true,
    },

    // Số thành viên tối đa
    maxMembers: {
      type: Number,
      default: 10,
      min: [2, 'Phòng phải có ít nhất 2 người'],
    },
  },
  {
    timestamps: true,
    collection: 'rooms',
  }
);

// Tự động tạo invite code trước khi lưu
roomSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
  next();
});

// Hàm tạo mã mời ngẫu nhiên
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
  }
  return code;
}

module.exports = mongoose.model('Room', roomSchema);
