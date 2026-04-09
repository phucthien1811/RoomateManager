import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faUsers,
  faMapMarkerAlt,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/room.management.css';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([
    {
      id: 1,
      name: 'Trần Hùng Đạo',
      address: '123 Trần Hùng Đạo, Q1, TP.HCM',
      members: 4,
      owner: 'Duy Nguyễn',
      monthlyRent: 3400000,
      status: 'active',
    },
    {
      id: 2,
      name: 'An Dương Vương',
      address: '456 An Dương Vương, Q5, TP.HCM',
      members: 5,
      owner: 'Hoa Trần',
      monthlyRent: 4500000,
      status: 'active',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    owner: '',
    monthlyRent: '',
  });
  const [editingId, setEditingId] = useState(null);

  const handleOpenModal = (type, room = null) => {
    setModalType(type);
    if (type === 'edit' && room) {
      setFormData({
        name: room.name,
        address: room.address,
        owner: room.owner,
        monthlyRent: room.monthlyRent,
      });
      setEditingId(room.id);
    } else {
      setFormData({ name: '', address: '', owner: '', monthlyRent: '' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', address: '', owner: '', monthlyRent: '' });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveRoom = () => {
    if (modalType === 'create') {
      const newRoom = {
        ...formData,
        id: rooms.length + 1,
        members: 1,
        status: 'active',
        monthlyRent: parseInt(formData.monthlyRent) || 0,
      };
      setRooms([...rooms, newRoom]);
    } else if (modalType === 'edit') {
      setRooms(
        rooms.map((room) =>
          room.id === editingId
            ? {
                ...room,
                ...formData,
                monthlyRent: parseInt(formData.monthlyRent) || room.monthlyRent,
              }
            : room
        )
      );
    }
    handleCloseModal();
  };

  const handleDeleteRoom = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      setRooms(rooms.filter((room) => room.id !== id));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
        >
          <FontAwesomeIcon icon={faPlus} /> Tạo Phòng Mới
        </button>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
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
                  onClick={() => handleDeleteRoom(room.id)}
                  title="Xóa"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>

            <div className="room-card-body">
              <div className="room-info-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="info-icon" />
                <span className="info-text">{room.address}</span>
              </div>

              <div className="room-info-item">
                <FontAwesomeIcon icon={faUser} className="info-icon" />
                <span className="info-text">Chủ phòng: {room.owner}</span>
              </div>

              <div className="room-info-item">
                <FontAwesomeIcon icon={faUsers} className="info-icon" />
                <span className="info-text">{room.members} thành viên</span>
              </div>

              <div className="room-rent-divider"></div>

              <div className="room-rent-info">
                <span className="rent-label">💰 Tiền thuê / tháng</span>
                <span className="rent-value">
                  {formatCurrency(room.monthlyRent)}
                </span>
              </div>

              <div className="room-status">
                <span
                  className={`status-badge status-${room.status}`}
                >
                  {room.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>

            <div className="room-card-footer">
              <button className="btn-manage-members">Quản lý thành viên</button>
            </div>
          </div>
        ))}
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
              <div className="form-group">
                <label htmlFor="name">Tên Phòng</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="VD: Trần Hùng Đạo"
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
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
              >
                Hủy
              </button>
              <button
                className="btn-submit"
                onClick={handleSaveRoom}
              >
                {modalType === 'create' ? 'Tạo Phòng' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
