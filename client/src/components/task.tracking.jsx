import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCheckCircle,
  faClipboardList,
  faTimes,
  faCamera,
  faEdit,
  faTrash,
  faCalendarAlt,
  faUser,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/task.tracking.css';

const TaskTracking = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Vệ sinh nhà vệ sinh chung',
      assignedTo: 'Duy Nguyễn',
      room: 'Trần Hùng Đạo',
      dueDate: '2024-04-15',
      status: 'completed',
      description: 'Vệ sinh phòng tắm chung hàng tuần',
      screenshot: 'https://via.placeholder.com/300x200?text=Screenshot',
      completedDate: '2024-04-15',
    },
    {
      id: 2,
      title: 'Rửa bát chung',
      assignedTo: 'Iris Trần',
      room: 'Trần Hùng Đạo',
      dueDate: '2024-04-20',
      status: 'pending',
      description: 'Rửa bát và dọn bếp chung',
      screenshot: null,
      completedDate: null,
    },
    {
      id: 3,
      title: 'Quét lau cầu thang',
      assignedTo: 'An Phạm',
      room: 'An Dương Vương',
      dueDate: '2024-04-18',
      status: 'completed',
      description: 'Quét lau cầu thang chung hàng ngày',
      screenshot: 'https://via.placeholder.com/300x200?text=Screenshot',
      completedDate: '2024-04-18',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [formData, setFormData] = useState({
    title: '',
    assignedTo: '',
    room: '',
    dueDate: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);

  const handleOpenModal = (type, task = null) => {
    setModalType(type);
    if (type === 'edit' && task) {
      setFormData({
        title: task.title,
        assignedTo: task.assignedTo,
        room: task.room,
        dueDate: task.dueDate,
        description: task.description,
      });
      setEditingId(task.id);
    } else {
      setFormData({
        title: '',
        assignedTo: '',
        room: '',
        dueDate: '',
        description: '',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTask = () => {
    const newTask = {
      ...formData,
      id: tasks.length + 1,
      status: 'pending',
      screenshot: null,
      completedDate: null,
    };
    setTasks([...tasks, newTask]);
    handleCloseModal();
  };

  const handleEditTask = () => {
    setTasks(
      tasks.map((task) =>
        task.id === editingId ? { ...task, ...formData } : task
      )
    );
    handleCloseModal();
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  const handleMarkComplete = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: 'completed',
              completedDate: new Date().toISOString().split('T')[0],
              screenshot: 'https://via.placeholder.com/300x200?text=Screenshot',
            }
          : task
      )
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusClass = (status) => {
    return status === 'completed' ? 'status-completed' : 'status-pending';
  };

  const getStatusLabel = (status) => {
    return status === 'completed' ? 'Hoàn thành' : 'Chưa hoàn thành';
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="task-tracking">
      <div className="task-tracking-header">
        <div className="header-content">
          <h1>Quản Lý Công Việc Chung</h1>
          <p>Giao dịch, theo dõi và xác nhận hoàn thành các công việc chung phòng</p>
        </div>
        <button className="btn-create-task" onClick={() => handleOpenModal('create')}>
          <FontAwesomeIcon icon={faPlus} /> Thêm Công Việc
        </button>
      </div>

      <div className="tasks-stats">
        <div className="stat-card pending">
          <div className="stat-value">{pendingTasks.length}</div>
          <div className="stat-label">Công Việc Chưa Làm</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-value">{completedTasks.length}</div>
          <div className="stat-label">Công Việc Hoàn Thành</div>
        </div>
        <div className="stat-card total">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">Tổng Công Việc</div>
        </div>
      </div>

      <div className="tasks-section">
        <h2 className="section-title">Công Việc Chưa Hoàn Thành</h2>
        {pendingTasks.length > 0 ? (
          <div className="tasks-list">
            {pendingTasks.map((task) => (
              <div key={task.id} className="task-item pending-item">
                <div className="task-checkbox">
                  <button
                    className="btn-check-task"
                    onClick={() => handleMarkComplete(task.id)}
                    title="Đánh dấu hoàn thành"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                  </button>
                </div>

                <div className="task-info">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>

                  <div className="task-meta">
                    <span className="meta-item">
                      <FontAwesomeIcon icon={faUser} /> {task.assignedTo}
                    </span>
                    <span className="meta-item">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(task.dueDate)}
                    </span>
                    <span className="meta-item room">{task.room}</span>
                  </div>
                </div>

                <div className="task-status">
                  <span className={`status-badge ${getStatusClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>

                <div className="task-actions">
                  <button
                    className="btn-task-action edit"
                    onClick={() => handleOpenModal('edit', task)}
                    title="Chỉnh sửa"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="btn-task-action delete"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Không có công việc chưa hoàn thành</p>
          </div>
        )}
      </div>

      <div className="tasks-section">
        <h2 className="section-title">Công Việc Đã Hoàn Thành</h2>
        {completedTasks.length > 0 ? (
          <div className="tasks-grid">
            {completedTasks.map((task) => (
              <div key={task.id} className="task-card completed-card">
                <div className="task-card-header">
                  <span className={`status-badge ${getStatusClass(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  <button
                    className="btn-task-action delete"
                    onClick={() => handleDeleteTask(task.id)}
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>

                <div className="task-card-body">
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>

                  {task.screenshot && (
                    <div className="task-screenshot">
                      <img src={task.screenshot} alt="Task screenshot" />
                    </div>
                  )}

                  <div className="task-meta">
                    <span className="meta-item">
                      <FontAwesomeIcon icon={faUser} /> {task.assignedTo}
                    </span>
                    <span className="meta-item">
                      <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(task.completedDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Không có công việc đã hoàn thành</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {modalType === 'create'
                  ? 'Thêm Công Việc Mới'
                  : 'Chỉnh Sửa Công Việc'}
              </h2>
              <button
                className="btn-close-modal"
                onClick={handleCloseModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="title">Tiêu Đề Công Việc</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="VD: Vệ sinh nhà vệ sinh chung"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="assignedTo">Giao Cho</label>
                  <input
                    type="text"
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    placeholder="Tên thành viên"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="room">Phòng</label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="Tên phòng"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Hạn Hoàn Thành</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Mô Tả Chi Tiết</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả công việc chi tiết"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
              >
                Hủy
              </button>
              <button
                className="btn-submit"
                onClick={modalType === 'create' ? handleCreateTask : handleEditTask}
              >
                {modalType === 'create' ? 'Thêm Công Việc' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracking;
