import api from './api';

const memberService = {
  /**
   * Lấy danh sách thành viên của phòng
   */
  getMembers: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/members`);
      return response.data.members || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Thêm thành viên vào phòng
   */
  addMember: async (roomId, memberData) => {
    try {
      const response = await api.post(`/rooms/${roomId}/members`, memberData);
      return response.data.member || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật thông tin thành viên
   */
  updateMember: async (memberId, memberData) => {
    try {
      const response = await api.put(`/members/${memberId}`, memberData);
      return response.data.member;
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

};

export default memberService;
