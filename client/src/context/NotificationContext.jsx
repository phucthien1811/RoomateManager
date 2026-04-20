import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import notificationService from '../services/notification.service.js';

const NotificationContext = createContext(null);
const NOTIFICATION_STORAGE_KEY = 'roommate_manager.notification_history';

const isServerNotificationId = (id = '') => /^[a-fA-F0-9]{24}$/.test(String(id));

const makeNotification = (payload = {}) => ({
  id: payload.id || payload._id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: payload.type || 'info',
  title: payload.title || 'Thông báo',
  message: payload.message || '',
  meta: payload.meta || '',
  createdAt: payload.createdAt || new Date().toISOString(),
  read: Boolean(payload.read),
});

const getTimestamp = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const mergeNotifications = (...collections) => {
  const map = new Map();

  collections.flat().forEach((item) => {
    const notification = makeNotification(item);
    const existed = map.get(notification.id);

    if (!existed) {
      map.set(notification.id, notification);
      return;
    }

    map.set(notification.id, {
      ...existed,
      ...notification,
      read: existed.read || notification.read,
    });
  });

  return Array.from(map.values()).sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));
};

const getStoredNotifications = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => makeNotification(item)) : [];
  } catch (error) {
    console.error('Error reading stored notifications:', error);
    return [];
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => getStoredNotifications());

  const refreshNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      const normalized = data.map((item) => makeNotification(item));
      setNotifications((prev) => mergeNotifications(normalized, prev));
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
      setNotifications((prev) => mergeNotifications([notification], prev));
    };

    window.addEventListener('app-notification', handleAppNotification);
    return () => window.removeEventListener('app-notification', handleAppNotification);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notification history:', error);
    }
  }, [notifications]);

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    if (!isServerNotificationId(id)) return;
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

