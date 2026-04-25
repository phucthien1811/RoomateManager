const Member = require('../models/member.model');
const Room = require('../models/room.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Tham gia phòng bằng mã mời
exports.joinRoomByCode = async (req, res) => {
  try {
    const { inviteCode, code } = req.body;
    const userId = req.user.id;
    const normalizedCode = (inviteCode || code || '').trim().toUpperCase();

    // Kiểm tra mã mời
    if (!normalizedCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã mời',
      });
    }

    // Tìm phòng theo mã mời hoặc mã phòng
    const room = await Room.findOne({
      $or: [{ inviteCode: normalizedCode }, { code: normalizedCode }],
    }).populate('owner', 'name');

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

    if (!room.members.some((memberId) => memberId.toString() === userId)) {
      room.members.push(userId);
      await room.save();
    }

    // Populate dữ liệu
    await newMember.populate('room user', 'name email address');

    const joinSuccessMessage = `Tham gia thành công phòng ${room.name}`;
    await Notification.create({
      recipient: userId,
      type: 'success',
      title: 'Tham gia phòng thành công',
      message: joinSuccessMessage,
      meta: `ROOM ${room._id}`,
    });

    const ownerName = room.owner?.name || 'Chủ phòng';
    const existingMemberIds = Array.from(
      new Set(
        (room.members || [])
          .map((memberId) => memberId.toString())
          .filter((memberId) => memberId !== userId)
      )
    );

    if (existingMemberIds.length > 0) {
      const memberJoinedMessage = `${user.name} đã tham gia phòng ${room.name} của bạn`;
      await Notification.insertMany(
        existingMemberIds.map((recipientId) => ({
          recipient: recipientId,
          type: 'info',
          title: 'Có thành viên mới tham gia',
          message: memberJoinedMessage,
          meta: `ROOM ${room._id} • ${ownerName}`,
        }))
      );
    }

    res.status(201).json({
      success: true,
      message: 'Tham gia phòng thành công',
      member: newMember,
      room: {
        _id: room._id,
        name: room.name,
        code: room.code || room.inviteCode,
      },
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

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Phòng không tồn tại',
      });
    }

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

    room.members = (room.members || []).filter((memberId) => memberId.toString() !== userId.toString());
    await room.save();

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

// Cập nhật thông tin thành viên (user profile)
exports.updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, email, phone, roomId } = req.body;
    const requesterId = req.user.id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu roomId để xác thực quyền chỉnh sửa',
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Phòng không tồn tại',
      });
    }

    const isRoomOwner = room.owner.toString() === requesterId;
    const isSelfUpdate = String(memberId) === String(requesterId);

    if (!isRoomOwner && !isSelfUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể chỉnh sửa thông tin của chính mình',
      });
    }

    if (!room.members.some((id) => id.toString() === memberId)) {
      return res.status(404).json({
        success: false,
        message: 'Thành viên không thuộc phòng hiện tại',
      });
    }

    const user = await User.findById(memberId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();

    if (typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (exists) {
          return res.status(400).json({
            success: false,
            message: 'Email đã tồn tại',
          });
        }
        user.email = normalizedEmail;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thành viên thành công',
      member: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thành viên',
      error: error.message,
    });
  }
};

// Chuyển thành viên sang phòng khác
exports.transferMemberRoom = async (req, res) => {
  try {
    const { roomId, memberId } = req.params;
    const { targetRoomId } = req.body;
    const requesterId = req.user.id;

    if (!targetRoomId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu phòng đích để chuyển thành viên',
      });
    }

    if (roomId === targetRoomId) {
      return res.status(400).json({
        success: false,
        message: 'Phòng đích phải khác phòng hiện tại',
      });
    }

    const currentRoom = await Room.findById(roomId);
    const targetRoom = await Room.findById(targetRoomId);

    if (!currentRoom || !targetRoom) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng nguồn hoặc phòng đích',
      });
    }

    if (currentRoom.owner.toString() !== requesterId || targetRoom.owner.toString() !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn cần là chủ phòng của cả hai phòng để chuyển thành viên',
      });
    }

    if (currentRoom.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Không thể chuyển chủ phòng',
      });
    }

    const existsInCurrent = currentRoom.members.some((id) => id.toString() === memberId);
    if (!existsInCurrent) {
      return res.status(404).json({
        success: false,
        message: 'Thành viên không có trong phòng hiện tại',
      });
    }

    const existsInTarget = targetRoom.members.some((id) => id.toString() === memberId);
    if (existsInTarget) {
      return res.status(400).json({
        success: false,
        message: 'Thành viên đã có trong phòng đích',
      });
    }

    if (targetRoom.members.length >= (targetRoom.maxMembers || 10)) {
      return res.status(400).json({
        success: false,
        message: 'Phòng đích đã đầy',
      });
    }

    currentRoom.members = currentRoom.members.filter((id) => id.toString() !== memberId);
    targetRoom.members.push(memberId);

    await currentRoom.save();
    await targetRoom.save();

    const currentMemberDoc = await Member.findOne({
      room: roomId,
      user: memberId,
      status: 'active',
    });
    if (currentMemberDoc) {
      currentMemberDoc.status = 'left';
      await currentMemberDoc.save();
    }

    const targetMemberDoc = await Member.findOne({ room: targetRoomId, user: memberId });
    if (targetMemberDoc) {
      targetMemberDoc.status = 'active';
      targetMemberDoc.joinedAt = new Date();
      await targetMemberDoc.save();
    } else {
      await Member.create({
        room: targetRoomId,
        user: memberId,
        role: 'member',
        status: 'active',
      });
    }

    const movedUser = await User.findById(memberId).select('name email');
    res.status(200).json({
      success: true,
      message: 'Chuyển thành viên sang phòng khác thành công',
      member: movedUser,
      fromRoom: { _id: currentRoom._id, name: currentRoom.name },
      toRoom: { _id: targetRoom._id, name: targetRoom.name },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi chuyển thành viên',
      error: error.message,
    });
  }
};
