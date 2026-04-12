import api from './api';

const reportService = {
  /**
   * Lấy báo cáo tài chính
   */
  getFinancialReport: async (roomId, month, year) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/financial?month=${month}&year=${year}`);
      return response.data.report || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xuất báo cáo tài chính ra PDF
   */
  exportFinancialReportPDF: async (roomId, month, year) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/financial/export?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy báo cáo chi tiêu (expense sharing)
   */
  getExpenseReport: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/expense`);
      return response.data.report || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xuất báo cáo chi tiêu ra PDF
   */
  exportExpenseReportPDF: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/expense/export`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy báo cáo công việc
   */
  getChoreReport: async (roomId, month, year) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/chore?month=${month}&year=${year}`);
      return response.data.report || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xuất báo cáo công việc ra PDF
   */
  exportChoreReportPDF: async (roomId, month, year) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/chore/export?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy báo cáo vắng mặt
   */
  getAbsenceReport: async (roomId, month, year) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/absence?month=${month}&year=${year}`);
      return response.data.report || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xuất báo cáo vắng mặt ra PDF
   */
  exportAbsenceReportPDF: async (roomId, month, year) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/absence/export?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy báo cáo tổng quan phòng
   */
  getDashboardReport: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/reports/dashboard`);
      return response.data.report || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy báo cáo cá nhân
   */
  getPersonalReport: async () => {
    try {
      const response = await api.get('/reports/personal');
      return response.data.report || {};
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default reportService;
