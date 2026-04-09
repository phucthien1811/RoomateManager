import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faHome,
  faUsers,
  faFileAlt,
  faTasks,
  faBell,
  faChartBar,
  faPiggyBank,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/sidebar.css';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: faChartLine },
    { id: 'rooms', label: 'Quản Lý Phòng', icon: faHome },
    { id: 'members', label: 'Quản Lý Thành Viên', icon: faUsers },
    { id: 'bills', label: 'Hóa Đơn', icon: faFileAlt },
    { id: 'tasks', label: 'Công Việc Chung', icon: faTasks },
    { id: 'expenses', label: 'Chi Phí & Quỹ', icon: faPiggyBank },
    { id: 'notifications', label: 'Thông Báo', icon: faBell },
    { id: 'reports', label: 'Báo Cáo Tài Chính', icon: faChartBar },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <FontAwesomeIcon icon={faHome} className="logo-icon" /> Roommate Manager
        </div>
      </div>
      
      <nav className="sidebar-menu">
        <div className="menu-title">MENU</div>
        {menuItems.map((item) => {
          return (
            <button
              key={item.id}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <FontAwesomeIcon icon={item.icon} className="menu-icon" />
              <span className="menu-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-summary">
        <div className="summary-title">THỐNG KÊ NHANH</div>
        <div className="summary-card">
          <div className="summary-label">Phòng đang quản lý</div>
          <div className="summary-value">5</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Tổng thành viên</div>
          <div className="summary-value">18</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Chưa thanh toán</div>
          <div className="summary-value">2.5M</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
