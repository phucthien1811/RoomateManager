import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faDownload,
  faChartBar,
  faTrophy,
  faDollarSign,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faPrint,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/financial.report.css';

const FinancialReport = () => {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('2024-04');

  const financialData = {
    all: {
      totalIncome: 12550000,
      totalExpense: 8420000,
      balance: 4130000,
      lastMonthIncome: 12000000,
      lastMonthExpense: 7800000,
    },
    'Trần Hùng Đạo': {
      totalIncome: 3650000,
      totalExpense: 2450000,
      balance: 1200000,
      lastMonthIncome: 3550000,
      lastMonthExpense: 2300000,
    },
    'An Dương Vương': {
      totalIncome: 4850000,
      totalExpense: 3220000,
      balance: 1630000,
      lastMonthIncome: 4500000,
      lastMonthExpense: 3100000,
    },
    'Lạc Long Quân': {
      totalIncome: 4050000,
      totalExpense: 2750000,
      balance: 1300000,
      lastMonthIncome: 3950000,
      lastMonthExpense: 2400000,
    },
  };

  const expenseBreakdown = [
    { name: 'Tiền Thuê', amount: 3400000, percentage: 40 },
    { name: 'Điện', amount: 850000, percentage: 10 },
    { name: 'Nước', amount: 425000, percentage: 5 },
    { name: 'Internet', amount: 550000, percentage: 7 },
    { name: 'Khác', amount: 2795000, percentage: 38 },
  ];

  const monthlyStats = [
    { month: 'Tháng 2/2024', income: 11200000, expense: 7200000 },
    { month: 'Tháng 3/2024', income: 12000000, expense: 7800000 },
    { month: 'Tháng 4/2024', income: 12550000, expense: 8420000 },
  ];

  const data = financialData[selectedRoom];

  const calculatePercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  const calculateChange = (current, previous) => {
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    return {
      amount: change,
      percentage: percentage,
      isPositive: change > 0,
    };
  };

  const incomeChange = calculateChange(data.totalIncome, data.lastMonthIncome);
  const expenseChange = calculateChange(data.totalExpense, data.lastMonthExpense);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleExportPDF = () => {
    alert('Tính năng xuất PDF sẽ được phát triển. Đây là giao diện demo.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="financial-report">
      <div className="report-header">
        <div className="header-content">
          <h1>Báo Cáo Tài Chính</h1>
          <p>Xem chi tiết thu chi, số dư và tạo báo cáo tài chính định kỳ</p>
        </div>
        <div className="header-actions">
          <button className="btn-print" onClick={handlePrint}>
            <FontAwesomeIcon icon={faPrint} /> In
          </button>
          <button className="btn-export" onClick={handleExportPDF}>
            <FontAwesomeIcon icon={faDownload} /> Xuất PDF
          </button>
        </div>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <label>Chọn Phòng:</label>
          <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
            <option value="all">Tất Cả Phòng</option>
            <option value="Trần Hùng Đạo">Trần Hùng Đạo</option>
            <option value="An Dương Vương">An Dương Vương</option>
            <option value="Lạc Long Quân">Lạc Long Quân</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Tháng:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-header">
            <span className="stat-label">Tổng Thu Nhập</span>
            <span className={`stat-change ${incomeChange.isPositive ? 'positive' : 'negative'}`}>
              <FontAwesomeIcon icon={incomeChange.isPositive ? faArrowUp : faArrowDown} />
              {Math.abs(incomeChange.percentage)}%
            </span>
          </div>
          <div className="stat-value">{formatCurrency(data.totalIncome)}</div>
          <small className="stat-detail">
            {incomeChange.isPositive ? '+' : ''}{formatCurrency(incomeChange.amount)} so với tháng trước
          </small>
        </div>

        <div className="stat-card expense">
          <div className="stat-header">
            <span className="stat-label">Tổng Chi Tiêu</span>
            <span className={`stat-change ${!expenseChange.isPositive ? 'positive' : 'negative'}`}>
              <FontAwesomeIcon icon={!expenseChange.isPositive ? faArrowDown : faArrowUp} />
              {Math.abs(expenseChange.percentage)}%
            </span>
          </div>
          <div className="stat-value">{formatCurrency(data.totalExpense)}</div>
          <small className="stat-detail">
            {expenseChange.isPositive ? '+' : ''}{formatCurrency(expenseChange.amount)} so với tháng trước
          </small>
        </div>

        <div className="stat-card balance">
          <div className="stat-header">
            <span className="stat-label">Số Dư</span>
            <FontAwesomeIcon icon={faTrophy} className="stat-icon" />
          </div>
          <div className="stat-value">{formatCurrency(data.balance)}</div>
          <small className="stat-detail">
            Tỷ lệ: {calculatePercentage(data.balance, data.totalIncome)}%
          </small>
        </div>
      </div>

      <div className="report-body">
        <div className="section left-section">
          <div className="section-card">
            <h2 className="section-title">Chi Tiêu Chi Tiết</h2>
            <div className="expense-breakdown">
              {expenseBreakdown.map((item, idx) => (
                <div key={idx} className="expense-item">
                  <div className="expense-info">
                    <span className="expense-name">{item.name}</span>
                    <span className="expense-percentage">{item.percentage}%</span>
                  </div>
                  <div className="expense-bar-container">
                    <div
                      className="expense-bar"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="expense-amount">{formatCurrency(item.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section right-section">
          <div className="section-card">
            <h2 className="section-title">Thống Kê 3 Tháng Gần Nhất</h2>
            <div className="monthly-stats">
              {monthlyStats.map((stat, idx) => (
                <div key={idx} className="monthly-item">
                  <div className="monthly-header">
                    <span className="monthly-month">{stat.month}</span>
                  </div>
                  <div className="monthly-values">
                    <div className="value-item">
                      <span className="label">Thu:</span>
                      <span className="value income">{formatCurrency(stat.income)}</span>
                    </div>
                    <div className="value-item">
                      <span className="label">Chi:</span>
                      <span className="value expense">{formatCurrency(stat.expense)}</span>
                    </div>
                    <div className="value-item">
                      <span className="label">Lãi:</span>
                      <span className="value balance">
                        {formatCurrency(stat.income - stat.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="report-footer">
        <div className="footer-note">
          <FontAwesomeIcon icon={faFileAlt} />
          <p>
            Báo cáo này được tạo automatically. Để được trợ giúp, vui lòng liên hệ quản trị viên hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialReport;
