import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
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
import JoinRoom from './components/join-room.jsx';
import AbsenceReport from './components/absence.report.jsx';
import DutySchedule from './components/duty.schedule.jsx';
import './styles/app.css';

// Component for main app layout
const AppLayout = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const { user } = useAuth();

  const currentUser = user || {
    name: 'Guest User',
    email: 'guest@gmail.com',
  };

  const handleJoinRoom = (roomData) => {
    console.log('Joined room:', roomData);
    // Sau này sẽ call API join room
    setActiveMenu('dashboard');
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
      case 'tasks':
        return <TaskTracking />;
      case 'expenses':
        return <ExpenseSharing />;
      case 'notifications':
        return <NotificationBoard />;
      case 'reports':
        return <FinancialReport />;
      case 'joinRoom':
        return (
          <JoinRoom
            onJoinRoom={handleJoinRoom}
            onCancel={() => setActiveMenu('dashboard')}
            currentUser={currentUser}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div className="main-content">
        {renderContent()}
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
