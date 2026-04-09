import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheckCircle,
  faTimes,
  faPlus,
  faTrash,
  faCalendarAlt,
  faTasks,
  faInfoCircle,
  faWarning,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/notification.board.css';

const NotificationBoard = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [unreadCount, setUnreadCount] = useState(3);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'expense',
      title: 'Hóa Đơn Điện Chưa Thanh Toán',
      message: 'Hóa đơn điện tháng 4 của phòng Trần Hùng Đạo chưa được thanh toán',
      date: '2024-04-15',
      time: '14:30',
      read: false,
      icon: faWarning,
      color: 'warning',
    },
    {
      id: 2,
      type: 'task',
      title: 'Công Việc Chưa Hoàn Thành',
      message: 'Bạn chưa hoàn thành công việc "Rửa bát chung"',
      date: '2024-04-15',
      time: '10:15',
      read: false,
      icon: faTasks,
      color: 'info',
    },
    {
      id: 3,
      type: 'payment',
      title: 'Xác Nhận Thanh Toán Thành Công',
      message: 'Hóa đơn HD-2024-002 tháng 3 đã được thanh toán thành công',
      date: '2024-04-14',
      time: '15:45',
      read: false,
      icon: faCheckCircle,
      color: 'success',
    },
    {
      id: 4,
      type: 'general',
      title: 'Cập Nhật Thành Viên Phòng',
      message: 'Thành viên mới "Minh Trần" đã tham gia phòng Trần Hùng Đạo',
      date: '2024-04-13',
      time: '09:20',
      read: true,
      icon: faInfoCircle,
      color: 'default',
    },
  ]);

  const [chores, setChores] = useState([
    {
      id: 1,
      activity: 'Vệ sinh nhà vệ sinh chung',
      assignedTo: 'Duy Nguyễn',
      frequency: 'Hàng ngày',
      dueDate: 'Hôm nay',
      status: 'completed',
      color: '#0D9488',
    },
    {
      id: 2,
      activity: 'Rửa bát chung',
      assignedTo: 'Iris Trần',
      frequency: 'Hàng ngày',
      dueDate: 'Hôm nay',
      status: 'pending',
      color: '#D97706',
    },
    {
      id: 3,
      activity: 'Quét lau cầu thang',
      assignedTo: 'An Phạm',
      frequency: 'Hàng ngày',
      dueDate: 'Ngày mai',
      status: 'pending',
      color: '#D97706',
    },
  ]);

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    if (!notifications.find((n) => n.id === id)?.read) {
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
  };

  const handleDeleteChore = (id) => {
    setChores(chores.filter((c) => c.id !== id));
  };

  const formatDate = (date) => {
    const today = new Date();
    const notifDate = new Date(date);
    
    if (notifDate.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (notifDate.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    
    return notifDate.toLocaleDateString('vi-VN');
  };

  return (
    <div className="notification-board">
      <div className="board-header">
        <div className="header-content">
          <h1>Bảng Thông Báo & Bảng Công Việc</h1>
          <p>Theo dõi thông báo, công việc hàng ngày và cập nhật phòng</p>
        </div>
        {unreadCount > 0 && (
          <div className="unread-badge">{unreadCount}</div>
        )}
      </div>

      <div className="board-tabs">
        <button
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FontAwesomeIcon icon={faBell} className="icon" />
          <span>Thông Báo</span>
          {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === 'chores' ? 'active' : ''}`}
          onClick={() => setActiveTab('chores')}
        >
          <FontAwesomeIcon icon={faTasks} className="icon" />
          <span>Bảng Công Việc Hàng Ngày</span>
        </button>
      </div>

      {activeTab === 'notifications' && (
        <div className="notifications-section">
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'} type-${notif.type}`}
                >
                  <div className="notif-icon-container">
                    <div className={`notif-icon color-${notif.color}`}>
                      <FontAwesomeIcon icon={notif.icon} />
                    </div>
                  </div>

                  <div className="notif-content">
                    <div className="notif-header">
                      <h3 className="notif-title">{notif.title}</h3>
                      <span className="notif-badge">
                        {notif.date} · {notif.time}
                      </span>
                    </div>
                    <p className="notif-message">{notif.message}</p>
                  </div>

                  <div className="notif-actions">
                    {!notif.read && (
                      <button
                        className="btn-mark-read"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Đánh dấu đã đọc"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} />
                      </button>
                    )}
                    <button
                      className="btn-delete-notif"
                      onClick={() => handleDeleteNotification(notif.id)}
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FontAwesomeIcon icon={faBell} className="empty-icon" />
                <p>Không có thông báo nào</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'chores' && (
        <div className="chores-section">
          <div className="chores-header">
            <h2>Công Việc Hôm Nay</h2>
            <p className="chores-date">
              <FontAwesomeIcon icon={faCalendarAlt} /> Thứ Hai, 15 Tháng 4, 2024
            </p>
          </div>

          <div className="chores-list">
            {chores.length > 0 ? (
              chores.map((chore) => (
                <div
                  key={chore.id}
                  className={`chore-item status-${chore.status}`}
                  style={{ borderLeftColor: chore.color }}
                >
                  <div className="chore-checkbox">
                    <input
                      type="checkbox"
                      checked={chore.status === 'completed'}
                      onChange={() => {}}
                      disabled
                    />
                  </div>

                  <div className="chore-content">
                    <h3 className="chore-title">
                      {chore.activity}
                    </h3>
                    <div className="chore-meta">
                      <span className="chore-assigned">
                        <strong>Giao cho:</strong> {chore.assignedTo}
                      </span>
                      <span className="chore-frequency">
                        <strong>Tần suất:</strong> {chore.frequency}
                      </span>
                    </div>
                  </div>

                  <div className="chore-footer">
                    <span className={`chore-due ${chore.status}`}>
                      {chore.dueDate}
                    </span>
                    <span className={`chore-status status-badge status-${chore.status}`}>
                      {chore.status === 'completed' ? 'Hoàn Thành' : 'Chờ Làm'}
                    </span>
                    <button
                      className="btn-delete-chore"
                      onClick={() => handleDeleteChore(chore.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FontAwesomeIcon icon={faTasks} className="empty-icon" />
                <p>Không có công việc nào hôm nay</p>
              </div>
            )}
          </div>

          <div className="chores-info">
            <div className="info-box">
              <FontAwesomeIcon icon={faInfoCircle} />
              <p>
                Các công việc được giao dựa trên danh sách công việc chung. Xác nhận hoàn thành để cập nhật trạng thái.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBoard;
