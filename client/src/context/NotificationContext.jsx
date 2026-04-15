import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import notificationService from '../services/notification.service.js';

const NotificationContext = createContext(null);

const makeNotification = (payload = {}) => ({
  id: payload.id || payload._id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: payload.type || 'info',
  title: payload.title || 'Thông báo',
  message: payload.message || '',
  meta: payload.meta || '',
  createdAt: payload.createdAt || new Date().toISOString(),
  read: Boolean(payload.read),
});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      const normalized = data.map((item) => ({
        id: item._id || item.id,
        type: item.type || 'info',
        title: item.title || 'Thông báo',
        message: item.message || '',
        meta: item.meta || '',
        createdAt: item.createdAt || new Date().toISOString(),
        read: Boolean(item.read),
      }));
      setNotifications(normalized);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const intervalId = setInterval(refreshNotifications, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleAppNotification = (event) => {
      const notification = makeNotification(event.detail || {});
      setNotifications((prev) => [notification, ...prev].slice(0, 200));
    };

    window.addEventListener('app-notification', handleAppNotification);
    return () => window.removeEventListener('app-notification', handleAppNotification);
  }, []);

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    try {
      await notificationService.clearMyNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      refreshNotifications,
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

