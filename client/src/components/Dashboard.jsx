import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarCheck,
  faCircleExclamation,
  faCoins,
  faHouse,
  faMapMarkerAlt,
  faMoneyBillWave,
  faChartLine,
  faChartPie,
  faUser,
  faUsers,
  faPlus,
  faUserSlash,
  faPiggyBank,
} from '@fortawesome/free-solid-svg-icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import roomService from '../services/room.service.js';
import billService from '../services/bill.service.js';
import choreService from '../services/chore.service.js';
import absenceService from '../services/absence.service.js';
import api from '../services/api.js';
import dutyScheduleService from '../services/duty.schedule.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/dashboard.css';

const PIE_COLORS = ['#f6b74f', '#54c7a1', '#74b7ff', '#f7d26a', '#9ad8ff', '#c9ced6'];
const BILL_TYPE_LABELS = {
  electricity: 'Điện',
  water: 'Nước',
  rent: 'Tiền thuê',
  internet: 'Internet',
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(amount) || 0
  );

const getMemberName = (member) => member?.full_name || member?.name || member?.email || 'Thành viên';
const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return value._id || value.id || '';
  return value;
};

const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getTodayFullDate = () => {
  const d = new Date();
  const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return `${days[d.getDay()]}, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  return `Tháng ${parseInt(month, 10)} năm ${year}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [dashboardMode, setDashboardMode] = useState('room');
  const [selectedBillingMonth, setSelectedBillingMonth] = useState(getCurrentMonthKey());
  const [chartView, setChartView] = useState('distribution');
  const [memberChartMode, setMemberChartMode] = useState('chi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    room: null,
    members: [],
    bills: [],
    chores: [],
    absences: [],
    transactions: [],
    fundBalance: 0,
    duties: [],
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError('');
        const roomList = await roomService.getRooms();
        setRooms(roomList);

        if (roomList.length > 0) {
          const savedRoomId = localStorage.getItem('currentRoomId');
          const validSavedRoom = roomList.find((room) => room._id === savedRoomId);
          const roomId = validSavedRoom ? validSavedRoom._id : roomList[0]._id;
          setSelectedRoomId(roomId);
          localStorage.setItem('currentRoomId', roomId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError(err.message || 'Không thể tải danh sách phòng');
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const handleRoomSelected = (event) => {
      const roomId = event.detail?.roomId;
      if (roomId) setSelectedRoomId(roomId);
    };

    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;

    const fetchRoomDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [room, members, billHistory, chores, absences, fundResponse, duties] = await Promise.all([
          roomService.getRoomById(selectedRoomId),
          roomService.getRoomMembers(selectedRoomId),
          billService.getBillHistory(selectedRoomId),
          choreService.getChoresByRoom(selectedRoomId),
          absenceService.getAbsenceReports(selectedRoomId),
          api.get(`/fund?room_id=${selectedRoomId}`),
          dutyScheduleService.getWeekDuties(selectedRoomId, new Date().toISOString().split('T')[0]),
        ]);

        const billsData = Array.isArray(billHistory) ? billHistory : billHistory?.bills || [];
        const fundData = fundResponse?.data?.data || {};

        setData({
          room,
          members: Array.isArray(members) ? members : [],
          bills: billsData,
          chores: Array.isArray(chores) ? chores : [],
          absences: Array.isArray(absences) ? absences : [],
          transactions: Array.isArray(fundData.transactions) ? fundData.transactions : [],
          fundBalance: Number(fundData.balance) || 0,
          duties: Array.isArray(duties) ? duties : [],
        });

        const billMonths = [...new Set(billsData.map((bill) => bill.billing_month).filter(Boolean))].sort().reverse();
        if (billMonths.length > 0) {
          const currentMonth = getCurrentMonthKey();
          setSelectedBillingMonth(billMonths.includes(currentMonth) ? currentMonth : billMonths[0]);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err.message || 'Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDashboard();
  }, [selectedRoomId]);

  const computed = useMemo(() => {
    const monthToUse = selectedBillingMonth || getCurrentMonthKey();
    const monthlyBills = data.bills.filter((bill) => bill.billing_month === monthToUse);
    const monthlyExpense = monthlyBills.reduce((sum, bill) => sum + (Number(bill.total_amount) || 0), 0);

    const pendingChores = data.chores.filter((chore) => chore.status !== 'completed');
    const nextPendingChore = pendingChores.sort((a,b) => new Date(a.chore_date) - new Date(b.chore_date))[0];

    const pendingAmount = monthlyBills.reduce((sum, bill) => {
      const details = Array.isArray(bill.details) ? bill.details : [];
      const pendingDetails = details.filter((detail) => detail.status === 'pending');
      return (
        sum +
        pendingDetails.reduce(
          (detailSum, detail) => detailSum + (Number(detail.actual_amount) || Number(detail.amount_due) || 0),
          0
        )
      );
    }, 0);

    const pendingAbsences = data.absences.filter((report) => report.status === 'pending');

    const expenseByTypeMap = monthlyBills.reduce((acc, bill) => {
      const key = bill.bill_type || 'Khác';
      acc[key] = (acc[key] || 0) + (Number(bill.total_amount) || 0);
      return acc;
    }, {});

    const expensePieData = Object.entries(expenseByTypeMap).map(([name, value]) => ({
      name: BILL_TYPE_LABELS[name] || name,
      value,
    }));

    const monthlyExpenseMap = data.bills.reduce((acc, bill) => {
      const month = bill.billing_month;
      if (!month) return acc;
      acc[month] = (acc[month] || 0) + (Number(bill.total_amount) || 0);
      return acc;
    }, {});
    
    // Tạo danh sách 6 tháng liên tiếp kết thúc tại tháng đang chọn
    const expenseTrendData = (() => {
      const trend = [];
      const [selYear, selMonth] = monthToUse.split('-').map(Number);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selYear, selMonth - 1 - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trend.push({
          month: mKey,
          label: formatMonthLabel(mKey).replace(' năm ', '/'),
          chiTieu: monthlyExpenseMap[mKey] || 0,
        });
      }
      return trend;
    })();

    const memberExpenseMap = {};
    const memberIncomeMap = {};
    data.members.forEach((member) => {
      const name = getMemberName(member);
      memberExpenseMap[name] = 0;
      memberIncomeMap[name] = 0;
    });

    monthlyBills.forEach((bill) => {
      const details = Array.isArray(bill.details) ? bill.details : [];
      details.forEach((detail) => {
        const memberName = getMemberName(detail.member_id);
        const amount = Number(detail.actual_amount) || Number(detail.amount_due) || 0;
        memberExpenseMap[memberName] = (memberExpenseMap[memberName] || 0) + amount;
        if (detail.status === 'paid') {
          memberIncomeMap[memberName] = (memberIncomeMap[memberName] || 0) + amount;
        }
      });
    });

    // --- So sánh với tháng trước ---
    const previousMonthKey = (() => {
      const [year, month] = monthToUse.split('-').map(Number);
      const d = new Date(year, month - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const previousMonthBills = data.bills.filter((bill) => bill.billing_month === previousMonthKey);
    const previousMonthExpense = previousMonthBills.reduce((sum, bill) => sum + (Number(bill.total_amount) || 0), 0);

    const expenseDiff = monthlyExpense - previousMonthExpense;
    const expenseDiffPercent = previousMonthExpense > 0 ? (expenseDiff / previousMonthExpense) * 100 : 0;

    // --- Thống kê thành viên ---
    const memberFinanceData = data.members.map((member) => {
      const name = getMemberName(member);
      const avatar = member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
      
      // Tính chi (số tiền cần đóng)
      const chi = monthlyBills.reduce((sum, bill) => {
        const detail = bill.details?.find(d => getEntityId(d.member_id) === member._id);
        return sum + (Number(detail?.actual_amount) || Number(detail?.amount_due) || 0);
      }, 0);

      // Tính thu (số tiền thực tế đã đóng)
      const thu = monthlyBills.reduce((sum, bill) => {
        const detail = bill.details?.find(d => getEntityId(d.member_id) === member._id && d.status === 'paid');
        return sum + (Number(detail?.actual_amount) || Number(detail?.amount_due) || 0);
      }, 0);

      return { name, avatar, chi, thu };
    });

    const pendingPayments = monthlyBills
      .flatMap((bill) => {
        const details = Array.isArray(bill.details) ? bill.details : [];
        return details
          .filter((detail) => detail.status === 'pending')
          .map((detail) => ({
            id: `${bill._id}-${detail._id}`,
            title: `${getMemberName(detail.member_id)} chưa đóng ${bill.bill_type}`,
            amount: Number(detail.actual_amount) || Number(detail.amount_due) || 0,
            date: formatMonthLabel(bill.billing_month),
          }));
      })
      .slice(0, 5);

    const upcomingChores = (() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1));
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const allUpcoming = [
        ...data.chores
          .filter(c => c.status !== 'completed')
          .map(c => ({
            id: c._id,
            title: c.title,
            date: c.chore_date,
            type: 'chore',
            member: getMemberName(c.assigned_to)
          })),
        ...data.duties
          .map(d => ({
            id: d._id,
            title: d.title,
            date: d.date,
            type: 'duty',
            member: getMemberName(d.assigned_to)
          }))
      ];
      
      return allUpcoming
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => {
          const itemDateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
          let dateLabel = new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          if (itemDateStr === todayStr) dateLabel = 'Hôm nay';
          else if (itemDateStr === tomorrowStr) dateLabel = 'Ngày mai';
          
          return {
            ...item,
            dateDisplay: dateLabel,
            isToday: itemDateStr === todayStr,
            isTomorrow: itemDateStr === tomorrowStr
          };
        })
        .slice(0, 6);
    })();

    const recentHistory = [
      ...data.transactions.map((transaction) => ({
        id: `txn-${transaction._id}`,
        label: transaction.type === 'deposit' ? 'Đóng quỹ' : 'Rút quỹ',
        amount: Number(transaction.amount) || 0,
        createdAt: transaction.created_at,
      })),
      ...data.bills.map((bill) => ({
        id: `bill-${bill._id}`,
        label: `Tạo hóa đơn ${bill.bill_type}`,
        amount: Number(bill.total_amount) || 0,
        createdAt: bill.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return {
      memberCount: data.members.length,
      fundBalance: data.fundBalance,
      monthlyExpense,
      pendingAmount,
      pendingChoreCount: pendingChores.length,
      nextPendingChore,
      pendingAbsenceCount: pendingAbsences.length,
      expensePieData,
      expenseTrendData,
      memberFinanceData,
      expenseDiff,
      expenseDiffPercent,
      availableMonths: (() => {
        // Lấy danh sách tháng từ dữ liệu thật
        const realMonths = data.bills.map((bill) => bill.billing_month).filter(Boolean);
        
        // Tạo danh sách 12 tháng gần nhất (tính từ tháng hiện tại)
        const recentMonths = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          recentMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        
        // Gộp hai danh sách, loại bỏ trùng lặp và sắp xếp mới nhất lên đầu
        return [...new Set([...realMonths, ...recentMonths])].sort().reverse();
      })(),
      selectedMonthLabel: formatMonthLabel(monthToUse),
      pendingPayments,
      upcomingChores,
      recentHistory,
    };
  }, [data, selectedBillingMonth]);

  const personalComputed = useMemo(() => {
    const userId = user?.id;
    const monthToUse = selectedBillingMonth || getCurrentMonthKey();
    const monthlyBills = data.bills.filter((bill) => bill.billing_month === monthToUse);

    const myPendingPayments = monthlyBills.flatMap((bill) => {
      const details = Array.isArray(bill.details) ? bill.details : [];
      return details
        .filter((detail) => getEntityId(detail.member_id) === userId && detail.status === 'pending')
        .map((detail) => ({
          id: `${bill._id}-${detail._id}`,
          billType: bill.bill_type,
          amount: Number(detail.actual_amount) || Number(detail.amount_due) || 0,
          month: bill.billing_month,
        }));
    });

    const myPaidPayments = monthlyBills.flatMap((bill) => {
      const details = Array.isArray(bill.details) ? bill.details : [];
      return details
        .filter((detail) => getEntityId(detail.member_id) === userId && detail.status === 'paid')
        .map((detail) => Number(detail.actual_amount) || Number(detail.amount_due) || 0);
    });

    const myUpcomingChores = data.chores
      .filter((chore) => getEntityId(chore.assigned_to) === userId && chore.status !== 'completed')
      .sort((a, b) => new Date(a.chore_date) - new Date(b.chore_date))
      .slice(0, 5);

    const myCompletedChores = data.chores.filter(
      (chore) => getEntityId(chore.assigned_to) === userId && chore.status === 'completed'
    );

    const myFundContribution = data.transactions
      .filter((transaction) => transaction.type === 'deposit' && getEntityId(transaction.performed_by) === userId)
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

    const meInRoom = data.members.find((member) => getEntityId(member) === userId);

    return {
      myName: meInRoom ? getMemberName(meInRoom) : user?.name || 'Bạn',
      pendingCount: myPendingPayments.length,
      pendingAmount: myPendingPayments.reduce((sum, item) => sum + item.amount, 0),
      paidAmount: myPaidPayments.reduce((sum, amount) => sum + amount, 0),
      upcomingChores: myUpcomingChores,
      completedChoreCount: myCompletedChores.length,
      myFundContribution,
      pendingPayments: myPendingPayments,
      paymentPieData: [
        { name: 'Đã thanh toán', value: myPaidPayments.reduce((sum, amount) => sum + amount, 0) },
        { name: 'Còn phải đóng', value: myPendingPayments.reduce((sum, item) => sum + item.amount, 0) },
      ].filter((item) => item.value > 0),
      choreBarData: [
        { name: 'Đã hoàn thành', value: myCompletedChores.length },
        { name: 'Chưa hoàn thành', value: myUpcomingChores.length },
      ],
    };
  }, [data, user, selectedBillingMonth]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">Đang tải dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty dashboard-error">{error}</div>
      </div>
    );
  }

  if (!rooms.length) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">Bạn chưa có phòng nào. Hãy vào mục Phòng để tạo hoặc tham gia phòng.</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="35" height="35" viewBox="0 0 35 35">
              <image id="Layer_1_copy" x="1" y="1" width="33" height="33" xlinkHref="/datalogo" />
            </svg>
            <h1>{dashboardMode === 'room' ? 'Dashboard phòng' : 'Dashboard cá nhân'}</h1>
          </div>
          <p className="room-subtitle">
            {dashboardMode === 'room' ? (
              <>
                <FontAwesomeIcon icon={faHouse} /> {data.room?.name || 'Phòng của bạn'}
                {data.room?.address && (
                  <>
                    {' '}
                    • <FontAwesomeIcon icon={faMapMarkerAlt} /> {data.room.address}
                  </>
                )}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faUser} /> {personalComputed.myName} • {data.room?.name || 'Phòng hiện tại'}
              </>
            )}
          </p>
        </div>
        <div className="header-actions">
          <div className="quick-actions">
            <button 
              className="quick-action-btn fund" 
              onClick={() => window.dispatchEvent(new CustomEvent('change-menu', { detail: { menu: 'expenses' } }))}
              title="Đóng quỹ phòng"
            >
              <FontAwesomeIcon icon={faPiggyBank} /> Đóng quỹ
            </button>
            <button 
              className="quick-action-btn bill" 
              onClick={() => window.dispatchEvent(new CustomEvent('change-menu', { detail: { menu: 'bills' } }))}
              title="Tạo hóa đơn mới"
            >
              <FontAwesomeIcon icon={faPlus} /> Hóa đơn
            </button>
            <button 
              className="quick-action-btn absence" 
              onClick={() => window.dispatchEvent(new CustomEvent('change-menu', { detail: { menu: 'absence' } }))}
              title="Khái báo vắng mặt"
            >
              <FontAwesomeIcon icon={faUserSlash} /> Báo vắng
            </button>
          </div>
          <div className="dashboard-mode-switch">
            <button
              className={dashboardMode === 'room' ? 'active' : ''}
              onClick={() => setDashboardMode('room')}
              type="button"
            >
              Phòng
            </button>
            <button
              className={dashboardMode === 'personal' ? 'active' : ''}
              onClick={() => setDashboardMode('personal')}
              type="button"
            >
              Cá nhân
            </button>
          </div>
        </div>
      </div>

      {dashboardMode === 'room' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Số dư quỹ phòng</span>
              <strong className="stat-value">{formatCurrency(computed.fundBalance)}</strong>
              <span className="stat-meta">
                <FontAwesomeIcon icon={faCoins} /> Quỹ hiện tại
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Chi tiêu tháng này</span>
              <strong className="stat-value">{formatCurrency(computed.monthlyExpense)}</strong>
              <div className="stat-insight">
                {computed.expenseDiffPercent !== 0 ? (
                  <>
                    <span className={`diff-badge ${computed.expenseDiffPercent > 0 ? 'up' : 'down'}`}>
                      {computed.expenseDiffPercent > 0 ? '+' : ''}
                      {computed.expenseDiffPercent.toFixed(1)}%
                    </span>
                    <span className="insight-text">so với tháng trước</span>
                  </>
                ) : (
                  <span className="insight-text">Tháng đầu tiên</span>
                )}
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Khoản còn phải thu</span>
              <strong className="stat-value">{formatCurrency(computed.pendingAmount)}</strong>
              <span className="stat-meta">
                <FontAwesomeIcon icon={faCircleExclamation} /> Thành viên chưa thanh toán
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Việc nhà cần làm</span>
              <strong className="stat-value">{computed.pendingChoreCount}</strong>
              <div className="stat-insight chore-insight">
                {computed.nextPendingChore ? (
                  <>
                    <span className="chore-reminder-label">Tiếp theo:</span>
                    <span className="chore-reminder-task" title={`${computed.nextPendingChore.title} - ${getMemberName(computed.nextPendingChore.assigned_to)}`}>
                      {computed.nextPendingChore.title}
                    </span>
                  </>
                ) : (
                  <span className="insight-text">Đã hoàn thành hết!</span>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="section expense-overview-section">
              <div className="section-header expense-header">
                <div>
                  <h2>Tình hình thu chi</h2>
                  <p className="expense-subtitle">
                    <span className="today-badge">Hôm nay</span> {getTodayFullDate()} 
                    <span className="divider">•</span> 
                    <strong>{computed.selectedMonthLabel}</strong>
                  </p>
                </div>
                <div className="expense-header-controls">
                  <select
                    className="expense-month-selector"
                    value={selectedBillingMonth}
                    onChange={(e) => setSelectedBillingMonth(e.target.value)}
                  >
                    {computed.availableMonths.length === 0 ? (
                      <option value={getCurrentMonthKey()}>{formatMonthLabel(getCurrentMonthKey())}</option>
                    ) : (
                      computed.availableMonths.map((month) => (
                        <option key={month} value={month}>
                          {formatMonthLabel(month)}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="expense-view-switch">
                    <button
                      type="button"
                      className={chartView === 'distribution' ? 'active' : ''}
                      onClick={() => setChartView('distribution')}
                    >
                      <FontAwesomeIcon icon={faChartPie} /> Phân bổ
                    </button>
                    <button
                      type="button"
                      className={chartView === 'trend' ? 'active' : ''}
                      onClick={() => setChartView('trend')}
                    >
                      <FontAwesomeIcon icon={faChartLine} /> Xu hướng
                    </button>
                  </div>
                </div>
              </div>

              <div className="expense-charts-row">
                <div className="chart-wrap expense-main-chart-card">
                  {chartView === 'distribution' ? (
                    computed.expensePieData.length === 0 ? (
                      <div className="empty-inline">Chưa có dữ liệu chi tiêu tháng này</div>
                    ) : (
                      <div className="expense-distribution-layout">
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={computed.expensePieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={70}
                              outerRadius={112}
                              paddingAngle={3}
                            >
                              {computed.expensePieData.map((entry, index) => (
                                <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="expense-legend-list">
                          {computed.expensePieData.map((item, index) => (
                            <div key={`${item.name}-${index}`} className="expense-legend-item">
                              <span className="dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                              <div>
                                <strong>{item.name}</strong>
                                <p>{formatCurrency(item.value)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ) : computed.expenseTrendData.length === 0 ? (
                    <div className="empty-inline">Chưa có dữ liệu xu hướng theo tháng</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={computed.expenseTrendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}tr`} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="chiTieu" fill="#74b7ff" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="member-chart-block">
                  <div className="section-header member-chart-header">
                    <h2>Thu chi từng thành viên</h2>
                    <div className="member-mode-switch">
                      <button
                        type="button"
                        className={memberChartMode === 'chi' ? 'active' : ''}
                        onClick={() => setMemberChartMode('chi')}
                      >
                        Chi
                      </button>
                      <button
                        type="button"
                        className={memberChartMode === 'thu' ? 'active' : ''}
                        onClick={() => setMemberChartMode('thu')}
                      >
                        Thu
                      </button>
                    </div>
                  </div>
                  {computed.memberFinanceData.length === 0 ? (
                    <div className="empty-inline">Chưa có dữ liệu theo thành viên</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={computed.memberFinanceData} margin={{ top: 10, right: 10, left: 0, bottom: 35 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="avatar" 
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          tick={({ x, y, payload }) => (
                            <g transform={`translate(${x},${y + 12})`}>
                              <defs>
                                <clipPath id={`clip-${payload.index}`}>
                                  <circle cx="0" cy="0" r="14" />
                                </clipPath>
                              </defs>
                              <circle cx="0" cy="0" r="15" fill="#fff" stroke="#e5e7eb" strokeWidth="1" />
                              <image
                                x="-14"
                                y="-14"
                                width="28"
                                height="28"
                                xlinkHref={payload.value}
                                clipPath={`url(#clip-${payload.index})`}
                                preserveAspectRatio="xMidYMid slice"
                              />
                            </g>
                          )}
                        />
                        <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: '#f3f4f6', opacity: 0.4 }}
                          formatter={(value, name, props) => [formatCurrency(value), `Thành viên: ${props.payload.name}`]} 
                        />
                        <Bar
                          dataKey={memberChartMode}
                          fill={memberChartMode === 'chi' ? '#74b7ff' : '#54c7a1'}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="section">
              <div className="section-header">
                <h2>Lịch trực sắp tới</h2>
              </div>
              <div className="duty-list">
                {computed.upcomingChores.length === 0 ? (
                  <div className="empty-inline">Hôm nay và sắp tới chưa có lịch trực</div>
                ) : (
                  <>
                    {/* Nhóm Hôm nay */}
                    {computed.upcomingChores.some(c => c.isToday) && (
                      <div className="duty-group-header">Hôm nay</div>
                    )}
                    {computed.upcomingChores.filter(c => c.isToday).map((item) => (
                      <div key={item.id} className="duty-item today">
                        <div className="duty-info">
                          <strong>{item.title}</strong>
                          <p>{item.member}</p>
                        </div>
                        <div className="duty-type-tag">{item.type === 'duty' ? 'Trực nhật' : 'Việc nhà'}</div>
                      </div>
                    ))}

                    {/* Nhóm Ngày mai */}
                    {computed.upcomingChores.some(c => c.isTomorrow) && (
                      <div className="duty-group-header">Ngày mai</div>
                    )}
                    {computed.upcomingChores.filter(c => c.isTomorrow).map((item) => (
                      <div key={item.id} className="duty-item tomorrow">
                        <div className="duty-info">
                          <strong>{item.title}</strong>
                          <p>{item.member}</p>
                        </div>
                        <div className="duty-type-tag">{item.type === 'duty' ? 'Trực nhật' : 'Việc nhà'}</div>
                      </div>
                    ))}

                    {/* Các ngày khác */}
                    {computed.upcomingChores.filter(c => !c.isToday && !c.isTomorrow).length > 0 && (
                      <div className="duty-group-header">Sắp tới</div>
                    )}
                    {computed.upcomingChores.filter(c => !c.isToday && !c.isTomorrow).map((item) => (
                      <div key={item.id} className="duty-item">
                        <div className="duty-date-tag">{item.dateDisplay}</div>
                        <div className="duty-info">
                          <strong>{item.title}</strong>
                          <p>{item.member}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2>Lịch sử gần đây</h2>
              </div>
              <div className="list-wrap">
                {computed.recentHistory.length === 0 ? (
                  <div className="empty-inline">Chưa có hoạt động gần đây</div>
                ) : (
                  computed.recentHistory.map((item) => (
                    <div key={item.id} className="list-item">
                      <div>
                        <strong>{item.label}</strong>
                        <p>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2>Thành viên phòng</h2>
              </div>
              <div className="members-list">
                {data.members.length === 0 ? (
                  <div className="empty-inline">Chưa có thành viên</div>
                ) : (
                  data.members.map((member) => (
                    <div key={member._id} className="member-item">
                      <div className="member-avatar">{getMemberName(member).slice(0, 2).toUpperCase()}</div>
                      <div>
                        <strong>{getMemberName(member)}</strong>
                        <p>{member.email || 'Không có email'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Khoản bạn còn phải đóng</span>
              <strong className="stat-value">{formatCurrency(personalComputed.pendingAmount)}</strong>
              <span className="stat-meta">
                <FontAwesomeIcon icon={faCircleExclamation} /> {personalComputed.pendingCount} khoản pending
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Bạn đã thanh toán tháng này</span>
              <strong className="stat-value">{formatCurrency(personalComputed.paidAmount)}</strong>
              <span className="stat-meta">
                <FontAwesomeIcon icon={faMoneyBillWave} /> Theo bill tháng hiện tại
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Đóng góp quỹ của bạn</span>
              <strong className="stat-value">{formatCurrency(personalComputed.myFundContribution)}</strong>
              <span className="stat-meta">
                <FontAwesomeIcon icon={faCoins} /> Tổng nạp quỹ
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Công việc của bạn</span>
              <strong className="stat-value">{personalComputed.completedChoreCount}</strong>
              <span className="stat-meta">
                <FontAwesomeIcon icon={faCalendarCheck} /> Đã hoàn thành
              </span>
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="section">
              <div className="section-header">
                <h2>Tiến độ thanh toán cá nhân (Pie)</h2>
              </div>
              <div className="chart-wrap">
                {personalComputed.paymentPieData.length === 0 ? (
                  <div className="empty-inline">Bạn chưa có dữ liệu thanh toán tháng này</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={personalComputed.paymentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={92}>
                        {personalComputed.paymentPieData.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2>Trực nhật của bạn (Bar)</h2>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={personalComputed.choreBarData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </>
      )}

    </div>
  );
};

export default Dashboard;
