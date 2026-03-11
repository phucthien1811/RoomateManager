const Room = require('../models/room.model.js');

const getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    const currentUserId = req.user.id; 
    
    let roomData = room.toObject();

    if (room.owner.toString() !== currentUserId) {
      delete roomData.invite_code; 
    }

    res.status(200).json(roomData);
  } catch (error) {
    res.status(500).json({ message: "Lỗi truy vấn dữ liệu" });
  }
};

module.exports = { getRoomDetails };
