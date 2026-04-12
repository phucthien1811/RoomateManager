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

const notify = (payload) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-notification', { detail: payload }));
  }
};

const shouldNotifySuccess = (config = {}, data = {}) => {
  const method = (config.method || '').toLowerCase();
  const url = config.url || '';
  const message = String(data?.message || '').toLowerCase();

  if (!['post', 'put', 'patch', 'delete'].includes(method)) return false;

  // Bỏ các thông báo không cần hiển thị trên board
  if (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/me') ||
    url.includes('/auth/verify') ||
    (url.includes('/chores') && method === 'post') ||
    (url.includes('/bills/details/') && url.includes('/confirm'))
  ) {
    return false;
  }

  if (
    message.includes('đăng nhập') ||
    message.includes('dang nhap') ||
    message.includes('thanh toán thành công') ||
    message.includes('thanh toan thanh cong') ||
    message.includes('tạo lịch trực nhật thành công') ||
    message.includes('tao lich truc nhat thanh cong')
  ) {
    return false;
  }

  return true;
};

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
    const method = response.config?.method?.toLowerCase() || 'get';
    if (shouldNotifySuccess(response.config, response.data)) {
      notify({
        type: 'success',
        title: 'API thành công',
        message: response.data?.message || `${method.toUpperCase()} ${response.config?.url || ''} thành công`,
        meta: `${method.toUpperCase()} ${response.config?.url || ''}`,
      });
    }
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

    notify({
      type: 'error',
      title: 'API lỗi',
      message:
        error.response?.data?.message ||
        error.message ||
        `Yêu cầu thất bại ${error.config?.method?.toUpperCase() || ''} ${error.config?.url || ''}`,
      meta: `${error.config?.method?.toUpperCase() || ''} ${error.config?.url || ''} (${status || 'N/A'})`,
    });

    return Promise.reject(error);
  }
);

export default api;
