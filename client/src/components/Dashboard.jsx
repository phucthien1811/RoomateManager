import React, { useState, useEffect } from 'react';
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
import StatCard from './StatCard';
import RoomCard from './RoomCard';
import MemberItem from './MemberItem';
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
          <div className="user-avatar">DN</div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="stats-section">
        <StatCard
          title="Phòng quản lý"
          value={stats.roomCount}
          change={stats.roomChange}
          icon={faHome}
          color="blue"
        />
        <StatCard
          title="Tổng thành viên"
          value={stats.memberCount}
          change={stats.memberChange}
          icon={faUsers}
          color="pink"
        />
        <StatCard
          title="Chi tiêu tháng này"
          value={stats.expense}
          change={stats.expenseChange}
          icon={faDollarSign}
          color="orange"
        />
        <StatCard
          title="Chờ xác nhận"
          value={stats.pendingCount}
          change={stats.pendingChange}
          icon={faStar}
          color="cyan"
        />
      </div>

      {/* Rooms and Members Section */}
      <div className="content-section">
        {/* Left Column - Rooms */}
        <div className="left-column">
          <h2 className="section-title">Phòng của bạn</h2>
          <button className="btn-add-room">
            <FontAwesomeIcon icon={faPlus} /> Phòng mới
          </button>
          
          <div className="rooms-list">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                name={room.name}
                location={room.location}
                members={room.members}
                cost={room.cost}
                status={room.status}
                icon={room.icon}
                color={room.color}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Members */}
        <div className="right-column">
          <h2 className="section-title">Thành viên gần đây</h2>
          
          <div className="members-list">
            {members.map((member) => (
              <MemberItem
                key={member.id}
                name={member.name}
                email={member.email}
                avatar={member.avatar}
                role={member.role}
                action={member.action}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
