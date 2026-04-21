import api from './api';

const choreService = {
  getChoresByRoom: async (roomId) => {
    try {
      const response = await api.get(`/chores?room_id=${roomId}`);
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMyDutyTasks: async (roomId, weekStart) => {
    try {
      const response = await api.get(`/chores/my-duty?room_id=${roomId}&week_start=${weekStart}`);
      return response.data.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createChore: async (payload) => {
    try {
      const response = await api.post('/chores', payload);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  completeChore: async (choreId, proofImages) => {
    try {
      const response = await api.patch(`/chores/${choreId}/complete`, {
        proof_images: proofImages,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  completeDutyTask: async (dutyId, roomId, proofImages) => {
    try {
      const response = await api.patch(`/chores/duty/${dutyId}/complete`, {
        room_id: roomId,
        proof_images: proofImages,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteChore: async (choreId) => {
    try {
      await api.delete(`/chores/${choreId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default choreService;
