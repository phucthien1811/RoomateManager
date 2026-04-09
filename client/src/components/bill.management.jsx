import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faFileAlt,
  faEdit,
  faTrash,
  faTimes,
  faCheckCircle,
  faDownload,
  faSearchPlus,
  faClock,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/bill.management.css';

const BillManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [bills, setBills] = useState([
    {
      id: 1,
      billNo: 'HD-2024-001',
      room: 'Trần Hùng Đạo',
      month: 'Tháng 4/2024',
      totalAmount: 3650000,
      status: 'pending',
      issueDate: '2024-04-01',
      dueDate: '2024-04-15',
      description: 'Tiền thuê + điện + nước',
    },
    {
      id: 2,
      billNo: 'HD-2024-002',
      room: 'Trần Hùng Đạo',
      month: 'Tháng 3/2024',
      totalAmount: 3550000,
      status: 'paid',
      issueDate: '2024-03-01',
      dueDate: '2024-03-15',
      paidDate: '2024-03-13',
      description: 'Tiền thuê + điện + nước',
    },
    {
      id: 3,
      billNo: 'HD-2024-003',
      room: 'An Dương Vương',
      month: 'Tháng 4/2024',
      totalAmount: 4850000,
      status: 'overdue',
      issueDate: '2024-04-01',
      dueDate: '2024-04-15',
      description: 'Tiền thuê + điện + nước + internet',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    room: '',
    month: '',
    totalAmount: '',
    description: '',
  });
  const [editingId, setEditingId] = useState(null);

  const handleOpenModal = () => {
    setFormData({ room: '', month: '', totalAmount: '', description: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateBill = () => {
    const newBill = {
      ...formData,
      id: bills.length + 1,
      billNo: `HD-2024-${String(bills.length + 1).padStart(3, '0')}`,
      status: 'pending',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: parseInt(formData.totalAmount) || 0,
    };
    setBills([...bills, newBill]);
    handleCloseModal();
  };

  const handleDeleteBill = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      setBills(bills.filter((bill) => bill.id !== id));
    }
  };

  const handleConfirmPayment = (id) => {
    setBills(
      bills.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              status: 'paid',
              paidDate: new Date().toISOString().split('T')[0],
            }
          : bill
      )
    );
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
    return `status-${status}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      overdue: 'Quá hạn',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    if (status === 'paid') return faClock;
    if (status === 'overdue') return faCheckCircle;
    return faClock;
  };

  return (
    <div className="bill-management">
      <div className="bill-management-header">
        <div className="header-content">
          <h1>Quản Lý Hóa Đơn</h1>
          <p>Quản lý, theo dõi và xác nhận thanh toán hóa đơn từng tháng</p>
        </div>
        <button className="btn-create-bill" onClick={handleOpenModal}>
          <FontAwesomeIcon icon={faPlus} /> Tạo Hóa Đơn Mới
        </button>
      </div>

      <div className="bill-tabs">
        <button
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FontAwesomeIcon icon={faFileAlt} /> Danh Sách Hóa Đơn
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FontAwesomeIcon icon={faClock} /> Chưa Thanh Toán
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FontAwesomeIcon icon={faCheckCircle} /> Lịch Sử
        </button>
      </div>

      <div className="bills-container">
        {(activeTab === 'list' ||
          (activeTab === 'pending' && 
           bills.filter((b) => b.status !== 'paid').length > 0) ||
          (activeTab === 'history' && bills.filter((b) => b.status === 'paid').length > 0)) ? (
          <div className="bills-grid">
            {(activeTab === 'list'
              ? bills
              : activeTab === 'pending'
              ? bills.filter((b) => b.status !== 'paid')
              : bills.filter((b) => b.status === 'paid')
            ).map((bill) => (
              <div key={bill.id} className="bill-card">
                <div className="bill-card-header">
                  <div>
                    <h3 className="bill-number">{bill.billNo}</h3>
                    <p className="bill-room">{bill.room}</p>
                  </div>
                  <span className={`bill-status ${getStatusClass(bill.status)}`}>
                    {getStatusLabel(bill.status)}
                  </span>
                </div>

                <div className="bill-card-body">
                  <div className="bill-info-row">
                    <span className="label">Kỳ hóa đơn:</span>
                    <span className="value">{bill.month}</span>
                  </div>
                  <div className="bill-info-row">
                    <span className="label">Mô tả:</span>
                    <span className="value">{bill.description}</span>
                  </div>
                  <div className="bill-info-row">
                    <span className="label">Ngày phát hành:</span>
                    <span className="value">{formatDate(bill.issueDate)}</span>
                  </div>
                  <div className="bill-info-row">
                    <span className="label">Hạn thanh toán:</span>
                    <span className="value">{formatDate(bill.dueDate)}</span>
                  </div>

                  {bill.paidDate && (
                    <div className="bill-info-row">
                      <span className="label">Ngày thanh toán:</span>
                      <span className="value paid">{formatDate(bill.paidDate)}</span>
                    </div>
                  )}

                  <div className="bill-divider"></div>

                  <div className="bill-total">
                    <span>Tổng tiền:</span>
                    <span className="total-amount">
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="bill-card-footer">
                  {bill.status !== 'paid' && (
                    <button
                      className="btn-confirm-payment"
                      onClick={() => handleConfirmPayment(bill.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Xác Nhận Thanh Toán
                    </button>
                  )}
                  <button
                    className="btn-download"
                    title="Tải PDF"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteBill(bill.id)}
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FontAwesomeIcon icon={faFileAlt} className="empty-icon" />
            <p>Không có hóa đơn nào</p>
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
              <div className="form-group">
                <label htmlFor="room">Phòng</label>
                <select
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                >
                  <option value="">Chọn phòng</option>
                  <option value="Trần Hùng Đạo">Trần Hùng Đạo</option>
                  <option value="An Dương Vương">An Dương Vương</option>
                  <option value="Lạc Long Quân">Lạc Long Quân</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="month">Kỳ Hóa Đơn</label>
                <input
                  type="text"
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  placeholder="VD: Tháng 4/2024"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalAmount">Tổng Tiền (VND)</label>
                <input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  placeholder="VD: 3650000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Mô Tả Chi Tiết</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="VD: Tiền thuê + điện + nước"
                  rows="4"
                ></textarea>
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
                onClick={handleCreateBill}
              >
                Tạo Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
