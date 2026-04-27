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
  faDoorOpen,
  faExclamationCircle,
  faCheckCircle,
  faHome,
} from '@fortawesome/free-solid-svg-icons';
import roomService from '../services/room.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/room.management.css';

const copyText = async (value) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error('COPY_FAILED');
  }
};

const RoomManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('myRooms');
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

  // Join room state
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joining, setJoining] = useState(false);

  const getEntityId = (entity) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return entity._id || entity.id || '';
  };

  const currentUserId = String(user?.id || user?._id || '');

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
        if (createdRoom && (createdRoom._id || createdRoom.id)) {
          localStorage.setItem('currentRoomId', createdRoom._id || createdRoom.id);
        }

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
      await copyText(roomCode);
      const roomId = room._id || room.id;
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 1500);
    } catch (err) {
      setError('Không thể sao chép mã phòng. Hãy dùng HTTPS hoặc cấp quyền clipboard cho trình duyệt.');
    }
  };

  const handleLeaveRoom = async (room) => {
    const roomId = room?._id || room?.id;
    if (!roomId) return;

    if (!window.confirm('Bạn có chắc chắn muốn rời khỏi phòng này?')) {
      return;
    }

    try {
      await roomService.leaveRoom(roomId);
      const selectedRoomId = localStorage.getItem('currentRoomId') || '';
      await fetchRooms();

      if (selectedRoomId && selectedRoomId === roomId) {
        const latestRooms = await roomService.getRooms();
        const fallbackRoomId = latestRooms?.[0]?._id || latestRooms?.[0]?.id || '';
        if (fallbackRoomId) {
          localStorage.setItem('currentRoomId', fallbackRoomId);
        } else {
          localStorage.removeItem('currentRoomId');
        }
        window.dispatchEvent(new CustomEvent('room-selected', { detail: { roomId: fallbackRoomId } }));
      }
    } catch (err) {
      setError(err.message || 'Không thể rời phòng');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) {
      setJoinError('Vui lòng nhập mã phòng');
      return;
    }
    if (joinCode.trim().length < 4) {
      setJoinError('Mã phòng không hợp lệ (tối thiểu 4 ký tự)');
      return;
    }
    setJoining(true);
    try {
      const result = await roomService.joinRoom(joinCode.trim());
      const joinedRoom = result?.room;
      setJoinSuccess(true);
      if (joinedRoom?._id) {
        localStorage.setItem('currentRoomId', joinedRoom._id);
        window.dispatchEvent(new CustomEvent('room-selected', { detail: { roomId: joinedRoom._id } }));
        window.dispatchEvent(new CustomEvent('room-joined', { detail: { roomId: joinedRoom._id } }));
      }
      setTimeout(() => {
        setJoinSuccess(false);
        setJoinCode('');
        setActiveTab('myRooms');
        fetchRooms();
      }, 1500);
    } catch (err) {
      if (err.status === 409 || err.status === 400) {
        setJoinError('Bạn đã là thành viên của phòng này');
      } else if (err.status === 404) {
        setJoinError('Mã phòng không tồn tại. Vui lòng kiểm tra lại.');
      } else {
        setJoinError(err.message || 'Mã phòng không tồn tại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="room-management">
      <div className="room-management-tabs">
        <button
          className={`rm-tab ${activeTab === 'myRooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('myRooms')}
        >
          <FontAwesomeIcon icon={faHome} /> Phòng Của Tôi
        </button>
        <button
          className={`rm-tab ${activeTab === 'joinRoom' ? 'active' : ''}`}
          onClick={() => { setActiveTab('joinRoom'); setJoinError(''); setJoinSuccess(false); }}
        >
          <FontAwesomeIcon icon={faDoorOpen} /> Tham Gia Phòng
        </button>
        {activeTab === 'myRooms' && (
          <button
            className="btn-create-room"
            onClick={() => handleOpenModal('create')}
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faPlus} /> Tạo Phòng Mới
          </button>
        )}
      </div>

      {activeTab === 'myRooms' && (
        <>
          {error && <div className="error-message">{error}</div>}
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
                      {String(getEntityId(room.owner)) === currentUserId ? (
                        <>
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
                        </>
                      ) : (
                        <button
                          className="btn-action leave"
                          onClick={() => handleLeaveRoom(room)}
                          title="Rời phòng"
                        >
                          <FontAwesomeIcon icon={faDoorOpen} />
                        </button>
                      )}
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
                      <span className={`status-badge status-${room.status || 'active'}`}>
                        {room.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'joinRoom' && (
        <div className="join-room-panel">
          <div className="join-room-panel-inner">
            <div className="join-room-panel-icon">
              <FontAwesomeIcon icon={faDoorOpen} />
            </div>
            <h2>Tham Gia Phòng</h2>
            <p>Nhập mã phòng được cấp bởi chủ phòng để tham gia</p>

            {joinError && (
              <div className="alert alert-error">
                <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
                <span>{joinError}</span>
              </div>
            )}
            {joinSuccess && (
              <div className="alert alert-success">
                <FontAwesomeIcon icon={faCheckCircle} className="alert-icon" />
                <span>Tham gia phòng thành công! Đang chuyển hướng...</span>
              </div>
            )}

            <form onSubmit={handleJoinRoom} className="join-room-panel-form">
              <div className="form-group">
                <label htmlFor="joinCode">Mã Phòng</label>
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faKey} className="input-icon" />
                  <input
                    type="text"
                    id="joinCode"
                    className="form-input"
                    placeholder="Nhập mã phòng (VD: ROOM01)"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
                    disabled={joining}
                    autoComplete="off"
                  />
                </div>
              </div>
              <button type="submit" className="btn-submit" disabled={joining}>
                {joining ? <span className="spinner-sm"></span> : <><FontAwesomeIcon icon={faDoorOpen} /> Tham Gia</>}
              </button>
            </form>

            <p className="join-room-hint">Chưa có mã phòng? Liên hệ chủ phòng để được cấp mã truy cập.</p>
          </div>
        </div>
      )}

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
