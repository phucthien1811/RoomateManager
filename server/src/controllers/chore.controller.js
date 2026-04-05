const choreService = require("../services/chore.service");

const sendResponse = (res, status, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(status).json(payload);
};

// POST /api/chores — Tạo lịch trực nhật
const createChore = async (req, res) => {
  try {
    const { room_id, assigned_to, chore_date, note } = req.body;

    if (!room_id || !assigned_to || !chore_date) {
      return sendResponse(res, 400, false, "Thiếu room_id, assigned_to hoặc chore_date");
    }

    const chore = await choreService.createChore({ room_id, assigned_to, chore_date, note });
    return sendResponse(res, 201, true, "Tạo lịch trực nhật thành công", chore);
  } catch (error) {
    console.error("[ChoreController] createChore error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi tạo lịch trực nhật");
  }
};

// PATCH /api/chores/:choreId/complete — RM-19: Đánh dấu hoàn thành + ảnh minh chứng
const completeChore = async (req, res) => {
  try {
    const { choreId } = req.params;

    if (!choreId || !/^[a-fA-F0-9]{24}$/.test(choreId)) {
      return sendResponse(res, 400, false, "choreId không hợp lệ");
    }

    const memberId = req.user?._id || req.body.member_id;

    // proof_images là mảng URL ảnh, frontend upload lên storage rồi gửi URL về
    // TODO: khi tích hợp Cloudinary thì xử lý upload ở middleware trước khi vào đây
    const proofImages = req.body.proof_images || [];

    const chore = await choreService.completeChore(choreId, memberId, proofImages);
    return sendResponse(res, 200, true, "Đánh dấu hoàn thành trực nhật thành công", chore);
  } catch (error) {
    const knownErrors = [
      "Không tìm thấy lịch trực nhật",
      "đã được đánh dấu hoàn thành rồi",
      "không có quyền",
    ];
    if (knownErrors.some((msg) => error.message.includes(msg))) {
      return sendResponse(res, 400, false, error.message);
    }
    console.error("[ChoreController] completeChore error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi cập nhật trực nhật");
  }
};

// GET /api/chores?room_id=... — Lấy danh sách trực nhật của phòng
const getChoresByRoom = async (req, res) => {
  try {
    const { room_id } = req.query;

    if (!room_id) {
      return sendResponse(res, 400, false, "Thiếu room_id");
    }

    const chores = await choreService.getChoresByRoom(room_id);
    return sendResponse(res, 200, true, "Lấy danh sách trực nhật thành công", chores);
  } catch (error) {
    console.error("[ChoreController] getChoresByRoom error:", error.message);
    return sendResponse(res, 500, false, "Lỗi server khi lấy danh sách trực nhật");
  }
};

module.exports = {
  createChore,
  completeChore,
  getChoresByRoom,
};
