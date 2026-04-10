const Room = require('../models/room.model');
const User = require('../models/user.model');

// GET /api/rooms - Lấy danh sách phòng của user
const getRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Lấy danh sách phòng mà user là owner hoặc member
    const rooms = await Room.find({
      $or: [
        { owner: userId },
        { members: { $in: [userId] } }
      ]
    }).populate('owner', 'name email');

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phòng', error: error.message });
  }
};

// GET /api/rooms/:roomId - Lấy chi tiết phòng
const getRoomDetail = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId)
      .populate('owner', 'name email')
      .populate('members', 'name email phone');

    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Check if user is owner or member
    const isOwner = room.owner._id.toString() === userId;
    const isMember = room.members.some(m => m._id.toString() === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập phòng này' });
    }

    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết phòng', error: error.message });
  }
};

// POST /api/rooms - Tạo phòng mới
const createRoom = async (req, res) => {
  try {
    const { name, address, location, monthlyRent, owner } = req.body;
    const userId = req.user.id;

    if (!name || !address) {
      return res.status(400).json({ message: 'Tên phòng và địa chỉ là bắt buộc' });
    }

    const room = await Room.create({
      name,
      address: address || location,
      location: location || address,
      monthlyRent: parseInt(monthlyRent) || 0,
      owner: userId,
      members: [userId],
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    await room.populate('owner', 'name email');

    res.status(201).json({
      message: 'Phòng được tạo thành công',
      room
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo phòng', error: error.message });
  }
};

// PUT /api/rooms/:roomId - Cập nhật phòng
const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, address, location, monthlyRent } = req.body;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Only owner can update
    if (room.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Chỉ chủ phòng mới có thể cập nhật' });
    }

    if (name) room.name = name;
    if (address) room.address = address;
    if (location) room.location = location;
    if (monthlyRent) room.monthlyRent = parseInt(monthlyRent);

    await room.save();
    await room.populate('owner', 'name email');

    res.json({ message: 'Phòng được cập nhật thành công', room });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật phòng', error: error.message });
  }
};

// DELETE /api/rooms/:roomId - Xóa phòng
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Only owner can delete
    if (room.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Chỉ chủ phòng mới có thể xóa' });
    }

    await Room.deleteOne({ _id: roomId });

    res.json({ message: 'Phòng được xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa phòng', error: error.message });
  }
};

// POST /api/rooms/:roomId/members - Thêm thành viên vào phòng
const addMember = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { email, name, phone } = req.body;
    const userId = req.user.id;

    // Kiểm tra phòng tồn tại
    const room = await Room.findById(roomId).populate('owner');
    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Chỉ owner mới có thể thêm thành viên
    if (room.owner._id.toString() !== userId) {
      return res.status(403).json({ message: 'Chỉ chủ phòng mới có thể thêm thành viên' });
    }

    // Tìm hoặc tạo người dùng
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Tạo user mới nếu chưa tồn tại
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        phone: phone || '',
        password: 'temp123456', // Tạm password, user sẽ đổi lại
      });
    }

    // Kiểm tra user đã là thành viên
    if (room.members.includes(user._id)) {
      return res.status(400).json({ message: 'Người dùng đã là thành viên của phòng' });
    }

    // Kiểm tra số lượng thành viên tối đa
    if (room.members.length >= (room.maxMembers || 10)) {
      return res.status(400).json({ message: 'Phòng đã đầy' });
    }

    // Thêm thành viên vào phòng
    room.members.push(user._id);
    await room.save();

    await room.populate('members', 'name email phone avatar');

    res.status(201).json({
      message: 'Thêm thành viên thành công',
      member: user,
      room
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm thành viên', error: error.message });
  }
};

// DELETE /api/rooms/:roomId/members/:memberId - Xóa thành viên khỏi phòng
const removeMember = async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const userId = req.user.id;

    // Kiểm tra phòng tồn tại
    const room = await Room.findById(roomId).populate('owner');
    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Chỉ owner mới có thể xóa thành viên
    if (room.owner._id.toString() !== userId) {
      return res.status(403).json({ message: 'Chỉ chủ phòng mới có thể xóa thành viên' });
    }

    // Xóa thành viên
    room.members = room.members.filter(m => m.toString() !== memberId);
    await room.save();

    res.json({
      message: 'Xóa thành viên thành công',
      room
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa thành viên', error: error.message });
  }
};

// GET /api/rooms/:roomId/members - Lấy danh sách thành viên
const getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId)
      .populate('members', 'name email phone avatar role createdAt')
      .populate('owner', 'name email');

    if (!room) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Check if user is member or owner
    const isMember = room.members.some(m => m._id.toString() === userId);
    const isOwner = room.owner._id.toString() === userId;

    if (!isMember && !isOwner) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }

    res.json({ members: room.members });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách thành viên', error: error.message });
  }
};

module.exports = {
  getRooms,
  getRoomDetail,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomMembers,
  addMember,
  removeMember,
};
