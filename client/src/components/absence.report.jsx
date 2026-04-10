import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCalendarAlt,
  faTrash,
  faTimes,
  faClock,
  faCheckCircle,
  faExclamationCircle,
  faFilter,
  faBriefcase,
  faHome,
  faHeartPulse,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import absenceService from '../services/absence.service.js';
import roomService from '../services/room.service.js';
import '../styles/absence.report.css';

const AbsenceReport = () => {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    room_id: '',
    startDate: '',
    endDate: '',
    reason: '',
    note: '',
  });

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch reports when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      fetchReports();
    }
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await absenceService.getAbsenceReports(selectedRoomId);
      // Ensure data is always an array
      const reportsArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      setReports(reportsArray);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Lỗi khi tải danh sách báo cáo');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      room_id: selectedRoomId,
      startDate: '',
      endDate: '',
      reason: '',
      note: '',
    });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitReport = async () => {
    if (!formData.room_id || !formData.startDate || !formData.endDate || !formData.reason) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    // Wait for auth to load
    if (authLoading) {
      setError('Đang xác thực, vui lòng chờ...');
      return;
    }

    // Check user exists
    if (!user) {
      setError('Vui lòng đăng nhập lại');
      return;
    }

    // Get user ID (try both field names)
    const userId = user.id || user._id;
    if (!userId) {
      console.error('User object invalid:', user);
      setError('Không thể xác định người dùng (ID missing)');
      return;
    }

    setSubmitting(true);
    try {
      setError('');
      await absenceService.createAbsenceReport({
        room_id: formData.room_id,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        note: formData.note,
        member_id: userId,
      });
      await fetchReports();
      handleCloseModal();
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
      try {
        await absenceService.deleteAbsenceReport(id);
        await fetchReports();
      } catch (err) {
        console.error('Error deleting report:', err);
        alert('Lỗi khi xóa báo cáo');
      }
    }
  };

  const handleApproveReport = async (id) => {
    try {
      await absenceService.approveAbsenceReport(id);
      await fetchReports();
    } catch (err) {
      console.error('Error approving report:', err);
      alert('Lỗi khi phê duyệt báo cáo');
    }
  };

  const handleRejectReport = async (id) => {
    try {
      await absenceService.rejectAbsenceReport(id);
      await fetchReports();
    } catch (err) {
      console.error('Error rejecting report:', err);
      alert('Lỗi khi từ chối báo cáo');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status) => {
    const labels = {
      'Chờ duyệt': 'Chờ duyệt',
      'Đã duyệt': 'Đã duyệt',
      'Từ chối': 'Từ chối',
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    if (status === 'Đã duyệt' || status === 'approved') return faCheckCircle;
    if (status === 'Từ chối' || status === 'rejected') return faExclamationCircle;
    return faClock;
  };

  // Filter reports based on selected status
  const filteredReports = selectedStatus === 'all' 
    ? reports 
    : reports.filter(report => getStatusLabel(report.status) === getStatusLabel(selectedStatus));

  const getStatusClass = (status) => {
    const normalizedStatus = getStatusLabel(status).toLowerCase();
    if (normalizedStatus.includes('duyệt') && !normalizedStatus.includes('từ')) return 'status-approved';
    if (normalizedStatus.includes('từ')) return 'status-rejected';
    return 'status-pending';
  };

  const getReasonIcon = (reason) => {
    const normalizedReason = reason?.toLowerCase() || '';
    if (normalizedReason.includes('công tác')) return faBriefcase;
    if (normalizedReason.includes('quê') || normalizedReason.includes('nhà')) return faHome;
    if (normalizedReason.includes('ốm') || normalizedReason.includes('bệnh') || normalizedReason.includes('khám')) return faHeartPulse;
    return faCalendarAlt;
  };

  return (
    <div className="absence-report-page">
      {/* Header Section */}
      <div className="absence-report-header">
        <div className="header-content">
          <h1>Báo Cáo Vắng Mặt</h1>
          <p>Báo cáo kỳ vắng mặt và theo dõi trạng thái duyệt/phê</p>
        </div>
        <button
          className="btn-create-report"
          onClick={handleOpenModal}
          disabled={submitting}
          title="Thêm báo cáo vắng mặt mới"
        >
          <FontAwesomeIcon icon={faPlus} /> Báo Cáo Vắng Mặt
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <FontAwesomeIcon icon={faExclamationCircle} /> {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="room-select">Chọn phòng:</label>
          <select
            id="room-select"
            className="filter-select"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-select">Chọn trạng thái:</label>
          <select
            id="status-select"
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Từ chối">Từ chối</option>
          </select>
        </div>

        <button className="btn-filter" disabled={loading}>
          <FontAwesomeIcon icon={faFilter} /> Lọc
        </button>
      </div>

      {/* Reports List */}
      <div className="reports-section">
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faCalendarAlt} className="empty-icon" />
            <h3>Không có báo cáo vắng mặt</h3>
            <p>{selectedRoomId ? 'Hãy tạo báo cáo đầu tiên' : 'Vui lòng chọn phòng'}</p>
          </div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <div key={report._id} className={`absence-card ${getStatusClass(report.status)}`}>
                {/* Card Header - Like Bill Card */}
                <div className="absence-card-header">
                  <div className="absence-card-title">
                    <div className="absence-icon-badge">
                      <FontAwesomeIcon icon={getReasonIcon(report.reason)} />
                    </div>
                    <div className="absence-title-content">
                      <h3>{report.reason}</h3>
                      <p className="member-name">{report.member?.name || 'Thành viên'}</p>
                    </div>
                  </div>
                  <span className={`absence-status-badge ${getStatusClass(report.status)}`}>
                    <FontAwesomeIcon icon={getStatusIcon(report.status)} />
                    {getStatusLabel(report.status)}
                  </span>
                </div>

                {/* Card Body - Details */}
                <div className="absence-card-body">
                  <div className="detail-row">
                    <span className="detail-label">Thời gian:</span>
                    <span className="detail-value">
                      {formatDate(report.startDate)} → {formatDate(report.endDate)}
                    </span>
                  </div>

                  {report.note && (
                    <div className="detail-row">
                      <span className="detail-label">Ghi chú:</span>
                      <span className="detail-value">{report.note}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Ngày báo cáo:</span>
                    <span className="detail-value">{formatDate(report.createdAt)}</span>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="absence-card-footer">
                  {report.status === 'Chờ duyệt' && (
                    <>
                      <button
                        className="btn-approve-action"
                        onClick={() => handleApproveReport(report._id)}
                        title="Phê duyệt"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} /> Duyệt
                      </button>
                      <button
                        className="btn-reject-action"
                        onClick={() => handleRejectReport(report._id)}
                        title="Từ chối"
                      >
                        <FontAwesomeIcon icon={faExclamationCircle} /> Từ chối
                      </button>
                    </>
                  )}
                  <button
                    className="btn-delete-action"
                    onClick={() => handleDeleteReport(report._id)}
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Báo Cáo Vắng Mặt</h2>
              <button
                className="btn-close-modal"
                onClick={handleCloseModal}
                aria-label="Đóng"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="room-modal">Chọn phòng <span className="required">*</span></label>
                <select
                  id="room-modal"
                  name="room_id"
                  value={formData.room_id}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Ngày bắt đầu vắng <span className="required">*</span></label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">Ngày kết thúc vắng <span className="required">*</span></label>
                <input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reason">Lý do vắng mặt <span className="required">*</span></label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">-- Chọn lý do --</option>
                  <option value="Về quê">Về quê</option>
                  <option value="Công tác">Công tác</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="note">Ghi chú thêm</label>
                <textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Nhập ghi chú (tuỳ chọn)"
                  rows="3"
                  className="form-input"
                />
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
                className="btn-save"
                onClick={handleSubmitReport}
                disabled={submitting}
              >
                {submitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceReport;
