import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

const makeNotification = (payload = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: payload.type || 'info',
  title: payload.title || 'Thông báo',
  message: payload.message || '',
  meta: payload.meta || '',
  createdAt: payload.createdAt || new Date().toISOString(),
  read: Boolean(payload.read),
});

const now = Date.now();
const minutesAgo = (min) => new Date(now - min * 60 * 1000).toISOString();

const SAMPLE_NOTIFICATIONS = [
  makeNotification({
    type: 'warning',
    title: 'Hóa đơn điện còn thiếu',
    message: '2 thành viên chưa thanh toán hóa đơn điện tháng này.',
    meta: 'BILL /rooms/:id',
    createdAt: minutesAgo(3),
  }),
  makeNotification({
    type: 'info',
    title: 'Đã cập nhật lịch trực',
    message: 'Lịch trực tuần mới cho phòng An Dương Vương đã được cập nhật.',
    meta: 'CHORE /chores',
    createdAt: minutesAgo(14),
  }),
  makeNotification({
    type: 'success',
    title: 'Quỹ phòng đã nạp thành công',
    message: 'Vừa ghi nhận 500.000 VND đóng góp vào quỹ chung.',
    meta: 'FUND /fund/deposit',
    createdAt: minutesAgo(36),
  }),
  makeNotification({
    type: 'error',
    title: 'Không thể tải báo cáo vắng mặt',
    message: 'Yêu cầu lấy danh sách báo cáo vắng mặt bị lỗi. Vui lòng thử lại.',
    meta: 'GET /absence-reports/:roomId (500)',
    createdAt: minutesAgo(62),
  }),
  makeNotification({
    type: 'info',
    title: 'Thành viên mới đã tham gia',
    message: 'Iris Tran vừa được thêm vào phòng An Dương Vương.',
    meta: 'MEMBER /rooms/:id/members',
    createdAt: minutesAgo(180),
    read: true,
  }),
];

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  useEffect(() => {
    const handleAppNotification = (event) => {
      const notification = makeNotification(event.detail || {});
      setNotifications((prev) => [notification, ...prev].slice(0, 200));
    };

    window.addEventListener('app-notification', handleAppNotification);
    return () => window.removeEventListener('app-notification', handleAppNotification);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const clearNotifications = () => setNotifications([]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }),
    [notifications, unreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

