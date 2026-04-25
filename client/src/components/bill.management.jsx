import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faTimes,
  faCheckCircle,
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
import { useToast } from '../context/ToastContext.jsx';
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
  date
    ? new Date(date).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

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

const getMoneySuggestions = (rawValue) => {
  const numericText = String(rawValue || '').replace(/\D/g, '');
  if (!numericText) return [];

  const base = Number(numericText);
  if (!Number.isFinite(base) || base <= 0) return [];

  return [base * 1000, base * 10000, base * 100000]
    .filter((value) => value >= 5000)
    .filter((value, index, arr) => arr.indexOf(value) === index);
};

const fmtSuggestion = (value) => new Intl.NumberFormat('vi-VN').format(value);

const normalizePercent = (value) => {
  if (!Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
};

const getAwayMemberIdsByBillDate = (reports = [], billDate) => {
  const target = new Date(billDate);
  if (Number.isNaN(target.getTime())) return [];

  const dateOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const awayIds = (Array.isArray(reports) ? reports : [])
    .filter((r) => (r?.status || '') !== 'Từ chối')
    .filter((r) => {
      const start = new Date(r?.startDate);
      const end = new Date(r?.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return startOnly <= dateOnly && dateOnly <= endOnly;
    })
    .map((r) => String(r?.member?.user?._id || r?.member?.user || ''))
    .filter(Boolean);

  return [...new Set(awayIds)];
};

const getBillStatusMeta = (status) => {
  if (status === 'completed') return { className: 'completed', label: 'Đã xong' };
  if (status === 'partial') return { className: 'partial', label: 'Một phần' };
  if (status === 'rejected') return { className: 'rejected', label: 'Bị từ chối' };
  return { className: 'pending', label: 'Chưa trả' };
};

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
  const { showToast } = useToast();
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
  const [absenceReports, setAbsenceReports] = useState([]);
  const [splitParticipants, setSplitParticipants] = useState([]);
  const [manualPercentMemberIds, setManualPercentMemberIds] = useState([]);
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
      setAbsenceReports([]);
      setSplitParticipants([]);
      setManualPercentMemberIds([]);
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
      const reportList = Array.isArray(reports) ? reports : [];
      setRoomMembers(memberList);
      setAbsenceReports(reportList);

      const awayIds = getAwayMemberIdsByBillDate(
        reportList,
        formData.bill_date || new Date().toISOString().slice(0, 10)
      );
      setAwayMemberIds(awayIds);
    } catch {
      setRoomMembers([]);
      setAwayMemberIds([]);
      setAbsenceReports([]);
      setSplitParticipants([]);
      setManualPercentMemberIds([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const [autoPayWithFund, setAutoPayWithFund] = useState(false);

  const handleOpenModal = () => {
    if (!selectedRoomId) { setError('Vui lòng chọn phòng ở sidebar trước khi tạo hóa đơn'); return; }
    const now = new Date();
    const defaultDate = now.toISOString().slice(0, 10);
    const creatorId = String(user?.id || user?._id || '');
    const defaultPayerId = roomMembers.find((m) => String(m._id) === creatorId)?._id || roomMembers[0]?._id || creatorId || '';

    setFormData({
      room_id: selectedRoomId,
      bill_type: 'electricity',
      bill_type_other: '',
      bill_date: defaultDate,
      total_amount: '',
      payer_id: defaultPayerId,
      billing_month: defaultDate.slice(0, 7),
      description: '',
    });

    const defaultAwayIds = getAwayMemberIdsByBillDate(absenceReports, defaultDate);
    setAwayMemberIds(defaultAwayIds);
    setSplitParticipants(buildSplitParticipants(roomMembers, defaultAwayIds));
    setManualPercentMemberIds([]);

    setError('');
    setAutoPayWithFund(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setAutoPayWithFund(false);
    setManualPercentMemberIds([]);
  };

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
      const nextAwayIds = getAwayMemberIdsByBillDate(absenceReports, value);
      setFormData((prev) => ({ ...prev, bill_date: value, billing_month: value ? value.slice(0, 7) : prev.billing_month }));
      setAwayMemberIds(nextAwayIds);
      setSplitParticipants(buildSplitParticipants(roomMembers, nextAwayIds));
      setManualPercentMemberIds([]);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleParticipant = (memberId) => {
    setError('');
    setManualPercentMemberIds([]);
    setSplitParticipants((prev) => {
      const toggled = prev.map((p) => {
        if (p.member_id !== memberId) return p;
        return { ...p, selected: !p.selected };
      });

      const selectedRows = toggled.filter((p) => p.selected);
      if (selectedRows.length === 0) return toggled;

      const eq = Math.floor((100 / selectedRows.length) * 100) / 100;
      return toggled.map((p) => {
        if (!p.selected) return p;
        const idx = selectedRows.findIndex((s) => s.member_id === p.member_id);
        const isLast = idx === selectedRows.length - 1;
        const pct = isLast ? Number((100 - eq * (selectedRows.length - 1)).toFixed(2)) : eq;
        return { ...p, split_mode: 'percent', split_value: String(pct) };
      });
    });
  };

  const handleSelectAllParticipants = () => {
    setError('');
    setManualPercentMemberIds([]);
    setSplitParticipants((prev) => {
      const selectable = prev;
      const eq = selectable.length > 0 ? Math.floor((100 / selectable.length) * 100) / 100 : 0;
      return prev.map((p) => {
        const idx = selectable.findIndex((s) => s.member_id === p.member_id);
        const isLast = idx === selectable.length - 1;
        const pct = isLast ? Number((100 - eq * (selectable.length - 1)).toFixed(2)) : eq;
        return { ...p, selected: true, split_mode: 'percent', split_value: String(pct) };
      });
    });
  };

  const handleParticipantSplitChange = (memberId, field, value) => {
    if (field === 'split_mode' && value !== 'percent') {
      setManualPercentMemberIds((prev) => prev.filter((id) => String(id) !== String(memberId)));
    }

    setSplitParticipants((prev) => {
      const updated = prev.map((p) => (p.member_id === memberId ? { ...p, [field]: value } : p));

      if (field === 'split_value') {
        const selectedPercent = updated.filter((p) => p.selected && p.split_mode === 'percent');
        const current = selectedPercent.find((p) => String(p.member_id) === String(memberId));
        const entered = Number(value);
        const currentPct = normalizePercent(entered);
        if (!current || currentPct === null) return updated;

        const selectedIdSet = new Set(selectedPercent.map((p) => String(p.member_id)));
        const manualSet = new Set(
          [...manualPercentMemberIds.map(String), String(memberId)]
            .filter((id) => selectedIdSet.has(id))
        );

        const getPct = (id) => {
          const row = selectedPercent.find((p) => String(p.member_id) === String(id));
          const pct = normalizePercent(Number(row?.split_value));
          return pct ?? 0;
        };

        const otherManualIds = Array.from(manualSet).filter((id) => id !== String(memberId));
        const otherManualSum = otherManualIds.reduce((sum, id) => sum + getPct(id), 0);
        const safeCurrentPct = Math.min(currentPct, Math.max(0, Number((100 - otherManualSum).toFixed(2))));

        const fixedValueMap = new Map(otherManualIds.map((id) => [id, getPct(id)]));
        fixedValueMap.set(String(memberId), safeCurrentPct);

        const autoRows = selectedPercent.filter((p) => !manualSet.has(String(p.member_id)));
        const fixedSum = Array.from(fixedValueMap.values()).reduce((sum, pct) => sum + pct, 0);
        const remain = Math.max(0, Number((100 - fixedSum).toFixed(2)));

        if (autoRows.length > 0) {
          const each = Number((remain / autoRows.length).toFixed(2));
          let assigned = 0;
          autoRows.forEach((p, index) => {
            const isLast = index === autoRows.length - 1;
            const valueForRow = isLast
              ? Number((remain - assigned).toFixed(2))
              : each;
            assigned = Number((assigned + valueForRow).toFixed(2));
            fixedValueMap.set(String(p.member_id), valueForRow);
          });
        } else if (fixedValueMap.size > 0 && fixedSum !== 100) {
          const adjustedCurrent = Math.max(0, Number((100 - otherManualSum).toFixed(2)));
          fixedValueMap.set(String(memberId), adjustedCurrent);
        }

        setManualPercentMemberIds(Array.from(manualSet));

        return updated.map((p) => {
          const key = String(p.member_id);
          if (!selectedIdSet.has(key) || p.split_mode !== 'percent') return p;
          if (!fixedValueMap.has(key)) return p;
          return { ...p, split_value: String(fixedValueMap.get(key)) };
        });
      }

      return updated;
    });
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

      const selected = splitParticipants.filter((p) => p.selected);
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
            showToast(
              `Hóa đơn đã được tạo nhưng KHÔNG THỂ trích quỹ chung (lỗi: ${errorMessage}). Vui lòng tự thanh toán lại bằng quỹ chung sau.`,
              { type: 'error', duration: 5000 }
            );
          }
       }

      await fetchBills();
      showToast('Tạo hóa đơn thành công', { type: 'success' });
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu hóa đơn');
      showToast(err.response?.data?.message || err.message || 'Lỗi khi lưu hóa đơn', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
    try {
      await billService.deleteBill(id);
      await fetchBills();
      showToast('Đã xóa hóa đơn thành công', { type: 'success' });
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa hóa đơn');
      showToast(err.message || 'Lỗi khi xóa hóa đơn', { type: 'error' });
    }
  };

  const handleConfirmPayment = async (billId, detailId) => {
    try {
      if (!window.confirm('Xác nhận thành viên này đã đóng tiền?')) return;
      await billService.confirmBillPayment(billId, detailId);
      await fetchBills();
      showToast('Đã xác nhận thanh toán cho thành viên', { type: 'success' });
    } catch (err) {
      setError(err.message || 'Lỗi khi xác nhận thanh toán');
      showToast(err.message || 'Lỗi khi xác nhận thanh toán', { type: 'error' });
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
      showToast(res.message || 'Giao dịch đã được ghi nhận!', { type: 'success' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi khi sử dụng quỹ chung để thanh toán.');
      showToast(err.message || 'Lỗi khi sử dụng quỹ chung để thanh toán.', { type: 'error' });
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
    setManualPercentMemberIds([]);
    setFormData((prev) => ({
      ...prev,
      payer_id: prev.payer_id || roomMembers.find((m) => String(m._id) === currentUserId)?._id || roomMembers[0]?._id || currentUserId || '',
    }));
  }, [showModal, splitParticipants.length, roomMembers, awayMemberIds, currentUserId]);

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
                const statusMeta = getBillStatusMeta(bill.status);
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
                          <span className={`status-dot ${statusMeta.className}`}></span>
                          {formatDate(bill.created_at || bill.createdAt || bill.bill_date)}
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
                    const selectedBillStatusMeta = getBillStatusMeta(selectedBill.status);
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
                            <span className={`bill-status-badge ${selectedBillStatusMeta.className}`}>
                              {selectedBillStatusMeta.label}
                            </span>
                          </div>
                          <div className="meta">
                            Kỳ sử dụng: <strong>Tháng {selectedBill.billing_month}</strong><br/>
                            Ngày chốt hóa đơn: {formatDate(selectedBill.created_at || selectedBill.createdAt || selectedBill.bill_date)}<br/>
                            Người tạo hóa đơn: <strong>{selectedBill.payer_id?.name || selectedBill.created_by?.name || '—'}</strong>
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
                                       {isPaid ? <span className="badge-paid">Đã trả</span> : <span className="badge-view-only">Chưa trả</span>}
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
                                         showToast('Đã xác nhận thanh toán toàn bộ thành viên', { type: 'success' });
                                      } catch (e) {
                                        setError(e.message);
                                        showToast(e.message || 'Lỗi khi xác nhận thanh toán', { type: 'error' });
                                      } finally { setSubmitting(false); }
                                   }} disabled={submitting}>
                                      <FontAwesomeIcon icon={faCheckCircle} /> Thu cá nhân
                                   </button>
                                  
                                  <button 
                                    className="btn-confirm-all btn-confirm-fund"
                                    style={{ flex: 1 }}
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
                  {getMoneySuggestions(formData.total_amount).length > 0 && (
                    <div className="money-suggest-list">
                      {getMoneySuggestions(formData.total_amount).map((value) => (
                        <button
                          key={value}
                          type="button"
                          className="money-suggest-btn"
                          onClick={() => setFormData((prev) => ({ ...prev, total_amount: String(value) }))}
                        >
                          {fmtSuggestion(value)}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="hint-text">Tối thiểu 1.000 VNĐ</span>
                </div>
              </div>

              <div className="form-group">
                <label>Người tạo hóa đơn *</label>
                <select name="payer_id" value={formData.payer_id} onChange={handleInputChange}>
                  <option value="">— Chọn người tạo hóa đơn —</option>
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
                          {p.isAway && <small>Vắng mặt trong thời gian này</small>}
                        </button>
                        <div className="participant-split">
                          <select
                            value={p.split_mode}
                            onChange={(e) => handleParticipantSplitChange(p.member_id, 'split_mode', e.target.value)}
                            disabled={!p.selected}
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
                            disabled={!p.selected}
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
