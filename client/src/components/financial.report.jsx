import React, { useState, useRef } from 'react';
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
  faFilePdf,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/financial.report.css';

const FinancialReport = () => {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('2024-04');
  const [showExportModal, setShowExportModal] = useState(false);
  const reportRef = useRef(null);

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

  const generateFileName = (format) => {
    const date = new Date().toISOString().split('T')[0];
    const room = selectedRoom === 'all' ? 'all-rooms' : selectedRoom;
    const month = selectedMonth.replace('-', '-');
    return `financial-report-${room}-${month}.${format}`;
  };

  const exportAsImage = async () => {
    createSimpleImageExport();
  };

  const createSimpleImageExport = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#2d3748';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('BÁO CÁO TÀI CHÍNH', 50, 50);

      // Month info
      ctx.font = '16px Arial';
      ctx.fillStyle = '#718096';
      ctx.fillText(`Tháng: ${selectedMonth} | Phòng: ${selectedRoom}`, 50, 100);

      // Line separator
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 120);
      ctx.lineTo(canvas.width - 50, 120);
      ctx.stroke();

      // Data section
      let y = 160;
      ctx.font = '18px Arial';
      ctx.fillStyle = '#2d3748';

      ctx.fillText(`Tổng Thu Nhập: ${formatCurrency(data.totalIncome)}`, 50, y);
      y += 50;
      ctx.fillText(`Tổng Chi Tiêu: ${formatCurrency(data.totalExpense)}`, 50, y);
      y += 50;
      ctx.fillText(`Số Dư: ${formatCurrency(data.balance)}`, 50, y);
      y += 80;

      // Expense breakdown
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#667eea';
      ctx.fillText('CHI TIÊU CHI TIẾT', 50, y);
      y += 40;

      ctx.font = '14px Arial';
      ctx.fillStyle = '#4a5568';
      expenseBreakdown.forEach((item) => {
        ctx.fillText(`${item.name}: ${formatCurrency(item.amount)} (${item.percentage}%)`, 50, y);
        y += 35;
      });

      // Footer
      ctx.font = '12px Arial';
      ctx.fillStyle = '#a0aec0';
      ctx.fillText(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, 50, canvas.height - 30);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = generateFileName('png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
      alert('Xuất ảnh thành công!');
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Không thể xuất ảnh. Vui lòng thử lại.');
    }
  };

  const exportAsPDF = async () => {
    createSimplePDFExport();
  };

  const createSimplePDFExport = () => {
    try {
      // Create a simple text-based PDF using canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');

      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#2d3748';
      ctx.font = 'bold 48px Arial';
      ctx.fillText('BÁO CÁO TÀI CHÍNH', 50, 80);

      // Header info
      ctx.font = '18px Arial';
      ctx.fillStyle = '#718096';
      ctx.fillText(`Tháng: ${selectedMonth}`, 50, 150);
      ctx.fillText(`Phòng: ${selectedRoom}`, 50, 190);
      ctx.fillText(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, 50, 230);

      // Line separator
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(50, 260);
      ctx.lineTo(canvas.width - 50, 260);
      ctx.stroke();

      // Data section
      let y = 350;
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#2d3748';
      ctx.fillText('TỔNG QUAN TÀI CHÍNH', 50, y);

      y += 80;
      ctx.font = '20px Arial';
      ctx.fillStyle = '#667eea';
      ctx.fillText(`Tổng Thu Nhập: ${formatCurrency(data.totalIncome)}`, 50, y);
      y += 60;

      ctx.fillStyle = '#f56565';
      ctx.fillText(`Tổng Chi Tiêu: ${formatCurrency(data.totalExpense)}`, 50, y);
      y += 60;

      ctx.fillStyle = '#48bb78';
      ctx.fillText(`Số Dư: ${formatCurrency(data.balance)}`, 50, y);

      // Expense breakdown section
      y += 120;
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#2d3748';
      ctx.fillText('CHI TIÊU CHI TIẾT', 50, y);

      y += 70;
      ctx.font = '18px Arial';
      ctx.fillStyle = '#4a5568';
      expenseBreakdown.forEach((item) => {
        ctx.fillText(`• ${item.name}`, 50, y);
        ctx.fillText(`  Số tiền: ${formatCurrency(item.amount)}`, 80, y + 40);
        ctx.fillText(`  Tỷ lệ: ${item.percentage}%`, 80, y + 80);
        y += 130;
      });

      // Monthly stats
      y += 50;
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#2d3748';
      ctx.fillText('THỐNG KÊ 3 THÁNG GẦN NHẤT', 50, y);

      y += 70;
      ctx.font = '16px Arial';
      ctx.fillStyle = '#4a5568';
      monthlyStats.forEach((stat) => {
        ctx.fillText(`${stat.month}:`, 50, y);
        ctx.fillText(`  Thu: ${formatCurrency(stat.income)}`, 80, y + 35);
        ctx.fillText(`  Chi: ${formatCurrency(stat.expense)}`, 80, y + 70);
        ctx.fillText(`  Lãi: ${formatCurrency(stat.income - stat.expense)}`, 80, y + 105);
        y += 150;
      });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = generateFileName('pdf.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportModal(false);
      alert('Xuất báo cáo thành công! (Định dạng PNG)');
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Không thể xuất báo cáo. Vui lòng thử lại.');
    }
  };

  const handleOpenExportModal = () => {
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  const handleExportPDF = () => {
    exportAsPDF();
  };

  const handleExportImage = () => {
    exportAsImage();
  };

  return (
    <div className="financial-report">
      <div className="report-header">
        <div className="header-content">
          <h1>Báo Cáo Tài Chính</h1>
          <p>Xem chi tiết thu chi, số dư và tạo báo cáo tài chính định kỳ</p>
        </div>
        <div className="header-actions">
          <button className="btn-print" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> In
          </button>
          <button className="btn-export" onClick={handleOpenExportModal}>
            <FontAwesomeIcon icon={faDownload} /> Xuất File
          </button>
        </div>
      </div>

      <div ref={reportRef} className="report-content">
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

      {showExportModal && (
        <div className="modal-overlay">
          <div className="export-modal">
            <div className="modal-header">
              <h2>Chọn Định Dạng Xuất File</h2>
              <button className="btn-close-modal" onClick={handleCloseExportModal}>✕</button>
            </div>
            <div className="modal-content">
              <p>Vui lòng chọn định dạng file bạn muốn xuất:</p>
              <div className="export-options">
                <button className="export-option pdf-option" onClick={handleExportPDF}>
                  <FontAwesomeIcon icon={faFilePdf} className="option-icon" />
                  <span className="option-title">Xuất PDF</span>
                  <span className="option-desc">Định dạng PDF chuyên nghiệp</span>
                </button>
                <button className="export-option image-option" onClick={handleExportImage}>
                  <FontAwesomeIcon icon={faImage} className="option-icon" />
                  <span className="option-title">Xuất Ảnh (PNG)</span>
                  <span className="option-desc">Định dạng hình ảnh PNG</span>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={handleCloseExportModal}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReport;
