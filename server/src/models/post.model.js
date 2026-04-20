const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: [120, 'Tiêu đề không quá 120 ký tự'],
    },
    content: {
      type: String,
      required: [true, 'Nội dung bài viết là bắt buộc'],
      trim: true,
      maxlength: [3000, 'Nội dung không quá 3000 ký tự'],
    },
  },
  {
    timestamps: true,
    collection: 'room_posts',
  }
);

postSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
