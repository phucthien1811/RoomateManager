import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faBurger,
  faCarSide,
  faClapperboard,
  faCoins,
  faFileInvoiceDollar,
  faPlus,
  faQuestionCircle,
  faShop,
  faSackDollar,
  faUserGroup,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import fundService from '../services/fund.service.js';
import roomService from '../services/room.service.js';
import '../styles/expense.sharing.css';

const PIE_COLORS = ['#60a5fa', '#34d399', '#f59e0b', '#f472b6', '#a78bfa', '#94a3b8'];
const DEFAULT_CATEGORIES = ['Ăn uống', 'Hóa đơn', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Chưa phân loại'];
const CATEGORY_ICON_MAP = {
  'Ăn uống': faBurger,
  'Hóa đơn': faFileInvoiceDollar,
  'Di chuyển': faCarSide,
  'Mua sắm': faShop,
  'Giải trí': faClapperboard,
  'Chưa phân loại': faQuestionCircle,
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    Number(amount) || 0
  );

const formatMonthKey = (monthKey) => {
  const [year, month] = String(monthKey || '').split('-');
  if (!year || !month) return monthKey || '';
  return `Tháng ${month}/${year}`;
};

const getMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
};

const getMemberName = (user) => user?.full_name || user?.name || user?.email || 'Thành viên';

