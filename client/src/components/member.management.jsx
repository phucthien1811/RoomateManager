import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faEnvelope,
  faPhone,
  faCrown,
} from '@fortawesome/free-solid-svg-icons';
import memberService from '../services/member.service.js';
import roomService from '../services/room.service.js';
import PageHeader from './PageHeader.jsx';
import '../styles/member.management.css';

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Thành viên',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');

  useEffect(() => {
    fetchRooms();
    fetchMembers(selectedRoomId);

    const handleRoomSelected = (event) => {
      const roomId = event.detail?.roomId || localStorage.getItem('currentRoomId') || '';
      setSelectedRoomId(roomId);
      fetchMembers(roomId);
    };

    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  const fetchMembers = async (roomIdOverride) => {
    try {
      setLoading(true);
      setError('');
      const roomId = roomIdOverride || localStorage.getItem('currentRoomId');
      const currentRoom = rooms.find((room) => room._id === roomId);
      if (roomId) {
        const data = await memberService.getMembers(roomId);
        const formattedMembers = data.map((member) => ({
          id: member._id || member.user?._id,
          _id: member._id || member.user?._id,
          name: member.name || member.user?.name || '',
          email: member.email || member.user?.email || '',
          phone: member.phone || member.user?.phone || '',
          room: member.room?.name || currentRoom?.name || 'Phòng hiện tại',
          roomId,
          role: member.role || 'Thành viên',
          status: member.status || 'active',
          joinDate: member.createdAt || member.joinedAt || new Date().toISOString(),
          totalDebt: member.totalDebt || 0,
        }));
        setMembers(formattedMembers);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Lỗi khi tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await roomService.getRooms();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };

  const handleOpenModal = (type, member = null) => {
    setModalType(type);
    setError('');
    if (type === 'edit' && member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
      });
      setEditingId(member._id || member.id);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Thành viên',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Thành viên',
    });
    setEditingId(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveMember = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      setError('');
      const roomId = localStorage.getItem('currentRoomId');
      
      if (modalType === 'create') {
        const newMember = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        };
        if (roomId) {
          await memberService.addMember(roomId, newMember);
        }
      } else if (modalType === 'edit') {
        const currentRoomId = localStorage.getItem('currentRoomId');
        const updates = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          roomId: currentRoomId,
        };
        await memberService.updateMember(editingId, updates);
      }
      
      // Refresh members list
      await fetchMembers();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving member:', err);
      setError(err.message || 'Lỗi khi lưu thành viên');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      try {
        const roomId = localStorage.getItem('currentRoomId');
        if (roomId) {
          await memberService.removeMember(roomId, id);
          await fetchMembers();
        }
      } catch (err) {
        console.error('Error deleting member:', err);
        alert('Lỗi khi xóa thành viên: ' + (err.message || 'Vui lòng thử lại'));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="member-management">
      <PageHeader 
        title="Quản Lý Thành Viên"
        actions={
          <button
            className="btn-add-member"
            onClick={() => handleOpenModal('create')}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faPlus} /> Thêm Thành Viên
          </button>
        }
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="members-table-container">
        {loading ? (
          <div className="loading-message">Đang tải dữ liệu...</div>
        ) : members.length === 0 ? (
          <div className="empty-message">Chưa có thành viên nào.</div>
        ) : (
          <table className="members-table">
            <thead>
              <tr>
                <th>Tên Thành Viên</th>
                <th>Email</th>
                <th>Điện Thoại</th>
                <th>Phòng</th>
                <th>Vai Trò</th>
                <th>Nợ Tiền</th>
                <th>Trạng Thái</th>
                <th>Ngày Tham Gia</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id || member.id} className="member-row">
                  <td className="member-name">
                    <div className="name-cell">
                      <div className="member-avatar">{member.name.charAt(0)}</div>
                      <div>
                        <div className="member-full-name">{member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell">
                      <FontAwesomeIcon icon={faEnvelope} /> {member.email}
                    </div>
                  </td>
                  <td>
                    <div className="phone-cell">
                      <FontAwesomeIcon icon={faPhone} /> {member.phone || 'N/A'}
                    </div>
                  </td>
                  <td>{member.room || 'N/A'}</td>
                  <td>
                    <div className="role-cell">
                      {member.role === 'Chủ phòng' && (
                        <FontAwesomeIcon icon={faCrown} className="role-icon" />
                      )}
                      {member.role}
                    </div>
                  </td>
                  <td>
                    <div
                      className={`debt-cell ${
                        member.totalDebt > 0 ? 'has-debt' : 'no-debt'
                      }`}
                    >
                      {member.totalDebt > 0 ? formatCurrency(member.totalDebt) : '✓'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(member.status)}`}>
                      {member.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(member.joinDate)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-table-action edit"
                        onClick={() => handleOpenModal('edit', member)}
                        title="Chỉnh sửa"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-table-action delete"
                        onClick={() => handleDeleteMember(member._id || member.id)}
                        title="Xóa"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {modalType === 'create'
                  ? 'Thêm Thành Viên Mới'
                  : 'Chỉnh Sửa Thành Viên'}
              </h2>
              <button
                className="btn-close-modal"
                onClick={handleCloseModal}
              >
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
                <label htmlFor="name">Tên Thành Viên</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên thành viên"
                  disabled={submitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Điện Thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="090xxxxxxxx"
                    disabled={submitting}
                  />
                </div>
              </div>

              {modalType === 'edit' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Vai Trò</label>
                    <input id="role" name="role" value={formData.role} disabled />
                  </div>
                </div>
              )}
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
                onClick={handleSaveMember}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : modalType === 'create' ? 'Thêm Thành Viên' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
