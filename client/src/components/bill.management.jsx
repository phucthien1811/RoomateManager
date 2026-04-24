import React, { useState, useEffect, useMemo } from 'react';
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
  faHourglassHalf,
  faUsers,
  faReceipt,
  faChartPie,
  faFileInvoiceDollar,
  faCamera,
  faImages,
  faExpand,
  faChevronDown,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import billService from '../services/bill.service.js';
import roomService from '../services/room.service.js';
import absenceService from '../services/absence.service.js';
import fundService from '../services/fund.service.js';
import PageHeader from './PageHeader.jsx';
import '../styles/bill.management.css';

/* ─── helpers ─────────────────────────── */
const formatCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('vi-VN') : '—';

const getInitials = (name = '') =>
  name.trim().split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() || '?';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });

const BILL_TYPES = [
  { key: 'electricity', label: 'Điện',    icon: faLightbulb,       cls: 'electric' },
  { key: 'water',       label: 'Nước',    icon: faDroplet,          cls: 'water'    },
  { key: 'internet',    label: 'Internet', icon: faWifi,            cls: 'internet' },
  { key: 'rent',        label: 'Thuê',    icon: faHouse,            cls: 'rent'     },
  { key: 'other',       label: 'Khác',    icon: faFileAlt,          cls: 'other'    },
];

const getBillTypeMeta = (key) => BILL_TYPES.find((t) => t.key === key) || BILL_TYPES[4];

const buildSplitParticipants = (members = [], awayIds = []) => {
  const available = members.filter((m) => !awayIds.includes(String(m._id)));
  const eq = available.length > 0 ? Math.floor((100 / available.length) * 100) / 100 : 0;

  return members.map((m) => {
    const isAway = awayIds.includes(String(m._id));
    const displayName = m.name || (m.email ? m.email.split('@')[0] : 'Thành viên');
    if (isAway) {
      return {
        member_id: m._id,
        name: displayName,
        email: m.email || '',
        selected: false,
        split_mode: 'percent',
        split_value: '',
        isAway: true,
      };
    }

    const idx = available.findIndex((a) => String(a._id) === String(m._id));
    const isLast = idx === available.length - 1;
    const pct = isLast ? Number((100 - eq * (available.length - 1)).toFixed(2)) : eq;
    return {
      member_id: m._id,
      name: displayName,
      email: m.email || '',
      selected: true,
      split_mode: 'percent',
      split_value: String(pct),
      isAway: false,
    };
  });
};

