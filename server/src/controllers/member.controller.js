const Member = require('../models/member.model');
const Room = require('../models/room.model');
const User = require('../models/user.model');

// Tham gia phòng bằng mã mời
exports.joinRoomByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    // Kiểm tra mã mời
    if (!inviteCode || inviteCode.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã mời',
      });
    }

    // Tìm phòng theo mã mời
    const room = await Room.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Mã mời không tồn tại hoặc đã hết hạn',
      });
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    // Kiểm tra nếu đã là thành viên
    const existingMember = await Member.findOne({
      room: room._id,
      user: userId,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên của phòng này',
      });
    }

    // Kiểm tra số lượng thành viên tối đa
    const memberCount = await Member.countDocuments({
      room: room._id,
      status: 'active',
    });

    if (memberCount >= room.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Phòng đã đầy, không thể tham gia',
      });
    }

    // Tạo thành viên mới
    const newMember = new Member({
      room: room._id,
      user: userId,
      role: 'member',
      status: 'active',
    });

    await newMember.save();

    // Populate dữ liệu
    await newMember.populate('room user', 'name email address');

    res.status(201).json({
      success: true,
      message: 'Tham gia phòng thành công',
      member: newMember,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tham gia phòng',
      error: error.message,
    });
  }
};

// Lấy danh sách thành viên trong phòng
exports.getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Phòng không tồn tại',
      });
    }

    const members = await Member.find({
      room: roomId,
      status: 'active',
    }).populate('user', 'name email avatar');

    res.status(200).json({
      success: true,
      totalMembers: members.length,
      members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thành viên',
      error: error.message,
    });
  }
};

// Lấy danh sách phòng của người dùng
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const userRooms = await Member.find({
      user: userId,
      status: 'active',
    })
      .populate('room')
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      totalRooms: userRooms.length,
      rooms: userRooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng',
      error: error.message,
    });
  }
};

// Rời khỏi phòng
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const member = await Member.findOne({
      room: roomId,
      user: userId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Bạn không phải là thành viên của phòng này',
      });
    }

    // Không cho phép chủ phòng rời
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Chủ phòng không thể rời phòng. Hãy chuyển quyền chủ phòng trước',
      });
    }

    member.status = 'left';
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Bạn đã rời khỏi phòng',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi rời phòng',
      error: error.message,
    });
  }
};

// Cập nhật biệt danh thành viên
exports.updateMemberNickname = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { nickname } = req.body;
    const userId = req.user.id;

    const member = await Member.findOne({
      room: roomId,
      user: userId,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Bạn không phải là thành viên của phòng này',
      });
    }

    member.nickname = nickname || '';
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật biệt danh thành công',
      member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật biệt danh',
      error: error.message,
    });
  }
};