const ExpenseSharing = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [fundBalance, setFundBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryAllocations, setCategoryAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit',
    amount: '',
    description: '',
    category: 'Chưa phân loại',
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const list = await roomService.getRooms();
        setRooms(list);
      } catch (err) {
        setError(err?.message || 'Không thể tải danh sách phòng');
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    const applyRoom = (roomId) => {
      if (!roomId) return;
      setSelectedRoomId(roomId);
    };

    applyRoom(localStorage.getItem('currentRoomId'));
    const handleRoomSelected = (event) => applyRoom(event.detail?.roomId || localStorage.getItem('currentRoomId'));
    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  useEffect(() => {
    const fetchFundData = async () => {
      if (!selectedRoomId) {
        setTransactions([]);
        setFundBalance(0);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const detail = await fundService.getFundDetail(selectedRoomId);
        setFundBalance(Number(detail.balance) || 0);
        setTransactions(Array.isArray(detail.transactions) ? detail.transactions : []);
        setCategoryAllocations(Array.isArray(detail.category_allocations) ? detail.category_allocations : []);
        const serverCategories = Array.isArray(detail.categories) ? detail.categories : [];
        const mergedCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...serverCategories]));
        setCategories(mergedCategories);
      } catch (err) {
        setError(err?.message || 'Không thể tải dữ liệu quỹ');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFundData();
  }, [selectedRoomId]);

  const computed = useMemo(() => {
    const monthKeys = Array.from(
      new Set(
        transactions
          .map((tx) => getMonthKey(tx.created_at))
          .filter(Boolean)
      )
    ).sort((a, b) => b.localeCompare(a));

    const sourceTransactions =
      selectedMonth === 'all'
        ? transactions
        : transactions.filter((tx) => getMonthKey(tx.created_at) === selectedMonth);

    const monthIncome = sourceTransactions
      .filter((tx) => tx.type === 'deposit')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const monthExpense = sourceTransactions
      .filter((tx) => tx.type === 'withdraw')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const pendingToCollect = Math.max(0, monthExpense - monthIncome);

    const typeDistributionMap = sourceTransactions.reduce((map, tx) => {
      const key = String(tx.category || '').trim() || 'Chưa phân loại';
      map.set(key, (map.get(key) || 0) + (Number(tx.amount) || 0));
      return map;
    }, new Map());

    const distributionData = Array.from(typeDistributionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const allocationData = categoryAllocations
      .filter((item) => Number(item.amount) > 0)
      .map((item) => ({ name: item.name, value: Number(item.amount) || 0 }))
      .sort((a, b) => b.value - a.value);

    const contributionMap = new Map();
    sourceTransactions
      .filter((tx) => tx.type === 'deposit')
      .forEach((tx) => {
        const user = tx.performed_by || {};
        const key = user._id || user.email || 'unknown';
        contributionMap.set(key, {
          name: getMemberName(user),
          amount: (contributionMap.get(key)?.amount || 0) + (Number(tx.amount) || 0),
        });
      });

    const contributionData = Array.from(contributionMap.values()).sort((a, b) => b.amount - a.amount);
    const memberCount = contributionData.length || 1;
    const expectedPerMember = Math.round(monthIncome / memberCount);
    const reconcileData = contributionData.map((item) => {
      const diff = item.amount - expectedPerMember;
      return { ...item, expected: expectedPerMember, diff };
    });

    return {
      monthKeys,
      monthIncome,
      monthExpense,
      pendingToCollect,
      distributionData,
      allocationData,
      contributionData,
      reconcileData,
      categoryListData: allocationData,
    };
  }, [transactions, selectedMonth, categoryAllocations]);

  const selectedRoomName = rooms.find((room) => room._id === selectedRoomId)?.name || 'Chưa chọn phòng';

  const handleCreateTransaction = async () => {
    const amount = Number(transactionForm.amount);
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng ở sidebar');
      return;
    }
    if (!amount || amount < 1000) {
      setError('Số tiền tối thiểu là 1.000 VNĐ');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (transactionForm.type === 'deposit') {
        await fundService.contributeFund(
          selectedRoomId,
          amount,
          transactionForm.description,
          transactionForm.category
        );
      } else {
        await fundService.withdrawFund(
          selectedRoomId,
          amount,
          transactionForm.description,
          transactionForm.category
        );
      }
      const detail = await fundService.getFundDetail(selectedRoomId);
      setFundBalance(Number(detail.balance) || 0);
      setTransactions(Array.isArray(detail.transactions) ? detail.transactions : []);
      setCategoryAllocations(Array.isArray(detail.category_allocations) ? detail.category_allocations : []);
      setShowTransactionModal(false);
      setTransactionForm({ type: 'deposit', amount: '', description: '', category: 'Chưa phân loại' });
      const serverCategories = Array.isArray(detail.categories) ? detail.categories : [];
      setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...serverCategories])));
    } catch (err) {
      setError(err?.message || 'Không thể tạo giao dịch quỹ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    const value = String(newCategoryName || '').trim();
    const amount = Number(newCategoryAmount) || 0;
    if (!value) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }
    if (amount <= 0) {
      setError('Số tiền phân bổ phải lớn hơn 0');
      return;
    }
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng ở sidebar');
      return;
    }

    setSubmitting(true);
    setError('');
    fundService
      .createCategory(selectedRoomId, value, amount)
      .then((data) => {
        const nextCategories = Array.isArray(data.categories) ? data.categories : [...categories, value];
        setCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...nextCategories])));
        if (Array.isArray(data.category_allocations)) {
          setCategoryAllocations(data.category_allocations);
        } else {
          setCategoryAllocations((prev) => {
            const next = [...prev];
            const idx = next.findIndex((item) => item.name === value);
            if (idx >= 0) {
              next[idx] = { ...next[idx], amount: (Number(next[idx].amount) || 0) + amount };
            } else {
              next.push({ name: value, amount });
            }
            return next;
          });
        }
        if (typeof data.balance === 'number') setFundBalance(data.balance);
        setTransactionForm((prev) => ({ ...prev, category: value }));
        setNewCategoryName('');
        setNewCategoryAmount('');
        setShowCategoryModal(false);
      })
      .catch((err) => {
        setError(err?.message || 'Không thể tạo danh mục quỹ');
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="expense-sharing">
      <div className="expense-sharing-header">
        <div className="header-content">
          <h1>Quỹ Tiền Chung</h1>
          <p>Phòng hiện tại: {selectedRoomName}</p>
        </div>
        <button className="btn-add" onClick={() => setShowTransactionModal(true)} disabled={!selectedRoomId || submitting}>
          <FontAwesomeIcon icon={faPlus} /> Thêm giao dịch quỹ
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="fund-overview-grid">
        <div className="overview-card">
          <span>Số dư quỹ hiện tại</span>
          <strong>{formatCurrency(fundBalance)}</strong>
          <small><FontAwesomeIcon icon={faWallet} /> Quỹ phòng</small>
        </div>
        <div className="overview-card">
          <span>Tổng thu {selectedMonth === 'all' ? 'đã ghi nhận' : formatMonthKey(selectedMonth)}</span>
          <strong>{formatCurrency(computed.monthIncome)}</strong>
          <small><FontAwesomeIcon icon={faArrowUp} /> Tiền đóng góp</small>
        </div>
        <div className="overview-card">
          <span>Tổng chi {selectedMonth === 'all' ? 'đã ghi nhận' : formatMonthKey(selectedMonth)}</span>
          <strong>{formatCurrency(computed.monthExpense)}</strong>
          <small><FontAwesomeIcon icon={faArrowDown} /> Chi tiêu chung</small>
        </div>
        <div className="overview-card">
          <span>Cần thu thêm</span>
          <strong>{formatCurrency(computed.pendingToCollect)}</strong>
          <small><FontAwesomeIcon icon={faCoins} /> Bù vào quỹ</small>
        </div>
      </div>

      <div className="fund-filter-row">
        <label htmlFor="fund-month-filter">Tháng</label>
        <select
          id="fund-month-filter"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="all">Tất cả</option>
          {computed.monthKeys.map((month) => (
            <option key={month} value={month}>
              {formatMonthKey(month)}
            </option>
          ))}
        </select>
      </div>

      <div className="fund-middle-grid">
        <div className="fund-chart-card">
          <h2>Chi theo danh mục</h2>
          {computed.distributionData.length === 0 ? (
            <div className="empty-inline">Chưa có dữ liệu giao dịch</div>
          ) : (
            <div className="pie-layout">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={computed.distributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {computed.distributionData.map((item, index) => (
                      <Cell key={`${item.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {computed.distributionData.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="legend-item">
                    <span className="dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <div>
                      <strong>{item.name}</strong>
                      <p>{formatCurrency(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="fund-chart-card">
          <h2><FontAwesomeIcon icon={faSackDollar} /> Số dư danh mục</h2>
          {computed.allocationData.length === 0 ? (
            <div className="empty-inline">Chưa có phân bổ danh mục</div>
          ) : (
            <div className="pie-layout">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={computed.allocationData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {computed.allocationData.map((item, index) => (
                      <Cell key={`${item.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {computed.allocationData.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="legend-item">
                    <span className="dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <div>
                      <strong>{item.name}</strong>
                      <p>{formatCurrency(item.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fund-chart-card full">
        <div className="category-list-header">
          <h2>Danh mục quỹ</h2>
          <button className="btn-add category-add-btn" onClick={() => setShowCategoryModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> Thêm danh mục
          </button>
        </div>
        {computed.categoryListData.length === 0 ? (
          <div className="empty-inline">Chưa có dữ liệu danh mục</div>
        ) : (
          <div className="category-mobile-list">
            {computed.categoryListData.map((item) => {
              const icon = CATEGORY_ICON_MAP[item.name] || faQuestionCircle;
              return (
                <div
                  key={item.name}
                  className={`category-mobile-item ${item.name === 'Chưa phân loại' ? 'uncategorized' : ''}`}
                >
                  <div className="category-name-wrap">
                    <span className="category-icon">
                      <FontAwesomeIcon icon={icon} />
                    </span>
                    <span className="category-name">{item.name}</span>
                  </div>
                  <strong>{formatCurrency(item.value)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fund-chart-card full">
        <h2>Lịch sử giao dịch quỹ</h2>
        {loading ? (
          <div className="empty-inline">Đang tải dữ liệu...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-inline">Chưa có giao dịch nào.</div>
        ) : (
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Người tạo</th>
                  <th>Nội dung</th>
                  <th>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`tx-type ${tx.type}`}>{tx.type === 'deposit' ? 'Thu' : 'Chi'}</span>
                    </td>
                    <td>{getMemberName(tx.performed_by)}</td>
                    <td>
                      <div className="tx-description-main">{tx.description || '-'}</div>
                      <div className="tx-category-chip">{tx.category || 'Chưa phân loại'}</div>
                    </td>
                    <td className={tx.type === 'deposit' ? 'tx-amount in' : 'tx-amount out'}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showTransactionModal && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm giao dịch quỹ</h2>
              <button className="btn-close-modal" onClick={() => setShowTransactionModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Loại giao dịch</label>
                  <select
                    value={transactionForm.type}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="deposit">Thu (đóng góp)</option>
                    <option value="withdraw">Chi (rút quỹ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Số tiền</label>
                  <input
                    type="number"
                    min="1000"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="100000"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục</label>
                  <select
                    value={transactionForm.category}
                    onChange={(e) => setTransactionForm((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group category-inline-add">
                  <label>Tạo nhanh danh mục</label>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    + Thêm danh mục mới
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Nội dung</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Ví dụ: Đóng quỹ tháng 4 / Mua đồ vệ sinh"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTransactionModal(false)}>
                Hủy
              </button>
              <button className="btn-submit" onClick={handleCreateTransaction} disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu giao dịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-container small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo danh mục quỹ</h2>
              <button className="btn-close-modal" onClick={() => setShowCategoryModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên danh mục</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ví dụ: Ăn uống (nếu trùng sẽ cộng thêm)"
                />
              </div>
              <div className="form-group">
                <label>Số tiền phân bổ từ quỹ</label>
                <input
                  type="number"
                  min="1"
                  value={newCategoryAmount}
                  onChange={(e) => setNewCategoryAmount(e.target.value)}
                  placeholder="Ví dụ: 300000"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCategoryModal(false)}>
                Hủy
              </button>
              <button className="btn-submit" onClick={handleAddCategory} disabled={submitting}>
                Lưu danh mục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseSharing;
