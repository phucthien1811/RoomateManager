import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faHome,
  faUsers,
  faFileAlt,
  faTasks,
  faChartBar,
  faPiggyBank,
  faDoorOpen,
  faCalendarAlt,
  faCalendarCheck,
  faBullhorn,
} from '@fortawesome/free-solid-svg-icons';
import roomService from '../services/room.service.js';
import '../styles/sidebar.css';

const Sidebar = ({ activeMenu, setActiveMenu }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: faChartLine },
    { id: 'rooms', label: 'Phòng', icon: faDoorOpen },
    { id: 'members', label: 'Thành Viên', icon: faUsers },
    { id: 'bills', label: 'Hóa Đơn', icon: faFileAlt },
    { id: 'absence', label: 'Vắng Mặt', icon: faCalendarAlt },
    { id: 'duties', label: 'Lịch Trực Nhật', icon: faCalendarCheck },
    { id: 'newsfeed', label: 'Bảng Tin Nội Bộ', icon: faBullhorn },
    { id: 'tasks', label: 'Công Việc Chung', icon: faTasks },
    { id: 'expenses', label: 'Quỹ Tiền Chung', icon: faPiggyBank },
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

    const handleRoomJoined = () => {
      fetchRooms();
    };

    window.addEventListener('room-joined', handleRoomJoined);
    return () => window.removeEventListener('room-joined', handleRoomJoined);
  }, []);

  const handleRoomChange = (roomId) => {
    setSelectedRoomId(roomId);
    localStorage.setItem('currentRoomId', roomId);
    window.dispatchEvent(new CustomEvent('room-selected', { detail: { roomId } }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-text-three">THREE</span>
          <span className="logo-text-am">AM</span>
        </div>
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
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
