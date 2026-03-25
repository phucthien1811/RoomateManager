import { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Avatar,
  Alert,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Person,
  Lock,
  Email,
  Phone,
  Home,
} from '@mui/icons-material';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ');
      return;
    }

    // Mock register - sau này sẽ call API
    setSuccess(true);
    setTimeout(() => {
      onRegister({
        id: Date.now(),
        username: formData.username,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });
    }, 1500);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ p: 5 }}>
            {/* Logo & Title */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto',
                  mb: 2,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                }}
              >
                <Home sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Tạo Tài Khoản Mới
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tham gia Roommate Manager ngay hôm nay
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Đăng ký thành công! Đang chuyển hướng...
              </Alert>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="fullName"
                    label="Họ và tên *"
                    variant="outlined"
                    value={formData.fullName}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="username"
                    label="Tên đăng nhập *"
                    variant="outlined"
                    value={formData.username}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email *"
                    type="email"
                    variant="outlined"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="phone"
                    label="Số điện thoại"
                    variant="outlined"
                    value={formData.phone}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="password"
                    label="Mật khẩu *"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    label="Xác nhận mật khẩu *"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                startIcon={<PersonAdd />}
                disabled={success}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                    boxShadow: '0 6px 16px rgba(240, 147, 251, 0.6)',
                  },
                }}
              >
                {success ? 'Đang xử lý...' : 'Đăng Ký'}
              </Button>
            </form>

            <Divider sx={{ my: 3 }} />

            {/* Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Đã có tài khoản?{' '}
                <Button
                  onClick={onSwitchToLogin}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    color: '#f093fb',
                  }}
                >
                  Đăng nhập ngay
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 3,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          © 2026 Roommate Manager - Quản lý chi tiêu thông minh
        </Typography>
      </Container>
    </Box>
  );
};

export default Register;
