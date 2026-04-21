const mongoose = require('mongoose');
const Room = require('../models/room.model');
const DutySchedule = require('../models/duty.schedule.model');

const isValidDateOnly = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

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

const mapDuty = (duty) => ({
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
});

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

    return res.json({ duties: duties.map(mapDuty) });
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

    const duty = await DutySchedule.create({
      room_id: roomId,
      week_start: new Date(`${week_start}T00:00:00.000Z`),
      day_label,
      title: String(title).trim(),
      start_hour: Number(start_hour),
      end_hour: Number(end_hour),
      members: members.map((member) => String(member).trim()).filter(Boolean),
      note: String(note || '').trim(),
      created_by: userId,
    });

    await duty.populate('created_by', 'name');
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
