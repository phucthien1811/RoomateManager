const mongoose = require('mongoose');
const Room = require('../models/room.model');
const DutySchedule = require('../models/duty.schedule.model');
const ChoreLog = require('../models/chore.log.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

const isValidDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const dayOffsetMap = {
  'Thứ 2': 0,
  'Thứ 3': 1,
  'Thứ 4': 2,
  'Thứ 5': 3,
  'Thứ 6': 4,
  'Thứ 7': 5,
  'Chủ nhật': 6,
};

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hasOverlappingDuty = async ({ roomId, weekStart, dayLabel, startHour, endHour, excludeDutyId = null }) => {
  const query = {
    room_id: roomId,
    week_start: weekStart,
    day_label: dayLabel,
    start_hour: { $lt: Number(endHour) },
    end_hour: { $gt: Number(startHour) },
  };
  if (excludeDutyId) {
    query._id = { $ne: excludeDutyId };
  }
  const existed = await DutySchedule.exists(query);
  return Boolean(existed);
};

const checkRoomAccess = async (roomId, userId) => {
  const room = await Room.findById(roomId).select('owner members');
  if (!room) return { ok: false, status: 404, message: 'Phòng không tồn tại' };

  const isOwner = room.owner.toString() === userId;
  const isMember = room.members.some((memberId) => memberId.toString() === userId);
  if (!isOwner && !isMember) {
    return { ok: false, status: 403, message: 'Bạn không có quyền truy cập phòng này' };
  }

  return { ok: true, room };
};

const mapDuty = (duty, completion = {}) => ({
  _id: duty._id,
  room_id: duty.room_id,
  week_start: duty.week_start,
  day_label: duty.day_label,
  title: duty.title,
  start_hour: duty.start_hour,
  end_hour: duty.end_hour,
  members: duty.members || [],
  note: duty.note || '',
  created_by: duty.created_by?._id || duty.created_by,
  created_by_name: duty.created_by?.name || '',
  created_at: duty.created_at,
  updated_at: duty.updated_at,
  completion_status: completion.status || 'pending',
  completion_completed: completion.completed || 0,
  completion_total: completion.total || 0,
});

const resolveTaggedRecipients = async (room, members) => {
  const roomUserIds = [room.owner, ...(room.members || [])].map((item) => item.toString());
  const users = await User.find({ _id: { $in: roomUserIds } }).select('name');

  const userByName = new Map();
  users.forEach((user) => {
    const key = normalizeName(user.name);
    if (!userByName.has(key)) {
      userByName.set(key, user._id.toString());
    }
  });

  const taggedUserIds = new Set();
  (members || []).forEach((memberName) => {
    const userId = userByName.get(normalizeName(memberName));
    if (userId) taggedUserIds.add(userId);
  });

  return Array.from(taggedUserIds);
};

const buildDutyDateTimeText = (weekStart, dayLabel, startHour, endHour) => {
  const dutyDate = new Date(`${weekStart}T00:00:00.000Z`);
  dutyDate.setUTCDate(dutyDate.getUTCDate() + (dayOffsetMap[dayLabel] || 0));

  const dateLabel = dutyDate.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const timeLabel = `${startHour}:00 - ${endHour}:00`;
  return `${timeLabel} ngày ${dateLabel}`;
};

const listByRoomAndWeek = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { week_start: weekStart } = req.query;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: 'roomId không hợp lệ' });
    }
    if (!isValidDateOnly(weekStart)) {
      return res.status(400).json({ message: 'week_start phải có định dạng YYYY-MM-DD' });
    }

    const access = await checkRoomAccess(roomId, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const duties = await DutySchedule.find({
      room_id: roomId,
      week_start: new Date(`${weekStart}T00:00:00.000Z`),
    })
      .sort({ day_label: 1, start_hour: 1 })
      .populate('created_by', 'name');

    if (duties.length === 0) {
      return res.json({ duties: [] });
    }

    const dutyIds = duties.map((duty) => duty._id);
    const roomUserIds = [access.room.owner, ...(access.room.members || [])].map((item) => item.toString());
    const users = await User.find({ _id: { $in: roomUserIds } }).select('name');

    const idByName = new Map();
    users.forEach((user) => {
      const nameKey = normalizeName(user.name);
      if (!idByName.has(nameKey)) {
        idByName.set(nameKey, user._id.toString());
      }
    });

    const taggedByDuty = new Map();
    duties.forEach((duty) => {
      const taggedUserIds = new Set();
      (duty.members || []).forEach((memberName) => {
        const userId = idByName.get(normalizeName(memberName));
        if (userId) taggedUserIds.add(userId);
      });
      taggedByDuty.set(String(duty._id), taggedUserIds);
    });

    const completedLogs = await ChoreLog.find({
      room_id: roomId,
      source_type: 'duty',
      duty_id: { $in: dutyIds },
      status: 'completed',
    }).select('duty_id assigned_to');

    const completedByDuty = new Map();
    completedLogs.forEach((log) => {
      const dutyIdKey = String(log.duty_id);
      if (!completedByDuty.has(dutyIdKey)) {
        completedByDuty.set(dutyIdKey, new Set());
      }
      completedByDuty.get(dutyIdKey).add(String(log.assigned_to));
    });

    const dutiesWithCompletion = duties.map((duty) => {
      const dutyIdKey = String(duty._id);
      const taggedUserIds = taggedByDuty.get(dutyIdKey) || new Set();
      const completedUserIds = completedByDuty.get(dutyIdKey) || new Set();

      const total = taggedUserIds.size > 0 ? taggedUserIds.size : (duty.members || []).length;
      const completed = total > 0
        ? Array.from(completedUserIds).filter((userId) => taggedUserIds.size === 0 || taggedUserIds.has(userId)).length
        : 0;

      const status = total > 0 && completed >= total
        ? 'completed'
        : completed > 0
          ? 'partial'
          : 'pending';

      return mapDuty(duty, { status, completed, total });
    });

    return res.json({ duties: dutiesWithCompletion });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy lịch trực nhật', error: error.message });
  }
};

