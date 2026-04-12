import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faFileAlt,
  faTrash,
  faTimes,
  faCheckCircle,
  faClock,
  faCheck,
  faLightbulb,
  faDroplet,
  faWifi,
  faHouse,
  faExclamationTriangle,
  faHourglassEnd,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import billService from '../services/bill.service.js';
import roomService from '../services/room.service.js';
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

  const [formData, setFormData] = useState({
    room_id: '',
    bill_type: 'electricity',
    total_amount: '',
    billing_month: '',
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
    } else {
      setBills([]);
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

  const handleOpenModal = () => {
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng ở sidebar trước khi tạo hóa đơn');
      return;
    }

    setFormData({
      room_id: selectedRoomId,
      bill_type: 'electricity',
      total_amount: '',
      billing_month: '',
      description: '',
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
    
    // Auto-format billing_month: remove spaces, ensure YYYY-MM format
    if (name === 'billing_month') {
      // Remove all spaces and dashes
      let cleaned = value.replace(/[\s-]/g, '');
      // If 6 digits like 202405, format as 2024-05
      if (cleaned.length === 6 && /^\d{6}$/.test(cleaned)) {
        cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
      }
      // If 4 digits and first 2 are month like 0504, don't format
      // Otherwise accept as-is (user can manually enter 2024-05)
      setFormData((prev) => ({
        ...prev,
        [name]: cleaned,
      }));
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    // Validate required fields
    if (!formData.room_id || !formData.bill_type || !formData.total_amount || !formData.billing_month) {
      setError('Vui lòng điền tất cả các trường bắt buộc');
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

      // Lấy room object để get tất cả members
      const selectedRoom = rooms.find(r => r._id === formData.room_id);
      if (!selectedRoom) {
        setError('Phòng không tồn tại');
        setSubmitting(false);
        return;
      }

      // Lấy danh sách member IDs từ room (hoặc nếu không có, dùng user hiện tại)
      const memberIds = selectedRoom.members && selectedRoom.members.length > 0
        ? selectedRoom.members.map(m => typeof m === 'string' ? m : m._id)
        : [userId];

      const billData = {
        room_id: formData.room_id,
        bill_type: formData.bill_type,
        total_amount: parseInt(formData.total_amount),
        billing_month: formData.billing_month,
        note: formData.description,
        member_ids: memberIds,
      };

      console.log('Creating bill with data:', billData);
      const response = await billService.createBill(billData);
      console.log('Bill created successfully:', response);
      
      console.log('Refreshing bills list...');
      await fetchBills();
      console.log('Closing modal...');
      handleCloseModal();
      alert('✅ Tạo hóa đơn thành công!');
    } catch (err) {
      console.error('Error saving bill:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
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
        alert('Lỗi khi xóa hóa đơn: ' + (err.message || 'Vui lòng thử lại'));
      }
    }
  };

  const handleConfirmPayment = async (billId, detailId) => {
    if (window.confirm('Xác nhận thanh toán?')) {
      try {
        await billService.confirmBillPayment(billId, detailId);
        await fetchBills();
        alert('✅ Thanh toán đã được xác nhận!');
      } catch (err) {
        console.error('Error confirming payment:', err);
        alert('Lỗi: ' + (err.message || 'Không thể xác nhận thanh toán'));
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
                      <span className="summary-label">Ngày tạo:</span>
                      <span className="summary-value">
                        {formatDate(bill.created_at || bill.createdAt || new Date())}
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
                  </select>
                </div>

                <div className="form-group">
                  <label>Kỳ tính (YYYY-MM) *</label>
                  <input
                    type="text"
                    name="billing_month"
                    value={formData.billing_month}
                    onChange={handleInputChange}
                    placeholder="2025-05 hoặc 202505"
                  />
                  <span className="hint-text">
                    Nhập theo định dạng YYYY-MM (ví dụ: 2025-05). Có thể bỏ dấu gạch ngang.
                  </span>
                </div>
              </div>

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
