import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb,
  faDroplet,
  faWifi,
  faHouse,
  faFileAlt,
  faArrowDown,
  faArrowUp,
  faDownload,
  faMinus,
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import billService from '../services/bill.service.js';
import fundService from '../services/fund.service.js';
import PageHeader from './PageHeader.jsx';
import '../styles/financial.report.css';

/* ─── helpers ─── */
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n ?? 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const BILL_TYPE_LABEL = {
  electricity: 'Tiền Điện',
  water:       'Tiền Nước',
  internet:    'Tiền Internet',
  rent:        'Tiền Thuê',
  other:       'Khác',
};

const BILL_TYPE_ICON = {
  electricity: faLightbulb,
  water:       faDroplet,
  internet:    faWifi,
  rent:        faHouse,
  other:       faFileAlt,
};

/* ─── Row builder ─── */
/**
 * Chuyển bills & fund transactions → danh sách rows đã sắp xếp theo ngày asc
 * mỗi row: { id, date, label, category, type: 'expense'|'income', amount, note, status }
 */
const buildRows = (bills, fundTransactions) => {
  const rows = [];
  const completedWithdrawTransactions = (fundTransactions || []).filter(
    (tx) => tx?.type === 'withdraw' && tx?.status === 'completed'
  );
  const completedWithdrawByBill = new Set(
    completedWithdrawTransactions
      .map((tx) => String(tx?.related_bill || ''))
      .filter(Boolean)
  );

  // Hóa đơn = chi tiêu
  (bills || []).forEach((bill) => {
    const billId = String(bill?._id || '');
    const billTypeLabel = bill.bill_type === 'other'
      ? (bill.bill_type_other || 'Hóa đơn khác')
      : (BILL_TYPE_LABEL[bill.bill_type] || 'Hóa đơn');
    const billMonthText = bill.billing_month ? `(Tháng ${bill.billing_month})` : '';

    // Tránh double count: bill đã thanh toán bằng quỹ (cờ trực tiếp, liên kết related_bill, hoặc dữ liệu cũ theo mô tả)
    const isPaidByFund = Boolean(
      bill.is_paid_by_fund
      || (billId && completedWithdrawByBill.has(billId))
      || completedWithdrawTransactions.some((tx) =>
        Math.abs(Number(tx.amount) || 0) === (Number(bill.total_amount) || 0)
        && (tx.description || '').includes(billTypeLabel)
        && (!billMonthText || (tx.description || '').includes(billMonthText))
      )
    );
    if (isPaidByFund) return;

    rows.push({
      id:       bill._id,
      date:     new Date(bill.bill_date || bill.created_at || bill.createdAt),
      label:    bill.bill_type === 'other'
                  ? (bill.bill_type_other || 'Hóa đơn khác')
                  : BILL_TYPE_LABEL[bill.bill_type] || 'Hóa đơn',
      category: 'Hóa đơn',
      icon:     BILL_TYPE_ICON[bill.bill_type] || faFileAlt,
      type:     'expense',
      amount:   Number(bill.total_amount) || 0,
      note:     bill.note || '',
      status:   bill.status,         // pending | partial | completed
      month:    bill.billing_month,
    });
  });

  // Quỹ deposit = thu; withdraw = chi
  (fundTransactions || []).forEach((tx) => {
    if (!tx || !tx.type) return;
    if (tx.type === 'withdraw' && tx.status !== 'completed') return;
    if (tx.type === 'deposit' && tx.status && tx.status !== 'completed') return;

    rows.push({
      id:       tx._id,
      date:     new Date(tx.created_at || tx.createdAt),
      label:    tx.type === 'deposit' ? 'Nạp tiền quỹ' : 'Rút quỹ',
      category: 'Quỹ phòng',
      icon:     tx.type === 'deposit' ? faArrowUp : faArrowDown,
      type:     tx.type === 'deposit' ? 'income' : 'expense',
      amount:   Math.abs(Number(tx.amount)) || 0,
      note:     (tx.type === 'deposit' ? 'Người nạp: ' : 'Người rút: ') + 
                (tx.performed_by?.full_name || tx.performed_by?.name || tx.performed_by?.email || 'Thành viên') +
                (tx.description ? ` - ${tx.description}` : ''),
      status:   tx.status || '',
      month:    (() => {
        const d = new Date(tx.created_at || tx.createdAt);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      })(),
    });
  });

  // Sắp xếp tăng dần theo ngày
  rows.sort((a, b) => a.date - b.date);
  return rows;
};

