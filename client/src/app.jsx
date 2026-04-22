import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './context/AuthContext.jsx';
import { useNotifications } from './context/NotificationContext.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import RoomManagement from './components/room.management.jsx';
import MemberManagement from './components/member.management.jsx';
import BillManagement from './components/bill.management.jsx';
import TaskTracking from './components/task.tracking.jsx';
import ExpenseSharing from './components/expense.sharing.jsx';
import NotificationBoard from './components/notification.board.jsx';
import FinancialReport from './components/financial.report.jsx';

import AbsenceReport from './components/absence.report.jsx';
import DutySchedule from './components/duty.schedule.jsx';
import InternalNewsfeed from './components/internal.newsfeed.jsx';
import './styles/app.css';

// Component for main app layout
const AppLayout = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();

  const currentUser = user || {
    name: 'Guest User',
    email: 'guest@gmail.com',
  };
  useEffect(() => {
    const handleChangeMenu = (e) => {
      if (e.detail?.menu) {
        setActiveMenu(e.detail.menu);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('change-menu', handleChangeMenu);
    return () => window.removeEventListener('change-menu', handleChangeMenu);
  }, []);



  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'rooms':
        return <RoomManagement />;
      case 'members':
        return <MemberManagement />;
      case 'bills':
        return <BillManagement />;
      case 'absence':
        return <AbsenceReport />;
      case 'duties':
        return <DutySchedule />;
      case 'newsfeed':
        return <InternalNewsfeed />;
      case 'tasks':
        return <TaskTracking />;
      case 'expenses':
        return <ExpenseSharing />;
      case 'reports':
        return <FinancialReport />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="app-main">
        <header className="global-header">

          <div className="global-header-right">
            <div className="global-user">
              <span className="global-user-name">{currentUser.name}</span>
              <span className="global-user-email">{currentUser.email}</span>
            </div>
            <button
              className="global-notification-btn"
              onClick={() => setShowNotificationModal(true)}
              type="button"
              title="Thông báo"
            >
              <FontAwesomeIcon icon={faBell} />
              {unreadCount > 0 && <span className="global-notification-badge">{unreadCount}</span>}
            </button>
            <button className="global-logout-btn" onClick={handleLogout} type="button" title="Đăng xuất">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
        </header>
        <div className="main-content">
          {renderContent()}
        </div>
        {showNotificationModal && (
          <div className="global-notification-modal" onClick={() => setShowNotificationModal(false)}>
            <div className="global-notification-modal-content" onClick={(e) => e.stopPropagation()}>
              <NotificationBoard compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { checkAuth, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      {isAuthenticated ? (
        <Route path="/*" element={<AppLayout />} />
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
