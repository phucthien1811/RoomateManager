import api from './api';

const absenceService = {
  /**
   * Tạo báo cáo vắng mặt
   */
  createAbsenceReport: async (absenceData) => {
    try {
      const response = await api.post(`/absence-reports`, absenceData);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy danh sách báo cáo vắng mặt theo phòng
   */
  getAbsenceReports: async (roomId) => {
    try {
      const response = await api.get(`/absence-reports/${roomId}`);
      // API returns { data: { reports: [...], total: ... } }
      const reportsData = response.data.data;
      return reportsData?.reports || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy chi tiết báo cáo vắng mặt
   */
  getAbsenceReportById: async (reportId) => {
    try {
      const response = await api.get(`/absence-reports/detail/${reportId}`);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Phê duyệt báo cáo vắng mặt
   */
  approveAbsenceReport: async (reportId) => {
    try {
      const response = await api.post(`/absence-reports/${reportId}/approve`);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Từ chối báo cáo vắng mặt
   */
  rejectAbsenceReport: async (reportId) => {
    try {
      const response = await api.post(`/absence-reports/${reportId}/reject`);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa báo cáo vắng mặt
   */
  deleteAbsenceReport: async (reportId) => {
    try {
      const response = await api.delete(`/absence-reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default absenceService;
