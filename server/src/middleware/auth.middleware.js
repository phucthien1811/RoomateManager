// Middleware xác thực người dùng
const authenticate = (req, res, next) => {
  try {
    // TODO: Implement JWT verification logic
    // For now, we'll assume userId is sent in headers or req.user is set
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập',
      });
    }
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      error: error.message,
    });
  }
};

module.exports = {
  authenticate,
};
