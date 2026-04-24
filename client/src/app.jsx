import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const currentUser = user || {
    name: 'Guest User',
    email: 'guest@gmail.com',
  };
  useEffect(() => {
    const handleChangeMenu = (e) => {
      if (e.detail?.menu) {
        setActiveMenu(e.detail.menu);
        setMobileSidebarOpen(false);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('change-menu', handleChangeMenu);
    return () => window.removeEventListener('change-menu', handleChangeMenu);
  }, []);

  useEffect(() => {
    const handleToggleSidebar = () => {
      setMobileSidebarOpen((prev) => !prev);
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('toggle-mobile-sidebar', handleToggleSidebar);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggleSidebar);
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'show' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="app-main">
        <header className="global-header">
          <button
            className="global-menu-btn"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            type="button"
            title="Mở menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

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
  const { isAuthenticated, loading } = useAuth();

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
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

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