/* ─── Component ──────────────────────── */
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
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [awayMemberIds, setAwayMemberIds] = useState([]);
  const [splitParticipants, setSplitParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  // RM-8: Image upload state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalBill, setImageModalBill] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);   // base64 preview sebelum save
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null); // lightbox src
  const [uploadingImages, setUploadingImages] = useState(false);

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

  /* — fetch on mount — */
  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    const apply = (roomId) => { if (roomId) setSelectedRoomId(roomId); };
    apply(localStorage.getItem('currentRoomId'));
    const handler = (e) => apply(e.detail?.roomId || localStorage.getItem('currentRoomId'));
    window.addEventListener('room-selected', handler);
    return () => window.removeEventListener('room-selected', handler);
  }, []);

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
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setBills(arr);
    } catch (err) {
      setError('Lỗi khi tải danh sách hóa đơn');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomParticipants = async (roomId) => {
    setParticipantsLoading(true);
    try {
      const [members, reports] = await Promise.all([
        roomService.getRoomMembers(roomId),
        absenceService.getAbsenceReports(roomId),
      ]);
      const memberList = Array.isArray(members) ? members : [];
      setRoomMembers(memberList);

      const now = new Date();
      const awayIds = (Array.isArray(reports) ? reports : [])
        .filter((r) => {
          if ((r.reason || '').toLowerCase() !== 'về quê') return false;
          const s = new Date(r.startDate), e = new Date(r.endDate);
          return !isNaN(s) && !isNaN(e) && s <= now && now <= e;
        })
        .map((r) => String(r.member?.user?._id || r.member?.user))
        .filter(Boolean);
      setAwayMemberIds([...new Set(awayIds)]);
    } catch {
      setRoomMembers([]);
      setAwayMemberIds([]);
      setSplitParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const [autoPayWithFund, setAutoPayWithFund] = useState(false);

  const handleOpenModal = () => {
    if (!selectedRoomId) { setError('Vui lòng chọn phòng ở sidebar trước khi tạo hóa đơn'); return; }
    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 10);

    setFormData({
      room_id: selectedRoomId,
      bill_type: 'electricity',
      bill_type_other: '',
      bill_date: defaultDate,
      total_amount: '',
      payer_id: roomMembers[0]?._id || '',
      billing_month: defaultDate.slice(0, 7),
      description: '',
    });

    setSplitParticipants(buildSplitParticipants(roomMembers, awayMemberIds));

    setError('');
    setAutoPayWithFund(false);
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setError(''); setAutoPayWithFund(false); };

  /* RM-8 — Image upload handlers */
  const handleOpenImageModal = (bill) => {
    setImageModalBill(bill);
    setPendingImages(bill.bill_images || []);
    setError('');
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    if (uploadingImages) return;
    setShowImageModal(false);
    setImageModalBill(null);
    setPendingImages([]);
  };

  const handleSelectImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    if (files.length === 0) return;
    try {
      const base64List = await Promise.all(files.map(fileToBase64));
      // Gộp ảnh mới vào ảnh cũ, tổng không quá 5
      setPendingImages((prev) => [...prev, ...base64List].slice(0, 5));
    } catch {
      setError('Không thể đọc ảnh. Vui lòng thử lại.');
    }
  };

  const handleRemovePendingImage = (index) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveImages = async () => {
    if (!imageModalBill) return;
    if (pendingImages.length === 0) { setError('Vui lòng chọn ít nhất 1 ảnh'); return; }
    try {
      setUploadingImages(true);
      setError('');
      await billService.uploadBillImages(imageModalBill._id, pendingImages);
      await fetchBills();
      handleCloseImageModal();
    } catch (err) {
      setError(err.message || 'Không thể lưu ảnh hóa đơn');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bill_date') {
      setFormData((prev) => ({ ...prev, bill_date: value, billing_month: value ? value.slice(0, 7) : prev.billing_month }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleParticipant = (memberId) => {
    setError('');
    setSplitParticipants((prev) =>
      prev.map((p) => {
        if (p.member_id !== memberId) return p;
        if (p.isAway) { setError(`${p.name} đang về quê`); return p; }
        return { ...p, selected: !p.selected };
      })
    );
  };

  const handleSelectAllParticipants = () => {
    setError('');
    setSplitParticipants((prev) => {
      const selectable = prev.filter((p) => !p.isAway);
      const eq = selectable.length > 0 ? Math.floor((100 / selectable.length) * 100) / 100 : 0;
      return prev.map((p) => {
        if (p.isAway) return { ...p, selected: false };
        const idx = selectable.findIndex((s) => s.member_id === p.member_id);
        const isLast = idx === selectable.length - 1;
        const pct = isLast ? Number((100 - eq * (selectable.length - 1)).toFixed(2)) : eq;
        return { ...p, selected: true, split_mode: 'percent', split_value: String(pct) };
      });
    });
  };

  const handleParticipantSplitChange = (memberId, field, value) => {
    setSplitParticipants((prev) =>
      prev.map((p) => (p.member_id === memberId ? { ...p, [field]: value } : p))
    );
  };

  const handleSaveBill = async () => {
    if (!formData.room_id || !formData.bill_type || !formData.total_amount || !formData.billing_month) {
      setError('Vui lòng điền tất cả các trường bắt buộc'); return;
    }
    if (formData.bill_type === 'other' && !formData.bill_type_other.trim()) {
      setError('Vui lòng nhập nội dung cho loại hóa đơn khác'); return;
    }
    if (!/^\d{4}-\d{2}$/.test(formData.billing_month)) {
      setError('Kỳ tính phải theo định dạng YYYY-MM'); return;
    }
    const amount = parseInt(formData.total_amount);
    if (isNaN(amount) || amount < 1000) { setError('Tổng tiền phải lớn hơn 1.000 VNĐ'); return; }
    if (authLoading) { setError('Đang xác thực, vui lòng chờ...'); return; }
    if (participantsLoading) { setError('Đang tải danh sách thành viên, vui lòng chờ...'); return; }
    if (!user) { setError('Vui lòng đăng nhập lại'); return; }
    const userId = user.id || user._id;
    if (!userId) { setError('Không thể xác định người dùng'); return; }

    setSubmitting(true);
    try {
      setError('');
      if (autoPayWithFund) {
        const fundData = await fundService.getFundDetail(formData.room_id);
        if ((fundData.balance || 0) < amount) {
          setError(`Số dư quỹ chung (${formatCurrency(fundData.balance || 0)}) không đủ để thanh toán hóa đơn này!`);
          setSubmitting(false);
          return;
        }
      }

      const selected = splitParticipants.filter((p) => p.selected && !p.isAway);
      if (selected.length === 0) { setError('Vui lòng chọn ít nhất 1 thành viên cùng thanh toán'); setSubmitting(false); return; }

      const hasCustom = selected.some((p) => String(p.split_value).trim() !== '');
      const customSplits = [];
      if (hasCustom) {
        for (const p of selected) {
          const raw = String(p.split_value).trim();
          if (!raw) { setError('Vui lòng nhập đầy đủ % hoặc số tiền cho mọi thành viên được chọn'); setSubmitting(false); return; }
          const parsed = Number(raw);
          if (!Number.isFinite(parsed) || parsed < 0) { setError('Giá trị chia hóa đơn không hợp lệ'); setSubmitting(false); return; }
          customSplits.push({ member_id: p.member_id, mode: p.split_mode, value: parsed });
        }
      }

      const res = await billService.createBill({
        room_id: formData.room_id,
        bill_type: formData.bill_type,
        bill_type_other: formData.bill_type === 'other' ? formData.bill_type_other.trim() : undefined,
        bill_date: formData.bill_date,
        total_amount: amount,
        payer_id: formData.payer_id || userId,
        billing_month: formData.billing_month,
        note: formData.description,
        member_ids: selected.map((p) => p.member_id),
        custom_splits: customSplits,
      });
      const newBillId = res.bill?._id || res._id;

      if (autoPayWithFund) {
         try {
           const typeLabel = formData.bill_type === 'other' ? formData.bill_type_other.trim() : getBillTypeMeta(formData.bill_type).label;
           await fundService.withdrawFund(
              formData.room_id,
              amount,
              `Chi trả hóa đơn: ${typeLabel} (Tháng ${formData.billing_month})`,
              'Hóa đơn chung',
              [],
              newBillId
            );
            const newDetails = res.details || [];
           
           // If member requests fund, the withdrawal is pending, so we don't confirm details yet.
           // If owner requests, it's completed and we confirm details.
           if (isRoomOwner) {
              for (const d of newDetails) {
                if (d.status !== 'paid') {
                  await billService.confirmBillPayment(newBillId, d._id);
                }
              }
              await billService.updateBill(newBillId, { is_paid_by_fund: true });
           }
         } catch (e) {
           console.error("Auto fund payment failed:", e);
           const errorMessage = e.response?.data?.message || e.message || 'Lỗi không xác định khi trích quỹ chung';
           alert(`Hóa đơn đã được tạo nhưng KHÔNG THỂ trích quỹ chung (lỗi: ${errorMessage}). Vui lòng tự thanh toán lại bằng quỹ chung sau.`);
         }
      }

      await fetchBills();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu hóa đơn');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
    try {
      await billService.deleteBill(id);
      await fetchBills();
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa hóa đơn');
    }
  };

  const handleConfirmPayment = async (billId, detailId) => {
    try {
      if (!window.confirm('Xác nhận thành viên này đã đóng tiền?')) return;
      await billService.confirmBillPayment(billId, detailId);
      await fetchBills();
    } catch (err) {
      setError(err.message || 'Lỗi khi xác nhận thanh toán');
    }
  };

  const handlePayWithFund = async (bill) => {
    try {
      if (!window.confirm(`Bạn có chắc chắn muốn trích quỹ chung để thanh toán toàn bộ "${bill.bill_type === 'other' ? bill.bill_type_other : getBillTypeMeta(bill.bill_type).label}"?`)) return;
      
      setSubmitting(true);
      const fundData = await fundService.getFundDetail(selectedRoomId);
      if ((fundData.balance || 0) < bill.total_amount) {
        throw new Error(`Số dư quỹ chung (${formatCurrency(fundData.balance || 0)}) không đủ để thanh toán hóa đơn này!`);
      }

      // 1. Gửi yêu cầu rút tiền từ quỹ (liên kết với bill)
      const res = await fundService.withdrawFund(
        selectedRoomId,
        bill.total_amount,
        `Chi trả hóa đơn: ${bill.bill_type === 'other' ? bill.bill_type_other : getBillTypeMeta(bill.bill_type).label} (Tháng ${bill.billing_month})`,
        'Hóa đơn chung',
        [],
        bill._id
      );

      // 2. Nếu là chủ phòng (completed), xác nhận toàn bộ thành viên đã trả
      if (isRoomOwner) {
        const pending = bill.details.filter((d) => d.status !== 'paid');
        for (const d of pending) {
          await billService.confirmBillPayment(bill._id, d._id);
        }
        // 3. Đánh dấu bill là đã trả bằng quỹ
        await billService.updateBill(bill._id, { is_paid_by_fund: true });
      }

      await fetchBills();
      alert(res.message || 'Giao dịch đã được ghi nhận!');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi sử dụng quỹ chung để thanh toán.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── derived data ─── */
  const selectedRoomName = rooms.find((r) => r._id === selectedRoomId)?.name || 'Chưa chọn phòng';
  const currentUserId = String(user?.id || user?._id || '');
  const roomOwnerId = String(rooms.find(r => r._id === selectedRoomId)?.owner?._id || rooms.find(r => r._id === selectedRoomId)?.owner || '');
  const isRoomOwner = Boolean(currentUserId && roomOwnerId && currentUserId === roomOwnerId);

  useEffect(() => {
    if (!showModal) return;
    if (splitParticipants.length > 0) return;
    if (roomMembers.length === 0) return;

    setSplitParticipants(buildSplitParticipants(roomMembers, awayMemberIds));
    setFormData((prev) => ({
      ...prev,
      payer_id: prev.payer_id || roomMembers[0]?._id || '',
    }));
  }, [showModal, splitParticipants.length, roomMembers, awayMemberIds]);

  const visibleBills = useMemo(() => {
    const filtered = bills.filter((bill) => {
      if (bill.billing_month !== filterMonth) return false;
      if (paymentStatusFilter === 'all') return true;
      if (!bill.details?.length) return false;
      return bill.details.some((d) => paymentStatusFilter === 'paid' ? d.status === 'paid' : d.status !== 'paid');
    });
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [bills, paymentStatusFilter, filterMonth]);

  const selectedBill = useMemo(() => bills.find(b => b._id === selectedBillId), [bills, selectedBillId]);

  /* ─── render ─── */
  return (
    <div className="bill-management">
      {/* HEADER */}
      <PageHeader
        title="Hóa Đơn Phòng"
        actions={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="month"
              className="bm-month-input"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
            <button className="btn-create-bill" onClick={handleOpenModal} disabled={submitting}>
              <FontAwesomeIcon icon={faPlus} /> Tạo Hóa Đơn Mới
            </button>
          </div>
        }
      />

      {error && <div className="alert alert-error"><FontAwesomeIcon icon={faExclamationTriangle} /> {error}</div>}



      {/* FILTER */}
      <div className="filter-bar">
        <span className="filter-label">Lọc:</span>
        <div className="filter-chips">
          {[
            { key: 'all',    label: 'Tất cả' },
            { key: 'unpaid', label: 'Chưa thanh toán' },
            { key: 'paid',   label: 'Đã thanh toán' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`chip ${paymentStatusFilter === key ? 'active' : ''}`}
              onClick={() => setPaymentStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* BILLS LIST */}
      <div className="bills-container">
        {loading ? (
          <div className="loading-message">Đang tải dữ liệu...</div>
        ) : !selectedRoomId ? (
          <div className="empty-message">Vui lòng chọn phòng ở sidebar để xem hóa đơn.</div>
        ) : bills.length === 0 ? (
          <div className="empty-message">Chưa có hóa đơn nào cho phòng này.</div>
        ) : visibleBills.length === 0 ? (
          <div className="empty-message">Không có hóa đơn phù hợp bộ lọc.</div>
        ) : (
          <div className="split-view-container">
            {/* LEFT: MASTER LIST */}
            <div className="split-left">
              {visibleBills.map((bill) => {
                const typeMeta = getBillTypeMeta(bill.bill_type);
                return (
                  <div 
                    key={bill._id} 
                    className={`h-bill-card ${selectedBillId === bill._id ? 'selected' : ''}`}
                    onClick={() => setSelectedBillId(bill._id)}
                  >
                    <div className="h-bill-left">
                      <div className={`h-bill-icon ${typeMeta.cls}`}>
                        <FontAwesomeIcon icon={typeMeta.icon} />
                      </div>
                      <div className="h-bill-info">
                        <h4>{bill.bill_type === 'other' ? (bill.bill_type_other || 'Hóa đơn khác') : `Tiền ${typeMeta.label}`}</h4>
                        <span>
                          <span className={`status-dot ${bill.status === 'completed' ? 'completed' : bill.status === 'partial' ? 'partial' : 'pending'}`}></span>
                          {formatDate(bill.bill_date || bill.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="h-bill-right">
                      <span className="amount">{formatCurrency(bill.total_amount)}</span>
                      <div className="avatar-stack" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
                        {bill.details?.slice(0, 3).map((d, idx) => (
                          <div key={idx} className={`avatar-stack-item ${d.status === 'paid' ? 'paid' : 'unpaid'}`} style={{ width: 22, height: 22, fontSize: 10 }} title={d.member_id?.name}>
                            {getInitials(d.member_id?.name || `T${idx+1}`)}
                          </div>
                        ))}
                        {bill.details?.length > 3 && (
                          <div className="avatar-stack-item count" style={{ width: 22, height: 22, fontSize: 10 }}>+{bill.details.length - 3}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT: DETAILS PANEL */}
            <div className="split-right">
              {!selectedBill ? (
                <div className="detail-empty">
                  <FontAwesomeIcon icon={faReceipt} />
                  <p>Chọn một hóa đơn bên trái để xem chi tiết</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const typeMeta = getBillTypeMeta(selectedBill.bill_type);
                    const responsibleId = String(selectedBill.payer_id?._id || selectedBill.payer_id || selectedBill.created_by?._id || selectedBill.created_by || '');
                    const canConfirm = Boolean(currentUserId && responsibleId && currentUserId === responsibleId);
                    return (
                      <>
                        <div className="detail-header">
                          <div className="detail-header-top">
                            <h2>
                               <div className={`h-bill-icon ${typeMeta.cls}`} style={{ width: 32, height: 32, fontSize: 14 }}>
                                 <FontAwesomeIcon icon={typeMeta.icon} />
                               </div>
                               {selectedBill.bill_type === 'other' ? selectedBill.bill_type_other || 'Khác' : `Tiền ${typeMeta.label}`}
                            </h2>
                            <span className={`bill-status-badge ${selectedBill.status === 'completed' ? 'completed' : selectedBill.status === 'partial' ? 'partial' : 'pending'}`}>
                              {selectedBill.status === 'completed' ? 'Đã xong' : selectedBill.status === 'partial' ? 'Một phần' : 'Chưa trả'}
                            </span>
                          </div>
                          <div className="meta">
                            Kỳ sử dụng: <strong>Tháng {selectedBill.billing_month}</strong><br/>
                            Ngày chốt hóa đơn: {formatDate(selectedBill.bill_date || selectedBill.created_at)}<br/>
                            Người quản lý: <strong>{selectedBill.payer_id?.name || selectedBill.created_by?.name || '—'}</strong>
                          </div>
                        </div>

                        <div className="detail-body">
                          <div className="split-meta-row">
                            <div className="split-meta-item">
                              <span>Tổng hóa đơn</span>
                              <strong style={{ fontSize: 20 }}>{formatCurrency(selectedBill.total_amount)}</strong>
                            </div>
                            <div className="split-meta-item">
                              <span>Đã thu</span>
                              <strong style={{ color: '#16a34a' }}>
                                {formatCurrency(selectedBill.details?.filter(d => d.status === 'paid').reduce((s, d) => s + (Number(d.amount_due) || 0), 0) || 0)}
                              </strong>
                            </div>
                            <div className="split-meta-item">
                              <span>Ảnh chứng từ</span>
                              {selectedBill.bill_images?.length > 0 ? (
                                 <button className="btn-icon-secondary" style={{ padding: '4px 10px', marginTop: 4 }} onClick={() => setImagePreviewSrc(selectedBill.bill_images[0])}>
                                   <FontAwesomeIcon icon={faImages} /> Xem ({selectedBill.bill_images.length})
                                 </button>
                              ) : (<span style={{ marginTop: 6 }}>Chưa có</span>)}
                            </div>
                          </div>

                          {selectedBill.note && (
                            <div style={{ marginBottom: 20, fontSize: 13, background: '#fffbeb', color: '#b45309', padding: 12, borderRadius: 8, border: '1px solid #fef3c7' }}>
                              <strong>Ghi chú:</strong> {selectedBill.note}
                            </div>
                          )}

                          <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)' }}>Phân bổ chi tiết ({selectedBill.details?.length || 0} người)</h4>
                          <table className="ds-member-table">
                            <thead>
                              <tr>
                                <th>Thành viên</th>
                                <th>Số tiền</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedBill.details?.map((detail, idx) => {
                                const isPaid = detail.status === 'paid';
                                return (
                                  <tr key={detail._id || idx}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                         <div className="member-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{getInitials(detail.member_id?.name || `T${idx+1}`)}</div>
                                         {detail.member_id?.name || `Thành viên ${idx + 1}`}
                                      </div>
                                    </td>
                                    <td style={{ color: '#2f6fec', fontWeight: 700 }}>{formatCurrency(detail.amount_due)}</td>
                                    <td>
                                       {isPaid ? <span className="badge-paid"><FontAwesomeIcon icon={faCheck} /> Đã trả</span> : <span className="badge-view-only">Chưa trả</span>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      {!isPaid && canConfirm ? (
                                        <button className="btn-confirm-small" onClick={() => handleConfirmPayment(selectedBill._id, detail._id)}>Xác nhận</button>
                                      ) : null}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="detail-actions-bar">
                             {canConfirm && selectedBill.status !== 'completed' && selectedBill.details?.some(d => d.status !== 'paid') && (
                                <>
                                  <button className="btn-confirm-all" style={{ flex: 1 }} onClick={async () => {
                                      if (!window.confirm('Xác nhận thanh toán toàn bộ từ tiền riêng?')) return;
                                      try {
                                         setSubmitting(true);
                                         const pending = selectedBill.details.filter(d => d.status !== 'paid');
                                         for (const d of pending) await billService.confirmBillPayment(selectedBill._id, d._id);
                                         await fetchBills();
                                      } catch (e) { setError(e.message); } finally { setSubmitting(false); }
                                  }} disabled={submitting}>
                                     <FontAwesomeIcon icon={faCheckCircle} /> Thu cá nhân
                                  </button>
                                  
                                  <button 
                                    className="btn-confirm-all" 
                                    style={{ flex: 1, background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 3px 10px rgba(180, 83, 9, 0.3)' }} 
                                    onClick={() => handlePayWithFund(selectedBill)}
                                    disabled={submitting}
                                  >
                                     <FontAwesomeIcon icon={faWallet} /> {isRoomOwner ? 'Trả bằng Quỹ' : 'Yêu cầu trích Quỹ'}
                                  </button>
                                </>
                             )}
                           <button className="btn-icon-secondary" onClick={() => handleOpenImageModal(selectedBill)}>
                             <FontAwesomeIcon icon={faCamera} /> {selectedBill.bill_images?.length > 0 ? 'Cập nhật ảnh' : 'Đính kèm ảnh'}
                           </button>
                           <button className="btn-delete" style={{ marginLeft: 'auto' }} onClick={() => {
                             setSelectedBillId(null);
                             handleDeleteBill(selectedBill._id);
                           }}>
                             <FontAwesomeIcon icon={faTrash} />
                           </button>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL TẠO HÓA ĐƠN ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo Hóa Đơn Mới</h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}

              {/* Phòng */}
              <p className="form-section-title"><FontAwesomeIcon icon={faHouse} /> Thông tin hóa đơn</p>
              <div className="form-group">
                <label>Phòng</label>
                <input type="text" value={selectedRoomName} disabled />
              </div>

              {/* Loại hóa đơn — card selector */}
              <div className="form-group">
                <label>Loại hóa đơn *</label>
                <div className="bill-type-selector">
                  {BILL_TYPES.map((t) => (
                    <div
                      key={t.key}
                      className={`type-card ${formData.bill_type === t.key ? 'active' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, bill_type: t.key }))}
                    >
                      <div className={`type-icon bill-type-icon ${t.cls}`}>
                        <FontAwesomeIcon icon={t.icon} />
                      </div>
                      <span className="type-label">{t.label}</span>
                    </div>
                  ))}
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

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày hóa đơn *</label>
                  <input type="date" name="bill_date" value={formData.bill_date} onChange={handleInputChange} />
                  <span className="hint-text">Kỳ tháng: <strong>{formData.billing_month || '—'}</strong></span>
                </div>
                <div className="form-group">
                  <label>Tổng tiền (VNĐ) *</label>
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    placeholder="VD: 950000"
                    min="1000"
                  />
                  <span className="hint-text">Tối thiểu 1.000 VNĐ</span>
                </div>
              </div>

              <div className="form-group">
                <label>Người quản lý / chịu trách nhiệm *</label>
                <select name="payer_id" value={formData.payer_id} onChange={handleInputChange}>
                  <option value="">— Chọn người chịu trách nhiệm —</option>
                  {roomMembers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name || (m.email ? m.email.split('@')[0] : 'Thành viên')}</option>
                  ))}
                </select>
              </div>

              {/* Participants */}
              <p className="form-section-title"><FontAwesomeIcon icon={faUsers} /> Phân chia cho thành viên</p>
              <div className="form-group">
                <div className="participant-head">
                  <label>Thành viên cùng thanh toán *</label>
                  <button type="button" className="btn-select-all-members" onClick={handleSelectAllParticipants}>
                    <FontAwesomeIcon icon={faUsers} /> Chọn tất cả
                  </button>
                </div>
                <div className="participant-list">
                  {participantsLoading ? (
                    <div style={{ padding: '12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Đang tải danh sách thành viên...
                    </div>
                  ) : splitParticipants.length === 0 ? (
                    <div style={{ padding: '12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Không có thành viên trong phòng.
                    </div>
                  ) : (
                    splitParticipants.map((p) => (
                      <div
                        key={p.member_id}
                        className={`participant-row ${p.selected ? 'selected' : ''} ${p.isAway ? 'away' : ''}`}
                      >
                        <button
                          type="button"
                          className="participant-toggle"
                          onClick={() => handleToggleParticipant(p.member_id)}
                        >
                          <input type="checkbox" readOnly checked={p.selected} />
                          <span>{p.name}</span>
                          {p.isAway && <small>Đang về quê</small>}
                        </button>
                        <div className="participant-split">
                          <select
                            value={p.split_mode}
                            onChange={(e) => handleParticipantSplitChange(p.member_id, 'split_mode', e.target.value)}
                            disabled={!p.selected || p.isAway}
                          >
                            <option value="percent">%</option>
                            <option value="amount">VNĐ</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            placeholder={p.split_mode === 'percent' ? 'VD: 25' : 'VD: 150000'}
                            value={p.split_value}
                            onChange={(e) => handleParticipantSplitChange(p.member_id, 'split_value', e.target.value)}
                            disabled={!p.selected || p.isAway}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <span className="hint-text">Để trống phần chia nếu muốn hệ thống tự chia đều.</span>
              </div>

              {/* Note */}
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập ghi chú (tuỳ chọn)"
                  rows="2"
                />
              </div>

              {/* Tùy chọn Auto Pay with Fund */}
              <div className="form-group" style={{ 
                marginTop: '16px', background: '#fdfce8', padding: '12px', borderRadius: '10px', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <input 
                  type="checkbox" 
                  id="autoPayWithFund"
                  checked={autoPayWithFund}
                  onChange={(e) => setAutoPayWithFund(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="autoPayWithFund" style={{ margin: 0, fontSize: '14px', color: '#854d0e', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faWallet} style={{ marginRight: 6 }}/> 
                  Trích quỹ chung để thanh toán luôn hóa đơn này
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>Hủy</button>
              <button className="btn-save" onClick={handleSaveBill} disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Tạo Hóa Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── RM-8: IMAGE UPLOAD MODAL ─── */}
      {showImageModal && imageModalBill && (
        <div className="modal-overlay" onClick={handleCloseImageModal}>
          <div className="modal-container modal-img-upload" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FontAwesomeIcon icon={faCamera} /> Ảnh hóa đơn thực tế</h2>
              <button className="btn-close-modal" onClick={handleCloseImageModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}

              <p className="img-upload-hint">
                Đính kèm ảnh chụp hóa đơn giấy để đối chiếu. Tối đa <strong>5 ảnh</strong>.
              </p>

              {/* Upload area */}
              {pendingImages.length < 5 && (
                <label className="img-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleSelectImages}
                  />
                  <div className="img-upload-area-inner">
                    <FontAwesomeIcon icon={faCamera} className="upload-icon" />
                    <span>Bấm để chọn ảnh</span>
                    <small>JPG, PNG, WEBP — tối đa 5 ảnh</small>
                  </div>
                </label>
              )}

              {/* Preview grid */}
              {pendingImages.length > 0 && (
                <div className="img-preview-grid">
                  {pendingImages.map((src, idx) => (
                    <div key={idx} className="img-preview-item">
                      <img src={src} alt={`preview-${idx}`} onClick={() => setImagePreviewSrc(src)} />
                      <button
                        className="img-remove-btn"
                        onClick={() => handleRemovePendingImage(idx)}
                        title="Xoá ảnh này"
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="hint-text" style={{ marginTop: 8 }}>
                {pendingImages.length}/5 ảnh — Lưu để cập nhật lên hóa đơn
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseImageModal} disabled={uploadingImages}>
                Hủy
              </button>
              <button className="btn-save" onClick={handleSaveImages} disabled={uploadingImages || pendingImages.length === 0}>
                {uploadingImages ? 'Đang lưu...' : 'Lưu ảnh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX ─── */}
      {imagePreviewSrc && (
        <div className="lightbox-overlay" onClick={() => setImagePreviewSrc(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setImagePreviewSrc(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={imagePreviewSrc} alt="Xem hóa đơn" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManagement;
