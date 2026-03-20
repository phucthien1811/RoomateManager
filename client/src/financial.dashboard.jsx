import { useState, useEffect } from 'react';
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
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AttachMoney,
  ElectricBolt,
  Water,
  Wifi,
  People,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Error,
  Analytics,
  AccountBalance,
  Notifications,
} from '@mui/icons-material';

const FinancialDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 5000000,
    totalPaid: 3500000,
    totalUnpaid: 1500000,
    memberCount: 4,
    bills: [
      {
        id: 1,
        type: 'Điện',
        amount: 1200000,
        icon: ElectricBolt,
        color: '#FFB020',
        paid: 900000,
      },
      {
        id: 2,
        type: 'Nước',
        amount: 800000,
        icon: Water,
        color: '#2196F3',
        paid: 600000,
      },
      {
        id: 3,
        type: 'Mạng',
        amount: 300000,
        icon: Wifi,
        color: '#9C27B0',
        paid: 300000,
      },
      {
        id: 4,
        type: 'Tiền nhà',
        amount: 2700000,
        icon: AttachMoney,
        color: '#4CAF50',
        paid: 1700000,
      },
    ],
    members: [
      { id: 1, name: 'Nguyễn Văn A', paid: 1250000, total: 1250000, status: 'paid' },
      { id: 2, name: 'Trần Thị B', paid: 1250000, total: 1250000, status: 'paid' },
      { id: 3, name: 'Lê Văn C', paid: 1000000, total: 1250000, status: 'partial' },
      { id: 4, name: 'Phạm Thị D', paid: 0, total: 1250000, status: 'unpaid' },
    ],
  });

  const getPaymentProgress = () => {
    return (dashboardData.totalPaid / dashboardData.totalExpenses) * 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'paid' ? <CheckCircle /> : <Error />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4,
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom 
              fontWeight="800" 
              sx={{ 
                color: 'white',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                mb: 1,
              }}
            >
              💰 Dashboard Tài Chính
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Roommate Manager - Quản lý chi phí thông minh
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Thông báo">
              <IconButton 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <Notifications sx={{ color: 'white' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Báo cáo">
              <IconButton 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <Analytics sx={{ color: 'white' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
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
              <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.2 }}>
                  <AccountBalance sx={{ fontSize: 120 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <AttachMoney sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Tổng Chi Phí
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(dashboardData.totalExpenses)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.2 }}>
                  <TrendingUp sx={{ fontSize: 120 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <TrendingUp sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Đã Thu
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(dashboardData.totalPaid)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.2 }}>
                  <TrendingDown sx={{ fontSize: 120 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <TrendingDown sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Còn Thiếu
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(dashboardData.totalUnpaid)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
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
              <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.2 }}>
                  <People sx={{ fontSize: 120 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56, mr: 2 }}>
                    <People sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Thành Viên
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData.memberCount}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  người
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
              📊 Tiến Độ Thu Tiền
            </Typography>
            <Chip 
              label={`${getPaymentProgress().toFixed(1)}% hoàn thành`}
              color="primary"
              sx={{ 
                fontWeight: 'bold',
                fontSize: '1rem',
                height: 40,
                px: 2,
              }}
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
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 10,
                },
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: getPaymentProgress() > 50 ? 'white' : 'black',
                fontWeight: 'bold',
              }}
            >
              {formatCurrency(dashboardData.totalPaid)} / {formatCurrency(dashboardData.totalExpenses)}
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Bills Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                📝 Chi Tiết Hóa Đơn
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {dashboardData.bills.map((bill) => {
                  const Icon = bill.icon;
                  const progress = (bill.paid / bill.amount) * 100;
                  return (
                    <Grid item xs={12} key={bill.id}>
                      <Card 
                        elevation={0}
                        sx={{
                          background: `linear-gradient(135deg, ${bill.color}15 0%, ${bill.color}05 100%)`,
                          border: `2px solid ${bill.color}30`,
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateX(8px)',
                            boxShadow: `0 8px 24px ${bill.color}40`,
                            border: `2px solid ${bill.color}`,
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: bill.color, 
                                width: 48, 
                                height: 48,
                                mr: 2,
                                boxShadow: `0 4px 12px ${bill.color}60`,
                              }}
                            >
                              <Icon sx={{ fontSize: 28 }} />
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" fontWeight="bold">
                                {bill.type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight="600">
                                {formatCurrency(bill.paid)} / {formatCurrency(bill.amount)}
                              </Typography>
                            </Box>
                            <Chip
                              label={progress === 100 ? '✓ Đủ' : '⏳ Thiếu'}
                              color={progress === 100 ? 'success' : 'warning'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: 'rgba(0,0,0,0.08)',
                              '& .MuiLinearProgress-bar': {
                                background: `linear-gradient(90deg, ${bill.color} 0%, ${bill.color}dd 100%)`,
                                borderRadius: 5,
                              },
                            }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>

          {/* Member Payment Status */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                👥 Trạng Thái Thành Viên
              </Typography>
              <List sx={{ py: 0 }}>
                {dashboardData.members.map((member, index) => (
                  <Box key={member.id}>
                    <ListItem 
                      sx={{ 
                        px: 0, 
                        py: 2.5,
                        transition: 'all 0.3s ease',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.02)',
                          pl: 2,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: getStatusColor(member.status) + '.main',
                            width: 56,
                            height: 56,
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                            {member.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="600" sx={{ mb: 1 }}>
                              {formatCurrency(member.paid)} / {formatCurrency(member.total)}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(member.paid / member.total) * 100}
                              sx={{ 
                                mt: 1, 
                                height: 10, 
                                borderRadius: 5,
                                bgcolor: 'rgba(0,0,0,0.08)',
                              }}
                              color={getStatusColor(member.status)}
                            />
                          </Box>
                        }
                      />
                      <Chip
                        icon={getStatusIcon(member.status)}
                        label={
                          member.status === 'paid'
                            ? '✓ Đủ'
                            : member.status === 'partial'
                            ? '⚠ Thiếu'
                            : '✗ Chưa'
                        }
                        color={getStatusColor(member.status)}
                        sx={{ 
                          fontWeight: 'bold',
                          height: 36,
                          fontSize: '0.9rem',
                        }}
                      />
                    </ListItem>
                    {index < dashboardData.members.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FinancialDashboard;
