import api from './api';

const authService = {
  /**
   * Đăng ký tài khoản mới
   */
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Đăng nhập và lấy token
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      const { token, user } = response.data;

      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Đăng xuất
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Kiểm tra token còn hợp lệ không
   */
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
};

export default authService;
