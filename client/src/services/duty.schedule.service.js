import api from './api';

const dutyScheduleService = {
  getWeekDuties: async (roomId, weekStart) => {
    try {
      const response = await api.get(`/rooms/${roomId}/duties?week_start=${weekStart}`);
      return response.data.duties || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createDuty: async (roomId, payload) => {
    try {
      const response = await api.post(`/rooms/${roomId}/duties`, payload);
      return response.data.duty;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateDuty: async (dutyId, payload) => {
    try {
      const response = await api.put(`/duties/${dutyId}`, payload);
      return response.data.duty;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteDuty: async (dutyId) => {
    try {
      await api.delete(`/duties/${dutyId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default dutyScheduleService;
