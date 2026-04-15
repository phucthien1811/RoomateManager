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
  faKey,
  faCopy,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import roomService from '../services/room.service.js';
import '../styles/room.management.css';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState(null);

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
      });
      setEditingId(room._id || room.id);
    } else {
      setFormData({ name: '', address: '' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', address: '' });
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
        };
        const createdRoom = await roomService.createRoom(newRoom);
        // Lưu room ID để dùng ở các component khác
        if (createdRoom && (createdRoom._id || createdRoom.id)) {
          localStorage.setItem('currentRoomId', createdRoom._id || createdRoom.id);
        }
        const createdRoomName = createdRoom?.name || formData.name;
        const createdRoomCode = createdRoom?.code || createdRoom?.inviteCode || '---';
        const successMessage = `Bạn vừa tạo phòng ${createdRoomName} thành công, mã phòng là ${createdRoomCode}`;
        window.dispatchEvent(
          new CustomEvent('app-notification', {
            detail: {
              type: 'success',
              title: 'Tạo phòng thành công',
              message: successMessage,
            },
          })
        );
      } else if (modalType === 'edit') {
        const updates = {
          name: formData.name,
          address: formData.address,
          location: formData.address,
        };
        await roomService.updateRoom(editingId, updates);
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

  const handleCopyRoomCode = async (room) => {
    const roomCode = room.code || room.inviteCode;
    if (!roomCode) return;

    try {
      await navigator.clipboard.writeText(roomCode);
      const roomId = room._id || room.id;
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 1500);
    } catch (err) {
      setError('Không thể sao chép mã phòng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="room-management">
      <div className="room-management-header">
        <div className="header-content">
          <h1>Quản Lý Phòng</h1>
          <p>Tạo phòng với tên + địa chỉ, thành viên tham gia bằng mã phòng</p>
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

                <div className="room-info-item room-code-item">
                  <FontAwesomeIcon icon={faKey} className="info-icon" />
                  <div className="room-code-content">
                    <span className="info-text">
                      Mã phòng: <strong>{room.code || room.inviteCode || '---'}</strong>
                    </span>
                    <button
                      type="button"
                      className={`btn-copy-code ${copiedRoomId === (room._id || room.id) ? 'copied' : ''}`}
                      onClick={() => handleCopyRoomCode(room)}
                      disabled={!(room.code || room.inviteCode)}
                      title="Sao chép mã phòng"
                    >
                      <FontAwesomeIcon icon={copiedRoomId === (room._id || room.id) ? faCheck : faCopy} />
                      {copiedRoomId === (room._id || room.id) ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div className="room-status">
                  <span
                    className={`status-badge status-${room.status || 'active'}`}
                  >
                    {room.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
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
              {modalType === 'create' && (
                <div className="form-group">
                  <p className="create-room-note">
                    Chủ phòng sẽ mặc định là tài khoản đang đăng nhập. Sau khi tạo phòng, thành viên tham gia bằng mã phòng.
                  </p>
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
