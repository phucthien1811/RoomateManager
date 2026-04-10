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
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import StatCard from './StatCard.jsx';
import RoomCard from './RoomCard.jsx';
import MemberItem from './MemberItem.jsx';
import reportService from '../services/report.service.js';
import roomService from '../services/room.service.js';
import memberService from '../services/member.service.js';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner: '',
    monthlyRent: '',
  });
  const [memberRows, setMemberRows] = useState([{ email: '', name: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch rooms
        const roomsData = await roomService.getRooms();
        const formattedRooms = roomsData.map((room, index) => {
          const colors = ['purple', 'pink', 'cyan', 'blue', 'green'];
          return {
            id: room._id,
            name: room.name,
            location: room.location || room.address || '',
            members: room.members?.length || 0,
            cost: room.monthlyRent || room.cost || '',
            status: room.status || 'Active',
            icon: faHome,
            color: colors[index % colors.length],
          };
        });
        setRooms(formattedRooms);

        // Calculate stats from rooms data
        setStats({
          roomCount: roomsData.length,
          roomChange: roomsData.length > 0 ? '+' + roomsData.length : '0',
          memberCount: roomsData.reduce((sum, room) => sum + (room.members?.length || 0), 0),
          memberChange: 'Thành viên',
          expense: '0',
          expenseChange: 'Tháng này',
          pendingCount: 0,
          pendingChange: 'Chờ xác nhận',
        });

        // Fetch members from first room if available
        if (roomsData.length > 0) {
          const currentRoom = roomsData[0];
          try {
            const membersData = await roomService.getRoomMembers(currentRoom._id);
            const formattedMembers = membersData.slice(0, 3).map((member) => ({
              id: member._id,
              name: member.name,
              email: member.email,
              avatar: member.name?.substring(0, 2).toUpperCase() || 'U',
              role: member.role || 'Thành viên',
              action: member.role || 'Thành viên',
            }));
            setMembers(formattedMembers);
            localStorage.setItem('currentRoomId', currentRoom._id);
          } catch (err) {
            console.error('Error fetching members:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err.message || 'Lỗi khi tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOpenModal = () => {
    setFormData({ name: '', address: '', owner: '', monthlyRent: '' });
    setMemberRows([{ email: '', name: '' }]);
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', address: '', owner: '', monthlyRent: '' });
    setMemberRows([{ email: '', name: '' }]);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMemberRowChange = (index, field, value) => {
    const newRows = [...memberRows];
    newRows[index][field] = value;
    setMemberRows(newRows);
  };

  const handleAddMemberRow = () => {
    setMemberRows([...memberRows, { email: '', name: '' }]);
  };

  const handleRemoveMemberRow = (index) => {
    if (memberRows.length > 1) {
      setMemberRows(memberRows.filter((_, i) => i !== index));
    }
  };

  const handleSaveRoom = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      setError('');
      const newRoom = {
        name: formData.name,
        address: formData.address,
        location: formData.address,
        owner: formData.owner,
        monthlyRent: parseInt(formData.monthlyRent) || 0,
      };
      const createdRoom = await roomService.createRoom(newRoom);

      if (createdRoom && (createdRoom._id || createdRoom.id)) {
        localStorage.setItem('currentRoomId', createdRoom._id || createdRoom.id);

        // Thêm các thành viên mới 
        const validMembers = memberRows.filter(m => m.email.trim());
        if (validMembers.length > 0) {
          for (const member of validMembers) {
            try {
              await memberService.addMember(createdRoom._id || createdRoom.id, member);
            } catch (err) {
              console.error('Error adding member:', err);
            }
          }
        }
      }

      // Reload dashboard
      window.location.reload();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving room:', err);
      setError(err.message || 'Lỗi khi tạo phòng');
    } finally {
      setSubmitting(false);
    }
  };

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
            <button className="btn-add" onClick={handleOpenModal}>
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

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo Phòng Mới</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="error-message" style={{ marginBottom: '15px' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="name">Tên Phòng</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="VD: Trần Hùng Đạo"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Địa Chỉ</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="VD: 123 Trần Hùng Đạo, Q1, TP.HCM"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="owner">Chủ Phòng</label>
                <input
                  type="text"
                  id="owner"
                  name="owner"
                  value={formData.owner}
                  onChange={handleInputChange}
                  placeholder="Tên chủ phòng"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="monthlyRent">Tiền Thuê / Tháng (VND)</label>
                <input
                  type="number"
                  id="monthlyRent"
                  name="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={handleInputChange}
                  placeholder="VD: 3400000"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Thêm Thành Viên Mới (Tùy Chọn)</label>
                {memberRows.map((row, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr auto auto',
                      gap: '8px',
                      marginBottom: '10px'
                    }}
                  >
                    <input
                      type="email"
                      value={row.email}
                      onChange={(e) => handleMemberRowChange(index, 'email', e.target.value)}
                      placeholder="Email thành viên"
                      disabled={submitting}
                    />
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleMemberRowChange(index, 'name', e.target.value)}
                      placeholder="Tên (tùy chọn)"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      onClick={handleAddMemberRow}
                      disabled={submitting}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        minWidth: '70px'
                      }}
                    >
                      + Thêm
                    </button>
                    {memberRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMemberRow(index)}
                        disabled={submitting}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          minWidth: '70px'
                        }}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                className="btn-submit"
                onClick={handleSaveRoom}
                disabled={submitting}
              >
                {submitting ? 'Đang tạo...' : 'Tạo Phòng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
