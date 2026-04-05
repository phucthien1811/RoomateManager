const ChoreLog = require("../models/chore.log.model");
const { CHORE_STATUS } = require("../constants/chore.constant");

// RM-19: Đánh dấu hoàn thành trực nhật + lưu ảnh minh chứng
const completeChore = async (choreId, memberId, proofImages = []) => {
  const chore = await ChoreLog.findById(choreId);

  if (!chore) throw new Error("Không tìm thấy lịch trực nhật");
  if (chore.status === CHORE_STATUS.COMPLETED) throw new Error("Lịch trực nhật này đã được đánh dấu hoàn thành rồi");

  // Chỉ người được phân công mới được đánh dấu hoàn thành
  if (chore.assigned_to.toString() !== memberId.toString()) {
    throw new Error("Bạn không có quyền đánh dấu hoàn thành lịch trực nhật này");
  }

  chore.status = CHORE_STATUS.COMPLETED;
  chore.completed_at = new Date();
  chore.proof_images = proofImages; // mảng URL ảnh, có thể rỗng

  await chore.save();
  return chore;
};

// Lấy danh sách trực nhật theo phòng (để hiển thị lịch sử)
const getChoresByRoom = async (roomId) => {
  return await ChoreLog.find({ room_id: roomId })
    .populate("assigned_to", "full_name email")
    .sort({ chore_date: -1 });
};

// Tạo lịch trực nhật mới (thường do admin/trưởng phòng tạo)
const createChore = async ({ room_id, assigned_to, chore_date, note }) => {
  return await ChoreLog.create({ room_id, assigned_to, chore_date, note });
};

module.exports = {
  completeChore,
  getChoresByRoom,
  createChore,
};
