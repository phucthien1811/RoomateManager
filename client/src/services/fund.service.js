import api from './api';

const fundService = {
  /**
   * Lấy thông tin quỹ + lịch sử giao dịch theo phòng
   */
  getFundDetail: async (roomId) => {
    try {
      const response = await api.get(`/fund`, {
        params: { room_id: roomId },
      });
      return response.data?.data || { balance: 0, transactions: [], categories: [], category_allocations: [] };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Đóng góp vào quỹ
   */
  contributeFund: async (roomId, amount, description = '', category = 'Chưa phân loại', proofImages = []) => {
    try {
      const response = await api.post(`/fund/deposit`, {
        room_id: roomId,
        amount: Number(amount),
        description,
        category,
        proof_images: proofImages,
      });
      return response.data?.data?.transaction;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Rút tiền từ quỹ
   */
  withdrawFund: async (roomId, amount, reason, category = 'Chưa phân loại', proofImages = [], relatedBill = null) => {
    try {
      const response = await api.post(`/fund/withdraw`, {
        room_id: roomId,
        amount: Number(amount),
        description: reason,
        category,
        proof_images: proofImages,
        related_bill: relatedBill,
      });
      return response.data; // Trả về cả cục để lấy message
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy lịch sử giao dịch quỹ
   */
  getFundHistory: async (roomId) => {
    try {
      const data = await fundService.getFundDetail(roomId);
      return data.transactions || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy đóng góp của từng thành viên
   */
  getMemberContributions: async (roomId) => {
    try {
      const data = await fundService.getFundDetail(roomId);
      const transactions = data.transactions || [];
      const map = new Map();

      transactions
        .filter((item) => item.type === 'deposit')
        .forEach((item) => {
          const user = item.performed_by || {};
          const key = user._id || 'unknown';
          const current = map.get(key) || {
            userId: key,
            full_name: user.full_name || user.name || user.email || 'Thành viên',
            amount: 0,
          };
          current.amount += Number(item.amount) || 0;
          map.set(key, current);
        });

      return Array.from(map.values());
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Phê duyệt rút tiền từ quỹ
   */
  approveFundWithdraw: async (transactionId) => {
    try {
      const response = await api.patch(`/fund/transactions/${transactionId}/approve`);
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
      const response = await api.patch(`/fund/transactions/${transactionId}/reject`, {
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
      const response = await api.put(`/fund`, {
        room_id: roomId,
        ...fundData,
      });
      return response.data?.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createCategory: async (roomId, name, amount = 0) => {
    try {
      const response = await api.post(`/fund/categories`, {
        room_id: roomId,
        name,
        amount: Number(amount) || 0,
      });
      return response.data?.data || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getFund: async (roomId) => {
    const data = await fundService.getFundDetail(roomId);
    return { balance: data.balance || 0 };
  },
};

export default fundService;
