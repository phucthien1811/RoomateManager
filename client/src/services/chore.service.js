import api from './api';

const choreService = {
  /**
   * Lấy danh sách trực nhật của phòng
   */
  getChoresByRoom: async (roomId) => {
    try {
      const response = await api.get(`/chores?room_id=${roomId}`);
      return response.data.data || response.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tạo trực nhật mới
   */
  createChore: async (choreData) => {
    try {
      const response = await api.post(`/chores`, choreData);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Hoàn thành trực nhật (update status + upload proof images)
   */
  completeChore: async (choreId, proofImages) => {
    try {
      const response = await api.patch(`/chores/${choreId}/complete`, {
        proof_images: proofImages,
      });
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default choreService;
