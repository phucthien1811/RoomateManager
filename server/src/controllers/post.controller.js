const mongoose = require('mongoose');
const Post = require('../models/post.model');
const Room = require('../models/room.model');

const hasRoomAccess = async (roomId, userId) => {
  const room = await Room.findById(roomId).select('owner members');
  if (!room) return { ok: false, status: 404, message: 'Phòng không tồn tại' };

  const isOwner = room.owner.toString() === userId;
  const isMember = room.members.some((memberId) => memberId.toString() === userId);
  if (!isOwner && !isMember) {
    return { ok: false, status: 403, message: 'Bạn không có quyền truy cập phòng này' };
  }

  return { ok: true };
};

const listRoomPosts = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: 'roomId không hợp lệ' });
    }

    const access = await hasRoomAccess(roomId, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const posts = await Post.find({ room: roomId })
      .sort({ createdAt: -1 })
      .populate('author', 'name email avatar');

    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy bài viết', error: error.message });
  }
};

const createRoomPost = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: 'roomId không hợp lệ' });
    }

    const access = await hasRoomAccess(roomId, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (!title || !String(title).trim() || !content || !String(content).trim()) {
      return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const post = await Post.create({
      room: roomId,
      author: userId,
      title: String(title).trim(),
      content: String(content).trim(),
    });

    await post.populate('author', 'name email avatar');
    return res.status(201).json({ message: 'Tạo bài viết thành công', post });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tạo bài viết', error: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'postId không hợp lệ' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Chỉ tác giả mới có thể chỉnh sửa bài viết' });
    }

    if (!title || !String(title).trim() || !content || !String(content).trim()) {
      return res.status(400).json({ message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    post.title = String(title).trim();
    post.content = String(content).trim();
    await post.save();
    await post.populate('author', 'name email avatar');

    return res.json({ message: 'Cập nhật bài viết thành công', post });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật bài viết', error: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'postId không hợp lệ' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Chỉ tác giả mới có thể xóa bài viết' });
    }

    await Post.deleteOne({ _id: postId });
    return res.json({ message: 'Xóa bài viết thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi xóa bài viết', error: error.message });
  }
};

const getPostDetail = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'postId không hợp lệ' });
    }

    const post = await Post.findById(postId).populate('author', 'name email avatar');
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    const access = await hasRoomAccess(post.room, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    return res.json({ post });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy chi tiết bài viết', error: error.message });
  }
};

module.exports = {
  listRoomPosts,
  createRoomPost,
  updatePost,
  deletePost,
  getPostDetail,
};
