import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faChevronLeft, faChevronRight, faPenToSquare, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import roomService from '../services/room.service.js';
import dutyScheduleService from '../services/duty.schedule.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from './PageHeader.jsx';
import '../styles/duty.schedule.css';

dayjs.extend(utc);
dayjs.extend(timezone);

const appTimezone = 'Asia/Ho_Chi_Minh';
const defaultMembers = ['Duy Nguyễn', 'Iris Trần', 'An Phạm', 'Minh Trần'];
const dayColumns = [
  { shortLabel: 'CN', dutyDay: 'Chủ nhật', offset: -1 },
  { shortLabel: 'THỨ 2', dutyDay: 'Thứ 2', offset: 0 },
  { shortLabel: 'THỨ 3', dutyDay: 'Thứ 3', offset: 1 },
  { shortLabel: 'THỨ 4', dutyDay: 'Thứ 4', offset: 2 },
  { shortLabel: 'THỨ 5', dutyDay: 'Thứ 5', offset: 3 },
  { shortLabel: 'THỨ 6', dutyDay: 'Thứ 6', offset: 4 },
  { shortLabel: 'THỨ 7', dutyDay: 'Thứ 7', offset: 5 },
];
const timeSlots = Array.from({ length: 23 }, (_, index) => ({
  slot: index + 1,
  hour: index + 1,
}));

const formatHourLabel = (hour) => {
  const normalizedHour = ((hour + 11) % 12) + 1;
  const suffix = hour >= 12 && hour < 24 ? 'PM' : 'AM';
  return `${normalizedHour} ${suffix}`;
};

const getDutyTimeRange = (startHour, endHour) => `${formatHourLabel(startHour)} - ${formatHourLabel(endHour)}`;

const startOfWeekMonday = (inputDate) => {
  const result = new Date(inputDate);
  result.setHours(0, 0, 0, 0);
  const dayOfWeek = result.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  result.setDate(result.getDate() + offset);
  return result;
};

const toDateKey = (date) => {
  return dayjs(date).tz(appTimezone).format('YYYY-MM-DD');
};

const getTodayKey = () => dayjs().tz(appTimezone).format('YYYY-MM-DD');

const getDayDateByOffset = (weekStart, offset) => {
  const result = new Date(weekStart);
  result.setDate(result.getDate() + offset);
  return result;
};

const getCellDateTime = (weekStart, offset, hour) => {
  const result = getDayDateByOffset(weekStart, offset);
  result.setHours(hour, 0, 0, 0);
  return result;
};

const notify = ({ type, title, message, meta }) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('app-notification', {
      detail: {
        type,
        title,
        message,
        meta,
        createdAt: new Date().toISOString(),
      },
    })
  );
};

