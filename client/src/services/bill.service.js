import api from './api';

const billService = {
  /**
   * Lấy danh sách hóa đơn của phòng
   */
  getBillsByRoom: async (roomId) => {
    try {
      const response = await api.get(`/bills/history/${roomId}`);
      // API trả về { bills: [...], pagination: {...} }
      const data = response.data.data || response.data || {};
      return data.bills || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tạo hóa đơn mới với chia tiền
   */
  createBill: async (billData) => {
    try {
      const response = await api.post(`/bills`, billData);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật hóa đơn
   */
  updateBill: async (billId, billData) => {
    try {
      const response = await api.patch(`/bills/${billId}`, billData);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa hóa đơn
   */
  deleteBill: async (billId) => {
    try {
      await api.delete(`/bills/${billId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xác nhận thanh toán hóa đơn
   */
  confirmBillPayment: async (billId, detailId) => {
    try {
      const response = await api.patch(`/bills/details/${detailId}/confirm`, {
        billId,
      });
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy lịch sử thanh toán
   */
  getBillHistory: async (roomId) => {
    try {
      const response = await api.get(`/bills/history/${roomId}`);
      return response.data.data || response.data || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * RM-8: Cập nhật ảnh hóa đơn thực tế (mảng base64 string, tối đa 5)
   */
  uploadBillImages: async (billId, images) => {
    try {
      const response = await api.patch(`/bills/${billId}/images`, { images });
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default billService;
