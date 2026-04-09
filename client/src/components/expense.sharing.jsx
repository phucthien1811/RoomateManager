import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faDollarSign,
  faTimes,
  faEdit,
  faTrash,
  faArrowUp,
  faArrowDown,
  faUser,
  faPiggyBank,
  faExchange,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/expense.sharing.css';

const ExpenseSharing = () => {
  const [activeTab, setActiveTab] = useState('sharing');
  
  const [expenses, setExpenses] = useState([
    {
      id: 1,
      description: 'Mua sửa cửa',
      amount: 500000,
      paidBy: 'Duy Nguyễn',
      room: 'Trần Hùng Đạo',
      date: '2024-04-10',
      participants: ['Duy Nguyễn', 'Iris Trần', 'An Phạm'],
      status: 'settled',
    },
    {
      id: 2,
      description: 'Tiền điện chung',
      amount: 450000,
      paidBy: 'Iris Trần',
      room: 'Trần Hùng Đạo',
      date: '2024-04-15',
      participants: ['Duy Nguyễn', 'Iris Trần'],
      status: 'pending',
    },
  ]);

  const [funds, setFunds] = useState([
    {
      id: 1,
      name: 'Quỹ Sửa Chữa',
      room: 'Trần Hùng Đạo',
      balance: 2000000,
      contributors: {
        'Duy Nguyễn': 700000,
        'Iris Trần': 650000,
        'An Phạm': 650000,
      },
      purpose: 'Để sửa chữa hư hỏng trong phòng',
    },
    {
      id: 2,
      name: 'Quỹ Vệ Sinh',
      room: 'Trần Hùng Đạo',
      balance: 800000,
      contributors: {
        'Duy Nguyễn': 300000,
        'Iris Trần': 250000,
        'An Phạm': 250000,
      },
      purpose: 'Mua sắm đồ vệ sinh chung',
    },
  ]);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    paidBy: '',
    room: '',
    participants: [],
  });
  const [fundForm, setFundForm] = useState({
    name: '',
    room: '',
    purpose: '',
  });

  const handleAddExpense = () => {
    const newExpense = {
      ...expenseForm,
      id: expenses.length + 1,
      date: new Date().toISOString().split('T')[0],
      amount: parseInt(expenseForm.amount) || 0,
      status: 'pending',
    };
    setExpenses([...expenses, newExpense]);
    setExpenseForm({ description: '', amount: '', paidBy: '', room: '', participants: [] });
    setShowExpenseModal(false);
  };

  const handleAddFund = () => {
    const newFund = {
      ...fundForm,
      id: funds.length + 1,
      balance: 0,
      contributors: {},
    };
    setFunds([...funds, newFund]);
    setFundForm({ name: '', room: '', purpose: '' });
    setShowFundModal(false);
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Xóa chi phí này?')) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  const handleDeleteFund = (id) => {
    if (window.confirm('Xóa quỹ này?')) {
      setFunds(funds.filter((f) => f.id !== id));
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

  const calculateShare = (amount, participantCount) => {
    return Math.round(amount / participantCount);
  };

  return (
    <div className="expense-sharing">
      <div className="expense-sharing-header">
        <div className="header-content">
          <h1>Quản Lý Chi Phí Chung & Quỹ</h1>
          <p>Chia sẻ chi phí công bằng và quản lý các quỹ chung phòng</p>
        </div>
      </div>

      <div className="sharing-tabs">
        <button
          className={`tab-button ${activeTab === 'sharing' ? 'active' : ''}`}
          onClick={() => setActiveTab('sharing')}
        >
          <FontAwesomeIcon icon={faExchange} /> Chia Sẻ Chi Phí
        </button>
        <button
          className={`tab-button ${activeTab === 'fund' ? 'active' : ''}`}
          onClick={() => setActiveTab('fund')}
        >
          <FontAwesomeIcon icon={faPiggyBank} /> Quỹ Chung
        </button>
      </div>

      {activeTab === 'sharing' && (
        <div className="tab-content sharing-content">
          <div className="tab-header">
            <h2>Danh Sách Chia Sẻ Chi Phí</h2>
            <button
              className="btn-add"
              onClick={() => setShowExpenseModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} /> Thêm Chi Phí
            </button>
          </div>

          <div className="expenses-container">
            {expenses.length > 0 ? (
              <>
                {expenses.map((expense) => (
                  <div key={expense.id} className="expense-card">
                    <div className="expense-card-header">
                      <div>
                        <h3 className="expense-title">{expense.description}</h3>
                        <p className="expense-meta">
                          <FontAwesomeIcon icon={faUser} /> {expense.paidBy} • {formatDate(expense.date)}
                        </p>
                      </div>
                      <span className={`status-badge status-${expense.status}`}>
                        {expense.status === 'settled' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                      </span>
                    </div>

                    <div className="expense-body">
                      <div className="expense-amount">
                        <span className="label">Tổng Tiền:</span>
                        <span className="amount">{formatCurrency(expense.amount)}</span>
                      </div>

                      <div className="expense-divider"></div>

                      <div className="expense-breakdown">
                        <h4>Chia Cho {expense.participants.length} Người:</h4>
                        <div className="breakdown-list">
                          {expense.participants.map((participant, idx) => (
                            <div key={idx} className="breakdown-item">
                              <span className="participant-name">{participant}</span>
                              <span className="participant-amount">
                                {formatCurrency(
                                  calculateShare(expense.amount, expense.participants.length)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="expense-footer">
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteExpense(expense.id)}
                        title="Xóa chi phí này"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="empty-state">
                <p>Chưa có chi phí nào được ghi nhận</p>
              </div>
            )}
          </div>

          {showExpenseModal && (
            <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
              <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Thêm Chi Phí Mới</h2>
                  <button
                    className="btn-close-modal"
                    onClick={() => setShowExpenseModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-group">
                    <label>Mô Tả Chi Phí</label>
                    <input
                      type="text"
                      placeholder="VD: Mua sữa cửa"
                      value={expenseForm.description}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Số Tiền (VND)</label>
                      <input
                        type="number"
                        placeholder="500000"
                        value={expenseForm.amount}
                        onChange={(e) =>
                          setExpenseForm({ ...expenseForm, amount: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Ai Trả Tiền?</label>
                      <input
                        type="text"
                        placeholder="Tên người trả"
                        value={expenseForm.paidBy}
                        onChange={(e) =>
                          setExpenseForm({ ...expenseForm, paidBy: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phòng</label>
                    <input
                      type="text"
                      placeholder="Tên phòng"
                      value={expenseForm.room}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, room: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-cancel"
                    onClick={() => setShowExpenseModal(false)}
                  >
                    Hủy
                  </button>
                  <button className="btn-submit" onClick={handleAddExpense}>
                    Thêm Chi Phí
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'fund' && (
        <div className="tab-content fund-content">
          <div className="tab-header">
            <h2>Các Quỹ Chung</h2>
            <button
              className="btn-add"
              onClick={() => setShowFundModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} /> Tạo Quỹ Mới
            </button>
          </div>

          <div className="funds-container">
            {funds.length > 0 ? (
              <div className="funds-grid">
                {funds.map((fund) => (
                  <div key={fund.id} className="fund-card">
                    <div className="fund-card-header">
                      <h3 className="fund-name">{fund.name}</h3>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteFund(fund.id)}
                        title="Xóa quỹ này"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>

                    <div className="fund-card-body">
                      <div className="fund-purpose">{fund.purpose}</div>

                      <div className="fund-balance">
                        <span className="label">Số Dư:</span>
                        <span className="balance">{formatCurrency(fund.balance)}</span>
                      </div>

                      <div className="fund-contributors">
                        <h4>Người Đóng Góp:</h4>
                        <div className="contributors-list">
                          {Object.entries(fund.contributors).map(([name, amount]) => (
                            <div key={name} className="contributor-item">
                              <span className="contributor-name">{name}</span>
                              <span className="contributor-amount">
                                {formatCurrency(amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="fund-room">
                        <small>Phòng: {fund.room}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Chưa có quỹ nào được tạo</p>
              </div>
            )}
          </div>

          {showFundModal && (
            <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
              <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Tạo Quỹ Mới</h2>
                  <button
                    className="btn-close-modal"
                    onClick={() => setShowFundModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-group">
                    <label>Tên Quỹ</label>
                    <input
                      type="text"
                      placeholder="VD: Quỹ Sửa Chữa"
                      value={fundForm.name}
                      onChange={(e) =>
                        setFundForm({ ...fundForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Phòng</label>
                    <input
                      type="text"
                      placeholder="Tên phòng"
                      value={fundForm.room}
                      onChange={(e) =>
                        setFundForm({ ...fundForm, room: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Mục Đích Quỹ</label>
                    <textarea
                      placeholder="Mô tả mục đích của quỹ này"
                      value={fundForm.purpose}
                      onChange={(e) =>
                        setFundForm({ ...fundForm, purpose: e.target.value })
                      }
                      rows="4"
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-cancel"
                    onClick={() => setShowFundModal(false)}
                  >
                    Hủy
                  </button>
                  <button className="btn-submit" onClick={handleAddFund}>
                    Tạo Quỹ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseSharing;