/* ─── Component ─── */
const FinancialReport = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(
    () => localStorage.getItem('currentRoomId') || ''
  );
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  });
  const [bills, setBills] = useState([]);
  const [fundTx, setFundTx] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* Sync phòng từ sidebar */
  useEffect(() => {
    const sync = (e) => {
      const id = e?.detail?.roomId || localStorage.getItem('currentRoomId') || '';
      setSelectedRoomId(id);
    };
    sync();
    window.addEventListener('room-selected', sync);
    return () => window.removeEventListener('room-selected', sync);
  }, []);

  /* Fetch data khi chọn phòng */
  useEffect(() => {
    if (!selectedRoomId) { setBills([]); setFundTx([]); return; }
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [b, fd] = await Promise.all([
          billService.getBillsByRoom(selectedRoomId),
          fundService.getFundDetail(selectedRoomId),
        ]);
        setBills(Array.isArray(b) ? b : []);
        const txList = Array.isArray(fd?.transactions) ? fd.transactions : [];
        const uniqueTx = Array.from(
          new Map(
            txList.map((tx) => [String(tx?._id || `${tx?.type}-${tx?.created_at}-${tx?.amount}`), tx])
          ).values()
        );
        setFundTx(uniqueTx);
      } catch (err) {
        setError(err.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRoomId]);

  /* Build all rows */
  const allRows = useMemo(() => buildRows(bills, fundTx), [bills, fundTx]);

  /* Filter theo tháng */
  const rows = useMemo(() => {
    const filtered = !filterMonth
      ? allRows
      : allRows.filter((r) => r.month === filterMonth);

    const sortedAsc = [...filtered].sort((a, b) => a.date - b.date);
    let balance = 0;
    const withBalance = sortedAsc.map((row) => {
      balance += row.type === 'income' ? row.amount : -row.amount;
      return { ...row, balance };
    });

    return withBalance.reverse();
  }, [allRows, filterMonth]);

  /* Summary */
  const totalIncome  = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const finalBalance = rows.length > 0 ? rows[0].balance : 0;

  /* Export Excel (.xlsx) — SheetJS, tiếng Việt hoàn hảo */
  const exportXLSX = () => {
    // Header row
    const headerRow = ['STT', 'Ngày', 'Khoản mục', 'Danh mục', 'Thu (VND)', 'Chi (VND)', 'Số dư (VND)', 'Ghi chú'];

    // Data rows
    const dataRows = rows.map((r, idx) => [
      idx + 1,
      fmtDate(r.date),
      r.label,
      r.category,
      r.type === 'income'  ? r.amount : '',
      r.type === 'expense' ? r.amount : '',
      r.balance,
      r.note || '',
    ]);

    // Footer tổng kỳ
    const footerRow = [
      '', `Cộng kỳ ${filterMonth}`, '', '',
      totalIncome, totalExpense, finalBalance, '',
    ];

    const wsData = [headerRow, ...dataRows, footerRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Độ rộng cột
    ws['!cols'] = [
      { wch: 5  },  // STT
      { wch: 12 },  // Ngày
      { wch: 24 },  // Khoản mục
      { wch: 12 },  // Danh mục
      { wch: 16 },  // Thu
      { wch: 16 },  // Chi
      { wch: 18 },  // Số dư
      { wch: 28 },  // Ghi chú
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Tháng ${filterMonth}`);
    XLSX.writeFile(wb, `bao-cao-tai-chinh-${filterMonth}.xlsx`);
  };

  return (
    <div className="fr-page">
      {/* ── HEADER ── */}
      <PageHeader 
        title="Báo Cáo Tài Chính"
        actions={
          <>
            <input
              type="month"
              className="fr-month-input"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
            <button className="fr-btn-export" onClick={exportXLSX} disabled={rows.length === 0}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel (.xlsx)
            </button>
          </>
        }
      />

      {/* ── TRẠNG THÁI ── */}
      {!selectedRoomId && (
        <div className="fr-empty">Vui lòng chọn phòng ở sidebar để xem báo cáo.</div>
      )}
      {selectedRoomId && loading && (
        <div className="fr-empty">Đang tải dữ liệu...</div>
      )}
      {selectedRoomId && error && (
        <div className="fr-error">{error}</div>
      )}

      {selectedRoomId && !loading && !error && (
        <>
          {/* ── SUMMARY CARDS ── */}
          <div className="fr-stats">
            <div className="fr-stat-card">
              <span className="fr-stat-label">Tổng Thu</span>
              <div className="fr-stat-value c-income">{fmt(totalIncome)}</div>
              <div className="fr-stat-strip income-strip" />
            </div>
            <div className="fr-stat-card">
              <span className="fr-stat-label">Tổng Chi</span>
              <div className="fr-stat-value c-expense">{fmt(totalExpense)}</div>
              <div className="fr-stat-strip expense-strip" />
            </div>
            <div className="fr-stat-card">
              <span className="fr-stat-label">Số Dư Cuối Kỳ</span>
              <div className={`fr-stat-value ${finalBalance >= 0 ? 'c-balance' : 'c-expense'}`}>
                {fmt(finalBalance)}
              </div>
              <div className="fr-stat-strip balance-strip" />
            </div>
          </div>

          {/* ── BẢNG SỔ CÁI ── */}
          {rows.length === 0 ? (
            <div className="fr-empty">Không có dữ liệu cho tháng {filterMonth}.</div>
          ) : (
            <div className="fr-table-wrap">
              <table className="fr-table">
                <thead>
                  <tr>
                    <th className="col-stt">STT</th>
                    <th className="col-date">Ngày</th>
                    <th className="col-label">Khoản mục</th>
                    <th className="col-cat">Danh mục</th>
                    <th className="col-num">Thu (VND)</th>
                    <th className="col-num">Chi (VND)</th>
                    <th className="col-num">Số dư (VND)</th>
                    <th className="col-note">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id + idx} className={`fr-row ${row.type}-row`}>
                      <td className="col-stt tc">{idx + 1}</td>
                      <td className="col-date">{fmtDate(row.date)}</td>
                      <td className="col-label">
                        <span className="fr-label-wrap">
                          <FontAwesomeIcon icon={row.icon} className="fr-row-icon" />
                          {row.label}
                        </span>
                      </td>
                      <td className="col-cat">
                        <span className={`fr-cat-tag cat-${row.category === 'Quỹ phòng' ? 'fund' : 'bill'}`}>
                          {row.category}
                        </span>
                      </td>
                      <td className="col-num tr">
                        {row.type === 'income'
                          ? <span className="c-income fw">{fmt(row.amount)}</span>
                          : <span className="c-muted"><FontAwesomeIcon icon={faMinus} /></span>}
                      </td>
                      <td className="col-num tr">
                        {row.type === 'expense'
                          ? <span className="c-expense fw">{fmt(row.amount)}</span>
                          : <span className="c-muted"><FontAwesomeIcon icon={faMinus} /></span>}
                      </td>
                      <td className={`col-num tr fw ${row.balance >= 0 ? 'c-balance' : 'c-expense'}`}>
                        {fmt(row.balance)}
                      </td>
                      <td className="col-note c-muted">{row.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="fr-tfoot">
                    <td colSpan={4} className="tfoot-label">Cộng kỳ {filterMonth}</td>
                    <td className="col-num tr fw c-income">{fmt(totalIncome)}</td>
                    <td className="col-num tr fw c-expense">{fmt(totalExpense)}</td>
                    <td className={`col-num tr fw ${finalBalance >= 0 ? 'c-balance' : 'c-expense'}`}>
                      {fmt(finalBalance)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialReport;
