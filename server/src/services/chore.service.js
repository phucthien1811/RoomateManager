const mongoose = require("mongoose");
const ChoreLog = require("../models/chore.log.model");
const DutySchedule = require("../models/duty.schedule.model");
const Room = require("../models/room.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const { CHORE_STATUS } = require("../constants/chore.constant");

const dayOffsetMap = {
  "Thứ 2": 0,
  "Thứ 3": 1,
  "Thứ 4": 2,
  "Thứ 5": 3,
  "Thứ 6": 4,
  "Thứ 7": 5,
  "Chủ nhật": 6,
};

const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

const getWeekStart = (date = new Date()) => {
  const result = new Date(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
};

const isValidDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const resolveDutyDate = (weekStart, dayLabel) => {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + (dayOffsetMap[dayLabel] || 0));
  return date;
};

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

const ensureRoomAccess = async (roomId, userId) => {
  if (!mongoose.isValidObjectId(roomId)) {
    throw new Error("room_id không hợp lệ");
  }

  const room = await Room.findById(roomId).select("owner members");
  if (!room) {
    throw new Error("Phòng không tồn tại");
  }

  const currentUserId = String(userId);
  const isOwner = String(room.owner) === currentUserId;
  const isMember = (room.members || []).some((memberId) => String(memberId) === currentUserId);
  if (!isOwner && !isMember) {
    throw new Error("Bạn không có quyền truy cập phòng này");
  }

  return room;
};

const getRoomUserMap = async (room) => {
  const roomUserIds = [room.owner, ...(room.members || [])].map((item) => String(item));
  const users = await User.find({ _id: { $in: roomUserIds } }).select("name");

  const byId = new Map();
  const idByName = new Map();
  users.forEach((user) => {
    const id = String(user._id);
    byId.set(id, user);

    const nameKey = normalizeName(user.name);
    if (!idByName.has(nameKey)) {
      idByName.set(nameKey, id);
    }
  });

  return { byId, idByName };
};

const mapChore = (item) => ({
  _id: item._id,
  room_id: item.room_id,
  source_type: item.source_type || "manual",
  duty_id: item.duty_id || null,
  title: item.title || item.note || "",
  note: item.note || "",
  chore_date: item.chore_date,
  week_start: item.week_start || null,
  duty_day_label: item.duty_day_label || "",
  start_hour: item.start_hour ?? null,
  end_hour: item.end_hour ?? null,
  status: item.status,
  completed_at: item.completed_at,
  proof_images: item.proof_images || [],
  assigned_to: item.assigned_to || null,
  assigned_members: item.assigned_members || [],
  created_by: item.created_by || null,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const getChoresByRoom = async ({ roomId, userId }) => {
  await ensureRoomAccess(roomId, userId);
  const chores = await ChoreLog.find({ room_id: roomId, source_type: "manual" })
    .populate("assigned_to", "name email")
    .populate("assigned_members", "name email")
    .populate("created_by", "name email")
    .sort({ chore_date: 1, created_at: -1 });
  return chores.map(mapChore);
};

const createChore = async ({ roomId, userId, title, choreDate, note, memberIds, startHour, endHour }) => {
  const room = await ensureRoomAccess(roomId, userId);
  if (!isValidDateOnly(choreDate)) {
    throw new Error("chore_date phải có định dạng YYYY-MM-DD");
  }

  const trimmedTitle = String(title || "").trim();
  if (!trimmedTitle) {
    throw new Error("Tiêu đề công việc là bắt buộc");
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    throw new Error("Phải tag ít nhất 1 thành viên");
  }

  const uniqueMemberIds = [...new Set(memberIds.map((memberId) => String(memberId)))];
  const roomMemberSet = new Set([String(room.owner), ...(room.members || []).map((id) => String(id))]);
  const invalidMember = uniqueMemberIds.find((memberId) => !roomMemberSet.has(memberId));
  if (invalidMember) {
    throw new Error("Có thành viên không thuộc phòng");
  }

  const parsedStartHour = startHour === null || startHour === undefined || startHour === ""
    ? null
    : Number(startHour);
  const parsedEndHour = endHour === null || endHour === undefined || endHour === ""
    ? null
    : Number(endHour);
  if ((parsedStartHour !== null || parsedEndHour !== null) && (!Number.isInteger(parsedStartHour) || !Number.isInteger(parsedEndHour) || parsedEndHour <= parsedStartHour)) {
    throw new Error("Khung giờ công việc không hợp lệ");
  }

  const chore = await ChoreLog.create({
    room_id: toObjectId(roomId),
    assigned_to: toObjectId(uniqueMemberIds[0]),
    assigned_members: uniqueMemberIds.map((memberId) => toObjectId(memberId)),
    created_by: toObjectId(userId),
    chore_date: new Date(`${choreDate}T00:00:00.000Z`),
    title: trimmedTitle,
    note: String(note || "").trim(),
    start_hour: parsedStartHour,
    end_hour: parsedEndHour,
    status: CHORE_STATUS.PENDING,
    source_type: "manual",
  });

  await chore.populate("assigned_members", "name");
  const dateLabel = new Date(`${choreDate}T00:00:00.000Z`).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const timeLabel = parsedStartHour !== null && parsedEndHour !== null ? ` (${parsedStartHour}:00-${parsedEndHour}:00)` : "";

  const assigneeNotifications = (chore.assigned_members || [])
    .map((member) => String(member._id))
    .filter((memberId) => memberId !== String(userId))
    .map((recipient) => ({
      recipient,
      type: "info",
      title: "Bạn được giao công việc mới",
      message: `Bạn được tag vào công việc "${trimmedTitle}" ngày ${dateLabel}${timeLabel}.`,
      meta: "Công việc chung",
    }));

  const creatorNotification = {
    recipient: userId,
    type: "success",
    title: "Tạo công việc thành công",
    message: `Đã tạo công việc "${trimmedTitle}" cho ${dateLabel}${timeLabel}.`,
    meta: "Công việc chung",
  };

  await Notification.insertMany([creatorNotification, ...assigneeNotifications]);

  const saved = await ChoreLog.findById(chore._id)
    .populate("assigned_to", "name email")
    .populate("assigned_members", "name email")
    .populate("created_by", "name email");
  return mapChore(saved);
};

const completeChore = async ({ choreId, userId, proofImages }) => {
  const chore = await ChoreLog.findById(choreId);
  if (!chore) throw new Error("Không tìm thấy công việc");

  await ensureRoomAccess(chore.room_id, userId);
  const isAssigned = (chore.assigned_members || []).some((memberId) => String(memberId) === String(userId))
    || String(chore.assigned_to) === String(userId);
  if (!isAssigned) {
    throw new Error("Bạn không có quyền hoàn thành công việc này");
  }
  if (chore.status === CHORE_STATUS.COMPLETED) {
    throw new Error("Công việc đã được hoàn thành trước đó");
  }

  if (!Array.isArray(proofImages) || proofImages.length === 0) {
    throw new Error("Vui lòng tải lên ít nhất 1 ảnh minh chứng");
  }

  chore.status = CHORE_STATUS.COMPLETED;
  chore.completed_at = new Date();
  chore.proof_images = proofImages.map((item) => String(item)).filter(Boolean).slice(0, 5);
  await chore.save();

  const saved = await ChoreLog.findById(chore._id)
    .populate("assigned_to", "name email")
    .populate("assigned_members", "name email")
    .populate("created_by", "name email");
  return mapChore(saved);
};

const getMyDutyTasks = async ({ roomId, userId, weekStart }) => {
  const room = await ensureRoomAccess(roomId, userId);
  const { byId } = await getRoomUserMap(room);
  const currentUser = byId.get(String(userId));
  if (!currentUser) {
    return [];
  }

  const selectedWeekStart = weekStart && isValidDateOnly(weekStart)
    ? new Date(`${weekStart}T00:00:00.000Z`)
    : new Date(getWeekStart());

  const duties = await DutySchedule.find({
    room_id: roomId,
    week_start: selectedWeekStart,
  }).sort({ day_label: 1, start_hour: 1 });

  const currentUserName = normalizeName(currentUser.name);
  const myDuties = duties.filter((duty) => (duty.members || []).some((memberName) => normalizeName(memberName) === currentUserName));
  const dutyIds = myDuties.map((duty) => duty._id);

  const completedLogs = await ChoreLog.find({
    room_id: roomId,
    source_type: "duty",
    duty_id: { $in: dutyIds },
    assigned_to: userId,
  });
  const logByDutyId = new Map(completedLogs.map((log) => [String(log.duty_id), log]));

  return myDuties.map((duty) => {
    const completedLog = logByDutyId.get(String(duty._id));
    const choreDate = resolveDutyDate(duty.week_start, duty.day_label);

    if (!completedLog) {
      return {
        _id: `duty-${String(duty._id)}`,
        room_id: duty.room_id,
        source_type: "duty",
        duty_id: String(duty._id),
        title: duty.title,
        note: duty.note || "",
        chore_date: choreDate,
        week_start: duty.week_start,
        duty_day_label: duty.day_label,
        start_hour: duty.start_hour,
        end_hour: duty.end_hour,
        status: CHORE_STATUS.PENDING,
        completed_at: null,
        proof_images: [],
        members: duty.members || [],
      };
    }

    return {
      ...mapChore(completedLog),
      duty_id: String(duty._id),
      members: duty.members || [],
      duty_day_label: duty.day_label,
      start_hour: duty.start_hour,
      end_hour: duty.end_hour,
      title: duty.title,
      note: completedLog.note || duty.note || "",
      chore_date: choreDate,
    };
  });
};

const completeDutyTask = async ({ roomId, dutyId, userId, proofImages }) => {
  const room = await ensureRoomAccess(roomId, userId);
  if (!mongoose.isValidObjectId(dutyId)) {
    throw new Error("dutyId không hợp lệ");
  }
  if (!Array.isArray(proofImages) || proofImages.length === 0) {
    throw new Error("Vui lòng tải lên ít nhất 1 ảnh minh chứng");
  }

  const duty = await DutySchedule.findById(dutyId);
  if (!duty || String(duty.room_id) !== String(roomId)) {
    throw new Error("Không tìm thấy lịch trực");
  }

  const { byId } = await getRoomUserMap(room);
  const currentUser = byId.get(String(userId));
  const currentUserName = normalizeName(currentUser?.name || "");
  const tagged = (duty.members || []).some((memberName) => normalizeName(memberName) === currentUserName);
  if (!tagged) {
    throw new Error("Bạn không được tag trong lịch trực này");
  }

  const existingLog = await ChoreLog.findOne({
    room_id: roomId,
    source_type: "duty",
    duty_id: duty._id,
    assigned_to: userId,
  });
  if (existingLog?.status === CHORE_STATUS.COMPLETED) {
    throw new Error("Bạn đã hoàn thành nhiệm vụ này trước đó");
  }

  const completedLog = existingLog || new ChoreLog({
    room_id: roomId,
    source_type: "duty",
    duty_id: duty._id,
    assigned_to: userId,
    assigned_members: [userId],
    created_by: duty.created_by,
    title: duty.title,
    note: duty.note || "",
    chore_date: resolveDutyDate(duty.week_start, duty.day_label),
    week_start: duty.week_start,
    duty_day_label: duty.day_label,
    start_hour: duty.start_hour,
    end_hour: duty.end_hour,
  });

  completedLog.status = CHORE_STATUS.COMPLETED;
  completedLog.completed_at = new Date();
  completedLog.proof_images = proofImages.map((item) => String(item)).filter(Boolean).slice(0, 5);
  await completedLog.save();

  const saved = await ChoreLog.findById(completedLog._id)
    .populate("assigned_to", "name email")
    .populate("assigned_members", "name email")
    .populate("created_by", "name email");
  return mapChore(saved);
};

const deleteChore = async ({ choreId, userId }) => {
  const chore = await ChoreLog.findById(choreId);
  if (!chore) {
    throw new Error("Không tìm thấy công việc");
  }

  const room = await ensureRoomAccess(chore.room_id, userId);
  if (chore.source_type === "duty") {
    throw new Error("Không thể xóa nhiệm vụ phát sinh từ lịch trực");
  }

  const isOwner = String(room.owner) === String(userId);
  const isCreator = chore.created_by && String(chore.created_by) === String(userId);
  if (!isOwner && !isCreator) {
    throw new Error("Bạn không có quyền xóa công việc này");
  }

  await ChoreLog.deleteOne({ _id: choreId });
};

module.exports = {
  getChoresByRoom,
  createChore,
  completeChore,
  getMyDutyTasks,
  completeDutyTask,
  deleteChore,
};
