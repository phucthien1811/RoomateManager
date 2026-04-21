import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheck,
  faCheckCircle,
  faCircleExclamation,
  faCircleInfo,
  faTrash,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '../context/NotificationContext.jsx';
import '../styles/notification.board.css';

const formatDateTime = (iso) => {
  const date = new Date(iso);
  return date.toLocaleString('vi-VN');
};

const getTypeIcon = (type) => {
  if (type === 'success') return faCheckCircle;
  if (type === 'error') return faXmarkCircle;
  if (type === 'warning') return faCircleExclamation;
  return faCircleInfo;
};

const NotificationBoard = ({ compact = false }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <div className={`notification-board ${compact ? 'compact' : ''}`}>
      <div className="notification-header">
        <div className="notification-header-title">
          <h3>
            <FontAwesomeIcon icon={faBell} /> Thông báo hệ thống
          </h3>
          <span>{unreadCount} chưa xem</span>
        </div>
        <div className="notification-header-actions">
          <button type="button" onClick={markAllAsRead}>
            <FontAwesomeIcon icon={faCheck} /> Đã xem tất cả
          </button>
          {notifications.length > 0 && (
            <button type="button" className="danger" onClick={clearNotifications}>
              <FontAwesomeIcon icon={faTrash} /> Xóa hết
            </button>
          )}
        </div>
      </div>

      <div className="notification-body">
        {notifications.length === 0 ? (
          <div className="notification-empty">Chưa có thông báo</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id || item.id}
              className={`notification-item ${item.read ? 'read' : 'unread'} type-${item.type || 'info'}`}
              onClick={() => {
                if (!item.read) markAsRead(item._id || item.id);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !item.read) {
                  markAsRead(item._id || item.id);
                }
              }}
            >
              <div className="notification-item-icon">
                <FontAwesomeIcon icon={getTypeIcon(item.type)} />
              </div>
              <div className="notification-item-content">
                <div className="notification-item-head">
                  <strong>{item.title}</strong>
                  <span>{formatDateTime(item.createdAt)}</span>
                </div>
                {item.message && <p>{item.message}</p>}
                {item.meta && <small>{item.meta}</small>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationBoard;

