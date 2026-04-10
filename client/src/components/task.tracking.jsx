import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCheck,
  faTrash,
  faTimes,
  faCalendarAlt,
  faBroom,
  faUtensils,
  faStar,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import choreService from '../services/chore.service.js';
import roomService from '../services/room.service.js';
import '../styles/task.tracking.css';

const TaskTracking = () => {
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    room_id: '',
    chore_date: '',
    note: '',
    assigned_to: '',
  });

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch tasks when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      fetchTasks();
    }
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Lỗi khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await choreService.getChoresByRoom(selectedRoomId);
      // Ensure data is always an array
      const tasksArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      setTasks(tasksArray);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Lỗi khi tải danh sách công việc');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      room_id: selectedRoomId,
      chore_date: '',
      note: '',
      assigned_to: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      chore_date: '',
      note: '',
      assigned_to: '',
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.room_id.trim() || !formData.chore_date.trim() || !formData.note.trim()) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      setError('');
      const choreData = {
        room_id: formData.room_id,
        chore_date: formData.chore_date,
        note: formData.note,
        assigned_to: formData.assigned_to || '',
      };
      await choreService.createChore(choreData);
      await fetchTasks();
      handleCloseModal();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message || 'Lỗi khi tạo công việc');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await choreService.completeChore(id);
      await fetchTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Lỗi khi hoàn thành công việc');
    }
  };

  const getTaskIcon = (note) => {
    const normalizedNote = note?.toLowerCase() || '';
    if (normalizedNote.includes('rửa') || normalizedNote.includes('bát') || normalizedNote.includes('bếp')) return faUtensils;
    if (normalizedNote.includes('dọn') || normalizedNote.includes('vệ sinh') || normalizedNote.includes('quét')) return faBroom;
    if (normalizedNote.includes('sạch') || normalizedNote.includes('lau')) return faStar;
    return faBroom;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        await choreService.deleteChore(id);
        await fetchTasks();
      } catch (err) {
        console.error('Error deleting task:', err);
        setError('Lỗi khi xóa công việc');
      }
    }
  };

  return (
    <div className="task-tracking-page">
      {/* Header Section */}
      <div className="task-header">
        <div className="header-content">
          <h1>Trực Nhật</h1>
          <p>Quản lý công việc chung và lịch trực nhật phòng</p>
        </div>
        <button
          className="btn-add-task"
          onClick={handleOpenModal}
          disabled={submitting}
          title="Thêm công việc mới"
        >
          <FontAwesomeIcon icon={faPlus} /> Thêm Công Việc
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="room-select">Chọn phòng:</label>
          <select
            id="room-select"
            className="filter-select"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="tasks-section">
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faBroom} className="empty-icon" />
            <h3>Không có công việc nào</h3>
            <p>{selectedRoomId ? 'Hãy thêm công việc mới' : 'Vui lòng chọn phòng'}</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task._id} className={`task-card status-${task.status}`}>
                {/* Card Header */}
                <div className="task-card-header">
                  <div className="task-title">
                    <div className="task-icon-badge">
                      <FontAwesomeIcon icon={getTaskIcon(task.note)} />
                    </div>
                    <div className="task-title-content">
                      <h3>{task.note}</h3>
                      <p className="assigned-to">
                        {task.assigned_to
                          ? `Gán cho: ${typeof task.assigned_to === 'object' ? task.assigned_to.name : task.assigned_to}`
                          : 'Chưa gán người'}
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge ${task.status === 'completed' ? 'completed' : 'pending'}`}>
                    {task.status === 'completed' ? (
                      <>
                        <FontAwesomeIcon icon={faCheck} /> Hoàn Thành
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCalendarAlt} /> Chờ Thực Hiện
                      </>
                    )}
                  </span>
                </div>

                {/* Card Body */}
                <div className="task-card-body">
                  <div className="detail-row">
                    <span className="detail-label">Ngày thực hiện:</span>
                    <span className="detail-value">{formatDate(task.chore_date)}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="task-card-footer">
                  {task.status !== 'completed' && (
                    <button
                      className="btn-action btn-complete"
                      onClick={() => handleComplete(task._id)}
                      title="Hoàn thành công việc"
                    >
                      <FontAwesomeIcon icon={faCheck} /> Hoàn Thành
                    </button>
                  )}
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteTask(task._id)}
                    title="Xóa công việc"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm Công Việc</h2>
              <button
                className="btn-close-modal"
                onClick={handleCloseModal}
                aria-label="Đóng"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '15px' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="room-task">Chọn phòng <span className="required">*</span></label>
                <select
                  id="room-task"
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="form-input"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="chore-date">Ngày thực hiện <span className="required">*</span></label>
                <input
                  type="date"
                  id="chore-date"
                  name="chore_date"
                  value={formData.chore_date}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="note">Mô tả công việc <span className="required">*</span></label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="VD: Rửa bát, dọn phòng, vệ sinh..."
                  disabled={submitting}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="assigned-to">Gán cho thành viên</label>
                <input
                  type="text"
                  id="assigned-to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleInputChange}
                  placeholder="Tên thành viên (tuỳ chọn)"
                  disabled={submitting}
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="btn-save"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Lưu Công Việc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracking;
