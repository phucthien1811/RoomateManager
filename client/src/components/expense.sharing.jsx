import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faCamera,
  faCheck,
  faChartPie,
  faClockRotateLeft,
  faCoins,
  faExpand,
  faFileInvoiceDollar,
  faHouse,
  faMoneyBillTransfer,
  faTimes,
  faUser,
  faUserGroup,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import fundService from '../services/fund.service.js';
import billService from '../services/bill.service.js';
import roomService from '../services/room.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from './PageHeader.jsx';
import '../styles/expense.sharing.css';

/* ─── constants ─────────────────────────────── */
const PIE_COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

const BILL_TYPE_LABEL = {
  electricity: 'Tiền Điện',
  water: 'Tiền Nước',
  internet: 'Internet',
  rent: 'Tiền Thuê',
  other: 'Khác',
};

/* ─── helpers ────────────────────────────────── */
const fmt = (n = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const getMemberName = (u) => {
  if (u?.full_name) return u.full_name;
  if (u?.name) return u.name;
  if (u?.email) return u.email.split('@')[0];
  return 'Thành viên';
};

const getInitials = (name = '') =>
  name.trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase() || '?';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });

/* ─── Component ──────────────────────────────── */
const ExpenseSharing = () => {
  const { user } = useAuth();
  const currentUserId = String(user?.id || user?._id || '');

  /* ── State ── */
  const [mode, setMode]           = useState('room'); // 'room' | 'personal'
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [rooms, setRooms]         = useState([]);
  const [fundBalance, setFundBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [bills, setBills]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* modal: deposit */
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: '', description: '', proofImages: [] });

  /* modal: withdraw */
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', description: '', proofImages: [] });

  /* modal: history (for personal tab action) */
  const [showHistory, setShowHistory] = useState(false);

  /* lightbox */
  const [lightboxSrc, setLightboxSrc] = useState(null);

  /* ── Sync room từ sidebar ── */
  useEffect(() => {
    const sync = (e) => {
      const id = e?.detail?.roomId || localStorage.getItem('currentRoomId') || '';
      setSelectedRoomId(id);
    };
    sync();
    window.addEventListener('room-selected', sync);
    return () => window.removeEventListener('room-selected', sync);
  }, []);

  /* ── Rooms ── */
  useEffect(() => { roomService.getRooms().then(setRooms).catch(() => {}); }, []);

  /* ── Fetch fund + bills ── */
  const fetchAll = async () => {
    if (!selectedRoomId) { setTransactions([]); setBills([]); setFundBalance(0); return; }
    try {
      setLoading(true); setError('');
      const [detail, billList] = await Promise.all([
        fundService.getFundDetail(selectedRoomId),
        billService.getBillsByRoom(selectedRoomId),
      ]);
      setFundBalance(Number(detail.balance) || 0);
      setTransactions(Array.isArray(detail.transactions) ? detail.transactions : []);
      setBills(Array.isArray(billList) ? billList : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu quỹ');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, [selectedRoomId]); // eslint-disable-line

  /* ── Computed: room tab ── */
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    
    return { totalDeposit, totalWithdraw, memberContribs, roomPieData, totalBillAmountMonth, thisMonthBillsCount: thisMonthBills.length, pendingTransactions };
  }, [transactions, bills]);

  const isRoomOwner = useMemo(() => {
    const room = rooms.find(r => r._id === selectedRoomId);
    if (!room) return false;
    const ownerId = String(room.owner?._id || room.owner || '');
    return currentUserId && ownerId && currentUserId === ownerId;
  }, [rooms, selectedRoomId, currentUserId]);

  /* ── Computed: personal tab ── */
  const personalStats = useMemo(() => {
    const myDeposit = transactions
      .filter(t => t.type === 'deposit' && String(t.performed_by?._id || t.performed_by || '') === currentUserId)
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const myBillTotal = bills.reduce((s, bill) => {
      const d = (bill.details || []).find(d => String(d.member_id?._id || d.member_id || '') === currentUserId);
      return s + (Number(d?.amount_due) || 0);
    }, 0);

    const myBillsByType = {};
    bills.forEach(bill => {
      const d = (bill.details || []).find(d => String(d.member_id?._id || d.member_id || '') === currentUserId);
      if (!d) return;
      const label = bill.bill_type === 'other' ? (bill.bill_type_other || 'Khác') : (BILL_TYPE_LABEL[bill.bill_type] || 'Khác');
      myBillsByType[label] = (myBillsByType[label] || 0) + (Number(d.amount_due) || 0);
    });
    const myPieData = Object.entries(myBillsByType).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return { myDeposit, myBillTotal, diff: myDeposit - myBillTotal, myPieData };
  }, [transactions, bills, currentUserId]);

  /* ── History rows (gộp transactions + bills) ── */
  const historyRows = useMemo(() => {
    const rows = [];
    transactions.forEach(tx => rows.push({
      id: tx._id,
      date: new Date(tx.created_at || tx.createdAt),
      type: tx.type === 'deposit' ? 'deposit' : 'withdraw',
      label: tx.type === 'deposit' ? `Nạp quỹ — ${getMemberName(tx.performed_by)}` : (tx.description || 'Rút quỹ'),
      amount: Number(tx.amount) || 0,
      note: tx.description || '',
      proofImages: tx.proof_images || [],
      userId: String(tx.performed_by?._id || tx.performed_by || ''),
      status: tx.status,
    }));
    bills.forEach(bill => rows.push({
      id: 'bill-' + bill._id,
      date: new Date(bill.bill_date || bill.created_at || bill.createdAt),
      type: 'bill',
      label: bill.bill_type === 'other'
        ? (bill.bill_type_other || 'Hóa đơn khác')
        : `Trừ ${BILL_TYPE_LABEL[bill.bill_type] || 'hóa đơn'} — ${fmt(bill.total_amount)}`,
      amount: Number(bill.total_amount) || 0,
      note: `Tháng ${bill.billing_month} · ${bill.status === 'completed' ? 'Đã trả đủ' : 'Còn thanh toán'}`,
      proofImages: bill.bill_images || [],
      details: bill.details || [],
    }));
    return rows.sort((a, b) => b.date - a.date);
  }, [transactions, bills]);

  const personalHistoryRows = useMemo(() => {
    const rows = [];
    transactions.forEach(tx => {
      const uid = String(tx.performed_by?._id || tx.performed_by || '');
      if (tx.type === 'deposit' && uid === currentUserId) {
        rows.push({
          id: tx._id,
          date: new Date(tx.created_at || tx.createdAt),
          type: 'deposit',
          label: `Tôi nạp quỹ`,
          amount: Number(tx.amount) || 0,
          note: tx.description || '',
          proofImages: tx.proof_images || [],
        });
      } else if (tx.type === 'withdraw' && uid === currentUserId) {
        rows.push({
          id: tx._id,
          date: new Date(tx.created_at || tx.createdAt),
          type: 'withdraw',
          label: tx.description || 'Tôi rút quỹ',
          amount: Number(tx.amount) || 0,
          note: tx.category || '',
          proofImages: tx.proof_images || [],
        });
      }
    });

    bills.forEach(bill => {
      const d = (bill.details || []).find(detail => String(detail.member_id?._id || detail.member_id || '') === currentUserId);
      if (d) {
        rows.push({
          id: 'my-bill-' + bill._id,
          date: new Date(bill.bill_date || bill.created_at || bill.createdAt),
          type: 'bill',
          label: bill.bill_type === 'other'
            ? (bill.bill_type_other || 'Hóa đơn khác (phần của tôi)')
            : `Trừ ${BILL_TYPE_LABEL[bill.bill_type] || 'hóa đơn'} (phần của tôi)`,
          amount: Number(d.amount_due) || 0,
          note: `Tháng ${bill.billing_month} · ${d.status === 'paid' ? 'Đã thanh toán' : 'Chưa trả'}`,
          proofImages: bill.bill_images || [],
        });
      }
    });
    return rows.sort((a, b) => b.date - a.date);
  }, [transactions, bills, currentUserId]);

  /* ── Handlers: deposit ── */
  const handleSelectProof = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    if (!files.length) return;
    try {
      const b64s = await Promise.all(files.map(fileToBase64));
      setDepositForm(p => ({ ...p, proofImages: [...p.proofImages, ...b64s].slice(0, 3) }));
    } catch { setError('Không thể đọc file ảnh'); }
  };

  const handleSaveDeposit = async () => {
    const amount = Number(depositForm.amount);
    if (!amount || amount < 1000) { setError('Số tiền tối thiểu 1.000 VNĐ'); return; }
    try {
      setSubmitting(true); setError('');
      await fundService.contributeFund(selectedRoomId, amount, depositForm.description || 'Nạp quỹ', 'Nạp quỹ', depositForm.proofImages);
      await fetchAll();
      setShowDeposit(false);
      setDepositForm({ amount: '', description: '', proofImages: [] });
    } catch (err) { setError(err?.message || 'Không thể nạp quỹ'); }
    finally { setSubmitting(false); }
  };

  /* ── Handlers: withdraw ── */
  const handleSaveWithdraw = async () => {
    const amount = Number(withdrawForm.amount);
    if (!amount || amount < 1000) { setError('Số tiền tối thiểu 1.000 VNĐ'); return; }
    try {
      setSubmitting(true); setError('');
      const res = await fundService.withdrawFund(selectedRoomId, amount, withdrawForm.description || 'Rút quỹ', 'Rút quỹ', withdrawForm.proofImages);
      alert(res.message || 'Giao dịch đã được ghi nhận!');
      await fetchAll();
      setShowWithdraw(false);
      setWithdrawForm({ amount: '', description: '', proofImages: [] });
    } catch (err) { setError(err?.message || 'Không thể rút quỹ'); }
    finally { setSubmitting(false); }
  };

  const handleApproveTx = async (txId) => {
    if (!window.confirm('Xác nhận phê duyệt yêu cầu rút tiền này?')) return;
    try {
      setSubmitting(true);
      await fundService.approveFundWithdraw(txId);
      await fetchAll();
      alert('Đã phê duyệt giao dịch thành công!');
    } catch (err) { alert(err.message || 'Lỗi khi phê duyệt'); }
    finally { setSubmitting(false); }
  };

  const handleRejectTx = async (txId) => {
    const reason = window.prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    try {
      setSubmitting(true);
      await fundService.rejectFundWithdraw(txId, reason);
      await fetchAll();
      alert('Đã từ chối giao dịch.');
    } catch (err) { alert(err.message || 'Lỗi khi từ chối'); }
    finally { setSubmitting(false); }
  };

  const selectedRoomName = rooms.find(r => r._id === selectedRoomId)?.name || 'Chưa chọn phòng';

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="expense-sharing">
      {/* ── HEADER + TAB SWITCH ── */}
      <PageHeader 
        title="Quỹ Tiền Chung"
        actions={
          <div className="dashboard-mode-switch">
            <button className={mode === 'room' ? 'active' : ''} onClick={() => setMode('room')}>Phòng</button>
            <button className={mode === 'personal' ? 'active' : ''} onClick={() => setMode('personal')}>Cá nhân</button>
          </div>
        }
      />

      {error && <div className="alert-error">{error}</div>}
      {!selectedRoomId && <div className="es-empty">Vui lòng chọn phòng ở sidebar để xem quỹ.</div>}

      {selectedRoomId && (
        <>
          {/* ══════ TAB: PHÒNG ══════ */}
          {mode === 'room' && (
            <>
              {/* Stats */}
              <div className="fund-overview-grid">
                <div className="overview-card">
                  <span>Số dư quỹ</span>
                  <strong>{fmt(fundBalance)}</strong>
                  <small><FontAwesomeIcon icon={faWallet} /> Quỹ phòng</small>
                </div>
                <div className="overview-card">
                  <span>Tổng đã nạp</span>
                  <strong style={{ color: '#0d9488' }}>{fmt(roomStats.totalDeposit)}</strong>
                  <small><FontAwesomeIcon icon={faArrowUp} /> Đóng góp</small>
                </div>
                <div className="overview-card">
                  <span>Đã rút quỹ</span>
                  <strong style={{ color: '#dc2626' }}>{fmt(roomStats.totalWithdraw)}</strong>
                  <small><FontAwesomeIcon icon={faArrowDown} /> Số tiền đã dùng</small>
                </div>
                <div className="overview-card">
                  <span>Hóa đơn tháng này</span>
                  <strong style={{ color: '#f59e0b' }}>{fmt(roomStats.totalBillAmountMonth)}</strong>
                  <small><FontAwesomeIcon icon={faFileInvoiceDollar} /> {roomStats.thisMonthBillsCount} hóa đơn phát sinh</small>
                </div>
              </div>

              {/* Pending Transactions for Owner */}
              {isRoomOwner && roomStats.pendingTransactions?.length > 0 && (
                <div className="fund-chart-card full" style={{ marginBottom: 20, border: '1px solid #fde68a', background: '#fffbeb' }}>
                  <h2 style={{ color: '#92400e' }}><FontAwesomeIcon icon={faClockRotateLeft} /> Yêu cầu rút quỹ đang chờ duyệt</h2>
                  <div className="transaction-table-wrap">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th>Người yêu cầu</th>
                          <th>Nội dung</th>
                          <th>Số tiền</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomStats.pendingTransactions.map(tx => (
                          <tr key={tx._id}>
                            <td className="td-date">{fmtDate(tx.created_at || tx.createdAt)}</td>
                            <td>{getMemberName(tx.performed_by)}</td>
                            <td>{tx.description}</td>
                            <td className="td-num"><span className="tx-amount out">−{fmt(tx.amount)}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn-confirm-mini" onClick={() => handleApproveTx(tx._id)} disabled={submitting}>
                                  <FontAwesomeIcon icon={faCheck} /> Duyệt
                                </button>
                                <button className="btn-reject-mini" onClick={() => handleRejectTx(tx._id)} disabled={submitting}>
                                  <FontAwesomeIcon icon={faTimes} /> Từ chối
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Biểu đồ + Đóng góp thành viên — 2 cột */}
              <div className="fund-middle-grid">

                {/* Pie: Chi theo loại hóa đơn THÁNG NÀY */}
                <div className="fund-chart-card">
                  <h2>Chi tiêu hóa đơn tháng này</h2>
                  {roomStats.roomPieData.length === 0 ? (
                    <div className="empty-inline">Chưa có hóa đơn nào phát sinh trong tháng.</div>
                  ) : (
                    <div className="pie-layout">
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie
                            data={roomStats.roomPieData}
                            dataKey="value" nameKey="name"
                            innerRadius={56} outerRadius={88} paddingAngle={3}
                          >
                            {roomStats.roomPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={v => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-legend">
                        {roomStats.roomPieData.map((item, i) => (
                          <div key={i} className="legend-item">
                            <span className="dot" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <div>
                              <strong>{item.name}</strong>
                              <p>{fmt(item.value)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Đóng góp thành viên */}
                <div className="fund-chart-card">
                  <h2><FontAwesomeIcon icon={faCoins} /> Đóng góp thành viên</h2>
                  {roomStats.memberContribs.length === 0 ? (
                    <div className="empty-inline">Chưa có ai đóng quỹ.</div>
                  ) : (
                    <div className="member-contrib-list">
                      {roomStats.memberContribs.map((m, i) => (
                        <div key={i} className="member-contrib-row">
                          <div className="mc-avatar">{getInitials(m.name)}</div>
                          <div className="mc-info">
                            <span className="mc-name">{m.name}</span>
                            <div className="mc-bar-track">
                              <div className="mc-bar-fill" style={{
                                width: roomStats.totalDeposit > 0
                                  ? `${Math.min(100, (m.amount / roomStats.totalDeposit) * 100)}%` : '0%',
                              }} />
                            </div>
                          </div>
                          <span className="mc-amount">{fmt(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lịch sử phòng */}
              <div className="fund-chart-card full">
                <h2>Lịch sử thu chi phòng</h2>
                {loading ? <div className="empty-inline">Đang tải...</div>
                  : historyRows.length === 0 ? <div className="empty-inline">Chưa có giao dịch nào.</div>
                  : <HistoryTable rows={historyRows} onThumb={setLightboxSrc} />}
              </div>
            </>
          )}

          {/* ══════ TAB: CÁ NHÂN ══════ */}
          {mode === 'personal' && (
            <>
              {/* Quick action buttons — banking style */}
              <div className="qa-row">
                <button className="qa-btn" onClick={() => { setError(''); setShowDeposit(true); }}>
                  <span className="qa-icon"><FontAwesomeIcon icon={faArrowUp} /></span>
                  <span className="qa-label">Nạp tiền</span>
                </button>
                <button className="qa-btn" onClick={() => { setError(''); setShowWithdraw(true); }}>
                  <span className="qa-icon"><FontAwesomeIcon icon={faMoneyBillTransfer} /></span>
                  <span className="qa-label">Rút tiền</span>
                </button>
                <button className="qa-btn" onClick={() => setShowHistory(true)}>
                  <span className="qa-icon"><FontAwesomeIcon icon={faClockRotateLeft} /></span>
                  <span className="qa-label">Lịch sử</span>
                </button>
                <button className="qa-btn" onClick={() => setMode('room')}>
                  <span className="qa-icon"><FontAwesomeIcon icon={faChartPie} /></span>
                  <span className="qa-label">Thống kê</span>
                </button>
              </div>

              {/* Personal stats */}
              <div className="fund-overview-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginTop: 16 }}>
                <div className="overview-card">
                  <span>Tôi đã nạp</span>
                  <strong style={{ color: '#0d9488' }}>{fmt(personalStats.myDeposit)}</strong>
                  <small><FontAwesomeIcon icon={faArrowUp} /> Đóng quỹ</small>
                </div>
                <div className="overview-card">
                  <span>Hóa đơn của tôi</span>
                  <strong style={{ color: '#dc2626' }}>{fmt(personalStats.myBillTotal)}</strong>
                  <small><FontAwesomeIcon icon={faFileInvoiceDollar} /> Phân bổ</small>
                </div>
                <div className="overview-card">
                  <span>Chênh lệch</span>
                  <strong style={{ color: personalStats.diff >= 0 ? '#0d9488' : '#dc2626' }}>
                    {fmt(personalStats.diff)}
                  </strong>
                  <small>{personalStats.diff >= 0 ? '✔ Đủ / dư' : '⚠ Còn thiếu'}</small>
                </div>
              </div>

              {/* Biểu đồ cá nhân */}
              <div className="fund-middle-grid" style={{ marginTop: 14 }}>
                <div className="fund-chart-card">
                  <h2>Chi phí của tôi theo loại</h2>
                  {personalStats.myPieData.length === 0 ? (
                    <div className="empty-inline">Bạn chưa có hóa đơn phân bổ nào.</div>
                  ) : (
                    <div className="pie-layout">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={personalStats.myPieData} dataKey="value" nameKey="name"
                            innerRadius={54} outerRadius={86} paddingAngle={3}>
                            {personalStats.myPieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={v => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-legend">
                        {personalStats.myPieData.map((item, i) => (
                          <div key={i} className="legend-item">
                            <span className="dot" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <div><strong>{item.name}</strong><p>{fmt(item.value)}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Giao dịch cá nhân gần nhất */}
                <div className="fund-chart-card">
                  <h2>Giao dịch gần nhất của tôi</h2>
                  <HistoryTable
                    rows={personalHistoryRows.slice(0, 5)}
                    onThumb={setLightboxSrc}
                    compact
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════ */}

      {/* Deposit modal */}
      {showDeposit && (
        <div className="modal-overlay" onClick={() => setShowDeposit(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faArrowUp} /> Nạp tiền vào quỹ</h2>
              <button className="btn-close-modal" onClick={() => setShowDeposit(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert-error" style={{ marginBottom: 10 }}>{error}</div>}
              <div className="form-group">
                <label>Số tiền *</label>
                <input type="number" min="1000" placeholder="500000"
                  value={depositForm.amount}
                  onChange={e => setDepositForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <input type="text" placeholder="Đóng quỹ tháng 4..."
                  value={depositForm.description}
                  onChange={e => setDepositForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faCamera} /> Ảnh minh chứng (tối đa 3)</label>
                {depositForm.proofImages.length < 3 && (
                  <label className="proof-upload-area">
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleSelectProof} />
                    <div className="proof-upload-inner">
                      <FontAwesomeIcon icon={faCamera} className="proof-upload-icon" />
                      <span>Chọn ảnh chuyển khoản</span>
                      <small>JPG, PNG — tối đa 3</small>
                    </div>
                  </label>
                )}
                {depositForm.proofImages.length > 0 && (
                  <div className="proof-preview-grid">
                    {depositForm.proofImages.map((src, i) => (
                      <div key={i} className="proof-preview-item">
                        <img src={src} alt="proof" onClick={() => setLightboxSrc(src)} />
                        <button className="proof-remove-btn"
                          onClick={() => setDepositForm(p => ({ ...p, proofImages: p.proofImages.filter((_, j) => j !== i) }))}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="hint-text">{depositForm.proofImages.length}/3 ảnh</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeposit(false)} disabled={submitting}>Hủy</button>
              <button className="btn-submit" onClick={handleSaveDeposit} disabled={submitting}>
                {submitting ? 'Đang lưu...' : <><FontAwesomeIcon icon={faCheck} /> Xác nhận nạp</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faMoneyBillTransfer} /> Rút tiền từ quỹ</h2>
              <button className="btn-close-modal" onClick={() => setShowWithdraw(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert-error" style={{ marginBottom: 10 }}>{error}</div>}
              <div className="form-group">
                <span className="fund-balance-hint">Số dư hiện tại: <strong>{fmt(fundBalance)}</strong></span>
              </div>
              <div className="form-group">
                <label>Số tiền rút *</label>
                <input type="number" min="1000" placeholder="200000"
                  value={withdrawForm.amount}
                  onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Lý do rút *</label>
                <input type="text" placeholder="Mua đồ vệ sinh / chi phí chung..."
                  value={withdrawForm.description}
                  onChange={e => setWithdrawForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label><FontAwesomeIcon icon={faCamera} /> Ảnh minh chứng (tối đa 3)</label>
                {withdrawForm.proofImages.length < 3 && (
                  <label className="proof-upload-area">
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []).slice(0, 3);
                        if (!files.length) return;
                        try {
                          const b64s = await Promise.all(files.map(fileToBase64));
                          setWithdrawForm(p => ({ ...p, proofImages: [...p.proofImages, ...b64s].slice(0, 3) }));
                        } catch { setError('Không thể đọc file ảnh'); }
                      }} />
                    <div className="proof-upload-inner">
                      <FontAwesomeIcon icon={faCamera} className="proof-upload-icon" />
                      <span>Chọn ảnh minh chứng hoặc hóa đơn mua đồ</span>
                      <small>JPG, PNG — tối đa 3</small>
                    </div>
                  </label>
                )}
                {withdrawForm.proofImages.length > 0 && (
                  <div className="proof-preview-grid">
                    {withdrawForm.proofImages.map((src, i) => (
                      <div key={i} className="proof-preview-item">
                        <img src={src} alt="proof" onClick={() => setLightboxSrc(src)} />
                        <button className="proof-remove-btn"
                          onClick={() => setWithdrawForm(p => ({ ...p, proofImages: p.proofImages.filter((_, j) => j !== i) }))}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="hint-text">{withdrawForm.proofImages.length}/3 ảnh</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowWithdraw(false)} disabled={submitting}>Hủy</button>
              <button className="btn-submit btn-withdraw" onClick={handleSaveWithdraw} disabled={submitting}>
                {submitting ? 'Đang lưu...' : <><FontAwesomeIcon icon={faArrowDown} /> Xác nhận rút</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal (từ nút Lịch sử của tab cá nhân) */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-container modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faClockRotateLeft} /> Lịch sử quỹ của tôi</h2>
              <button className="btn-close-modal" onClick={() => setShowHistory(false)}><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <HistoryTable
                rows={personalHistoryRows}
                onThumb={setLightboxSrc}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxSrc(null)}><FontAwesomeIcon icon={faTimes} /></button>
            <img src={lightboxSrc} alt="Minh chứng" />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── HistoryTable sub-component ─── */
const HistoryTable = ({ rows, onThumb, compact }) => {
  if (!rows || rows.length === 0) return <div className="empty-inline">Không có dữ liệu.</div>;
  return (
    <div className="transaction-table-wrap">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Nội dung</th>
            {!compact && <><th>Nạp</th><th>Trừ</th></>}
            <th>Ảnh</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id + idx}>
              <td className="td-date">{fmtDate(row.date)}</td>
              <td>
                <div className="tx-main-label">
                  {row.label}
                  {row.status === 'pending' && <span className="badge-pending" style={{ marginLeft: 8, fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fcd34d' }}>Chờ duyệt</span>}
                  {row.status === 'rejected' && <span className="badge-rejected" style={{ marginLeft: 8, fontSize: '10px', background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fecaca' }}>Từ chối</span>}
                </div>
                {row.note && <div className="tx-note">{row.note}</div>}
              </td>
              {!compact && (
                <>
                  <td className="td-num">
                    {row.type === 'deposit'
                      ? <span className="tx-amount in">+{new Intl.NumberFormat('vi-VN').format(row.amount)}</span>
                      : <span className="tx-dash">—</span>}
                  </td>
                  <td className="td-num">
                    {row.type !== 'deposit'
                      ? <span className="tx-amount out">−{new Intl.NumberFormat('vi-VN').format(row.amount)}</span>
                      : <span className="tx-dash">—</span>}
                  </td>
                </>
              )}
              <td>
                {row.proofImages?.length > 0 ? (
                  <div className="tx-thumbs">
                    {row.proofImages.map((src, i) => (
                      <button key={i} className="tx-thumb-btn" onClick={() => onThumb(src)}>
                        <img src={src} alt="proof" />
                        <span className="tx-thumb-overlay"><FontAwesomeIcon icon={faExpand} /></span>
                      </button>
                    ))}
                  </div>
                ) : <span className="tx-dash">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseSharing;