const DutySchedule = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [isFollowingToday, setIsFollowingToday] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [loadingDuties, setLoadingDuties] = useState(false);
  const [roomCreatedAt, setRoomCreatedAt] = useState(() => {
    const cached = localStorage.getItem('currentRoomCreatedAt');
    const parsed = cached ? new Date(cached) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date(0);
  });
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDay, setEditingDay] = useState('');
  const [editingOffset, setEditingOffset] = useState(0);
  const [editingDutyId, setEditingDutyId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    startHour: 16,
    endHour: 17,
    members: [],
    note: '',
  });

  useEffect(() => {
    const loadRoomCreatedAt = async (roomId) => {
      setSelectedRoomId(roomId || '');
      if (!roomId) {
        setRoomCreatedAt(new Date(0));
        return;
      }

      try {
        const room = await roomService.getRoomById(roomId);
        const rawCreatedAt = room?.createdAt || room?.created_at || room?.createdDate;
        const parsed = rawCreatedAt ? new Date(rawCreatedAt) : new Date(0);
        if (Number.isNaN(parsed.getTime())) {
          setRoomCreatedAt(new Date(0));
          return;
        }
        setRoomCreatedAt(parsed);
        localStorage.setItem('currentRoomCreatedAt', parsed.toISOString());
      } catch (error) {
        setRoomCreatedAt(new Date(0));
      }
    };

    loadRoomCreatedAt(localStorage.getItem('currentRoomId'));

    const handleRoomSelected = (event) => {
      loadRoomCreatedAt(event.detail?.roomId || localStorage.getItem('currentRoomId'));
    };

    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  useEffect(() => {
    if (!isFollowingToday) return undefined;

    const syncToday = () => setSelectedDate(getTodayKey());
    syncToday();

    const intervalId = setInterval(syncToday, 60000);
    return () => clearInterval(intervalId);
  }, [isFollowingToday]);

  const displayWeekStart = useMemo(() => startOfWeekMonday(new Date(selectedDate)), [selectedDate]);
  const todayKey = getTodayKey();
  const memberOptions = useMemo(() => {
    const uniqueMembers = new Set(defaultMembers);
    if (user?.name && String(user.name).trim()) {
      uniqueMembers.add(String(user.name).trim());
    }
    return Array.from(uniqueMembers);
  }, [user?.name]);
  const displayWeekKey = useMemo(() => toDateKey(displayWeekStart), [displayWeekStart]);
  const earliestWeekStart = useMemo(() => startOfWeekMonday(roomCreatedAt), [roomCreatedAt]);
  const earliestWeekKey = useMemo(() => toDateKey(earliestWeekStart), [earliestWeekStart]);
  const currentSchedule = schedules.find((schedule) => schedule.weekStart === displayWeekKey) || {
    weekStart: displayWeekKey,
    duties: [],
  };

  useEffect(() => {
    const fetchWeekDuties = async () => {
      if (!selectedRoomId) {
        setSchedules((prev) => prev.filter((item) => item.weekStart !== displayWeekKey));
        return;
      }

      setLoadingDuties(true);
      try {
        const duties = await dutyScheduleService.getWeekDuties(selectedRoomId, displayWeekKey);
        const mapped = duties.map((item) => ({
          id: item._id,
          day: item.day_label,
          title: item.title,
          startHour: Number(item.start_hour),
          endHour: Number(item.end_hour),
          members: Array.isArray(item.members) ? item.members : [],
          note: item.note || '',
          createdByName: item.created_by_name || '',
        }));

        setSchedules((prev) => {
          const withoutWeek = prev.filter((item) => item.weekStart !== displayWeekKey);
          return [...withoutWeek, { weekStart: displayWeekKey, duties: mapped }];
        });
      } catch (error) {
        notify({
          type: 'error',
          title: 'Lỗi tải lịch trực',
          message: error?.message || 'Không thể tải lịch trực nhật từ hệ thống',
          meta: displayWeekKey,
        });
      } finally {
        setLoadingDuties(false);
      }
    };

    fetchWeekDuties();
  }, [selectedRoomId, displayWeekKey]);

  const weekDates = useMemo(
    () => dayColumns.map((dayColumn) => getDayDateByOffset(displayWeekStart, dayColumn.offset)),
    [displayWeekStart]
  );

  const handleOpenModal = (day, offset, hour, duty = null) => {
    const now = new Date();
    const targetDateTime = getCellDateTime(displayWeekStart, offset, hour);

    if (!duty && (targetDateTime < roomCreatedAt || targetDateTime < now)) {
      notify({
        type: 'warning',
        title: 'Không thể tạo lịch',
        message: 'Không thể tạo lịch ở thời gian trước ngày tạo phòng hoặc đã qua.',
        meta: `${day} - ${formatHourLabel(hour)}`,
      });
      return;
    }

    if (duty) {
      const dutyStart = getCellDateTime(displayWeekStart, offset, duty.startHour);
      if (dutyStart < roomCreatedAt || dutyStart < now) {
        notify({
          type: 'warning',
          title: 'Không thể chỉnh sửa',
          message: 'Ca trực đã qua hoặc trước ngày tạo phòng.',
          meta: day,
        });
        return;
      }
    }

    setEditingDay(day);
    setEditingOffset(offset);
    if (duty) {
      setEditingDutyId(duty.id);
      setFormData({
        title: duty.title,
        startHour: duty.startHour,
        endHour: duty.endHour,
        members: duty.members || [],
        note: duty.note || '',
      });
    } else {
      setEditingDutyId(null);
      setFormData({
        title: '',
        startHour: hour,
        endHour: Math.min(hour + 1, 23),
        members: [],
        note: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDay('');
    setEditingOffset(0);
    setEditingDutyId(null);
  };

  const handleToggleMember = (member) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(member)
        ? prev.members.filter((item) => item !== member)
        : [...prev.members, member],
    }));
  };

  const handleSaveDuty = async () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề.');
      return;
    }
    if (formData.endHour <= formData.startHour) {
      alert('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
      return;
    }
    if (formData.members.length === 0) {
      alert('Vui lòng chọn ít nhất một thành viên phụ trách.');
      return;
    }

    const now = new Date();
    const targetStartDateTime = getCellDateTime(displayWeekStart, editingOffset, formData.startHour);
    if (targetStartDateTime < roomCreatedAt || targetStartDateTime < now) {
      alert('Không thể tạo hoặc chỉnh sửa lịch ở mốc thời gian đã khóa.');
      return;
    }

    const targetSchedule = schedules.find((schedule) => schedule.weekStart === displayWeekKey) || {
      weekStart: displayWeekKey,
      duties: [],
    };

    const hasOverlap = targetSchedule.duties.some((duty) => {
      if (duty.day !== editingDay || duty.id === editingDutyId) return false;
      return !(formData.endHour <= duty.startHour || formData.startHour >= duty.endHour);
    });

    if (hasOverlap) {
      alert('Khung giờ bị trùng với công việc khác trong cùng ngày.');
      return;
    }

    if (!selectedRoomId) {
      alert('Vui lòng chọn phòng trước khi tạo lịch trực.');
      return;
    }

    const payload = {
      week_start: displayWeekKey,
      day_label: editingDay,
      title: formData.title.trim(),
      start_hour: Number(formData.startHour),
      end_hour: Number(formData.endHour),
      members: [...formData.members],
      note: formData.note.trim(),
    };

    try {
      let savedDuty;
      if (editingDutyId) {
        savedDuty = await dutyScheduleService.updateDuty(editingDutyId, payload);
      } else {
        savedDuty = await dutyScheduleService.createDuty(selectedRoomId, payload);
      }

      const mappedDuty = {
        id: savedDuty._id,
        day: savedDuty.day_label,
        title: savedDuty.title,
        startHour: Number(savedDuty.start_hour),
        endHour: Number(savedDuty.end_hour),
        members: Array.isArray(savedDuty.members) ? savedDuty.members : [],
        note: savedDuty.note || '',
        createdByName: savedDuty.created_by_name || '',
      };

      setSchedules((prev) => {
        const withoutWeek = prev.filter((schedule) => schedule.weekStart !== displayWeekKey);
        const baseWeek = prev.find((schedule) => schedule.weekStart === displayWeekKey) || {
          weekStart: displayWeekKey,
          duties: [],
        };
        const nextWeekDuties = editingDutyId
          ? baseWeek.duties.map((duty) => (duty.id === editingDutyId ? mappedDuty : duty))
          : [...baseWeek.duties, mappedDuty];
        return [...withoutWeek, { weekStart: displayWeekKey, duties: nextWeekDuties }];
      });

      notify({
        type: 'success',
        title: editingDutyId ? 'Cập nhật lịch thành công' : 'Đã thêm lịch trực thành công',
        message: `${mappedDuty.title} (${getDutyTimeRange(mappedDuty.startHour, mappedDuty.endHour)})`,
        meta: `${editingDay} - ${mappedDuty.members.join(', ')}`,
      });
      handleCloseModal();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Lưu lịch thất bại',
        message: error?.message || 'Không thể lưu lịch trực nhật',
        meta: editingDay,
      });
    }
  };

  const handleDeleteDuty = async (dutyId) => {
    const duty = currentSchedule.duties.find((item) => item.id === dutyId);
    if (!duty) return;

    const offset = dayColumns.find((dayColumn) => dayColumn.dutyDay === duty.day)?.offset ?? 0;
    const dutyStart = getCellDateTime(displayWeekStart, offset, duty.startHour);
    if (dutyStart < new Date() || dutyStart < roomCreatedAt) {
      notify({
        type: 'warning',
        title: 'Không thể xóa',
        message: 'Ca trực đã khóa nên không thể xóa.',
        meta: duty.day,
      });
      return;
    }

    try {
      await dutyScheduleService.deleteDuty(dutyId);
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.weekStart !== displayWeekKey
            ? schedule
            : { ...schedule, duties: schedule.duties.filter((item) => item.id !== dutyId) }
        )
      );
      notify({
        type: 'info',
        title: 'Đã xóa lịch trực',
        message: duty.title,
        meta: duty.day,
      });
    } catch (error) {
      notify({
        type: 'error',
        title: 'Xóa lịch thất bại',
        message: error?.message || 'Không thể xóa lịch trực nhật',
        meta: duty.day,
      });
    }
  };

  const moveWeek = (direction) => {
    const next = new Date(displayWeekStart);
    next.setDate(next.getDate() + direction * 7);
    if (next < earliestWeekStart) return;
    setIsFollowingToday(false);
    setSelectedDate(toDateKey(next));
  };

  const handleChangeDate = (value) => {
    setIsFollowingToday(value === getTodayKey());
    setSelectedDate(value);
  };

  return (
    <div className="duty-schedule">
      <PageHeader title="Lịch Trực Nhật Phòng" />

      <div className="schedule-toolbar">
        <div className="toolbar-group">
          <label>Chọn ngày</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => handleChangeDate(event.target.value)}
            className="toolbar-date-input"
          />
        </div>
        <div className="toolbar-week-range">
          {weekDates[0]?.toLocaleDateString('vi-VN')} - {weekDates[6]?.toLocaleDateString('vi-VN')}
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            title="Tuần trước"
            onClick={() => moveWeek(-1)}
            disabled={displayWeekKey <= earliestWeekKey}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            type="button"
            className="current-btn"
            onClick={() => {
              setIsFollowingToday(true);
              setSelectedDate(getTodayKey());
            }}
          >
            Hôm nay
          </button>
          <button type="button" title="Tuần sau" onClick={() => moveWeek(1)}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      <div className="schedule-table-wrap">
        <table className="duty-grid">
          <colgroup>
            <col className="timezone-col-fixed" />
            {dayColumns.map((day) => (
              <col key={`col-${day.dutyDay}`} className="day-col-fixed" />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="timezone-col">GMT+07</th>
              {dayColumns.map((day, index) => (
                <th key={day.dutyDay} className="calendar-head-cell">
                  <span className="calendar-day-label">{day.shortLabel}</span>
                  <span className={`calendar-day-number ${toDateKey(weekDates[index]) === todayKey ? 'selected' : ''}`}>
                    {weekDates[index]?.getDate()}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot) => (
              <tr key={timeSlot.slot}>
                <td className="time-label-cell">{formatHourLabel(timeSlot.hour)}</td>
                {dayColumns.map((day) => {
                  const dayDuties = currentSchedule.duties.filter((item) => item.day === day.dutyDay);
                  const duty = dayDuties.find((item) => item.startHour === timeSlot.hour);
                  const isCovered = dayDuties.some(
                    (item) => timeSlot.hour > item.startHour && timeSlot.hour < item.endHour
                  );
                  const cellDateTime = getCellDateTime(displayWeekStart, day.offset, timeSlot.hour);
                  const isLocked = cellDateTime < roomCreatedAt || cellDateTime < new Date();

                  if (isCovered) return null;

                  if (duty) {
                    return (
                      <td
                        key={`${day.dutyDay}-${timeSlot.slot}`}
                        rowSpan={duty.endHour - duty.startHour}
                        className={`duty-cell-filled ${isLocked ? 'locked' : ''}`}
                        onClick={() => handleOpenModal(day.dutyDay, day.offset, timeSlot.hour, duty)}
                      >
                        <div className="duty-card" title={duty.note || ''}>
                          <strong>{duty.title}</strong>
                          <p className="duty-time">{getDutyTimeRange(duty.startHour, duty.endHour)}</p>
                          <div className="duty-member-tags">
                            {duty.createdByName && <span className="creator-tag">Tạo: {duty.createdByName}</span>}
                            {duty.members.map((member) => (
                              <span key={member}>{member}</span>
                            ))}
                          </div>
                          {duty.note && <p className="duty-note">{duty.note}</p>}
                          <div className="duty-card-actions">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenModal(day.dutyDay, day.offset, timeSlot.hour, duty);
                              }}
                              disabled={isLocked}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteDuty(duty.id);
                              }}
                              disabled={isLocked}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${day.dutyDay}-${timeSlot.slot}`}
                      className={`duty-cell-empty ${isLocked ? 'locked' : ''}`}
                      onClick={() => handleOpenModal(day.dutyDay, day.offset, timeSlot.hour)}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Phân công - {editingDay}</h2>
              <button className="btn-close" onClick={handleCloseModal} type="button">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tiêu đề</label>
                <input
                  className="form-input"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Thêm tiêu đề"
                />
              </div>

              <div className="form-group">
                <label>Giờ</label>
                <div className="form-row">
                  <select
                    value={formData.startHour}
                    onChange={(event) => {
                      const nextStart = Number(event.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        startHour: nextStart,
                        endHour: Math.max(prev.endHour, nextStart + 1),
                      }));
                    }}
                    className="form-select"
                  >
                    {timeSlots.map((timeSlot) => (
                      <option key={`start-${timeSlot.slot}`} value={timeSlot.hour}>
                        {formatHourLabel(timeSlot.hour)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.endHour}
                    onChange={(event) => setFormData((prev) => ({ ...prev, endHour: Number(event.target.value) }))}
                    className="form-select"
                  >
                    {Array.from({ length: 24 - formData.startHour }, (_, index) => formData.startHour + index + 1)
                      .filter((hour) => hour <= 24)
                      .map((hour) => (
                        <option key={`end-${hour}`} value={hour}>
                          {formatHourLabel(hour)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Thành viên phụ trách</label>
                <div className="member-tag-picker">
                  {memberOptions.map((member) => {
                    const selected = formData.members.includes(member);
                    return (
                      <button
                        key={member}
                        type="button"
                        className={`member-tag-btn ${selected ? 'selected' : ''}`}
                        onClick={() => handleToggleMember(member)}
                      >
                        {member}
                      </button>
                    );
                  })}
                </div>
                <div className="selected-member-tags">
                  {formData.members.map((member) => (
                    <span key={member}>{member}</span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  className="form-textarea"
                  value={formData.note}
                  onChange={(event) => setFormData((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Thêm ghi chú cho lịch trực nhật"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" type="button" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="btn-save" type="button" onClick={handleSaveDuty}>
                <FontAwesomeIcon icon={faCheck} /> Lưu phân công
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutySchedule;
