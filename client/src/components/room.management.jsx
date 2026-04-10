import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faUsers,
  faMapMarkerAlt,
  faUser,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import roomService from '../services/room.service.js';
import memberService from '../services/member.service.js';
import '../styles/room.management.css';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner: '',
    monthlyRent: '',
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [memberRows, setMemberRows] = useState([{ email: '', name: '' }]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await roomService.getRooms();
      setRooms(data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Lỗi khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, room = null) => {
    setModalType(type);
    setError('');
    if (type === 'edit' && room) {
      setFormData({
        name: room.name,
        address: room.address || room.location || '',
        owner: typeof room.owner === 'object' ? room.owner?._id : room.owner || '',
        monthlyRent: room.monthlyRent || room.monthlyRent || '',
      });
      // Set selected members for edit mode
      if (room.members && Array.isArray(room.members)) {
        setSelectedMembers(
          room.members.map(m => typeof m === 'object' ? m._id : m)
        );
      }
      setMemberRows([{ email: '', name: '' }]);
      setEditingId(room._id || room.id);
    } else {
      setFormData({ name: '', address: '', owner: '', monthlyRent: '' });
      setSelectedMembers([]);
      setMemberRows([{ email: '', name: '' }]);
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', address: '', owner: '', monthlyRent: '' });
    setSelectedMembers([]);
    setMemberRows([{ email: '', name: '' }]);
    setEditingId(null);
    setError('');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveRoom = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      setError('');
      if (modalType === 'create') {
        const newRoom = {
          name: formData.name,
          address: formData.address,
          location: formData.address,
          owner: formData.owner,
          monthlyRent: parseInt(formData.monthlyRent) || 0,
        };
        const createdRoom = await roomService.createRoom(newRoom);
        // Lưu room ID để dùng ở các component khác
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
      } else if (modalType === 'edit') {
        const updates = {
          name: formData.name,
          address: formData.address,
          location: formData.address,
          owner: formData.owner,
          monthlyRent: parseInt(formData.monthlyRent) || 0,
        };
        await roomService.updateRoom(editingId, updates);
        
        // Thêm các thành viên mới nếu có
        const validMembers = memberRows.filter(m => m.email.trim());
        if (validMembers.length > 0) {
          for (const member of validMembers) {
            try {
              await memberService.addMember(editingId, member);
            } catch (err) {
              console.error('Error adding member:', err);
            }
          }
        }
      }
      // Refresh rooms list
      await fetchRooms();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving room:', err);
      setError(err.message || 'Lỗi khi lưu phòng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      try {
        await roomService.deleteRoom(id);
        await fetchRooms();
      } catch (err) {
        console.error('Error deleting room:', err);
        alert('Lỗi khi xóa phòng: ' + (err.message || 'Vui lòng thử lại'));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="room-management">
      <div className="room-management-header">
        <div className="header-content">
          <h1>Quản Lý Phòng</h1>
          <p>Quản lý thông tin phòng trọ và thành viên</p>
        </div>
        <button
          className="btn-create-room"
          onClick={() => handleOpenModal('create')}
          disabled={submitting}
        >
          <FontAwesomeIcon icon={faPlus} /> Tạo Phòng Mới
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="rooms-grid">
        {loading ? (
          <div className="loading-message">Đang tải dữ liệu...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-message">Chưa có phòng nào. Tạo phòng mới để bắt đầu.</div>
        ) : (
          rooms.map((room) => (
            <div key={room._id || room.id} className="room-card">
              <div className="room-card-header">
                <h3 className="room-name">{room.name}</h3>
                <div className="room-actions">
                  <button
                    className="btn-action edit"
                    onClick={() => handleOpenModal('edit', room)}
                    title="Chỉnh sửa"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    className="btn-action delete"
                    onClick={() => handleDeleteRoom(room._id || room.id)}
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className="room-card-body">
                <div className="room-info-item">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                  <span className="info-text">{room.address || room.location}</span>
                </div>

                <div className="room-info-item">
                  <FontAwesomeIcon icon={faUser} className="info-icon" />
                  <span className="info-text">Chủ phòng: {typeof room.owner === 'object' ? room.owner?.name : room.owner || 'Chưa gán'}</span>
                </div>

                <div className="room-info-item">
                  <FontAwesomeIcon icon={faUsers} className="info-icon" />
                  <span className="info-text">{room.members?.length || 0} thành viên</span>
                </div>

                <div className="room-rent-divider"></div>

                <div className="room-rent-info">
                  <span className="rent-label">
                    <FontAwesomeIcon icon={faMoneyBillWave} /> Tiền thuê / tháng
                  </span>
                  <span className="rent-value">
                    {formatCurrency(room.monthlyRent || 0)}
                  </span>
                </div>

                <div className="room-status">
                  <span
                    className={`status-badge status-${room.status || 'active'}`}
                  >
                    {room.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>

              <div className="room-card-footer">
                <button className="btn-manage-members">Quản lý thành viên</button>
              </div>
            </div>
          ))
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
                {modalType === 'create' ? 'Tạo Phòng Mới' : 'Chỉnh Sửa Phòng'}
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
                <label>{modalType === 'create' ? 'Thêm Thành Viên Mới' : 'Thêm Thành Viên Mới'} (Tùy Chọn)</label>
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
                {submitting ? 'Đang lưu...' : modalType === 'create' ? 'Tạo Phòng' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
