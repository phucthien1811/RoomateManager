const mongoose = require("mongoose");
const choreService = require("../services/chore.service");

const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

const mapServiceError = (error) => {
  const message = error.message || "Lỗi xử lý công việc";
  if (
    message.includes("không hợp lệ")
    || message.includes("bắt buộc")
    || message.includes("ít nhất")
    || message.includes("khung giờ")
    || message.includes("không tìm thấy")
  ) {
    return { status: 400, message };
  }
  if (message.includes("không có quyền") || message.includes("không được tag")) {
    return { status: 403, message };
  }
  if (message.includes("không tồn tại")) {
    return { status: 404, message };
  }
  return { status: 500, message: "Lỗi server khi xử lý công việc" };
};

const createChore = async (req, res) => {
  try {
    const { room_id: roomId, title, chore_date: choreDate, note, member_ids: memberIds, start_hour: startHour, end_hour: endHour } = req.body;
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return sendResponse(res, 400, false, "room_id không hợp lệ");
    }

    const chore = await choreService.createChore({
      roomId,
      userId: req.user.id,
      title,
      choreDate,
      note,
      memberIds,
      startHour,
      endHour,
    });
    return sendResponse(res, 201, true, "Tạo công việc thành công", chore);
  } catch (error) {
    const mapped = mapServiceError(error);
    return sendResponse(res, mapped.status, false, mapped.message);
  }
};

const getChoresByRoom = async (req, res) => {
  try {
    const { room_id: roomId } = req.query;
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return sendResponse(res, 400, false, "room_id không hợp lệ");
    }

    const chores = await choreService.getChoresByRoom({ roomId, userId: req.user.id });
    return sendResponse(res, 200, true, "Lấy danh sách công việc thành công", chores);
  } catch (error) {
    const mapped = mapServiceError(error);
    return sendResponse(res, mapped.status, false, mapped.message);
  }
};

const getMyDutyTasks = async (req, res) => {
  try {
    const { room_id: roomId, week_start: weekStart } = req.query;
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return sendResponse(res, 400, false, "room_id không hợp lệ");
    }

    const tasks = await choreService.getMyDutyTasks({
      roomId,
      userId: req.user.id,
      weekStart,
    });
    return sendResponse(res, 200, true, "Lấy nhiệm vụ lịch trực thành công", tasks);
  } catch (error) {
    const mapped = mapServiceError(error);
    return sendResponse(res, mapped.status, false, mapped.message);
  }
};

const completeChore = async (req, res) => {
  try {
    const { choreId } = req.params;
    if (!choreId || !mongoose.isValidObjectId(choreId)) {
      return sendResponse(res, 400, false, "choreId không hợp lệ");
    }

    const chore = await choreService.completeChore({
      choreId,
      userId: req.user.id,
      proofImages: req.body.proof_images || [],
    });
    return sendResponse(res, 200, true, "Hoàn thành công việc thành công", chore);
  } catch (error) {
    const mapped = mapServiceError(error);
    return sendResponse(res, mapped.status, false, mapped.message);
  }
};

const completeDutyTask = async (req, res) => {
  try {
    const { dutyId } = req.params;
    const { room_id: roomId } = req.body;
    if (!dutyId || !mongoose.isValidObjectId(dutyId)) {
      return sendResponse(res, 400, false, "dutyId không hợp lệ");
    }
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return sendResponse(res, 400, false, "room_id không hợp lệ");
    }

    const task = await choreService.completeDutyTask({
      roomId,
      dutyId,
      userId: req.user.id,
      proofImages: req.body.proof_images || [],
    });
    return sendResponse(res, 200, true, "Xác nhận hoàn thành nhiệm vụ lịch trực thành công", task);
  } catch (error) {
    const mapped = mapServiceError(error);
    return sendResponse(res, mapped.status, false, mapped.message);
  }
};

const deleteChore = async (req, res) => {
  try {
    const { choreId } = req.params;
    if (!choreId || !mongoose.isValidObjectId(choreId)) {
      return sendResponse(res, 400, false, "choreId không hợp lệ");
    }

    await choreService.deleteChore({ choreId, userId: req.user.id });
    return sendResponse(res, 200, true, "Xóa công việc thành công");
  } catch (error) {
    const mapped = mapServiceError(error);
    return sendResponse(res, mapped.status, false, mapped.message);
  }
};

module.exports = {
  createChore,
  getChoresByRoom,
  getMyDutyTasks,
  completeChore,
  completeDutyTask,
  deleteChore,
};
