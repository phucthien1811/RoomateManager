import api from './api';

const roomService = {
  /**
   * Lấy danh sách phòng của user
   */
  getRooms: async () => {
    try {
      const response = await api.get('/rooms');
      return response.data.rooms || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy chi tiết một phòng
   */
  getRoomById: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      return response.data.room;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tạo phòng mới
   */
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/rooms', {
        name: roomData.name,
        address: roomData.address,
        location: roomData.location || roomData.address,
        monthlyRent: roomData.monthlyRent,
      });
      return response.data.room;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật phòng
   */
  updateRoom: async (roomId, data) => {
    try {
      const response = await api.put(`/rooms/${roomId}`, data);
      return response.data.room;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa phòng
   */
  deleteRoom: async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tham gia phòng bằng mã mời
   */
  joinRoom: async (roomCode) => {
    try {
      const response = await api.post('/members/join', {
        inviteCode: roomCode,
        code: roomCode,
      });
      return response.data;
    } catch (error) {
      const payload = error.response?.data || error;
      if (error.response?.status) {
        payload.status = error.response.status;
      }
      throw payload;
    }
  },

  /**
   * Lấy danh sách thành viên của phòng
   */
  getRoomMembers: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/members`);
      return response.data.members || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa thành viên khỏi phòng
   */
  removeMember: async (roomId, memberId) => {
    try {
      await api.delete(`/rooms/${roomId}/members/${memberId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Rời khỏi phòng hiện tại (dành cho thành viên)
   */
  leaveRoom: async (roomId) => {
    try {
      const response = await api.put(`/members/${roomId}/leave`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default roomService;
