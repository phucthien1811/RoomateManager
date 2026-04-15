import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faTimes,
  faCheckCircle,
  faCheck,
  faLightbulb,
  faDroplet,
  faWifi,
  faHouse,
  faFileAlt,
  faExclamationTriangle,
  faHourglassEnd,
  faListCheck,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import billService from '../services/bill.service.js';
import roomService from '../services/room.service.js';
import absenceService from '../services/absence.service.js';
import '../styles/bill.management.css';

const BillManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const [bills, setBills] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [roomMembers, setRoomMembers] = useState([]);
  const [awayMemberIds, setAwayMemberIds] = useState([]);
  const [splitParticipants, setSplitParticipants] = useState([]);

  const [formData, setFormData] = useState({
    room_id: '',
    bill_type: 'electricity',
    bill_type_other: '',
    bill_date: new Date().toISOString().slice(0, 10),
    total_amount: '',
    payer_id: '',
    billing_month: new Date().toISOString().slice(0, 7),
    description: '',
  });

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  // Sync selected room with sidebar selection
  useEffect(() => {
    const applySelectedRoom = (roomId) => {
      if (!roomId) return;
      setSelectedRoomId(roomId);
    };

    applySelectedRoom(localStorage.getItem('currentRoomId'));

    const handleRoomSelected = (event) => {
      applySelectedRoom(event.detail?.roomId || localStorage.getItem('currentRoomId'));
    };

    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  // Fetch bills when room is selected
  useEffect(() => {
    if (selectedRoomId) {
      fetchBills();
      fetchRoomParticipants(selectedRoomId);
    } else {
      setBills([]);
      setRoomMembers([]);
      setAwayMemberIds([]);
      setSplitParticipants([]);
    }
  }, [selectedRoomId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms();
      setRooms(data);
      if (!localStorage.getItem('currentRoomId') && data.length > 0) {
        setSelectedRoomId(data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Lỗi khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await billService.getBillsByRoom(selectedRoomId);
      
      // Ensure data is always an array
      const billsArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      setBills(billsArray);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Lỗi khi tải danh sách hóa đơn');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomParticipants = async (roomId) => {
    try {
      const [members, reports] = await Promise.all([
        roomService.getRoomMembers(roomId),
        absenceService.getAbsenceReports(roomId),
      ]);

      const memberList = Array.isArray(members) ? members : [];
      setRoomMembers(memberList);

      const now = new Date();
      const awayIds = (Array.isArray(reports) ? reports : [])
        .filter((report) => {
          if ((report.reason || '').toLowerCase() !== 'về quê') return false;
          const start = new Date(report.startDate);
          const end = new Date(report.endDate);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
          return start <= now && now <= end;
        })
        .map((report) => report.member?.user?._id || report.member?.user)
        .filter(Boolean)
        .map((id) => String(id));

      setAwayMemberIds(Array.from(new Set(awayIds)));
    } catch (err) {
      console.error('Error fetching participants/absence:', err);
      setRoomMembers([]);
      setAwayMemberIds([]);
      setSplitParticipants([]);
    }
  };

  const handleOpenModal = () => {
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng ở sidebar trước khi tạo hóa đơn');
      return;
    }

    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 10);
    const defaultMonth = defaultDate.slice(0, 7);
    const defaultPayerId = roomMembers[0]?._id || '';

    setFormData({
      room_id: selectedRoomId,
      bill_type: 'electricity',
      bill_type_other: '',
      bill_date: defaultDate,
      total_amount: '',
      payer_id: defaultPayerId,
      billing_month: defaultMonth,
      description: '',
    });

    setSplitParticipants(
      roomMembers.map((member) => ({
        member_id: member._id,
        name: member.name || member.email || 'Thành viên',
        email: member.email || '',
        selected: !awayMemberIds.includes(String(member._id)),
        split_mode: 'percent',
        split_value: '',
        isAway: awayMemberIds.includes(String(member._id)),
      }))
    );

    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'bill_date') {
      const month = value ? value.slice(0, 7) : formData.billing_month;
      setFormData((prev) => ({
        ...prev,
        bill_date: value,
        billing_month: month,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleParticipant = (memberId) => {
    setError('');
    setSplitParticipants((prev) =>
      prev.map((participant) => {
        if (participant.member_id !== memberId) return participant;
        if (participant.isAway) {
          setError(`${participant.name} đang về quê`);
          return participant;
        }
        return {
          ...participant,
          selected: !participant.selected,
        };
      })
    );
  };

  const handleSelectAllParticipants = () => {
    setError('');
    setSplitParticipants((prev) =>
      prev.map((participant) => ({
        ...participant,
        selected: participant.isAway ? false : true,
      }))
    );
  };

  const handleParticipantSplitChange = (memberId, field, value) => {
    setSplitParticipants((prev) =>
      prev.map((participant) =>
        participant.member_id === memberId
          ? {
              ...participant,
              [field]: value,
            }
          : participant
      )
    );
  };

  const validateBillingMonth = (month) => {
    // Must be YYYY-MM format
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(month)) {
      return 'Kỳ tính phải theo định dạng YYYY-MM (ví dụ: 2025-05)';
    }
    // Check valid month (01-12)
    const monthNum = parseInt(month.split('-')[1]);
    if (monthNum < 1 || monthNum > 12) {
      return 'Tháng phải từ 01 đến 12';
    }
    return null;
  };

  const handleSaveBill = async () => {
    if (!formData.room_id || !formData.bill_type || !formData.total_amount || !formData.billing_month) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    if (formData.bill_type === 'other' && !formData.bill_type_other.trim()) {
      setError('Vui lòng nhập nội dung cho loại hóa đơn khác');
      return;
    }

    // Validate billing_month format
    const monthError = validateBillingMonth(formData.billing_month);
    if (monthError) {
      setError(monthError);
      return;
    }

    // Validate total_amount
    const amount = parseInt(formData.total_amount);
    if (isNaN(amount) || amount < 1000) {
      setError('Tổng tiền phải lớn hơn 1.000 VNĐ');
      return;
    }

    if (authLoading) {
      setError('Đang xác thực, vui lòng chờ...');
      return;
    }

    // Check user exists
    if (!user) {
      setError('Vui lòng đăng nhập lại');
      return;
    }

    const userId = user.id || user._id;
    if (!userId) {
      console.error('User object invalid:', user);
      setError('Không thể xác định người dùng (ID missing)');
      return;
    }

    setSubmitting(true);
    try {
      setError('');

      const selectedParticipants = splitParticipants.filter((participant) => participant.selected && !participant.isAway);
      if (selectedParticipants.length === 0) {
        setError('Vui lòng chọn ít nhất 1 thành viên cùng thanh toán');
        setSubmitting(false);
        return;
      }

      const hasAnyCustomSplit = selectedParticipants.some(
        (participant) => String(participant.split_value).trim() !== ''
      );
      const customSplits = [];
      if (hasAnyCustomSplit) {
        for (const participant of selectedParticipants) {
          const rawValue = String(participant.split_value).trim();
          if (!rawValue) {
            setError('Nếu đã chia theo %/số tiền, vui lòng nhập đầy đủ cho mọi thành viên được chọn');
            setSubmitting(false);
            return;
          }
          const parsed = Number(rawValue);
          if (!Number.isFinite(parsed) || parsed < 0) {
            setError('Giá trị chia bill không hợp lệ');
            setSubmitting(false);
            return;
          }
          customSplits.push({
            member_id: participant.member_id,
            mode: participant.split_mode,
            value: parsed,
          });
        }
      }

      const memberIds = selectedParticipants.map((participant) => participant.member_id);

      const billData = {
        room_id: formData.room_id,
        bill_type: formData.bill_type,
        bill_type_other: formData.bill_type === 'other' ? formData.bill_type_other.trim() : undefined,
        bill_date: formData.bill_date,
        total_amount: parseInt(formData.total_amount),
        payer_id: formData.payer_id || userId,
        billing_month: formData.billing_month,
        note: formData.description,
        member_ids: memberIds,
        custom_splits: customSplits,
      };

      await billService.createBill(billData);
      await fetchBills();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving bill:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi lưu hóa đơn';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBill = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      try {
        await billService.deleteBill(id);
        await fetchBills();
      } catch (err) {
        console.error('Error deleting bill:', err);
        setError(err.message || 'Lỗi khi xóa hóa đơn');
      }
    }
  };

  const handleConfirmPayment = async (billId, detailId) => {
    if (window.confirm('Xác nhận thanh toán?')) {
      try {
        await billService.confirmBillPayment(billId, detailId);
        await fetchBills();
      } catch (err) {
        console.error('Error confirming payment:', err);
        setError(err.message || 'Không thể xác nhận thanh toán');
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

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chưa thanh toán',
      partial: 'Thanh toán một phần',
      completed: 'Đã thanh toán',
    };
    return labels[status] || status;
  };

  const selectedRoomName = rooms.find((room) => room._id === selectedRoomId)?.name || 'Chưa chọn phòng';
  const visibleBills = bills.filter((bill) => {
    if (paymentStatusFilter === 'all') return true;
    if (!bill.details || bill.details.length === 0) return false;
    return bill.details.some((detail) =>
      paymentStatusFilter === 'paid' ? detail.status === 'paid' : detail.status !== 'paid'
    );
  });

  return (
    <div className="bill-management">
      <div className="bill-management-header">
        <div className="header-content">
          <h1>Quản Lý Hóa Đơn</h1>
          <p>Quản lý, theo dõi và xác nhận thanh toán hóa đơn từng tháng · {selectedRoomName}</p>
        </div>
        <button
          className="btn-create-bill"
          onClick={handleOpenModal}
          disabled={submitting}
        >
          <FontAwesomeIcon icon={faPlus} /> Tạo Hóa Đơn Mới
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="payment-status-filter">Lọc theo trạng thái thanh toán user</label>
          <select
            id="payment-status-filter"
            className="filter-select"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>
        </div>
      </div>

      <div className="bills-container">
        {loading ? (
          <div className="loading-message">Đang tải dữ liệu...</div>
        ) : !selectedRoomId ? (
          <div className="empty-message">Vui lòng chọn phòng ở sidebar để xem hóa đơn.</div>
        ) : bills.length === 0 ? (
          <div className="empty-message">Chưa có hóa đơn nào cho phòng này.</div>
        ) : visibleBills.length === 0 ? (
          <div className="empty-message">Không có user phù hợp với bộ lọc thanh toán.</div>
        ) : (
          <div className="bills-grid">
            {visibleBills.map((bill) => {
              const visibleDetails = (bill.details || []).filter((detail) =>
                paymentStatusFilter === 'all'
                  ? true
                  : paymentStatusFilter === 'paid'
                    ? detail.status === 'paid'
                    : detail.status !== 'paid'
              );

              return (
              <div key={bill._id} className="bill-card">
                {/* HEADER */}
                <div className="bill-card-header">
                  <div className="header-title">
                    <h3 className="bill-type">
                      {bill.bill_type === 'electricity' && (
                        <>
                          <FontAwesomeIcon icon={faLightbulb} /> HÓA ĐƠN TIỀN ĐIỆN
                        </>
                      )}
                      {bill.bill_type === 'water' && (
                        <>
                          <FontAwesomeIcon icon={faDroplet} /> HÓA ĐƠN TIỀN NƯỚC
                        </>
                      )}
                      {bill.bill_type === 'internet' && (
                        <>
                          <FontAwesomeIcon icon={faWifi} /> HÓA ĐƠN TIỀN INTERNET
                        </>
                      )}
                      {bill.bill_type === 'rent' && (
                        <>
                          <FontAwesomeIcon icon={faHouse} /> HÓA ĐƠN TIỀN THUÊ
                        </>
                      )}
                      {bill.bill_type === 'other' && (
                        <>
                          <FontAwesomeIcon icon={faFileAlt} /> {`HÓA ĐƠN ${bill.bill_type_other || 'KHÁC'}`}
                        </>
                      )}
                    </h3>
                  </div>
                  <span className={`bill-status status-${bill.status}`}>
                    {bill.status === 'pending' && (
                      <>
                        <FontAwesomeIcon icon={faExclamationTriangle} /> CHƯA THANH TOÁN
                      </>
                    )}
                    {bill.status === 'partial' && (
                      <>
                        <FontAwesomeIcon icon={faHourglassEnd} /> THANH TOÁN MỘT PHẦN
                      </>
                    )}
                    {bill.status === 'completed' && (
                      <>
                        <FontAwesomeIcon icon={faCheckCircle} /> ĐÃ THANH TOÁN
                      </>
                    )}
                  </span>
                </div>

                {/* MAIN INFO */}
                <div className="bill-card-body">
                  <div className="bill-info-section">
                    <div className="info-item">
                      <span className="info-label">Phòng:</span>
                      <span className="info-value">{bill.room_id?.name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Kỳ:</span>
                      <span className="info-value">Tháng {bill.billing_month}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Trạng thái:</span>
                      <span className={`status-badge status-${bill.status}`}>
                        {getStatusLabel(bill.status)}
                      </span>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="bill-summary">
                    <div className="summary-item">
                      <span className="summary-label">Tổng tiền:</span>
                      <span className="summary-amount">{formatCurrency(bill.total_amount)}</span>
                    </div>
                    {bill.note && (
                      <div className="summary-item">
                        <span className="summary-label">Ghi chú:</span>
                        <span className="summary-value">{bill.note}</span>
                      </div>
                    )}
                    <div className="summary-item">
                      <span className="summary-label">Ngày hóa đơn:</span>
                      <span className="summary-value">
                        {formatDate(bill.bill_date || bill.created_at || bill.createdAt || new Date())}
                      </span>
                    </div>
                  </div>

                  <div className="divider-thick"></div>

                  {/* PAYMENT DETAILS */}
                  {bill.details && bill.details.length > 0 && (
                    <div className="bill-details-section">
                      <h4 className="details-title">
                        <FontAwesomeIcon icon={faListCheck} /> CHI TIẾT THANH TOÁN THEO THÀNH VIÊN
                      </h4>
                      
                      <div className="details-table">
                        <div className="table-header">
                          <div className="col-member">Thành viên</div>
                          <div className="col-amount">Số tiền</div>
                          <div className="col-action">Trạng thái</div>
                        </div>

                        {visibleDetails.length === 0 ? (
                          <div className="details-empty">Không có user phù hợp bộ lọc trong hóa đơn này.</div>
                        ) : (
                          visibleDetails.map((detail, index) => (
                          <div
                            key={detail._id || index}
                            className={`table-row status-${detail.status}`}
                          >
                            <div className="col-member">
                              {detail.member_id?.name || `Thành viên ${index + 1}`}
                            </div>
                            <div className="col-amount">
                              {formatCurrency(detail.amount_due)}
                            </div>
                            <div className="col-action">
                              {detail.status === 'paid' ? (
                                <span className="status-paid">
                                  <FontAwesomeIcon icon={faCheckCircle} /> Đã trả
                                </span>
                              ) : (
                                <button
                                  className="btn-confirm-small"
                                  onClick={() =>
                                    handleConfirmPayment(bill._id, detail._id)
                                  }
                                  title="Xác nhận thanh toán"
                                >
                                  <FontAwesomeIcon icon={faCheck} /> Xác nhận
                                </button>
                              )}
                            </div>
                          </div>
                          ))
                        )}

                        <div className="table-footer">
                          <div className="col-member">
                            <strong>Cộng:</strong>
                          </div>
                          <div className="col-amount">
                            <strong>
                              {formatCurrency(
                                visibleDetails.reduce((sum, detail) => sum + (Number(detail.amount_due) || 0), 0)
                              )}
                            </strong>
                          </div>
                          <div className="col-action"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bill-card-footer">
                  {bill.status !== 'completed' && bill.details && bill.details.length > 0 && (
                    <button
                      className="btn-confirm-all"
                      onClick={() => {
                        const pendingDetails = bill.details.filter(d => d.status === 'pending');
                        if (pendingDetails.length > 0) {
                          pendingDetails.forEach(detail => {
                            handleConfirmPayment(bill._id, detail._id);
                          });
                        }
                      }}
                      title="Xác nhận toàn bộ hóa đơn"
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> XÁC NHẬN TOÀN BỘ
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteBill(bill._id)}
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Tạo Hóa Đơn Mới</h2>
              <button
                className="btn-close-modal"
                onClick={handleCloseModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Phòng *</label>
                <input type="text" value={selectedRoomName} disabled />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loại hóa đơn *</label>
                  <select
                    name="bill_type"
                    value={formData.bill_type}
                    onChange={handleInputChange}
                  >
                    <option value="electricity">Tiền Điện</option>
                    <option value="water">Tiền Nước</option>
                    <option value="internet">Tiền Internet</option>
                    <option value="rent">Tiền Thuê</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ngày hóa đơn *</label>
                  <input
                    type="date"
                    name="bill_date"
                    value={formData.bill_date}
                    onChange={handleInputChange}
                  />
                  <span className="hint-text">
                    Kỳ tính tự cập nhật theo ngày đã chọn: <strong>{formData.billing_month || '-'}</strong>
                  </span>
                </div>
              </div>

              {formData.bill_type === 'other' && (
                <div className="form-group">
                  <label>Nội dung loại khác *</label>
                  <input
                    type="text"
                    name="bill_type_other"
                    value={formData.bill_type_other}
                    onChange={handleInputChange}
                    placeholder="VD: Phí vệ sinh, phí gửi xe..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>Tổng tiền *</label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleInputChange}
                  placeholder="950000"
                  min="1000"
                />
                <span className="hint-text">
                  Tối thiểu 1.000 VNĐ
                </span>
              </div>

              <div className="form-group">
                <label>Thành viên chịu trách nhiệm thanh toán *</label>
                <select
                  name="payer_id"
                  value={formData.payer_id}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn người chịu trách nhiệm</option>
                  {roomMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div className="participant-head">
                  <label>Thành viên cùng thanh toán *</label>
                  <button type="button" className="btn-select-all-members" onClick={handleSelectAllParticipants}>
                    <FontAwesomeIcon icon={faUsers} /> Chọn tất cả (trừ người về quê)
                  </button>
                </div>
                <div className="participant-list">
                  {splitParticipants.length === 0 ? (
                    <div className="participant-empty">Không có thành viên trong phòng.</div>
                  ) : (
                    splitParticipants.map((participant) => (
                      <div
                        key={participant.member_id}
                        className={`participant-row ${participant.selected ? 'selected' : ''} ${participant.isAway ? 'away' : ''}`}
                      >
                        <button
                          type="button"
                          className="participant-toggle"
                          onClick={() => handleToggleParticipant(participant.member_id)}
                        >
                          <input type="checkbox" readOnly checked={participant.selected} />
                          <span>{participant.name}</span>
                          {participant.isAway && <small>Đang về quê</small>}
                        </button>
                        <div className="participant-split">
                          <select
                            value={participant.split_mode}
                            onChange={(e) =>
                              handleParticipantSplitChange(participant.member_id, 'split_mode', e.target.value)
                            }
                            disabled={!participant.selected || participant.isAway}
                          >
                            <option value="percent">%</option>
                            <option value="amount">VND</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            placeholder={participant.split_mode === 'percent' ? 'VD: 25' : 'VD: 150000'}
                            value={participant.split_value}
                            onChange={(e) =>
                              handleParticipantSplitChange(participant.member_id, 'split_value', e.target.value)
                            }
                            disabled={!participant.selected || participant.isAway}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <span className="hint-text">
                  Để trống phần chia của từng người nếu muốn hệ thống tự chia đều.
                </span>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập ghi chú (tuỳ chọn)"
                  rows="3"
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
                onClick={handleSaveBill}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu...' : 'Tạo Hóa Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
