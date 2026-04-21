import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faEdit, faExclamationCircle, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import absenceService from '../services/absence.service.js';
import roomService from '../services/room.service.js';
import PageHeader from './PageHeader.jsx';
import '../styles/absence.report.css';

const formatDate = (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : '-');

const AbsenceReport = () => {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    note: '',
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomService.getRooms();
        setRooms(data);
      } catch (err) {
        setError(err?.message || 'Không thể tải danh sách phòng');
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const syncRoom = () => {
      const current = localStorage.getItem('currentRoomId') || '';
      setSelectedRoomId(current);
    };

    syncRoom();
    window.addEventListener('room-selected', syncRoom);
    return () => window.removeEventListener('room-selected', syncRoom);
  }, []);

  const fetchReports = async (roomId) => {
    if (!roomId) {
      setReports([]);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await absenceService.getAbsenceReports(roomId);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Lỗi khi tải danh sách báo cáo');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedRoomId);
  }, [selectedRoomId]);

  const handleOpenModal = () => {
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng ở sidebar trước');
      return;
    }
    setFormData({ startDate: '', endDate: '', note: '' });
    setEditingReport(null);
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (row) => {
    setFormData({
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : '',
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : '',
      note: row.note === '-' ? '' : row.note,
    });
    setEditingReport(row);
    setError('');
    setShowModal(true);
  };

  const handleSubmitReport = async () => {
    if (!formData.startDate || !formData.endDate) {
      setError('Vui lòng nhập đầy đủ ngày vắng và ngày có mặt');
      return;
    }
    if (authLoading || !user) {
      setError('Vui lòng đăng nhập lại');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (editingReport) {
        await absenceService.updateAbsenceReport(editingReport.id, {
          startDate: formData.startDate,
          endDate: formData.endDate,
          note: formData.note,
          member_id: user.id || user._id,
        });
      } else {
        await absenceService.createAbsenceReport({
          room_id: selectedRoomId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: 'Khác',
          note: formData.note,
          member_id: user.id || user._id,
        });
      }
      await fetchReports(selectedRoomId);
      setShowModal(false);
    } catch (err) {
      setError(err?.message || 'Lỗi khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoomName = rooms.find((room) => room._id === selectedRoomId)?.name || 'Chưa chọn phòng';
  const currentUserId = user?.id || user?._id || '';

  const tableRows = useMemo(
    () =>
      reports.map((report) => ({
        id: report._id,
        createdAt: report.createdAt || report.created_at,
        userId: report.member?.user?._id || report.member?.user || '',
        userName:
          report.member?.user?.name ||
          report.member?.user?.full_name ||
          report.member?.user?.email ||
          report.member?.nickname ||
          'Thành viên',
        note: report.note || '-',
        startDate: report.startDate,
        endDate: report.endDate,
        updatedAt: report.updatedAt || report.updated_at,
      })),
    [reports]
  );

  return (
    <div className="absence-report-page">
      <PageHeader 
        title="Báo Cáo Vắng Mặt"
        actions={
          <button className="btn-create-report" onClick={handleOpenModal} disabled={submitting}>
            <FontAwesomeIcon icon={faPlus} /> Báo Cáo Vắng Mặt
          </button>
        }
      />

      {error && (
        <div className="alert alert-error">
          <FontAwesomeIcon icon={faExclamationCircle} /> {error}
        </div>
      )}

      <div className="reports-section">
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : !selectedRoomId ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faCalendarAlt} className="empty-icon" />
            <h3>Chưa chọn phòng</h3>
            <p>Vui lòng chọn phòng ở sidebar để xem báo cáo vắng mặt</p>
          </div>
        ) : tableRows.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faCalendarAlt} className="empty-icon" />
            <h3>Không có báo cáo vắng mặt</h3>
            <p>Hãy tạo báo cáo đầu tiên</p>
          </div>
        ) : (
          <div className="absence-table-wrap">
            <table className="absence-table">
              <thead>
                <tr>
                  <th>Ngày báo cáo</th>
                  <th>User vắng</th>
                  <th>Ghi chú vắng</th>
                  <th>Ngày có mặt</th>
                  <th>Khác</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{row.userName}</td>
                    <td>{row.note}</td>
                    <td>{formatDate(row.endDate)}</td>
                    <td>
                      {row.updatedAt &&
                      new Date(row.updatedAt).getTime() > new Date(row.createdAt).getTime()
                        ? 'Đã chỉnh sửa'
                        : '-'}
                    </td>
                    <td>
                      {String(row.userId) === String(currentUserId) ? (
                        <button className="btn-edit-action" onClick={() => handleOpenEditModal(row)} title="Chỉnh sửa">
                          <FontAwesomeIcon icon={faEdit} /> Chỉnh sửa
                        </button>
                      ) : (
                        <span className="action-disabled-text">không được</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingReport ? 'Chỉnh Sửa Báo Cáo Vắng Mặt' : 'Báo Cáo Vắng Mặt'}</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)} aria-label="Đóng">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="startDate">Ngày bắt đầu vắng <span className="required">*</span></label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">Ngày có mặt <span className="required">*</span></label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="note">Ghi chú vắng</label>
                <textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Nhập ghi chú"
                  rows="3"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={submitting}>
                Hủy
              </button>
              <button className="btn-save" onClick={handleSubmitReport} disabled={submitting}>
                {submitting ? 'Đang lưu...' : editingReport ? 'Lưu chỉnh sửa' : 'Gửi Báo Cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceReport;
