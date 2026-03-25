import { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AccessTime,
  ElectricBolt,
  Water,
  Wifi,
  Restaurant,
  ShoppingCart,
  LocalGasStation,
  MoreHoriz,
} from '@mui/icons-material';

const PersonalDashboard = ({ user, onLogout }) => {
  // Mock data cho user cá nhân
  const [userData] = useState({
    totalPaid: 1250000,
    totalDebt: 0,
    monthlyBudget: 1250000,
    recentTransactions: [
      {
        id: 1,
        type: 'Tiền điện',
        amount: 300000,
        date: '2026-03-15',
        time: '14:30',
        status: 'paid',
        icon: ElectricBolt,
        color: '#FFB020',
      },
      {
        id: 2,
        type: 'Tiền nước',
        amount: 200000,
        date: '2026-03-15',
        time: '14:35',
        status: 'paid',
        icon: Water,
        color: '#2196F3',
      },
      {
        id: 3,
        type: 'Tiền mạng',
        amount: 75000,
        date: '2026-03-16',
        time: '10:20',
        status: 'paid',
        icon: Wifi,
        color: '#9C27B0',
      },
      {
        id: 4,
        type: 'Tiền nhà',
        amount: 675000,
        date: '2026-03-18',
        time: '09:15',
        status: 'paid',
        icon: AttachMoney,
        color: '#4CAF50',
      },
      {
        id: 5,
        type: 'Mua đồ ăn chung',
        amount: 150000,
        date: '2026-03-19',
        time: '18:45',
        status: 'pending',
        icon: Restaurant,
        color: '#FF5722',
      },
    ],
    monthlyBreakdown: [
      { category: 'Tiền nhà', amount: 675000, percentage: 54 },
      { category: 'Điện', amount: 300000, percentage: 24 },
      { category: 'Nước', amount: 200000, percentage: 16 },
      { category: 'Mạng', amount: 75000, percentage: 6 },
    ],
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getPaymentProgress = () => {
    return (userData.totalPaid / userData.monthlyBudget) * 100;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                fontWeight="800"
                sx={{
                  color: 'white',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                Xin chào, {user.name}! 👋
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Dashboard cá nhân của bạn
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Đăng xuất">
            <IconButton
              onClick={onLogout}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <Logout sx={{ color: 'white' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <TrendingUp sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Đã Đóng Tháng Này
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(userData.totalPaid)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <TrendingDown sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Còn Nợ
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(userData.totalDebt)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <AttachMoney sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Ngân Sách Tháng
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(userData.monthlyBudget)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Payment Progress */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" color="primary">
              📊 Tiến Độ Thanh Toán Tháng Này
            </Typography>
            <Chip
              icon={<CheckCircle />}
              label={getPaymentProgress() === 100 ? 'Hoàn thành' : 'Đang thực hiện'}
              color={getPaymentProgress() === 100 ? 'success' : 'warning'}
              sx={{ fontWeight: 'bold', height: 36 }}
            />
          </Box>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={getPaymentProgress()}
              sx={{
                height: 20,
                borderRadius: 10,
                background: 'rgba(0,0,0,0.05)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: 10,
                },
              }}
            />
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: getPaymentProgress() > 50 ? 'white' : 'black',
              }}
            >
              {getPaymentProgress().toFixed(0)}%
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Recent Transactions */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                📝 Lịch Sử Chi Tiêu Gần Đây
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Số Tiền</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ngày/Giờ</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Trạng Thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userData.recentTransactions.map((transaction) => {
                      const Icon = transaction.icon;
                      return (
                        <TableRow
                          key={transaction.id}
                          sx={{
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                            transition: 'all 0.2s',
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: transaction.color,
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                <Icon sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Typography fontWeight="600">{transaction.type}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight="bold" color="primary">
                              {formatCurrency(transaction.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(transaction.date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status === 'paid' ? 'Đã đóng' : 'Chờ xác nhận'}
                              color={transaction.status === 'paid' ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Monthly Breakdown */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                💰 Phân Bổ Chi Phí
              </Typography>

              <List sx={{ py: 0 }}>
                {userData.monthlyBreakdown.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      px: 0,
                      py: 2,
                      borderBottom: index < userData.monthlyBreakdown.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.category}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="600">
                              {formatCurrency(item.amount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold">
                              {item.percentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={item.percentage}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'rgba(0,0,0,0.08)',
                            }}
                            color="primary"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PersonalDashboard;
