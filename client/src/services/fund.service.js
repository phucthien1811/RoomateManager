import api from './api';

const fundService = {
  /**
   * Lấy thông tin quỹ của phòng
   */
  getFund: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/fund`);
      return response.data.fund || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Đóng góp vào quỹ
   */
  contributeFund: async (roomId, amount) => {
    try {
      const response = await api.post(`/rooms/${roomId}/fund/contribute`, {
        amount,
      });
      return response.data.transaction;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Rút tiền từ quỹ
   */
  withdrawFund: async (roomId, amount, reason) => {
    try {
      const response = await api.post(`/rooms/${roomId}/fund/withdraw`, {
        amount,
        reason,
      });
      return response.data.transaction;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy lịch sử giao dịch quỹ
   */
  getFundHistory: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/fund/history`);
      return response.data.transactions || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy đóng góp của từng thành viên
   */
  getMemberContributions: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/fund/contributions`);
      return response.data.contributions || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Phê duyệt rút tiền từ quỹ
   */
  approveFundWithdraw: async (transactionId) => {
    try {
      const response = await api.post(`/fund/transactions/${transactionId}/approve`);
      return response.data.transaction;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Từ chối rút tiền từ quỹ
   */
  rejectFundWithdraw: async (transactionId, reason) => {
    try {
      const response = await api.post(`/fund/transactions/${transactionId}/reject`, {
        reason,
      });
      return response.data.transaction;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật thông tin quỹ
   */
  updateFund: async (roomId, fundData) => {
    try {
      const response = await api.put(`/rooms/${roomId}/fund`, fundData);
      return response.data.fund;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default fundService;
