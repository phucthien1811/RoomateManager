import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import notificationService from '../services/notification.service.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || null;
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await notificationService.getMyNotifications();
      // data là mảng các đối tượng Notification từ MongoDB
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    refreshNotifications();
    const intervalId = setInterval(refreshNotifications, 15000);
    return () => clearInterval(intervalId);
  }, [refreshNotifications, userId]);

  const markAsRead = async (id) => {
    setNotifications((prev) => prev.map((item) => (item._id === id ? { ...item, read: true } : item)));
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
    [notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, refreshNotifications]
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

