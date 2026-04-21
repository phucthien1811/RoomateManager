import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorOpen,
  faKey,
  faUser,
  faExclamationCircle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import roomService from '../services/room.service.js';
import '../styles/join-room.css';

const JoinRoom = ({ onJoinRoom, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    roomCode: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.roomCode.trim()) {
      setError('Vui lòng nhập mã phòng');
      return;
    }

    // Validation: mã phòng phải đúng định dạng
    if (formData.roomCode.length < 4) {
      setError('Mã phòng không hợp lệ (tối thiểu 4 ký tự)');
      return;
    }

    setLoading(true);

    try {
      // Call API to join room
      const result = await roomService.joinRoom(formData.roomCode);
      const joinedRoom = result?.room;
      
      setSuccess(true);
      if (joinedRoom?._id) {
        localStorage.setItem('currentRoomId', joinedRoom._id);
        window.dispatchEvent(new CustomEvent('room-selected', { detail: { roomId: joinedRoom._id } }));
        window.dispatchEvent(new CustomEvent('room-joined', { detail: { roomId: joinedRoom._id } }));
      }



      setTimeout(() => {
        onJoinRoom({
          roomCode: formData.roomCode,
          roomId: joinedRoom?._id || joinedRoom?.roomId || result.roomId || result._id,
          roomName: joinedRoom?.name || '',
          userName: currentUser?.name || 'Thành viên mới',
          joinedDate: new Date().toISOString(),
        });
      }, 1000);
    } catch (err) {
      console.error('Error joining room:', err);
      const errorMessage = err.message || 'Mã phòng không tồn tại. Vui lòng kiểm tra lại.';
      
      if (err.status === 409 || err.status === 400) {
        setError('Bạn đã là thành viên của phòng này');
      } else if (err.status === 404) {
        setError('Mã phòng không tồn tại. Vui lòng kiểm tra lại.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-room-container">
      <div className="join-room-wrapper">
        <div className="join-room-card">
          {/* Header */}
          <div className="join-room-header">
            <div className="join-room-icon">
              <FontAwesomeIcon icon={faDoorOpen} />
            </div>
            <h1>Tham Gia Phòng</h1>
            <p>Nhập mã phòng để tham gia cộng đồng nhà ở của bạn</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="join-room-form">
            {/* Current User Info */}
            {currentUser && (
              <div className="current-user-info">
                <div className="user-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <div className="user-details">
                  <span className="user-label">Đăng nhập với:</span>
                  <span className="user-name">{currentUser.name}</span>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error">
                <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="alert alert-success">
                <FontAwesomeIcon icon={faCheckCircle} className="alert-icon" />
                <span>Tham gia phòng thành công! Đang chuyển hướng...</span>
              </div>
            )}

            {/* Room Code Input */}
            <div className="form-group">
              <label htmlFor="roomCode">Mã Phòng</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faKey} className="input-icon" />
                <input
                  type="text"
                  id="roomCode"
                  name="roomCode"
                  className="form-input"
                  placeholder="Nhập mã phòng (VD: ROOM01)"
                  value={formData.roomCode}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={onCancel}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  'Tham Gia'
                )}
              </button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="join-room-footer">
            <p className="footer-title">Chưa có mã phòng?</p>
            <p className="footer-text">Liên hệ chủ phòng hoặc quản lý phòng để được cấp mã truy cập</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
