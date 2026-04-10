    import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faCalendarAlt,
  faUser,
  faTimes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/duty.schedule.css';

const DutySchedule = () => {
  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const members = ['Duy Nguyễn', 'Iris Trần', 'An Phạm', 'Minh Trần'];

  const [schedules, setSchedules] = useState([
    {
      id: 1,
      week: 1,
      year: 2024,
      month: 4,
      duties: [
        { day: 'Thứ 2', assignedTo: 'Duy Nguyễn', task: 'Vệ sinh phòng tắm' },
        { day: 'Thứ 3', assignedTo: 'Iris Trần', task: 'Rửa bát, dọn bếp' },
        { day: 'Thứ 4', assignedTo: 'An Phạm', task: 'Quét lau cầu thang' },
        { day: 'Thứ 5', assignedTo: 'Minh Trần', task: 'Vệ sinh phòng khách' },
        { day: 'Thứ 6', assignedTo: 'Duy Nguyễn', task: 'Kiểm tra đồ ăn' },
        { day: 'Thứ 7', assignedTo: 'Iris Trần', task: 'Vệ sinh phòng ngủ' },
        { day: 'Chủ nhật', assignedTo: 'An Phạm', task: 'Dọn dẹp toàn bộ' },
      ],
    },
    {
      id: 2,
      week: 2,
      year: 2024,
      month: 4,
      duties: [
        { day: 'Thứ 2', assignedTo: 'Iris Trần', task: 'Vệ sinh phòng tắm' },
        { day: 'Thứ 3', assignedTo: 'An Phạm', task: 'Rửa bát, dọn bếp' },
        { day: 'Thứ 4', assignedTo: 'Minh Trần', task: 'Quét lau cầu thang' },
        { day: 'Thứ 5', assignedTo: 'Duy Nguyễn', task: 'Vệ sinh phòng khách' },
        { day: 'Thứ 6', assignedTo: 'Iris Trần', task: 'Kiểm tra đồ ăn' },
        { day: 'Thứ 7', assignedTo: 'An Phạm', task: 'Vệ sinh phòng ngủ' },
        { day: 'Chủ nhật', assignedTo: 'Minh Trần', task: 'Dọn dẹp toàn bộ' },
      ],
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [editingDayIndex, setEditingDayIndex] = useState(null);
  const [formData, setFormData] = useState({
    assignedTo: '',
    task: '',
  });
  const [selectedWeek, setSelectedWeek] = useState(schedules[0]?.id);

  const currentSchedule = schedules.find((s) => s.id === selectedWeek);

  const handleOpenModal = (scheduleId, dayIndex, duty = null) => {
    setEditingScheduleId(scheduleId);
    setEditingDayIndex(dayIndex);
    if (duty) {
      setFormData({
        assignedTo: duty.assignedTo,
        task: duty.task,
      });
    } else {
      setFormData({
        assignedTo: '',
        task: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ assignedTo: '', task: '' });
  };

  const handleSaveDuty = () => {
    if (!formData.assignedTo.trim() || !formData.task.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const updatedSchedules = schedules.map((schedule) => {
      if (schedule.id === editingScheduleId) {
        const updatedDuties = [...schedule.duties];
        updatedDuties[editingDayIndex] = {
          ...updatedDuties[editingDayIndex],
          assignedTo: formData.assignedTo,
          task: formData.task,
        };
        return { ...schedule, duties: updatedDuties };
      }
      return schedule;
    });

    setSchedules(updatedSchedules);
    handleCloseModal();
  };

  const handleDeleteDuty = (scheduleId, dayIndex) => {
    if (window.confirm('Bạn có chắc muốn xóa công việc này?')) {
      const updatedSchedules = schedules.map((schedule) => {
        if (schedule.id === scheduleId) {
          const updatedDuties = [...schedule.duties];
          updatedDuties[dayIndex] = {
            ...updatedDuties[dayIndex],
            assignedTo: '',
            task: '',
          };
          return { ...schedule, duties: updatedDuties };
        }
        return schedule;
      });
      setSchedules(updatedSchedules);
    }
  };

  const getWeekDateRange = (week, month, year) => {
    const firstDay = new Date(year, month - 1, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() + (week - 1) * 7 - firstDay.getDay() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return {
      start: startDate.toLocaleDateString('vi-VN'),
      end: endDate.toLocaleDateString('vi-VN'),
    };
  };

  const weekRange = currentSchedule ? getWeekDateRange(currentSchedule.week, currentSchedule.month, currentSchedule.year) : {};

  return (
    <div className="duty-schedule">
      <div className="schedule-header">
        <div className="header-content">
          <h1>Bảng Phân Công Trực Nhật</h1>
          <p>Quản lý lịch trực nhật hàng tuần cho các thành viên phòng</p>
        </div>
      </div>

      <div className="schedule-selector">
        <label>Chọn Tuần:</label>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
          className="week-select"
        >
          {schedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              Tuần {schedule.week}/Tháng {schedule.month}/{schedule.year}
            </option>
          ))}
        </select>
        {weekRange && (
          <span className="week-range">
            <FontAwesomeIcon icon={faCalendarAlt} /> {weekRange.start} - {weekRange.end}
          </span>
        )}
      </div>

      <div className="schedule-table-container">
        <table className="duty-table">
          <thead>
            <tr>
              <th>Ngày trong tuần</th>
              <th>Người phụ trách</th>
              <th>Công việc</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentSchedule?.duties.map((duty, index) => (
              <tr key={index} className={duty.assignedTo ? 'filled' : 'empty'}>
                <td className="day-cell">
                  <FontAwesomeIcon icon={faCalendarAlt} /> {duty.day}
                </td>
                <td className="member-cell">
                  {duty.assignedTo ? (
                    <span className="member-badge">
                      <FontAwesomeIcon icon={faUser} /> {duty.assignedTo}
                    </span>
                  ) : (
                    <span className="empty-text">Chưa gán</span>
                  )}
                </td>
                <td className="task-cell">{duty.task || <span className="empty-text">Chưa có công việc</span>}</td>
                <td className="action-cell">
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenModal(currentSchedule.id, index, duty)}
                    title="Sửa"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  {duty.assignedTo && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteDuty(currentSchedule.id, index)}
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="schedule-summary">
        <h3>Tóm Tắt Công Việc Trong Tuần</h3>
        <div className="members-summary">
          {members.map((member) => {
            const memberDuties = currentSchedule?.duties.filter((d) => d.assignedTo === member) || [];
            return (
              <div key={member} className="member-summary-card">
                <div className="member-name">
                  <FontAwesomeIcon icon={faUser} /> {member}
                </div>
                <div className="duty-count">
                  {memberDuties.length} công việc
                </div>
                <div className="duty-list">
                  {memberDuties.length > 0 ? (
                    <ul>
                      {memberDuties.map((duty, idx) => (
                        <li key={idx}>
                          <FontAwesomeIcon icon={faCheck} /> {duty.day}: {duty.task}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-duties">Không có công việc</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Phân Công Công Việc</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Người phụ trách:</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="form-select"
                >
                  <option value="">Chọn thành viên</option>
                  {members.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Công việc:</label>
                <input
                  type="text"
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  placeholder="Nhập công việc cần làm"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveDuty}>
                <FontAwesomeIcon icon={faCheck} /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutySchedule;
