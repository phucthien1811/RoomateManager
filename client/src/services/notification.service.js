import api from './api';

const notificationService = {
  getMyNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data.notifications || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  clearMyNotifications: async () => {
    try {
      await api.delete('/notifications');
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default notificationService;
