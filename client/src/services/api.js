import axios from 'axios';

// Base URL từ .env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor - gắn token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - xử lý 401, refresh token, etc
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;

    // Token hết hạn hoặc không hợp lệ
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch logout event để AuthContext bắt và redirect
      window.dispatchEvent(new Event('logout'));
    }

    // Lỗi 500 hoặc lỗi server khác
    if (status >= 500) {
      console.error('Server error:', error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;
