import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import RoomManagement from './components/room.management.jsx';
import MemberManagement from './components/member.management.jsx';
import BillManagement from './components/bill.management.jsx';
import TaskTracking from './components/task.tracking.jsx';
import ExpenseSharing from './components/expense.sharing.jsx';
import NotificationBoard from './components/notification.board.jsx';
import FinancialReport from './components/financial.report.jsx';
import './app.css';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

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
      case 'tasks':
        return <TaskTracking />;
      case 'expenses':
        return <ExpenseSharing />;
      case 'notifications':
        return <NotificationBoard />;
      case 'reports':
        return <FinancialReport />;
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
}

export default App;
