import React, { useEffect, useState } from 'react';
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
  faDoorOpen,
  faCalendarAlt,
  faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '../context/NotificationContext.jsx';
import roomService from '../services/room.service.js';
import '../styles/sidebar.css';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const { unreadCount } = useNotifications();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: faChartLine },
    { id: 'rooms', label: 'Quản Lý Phòng', icon: faHome },
    { id: 'joinRoom', label: 'Tham Gia Phòng', icon: faDoorOpen },
    { id: 'members', label: 'Quản Lý Thành Viên', icon: faUsers },
    { id: 'bills', label: 'Hóa Đơn', icon: faFileAlt },
    { id: 'absence', label: 'Báo Cáo Vắng Mặt', icon: faCalendarAlt },
    { id: 'duties', label: 'Phân Công Trực Nhật', icon: faCalendarCheck },
    { id: 'tasks', label: 'Công Việc Chung', icon: faTasks },
    { id: 'expenses', label: 'Chi Phí & Quỹ', icon: faPiggyBank },
    { id: 'notifications', label: 'Thông Báo', icon: faBell },
    { id: 'reports', label: 'Báo Cáo Tài Chính', icon: faChartBar },
  ];

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomList = await roomService.getRooms();
        setRooms(roomList);
        if (roomList.length === 0) return;

        const savedRoomId = localStorage.getItem('currentRoomId');
        const validSavedRoom = roomList.find((room) => room._id === savedRoomId);
        const roomId = validSavedRoom ? validSavedRoom._id : roomList[0]._id;
        setSelectedRoomId(roomId);
        localStorage.setItem('currentRoomId', roomId);
      } catch (error) {
        console.error('Error fetching rooms in sidebar:', error);
      }
    };

    fetchRooms();
  }, []);

  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    localStorage.setItem('currentRoomId', roomId);
    window.dispatchEvent(new CustomEvent('room-selected', { detail: { roomId } }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        {rooms.length > 0 && (
          <div className="sidebar-room-switch">
            <label htmlFor="sidebar-room-selector">Phòng hiện tại</label>
            <select
              id="sidebar-room-selector"
              value={selectedRoomId}
              onChange={(e) => handleRoomChange(e.target.value)}
            >
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="menu-badge">{unreadCount}</span>
              )}
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
