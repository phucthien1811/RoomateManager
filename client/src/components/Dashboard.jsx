import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUsers,
  faDollarSign,
  faStar,
  faBell,
  faCog,
  faPlus,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import StatCard from './StatCard.jsx';
import RoomCard from './RoomCard.jsx';
import MemberItem from './MemberItem.jsx';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    // Mock data - replace with API calls
    setStats({
      roomCount: 5,
      roomChange: '+12% so với tháng trước',
      memberCount: 18,
      memberChange: '+3 thành viên',
      expense: '3.8M',
      expenseChange: '-18% so với tháng trước',
      pendingCount: 3,
      pendingChange: 'Chờ xác nhận',
    });

    setRooms([
      {
        id: 1,
        name: 'Trần Hùng Đạo',
        location: 'Trần Hùng Đạo',
        members: 4,
        cost: '850K',
        status: 'Active',
        icon: faHome,
        color: 'purple',
      },
      {
        id: 2,
        name: 'An Dương Vương',
        location: 'An Dương Vương',
        members: 5,
        cost: '1.2M',
        status: 'Active',
        icon: faHome,
        color: 'pink',
      },
      {
        id: 3,
        name: 'Lạc Long Quân',
        location: 'Lạc Long Quân',
        members: 6,
        cost: '1.8M',
        status: 'Active',
        icon: faHome,
        color: 'cyan',
      },
    ]);

    setMembers([
      {
        id: 1,
        name: 'Duy Nguyễn',
        email: 'duynguyen@email.com',
        avatar: 'DN',
        role: 'Chủ phòng',
        action: 'Chủ phòng',
      },
      {
        id: 2,
        name: 'Iris',
        email: 'iris@email.com',
        avatar: 'IR',
        role: 'Thành viên',
        action: 'Thành viên',
      },
      {
        id: 3,
        name: 'An Phạm',
        email: 'anpham@email.com',
        avatar: 'AP',
        role: 'Thành viên',
        action: 'Thành viên',
      },
    ]);
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <button className="btn-notification">
            <FontAwesomeIcon icon={faBell} />
          </button>
          <button className="btn-settings">
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.roomCount && <StatCard title="Phòng Đang Quản Lý" value={stats.roomCount} change={stats.roomChange} icon={faHome} color="purple" />}
        {stats.memberCount && <StatCard title="Tổng Thành Viên" value={stats.memberCount} change={stats.memberChange} icon={faUsers} color="pink" />}
        {stats.expense && <StatCard title="Chi Phí Tháng Này" value={stats.expense} change={stats.expenseChange} icon={faDollarSign} color="cyan" />}
        {stats.pendingCount && <StatCard title="Chưa Thanh Toán" value={stats.pendingCount} change={stats.pendingChange} icon={faStar} color="orange" />}
      </div>

      <div className="dashboard-content">
        <div className="section">
          <div className="section-header">
            <h2>Phòng Đang Có</h2>
            <button className="btn-add">
              <FontAwesomeIcon icon={faPlus} /> Thêm Phòng Mới
            </button>
          </div>
          <div className="rooms-grid">
            {rooms.map((room) => (
              <RoomCard key={room.id} {...room} />
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Thành Viên Gần Đây</h2>
          </div>
          <div className="members-list">
            {members.map((member) => (
              <MemberItem key={member.id} {...member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