const createDuty = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { week_start, day_label, title, start_hour, end_hour, members, note } = req.body;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: 'roomId không hợp lệ' });
    }
    if (!isValidDateOnly(week_start)) {
      return res.status(400).json({ message: 'week_start phải có định dạng YYYY-MM-DD' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
    }
    if (!day_label) {
      return res.status(400).json({ message: 'day_label là bắt buộc' });
    }
    if (!Number.isInteger(Number(start_hour)) || !Number.isInteger(Number(end_hour)) || Number(end_hour) <= Number(start_hour)) {
      return res.status(400).json({ message: 'Giờ bắt đầu/kết thúc không hợp lệ' });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'members phải là mảng và không được rỗng' });
    }

    const access = await checkRoomAccess(roomId, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const weekStartDate = new Date(`${week_start}T00:00:00.000Z`);
    const hasOverlap = await hasOverlappingDuty({
      roomId,
      weekStart: weekStartDate,
      dayLabel: day_label,
      startHour: Number(start_hour),
      endHour: Number(end_hour),
    });
    if (hasOverlap) {
      return res.status(409).json({ message: 'Khung giờ bị trùng với lịch trực khác trong cùng ngày' });
    }

    const duty = await DutySchedule.create({
      room_id: roomId,
      week_start: weekStartDate,
      day_label,
      title: String(title).trim(),
      start_hour: Number(start_hour),
      end_hour: Number(end_hour),
      members: members.map((member) => String(member).trim()).filter(Boolean),
      note: String(note || '').trim(),
      created_by: userId,
    });

    await duty.populate('created_by', 'name');

    const dateTimeText = buildDutyDateTimeText(week_start, day_label, Number(start_hour), Number(end_hour));
    const taggedUserIds = await resolveTaggedRecipients(access.room, members);

    const creatorNotification = {
      recipient: userId,
      type: 'success',
      title: 'Đã thêm lịch trực thành công',
      message: `Bạn đã thêm lịch trực "${String(title).trim()}" vào ${dateTimeText}.`,
      meta: `${day_label} • ${start_hour}:00-${end_hour}:00`,
    };

    const assigneeNotifications = taggedUserIds
      .filter((recipientId) => recipientId !== String(userId))
      .map((recipientId) => ({
        recipient: recipientId,
        type: 'info',
        title: 'Bạn được phân công lịch trực',
        message: `Bạn được phân công lịch trực "${String(title).trim()}" vào ${dateTimeText}.`,
        meta: `${day_label} • ${start_hour}:00-${end_hour}:00`,
      }));

    await Notification.insertMany([creatorNotification, ...assigneeNotifications]);

    return res.status(201).json({ message: 'Tạo lịch trực nhật thành công', duty: mapDuty(duty) });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi tạo lịch trực nhật', error: error.message });
  }
};

const updateDuty = async (req, res) => {
  try {
    const { dutyId } = req.params;
    const userId = req.user.id;
    const { title, start_hour, end_hour, members, note } = req.body;

    if (!mongoose.isValidObjectId(dutyId)) {
      return res.status(400).json({ message: 'dutyId không hợp lệ' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Tiêu đề là bắt buộc' });
    }
    if (!Number.isInteger(Number(start_hour)) || !Number.isInteger(Number(end_hour)) || Number(end_hour) <= Number(start_hour)) {
      return res.status(400).json({ message: 'Giờ bắt đầu/kết thúc không hợp lệ' });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'members phải là mảng và không được rỗng' });
    }

    const duty = await DutySchedule.findById(dutyId);
    if (!duty) {
      return res.status(404).json({ message: 'Lịch trực nhật không tồn tại' });
    }

    const access = await checkRoomAccess(duty.room_id, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const hasOverlap = await hasOverlappingDuty({
      roomId: duty.room_id,
      weekStart: duty.week_start,
      dayLabel: duty.day_label,
      startHour: Number(start_hour),
      endHour: Number(end_hour),
      excludeDutyId: duty._id,
    });
    if (hasOverlap) {
      return res.status(409).json({ message: 'Khung giờ bị trùng với lịch trực khác trong cùng ngày' });
    }

    duty.title = String(title).trim();
    duty.start_hour = Number(start_hour);
    duty.end_hour = Number(end_hour);
    duty.members = members.map((member) => String(member).trim()).filter(Boolean);
    duty.note = String(note || '').trim();
    await duty.save();
    await duty.populate('created_by', 'name');

    return res.json({ message: 'Cập nhật lịch trực nhật thành công', duty: mapDuty(duty) });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật lịch trực nhật', error: error.message });
  }
};

const deleteDuty = async (req, res) => {
  try {
    const { dutyId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(dutyId)) {
      return res.status(400).json({ message: 'dutyId không hợp lệ' });
    }

    const duty = await DutySchedule.findById(dutyId);
    if (!duty) {
      return res.status(404).json({ message: 'Lịch trực nhật không tồn tại' });
    }

    const access = await checkRoomAccess(duty.room_id, userId);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    await DutySchedule.deleteOne({ _id: dutyId });
    return res.json({ message: 'Xóa lịch trực nhật thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi xóa lịch trực nhật', error: error.message });
  }
};

module.exports = {
  listByRoomAndWeek,
  createDuty,
  updateDuty,
  deleteDuty,
};
