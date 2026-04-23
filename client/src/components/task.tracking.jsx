import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import choreService from '../services/chore.service.js';
import PageHeader from './PageHeader.jsx';
import '../styles/task.tracking.css';

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date = new Date()) => {
  const value = new Date(date);
  const day = value.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diffToMonday);
  value.setHours(0, 0, 0, 0);
  return value;
};

const toDateKeyLocal = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatDateOnly(date);
};

const formatDateVi = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Không thể đọc ảnh'));
  reader.readAsDataURL(file);
});

const dayColumns = [
  { shortLabel: 'THỨ 2', offset: 0 },
  { shortLabel: 'THỨ 3', offset: 1 },
  { shortLabel: 'THỨ 4', offset: 2 },
  { shortLabel: 'THỨ 5', offset: 3 },
  { shortLabel: 'THỨ 6', offset: 4 },
  { shortLabel: 'THỨ 7', offset: 5 },
  { shortLabel: 'CN', offset: 6 },
];

const TaskTracking = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [displayWeekStart, setDisplayWeekStart] = useState(() => getWeekStart(new Date()));
  const [dutyTasks, setDutyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofTarget, setProofTarget] = useState(null);
  const [proofImages, setProofImages] = useState([]);

  const displayWeekKey = useMemo(() => formatDateOnly(displayWeekStart), [displayWeekStart]);

  useEffect(() => {
    const syncRoom = (event) => {
      const roomId = event?.detail?.roomId || localStorage.getItem('currentRoomId') || '';
      setSelectedRoomId(roomId);
    };

    syncRoom();
    window.addEventListener('room-selected', syncRoom);
    return () => window.removeEventListener('room-selected', syncRoom);
  }, []);

  const fetchData = async () => {
    if (!selectedRoomId) {
      setDutyTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const dutyItems = await choreService.getMyDutyTasks(selectedRoomId, displayWeekKey);
      setDutyTasks(Array.isArray(dutyItems) ? dutyItems : []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu công việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRoomId, displayWeekKey]);

  const weekDates = useMemo(
    () =>
      dayColumns.map((day) => {
        const value = new Date(displayWeekStart);
        value.setDate(value.getDate() + day.offset);
        return value;
      }),
    [displayWeekStart]
  );

  const tasksByDateKey = useMemo(() => {
    const map = new Map();
    weekDates.forEach((date) => map.set(formatDateOnly(date), []));

    [...dutyTasks]
      .sort((a, b) => {
        const dateDiff = new Date(a.chore_date) - new Date(b.chore_date);
        if (dateDiff !== 0) return dateDiff;
        return Number(a.start_hour || 0) - Number(b.start_hour || 0);
      })
      .forEach((task) => {
        const key = toDateKeyLocal(task.chore_date);
        if (map.has(key)) {
          map.get(key).push(task);
        }
      });

    return map;
  }, [dutyTasks, weekDates]);

  const todayKey = useMemo(() => formatDateOnly(new Date()), []);
  const weekRangeLabel = useMemo(() => {
    if (!weekDates[0] || !weekDates[6]) return '';
    return `${formatDateVi(weekDates[0])} - ${formatDateVi(weekDates[6])}`;
  }, [weekDates]);

  const openProofModal = (target) => {
    setProofTarget(target);
    setProofImages([]);
    setError('');
    setShowProofModal(true);
  };

  const handleSelectProofImages = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (files.length === 0) return;
    try {
      const urls = await Promise.all(files.map(fileToDataUrl));
      setProofImages(urls);
    } catch {
      setError('Không đọc được ảnh minh chứng');
    }
  };

  const handleCompleteWithProof = async () => {
    if (!proofTarget) return;

    try {
      setSaving(true);
      setError('');
      if (proofTarget.type === 'manual') {
        await choreService.completeChore(proofTarget.item._id, proofImages);
      } else {
        await choreService.completeDutyTask(proofTarget.item.duty_id, selectedRoomId, proofImages);
      }
      setShowProofModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái hoàn thành');
    } finally {
      setSaving(false);
    }
  };

  const renderDutyTaskCard = (task) => {
    const taskDateKey = toDateKeyLocal(task.chore_date);
    const isFutureTask = task.status !== 'completed' && taskDateKey > todayKey;
    
    // Calculate progress display
    const total = task.total_assigned || 1;
    const completed = task.completed_count || 0;
    const isAllDone = completed >= total;

    return (
      <article key={`${String(task.duty_id || task._id)}-${task.start_hour || ''}-${task.end_hour || ''}`} className={`task-card ${task.status}`}>
        <div className="task-card-head">
          <h3>{task.title}</h3>
          <span className={`task-status-chip ${task.status === 'completed' ? 'completed' : isFutureTask ? 'upcoming' : 'pending'}`}>
            {task.status === 'completed' ? 'Bạn đã xong' : isFutureTask ? 'Sắp tới' : 'Chưa xong'}
          </span>
        </div>
        
        <div className="task-progress-bar">
           <div className="progress-text">
             Tiến độ: {completed}/{total} {isAllDone ? '✓' : ''}
           </div>
           <div className="progress-track">
             <div className="progress-fill" style={{ width: `${(completed / total) * 100}%` }}></div>
           </div>
        </div>

        <p className="task-time">
          {Number.isFinite(task.start_hour) && Number.isFinite(task.end_hour)
            ? `${task.start_hour}:00 - ${task.end_hour}:00`
            : 'Không đặt khung giờ'}
        </p>
        {task.note && <small>{task.note}</small>}
        <div className="proof-list">
          {(task.proof_images || []).map((image, index) => (
            <img key={`${task._id}-proof-${index}`} src={image} alt="proof" />
          ))}
        </div>
        
        {task.status === 'completed' ? (
          <span className="status done"><FontAwesomeIcon icon={faCheck} /> Bạn đã hoàn thành</span>
        ) : isFutureTask ? (
          <span className="status upcoming">Sắp tới</span>
        ) : (
          <button type="button" className="task-complete-btn" onClick={() => openProofModal({ type: task.source_type || 'duty', item: task })}>
            <FontAwesomeIcon icon={faCheck} /> Hoàn thành phần của tôi
          </button>
        )}
      </article>
    );
  };


  return (
    <div className="task-tracking-page">
      <PageHeader title="Công Việc" />

      <div className="week-toolbar">
        <button type="button" onClick={() => setDisplayWeekStart((prev) => getWeekStart(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7)))}>
          <FontAwesomeIcon icon={faChevronLeft} /> Tuần trước
        </button>
        <strong>{weekRangeLabel}</strong>
        <button type="button" onClick={() => setDisplayWeekStart((prev) => getWeekStart(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7)))}>
          Tuần sau <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {!selectedRoomId && <div className="empty-box">Vui lòng chọn phòng ở sidebar trước khi dùng trang này.</div>}

      {selectedRoomId && (
        <>
          <section className="task-section">
            {loading ? (
              <div className="empty-box">Đang tải...</div>
            ) : (
              <div className="task-week-grid">
                {dayColumns.map((day, index) => {
                  const date = weekDates[index];
                  const dateKey = formatDateOnly(date);
                  const dayTasks = tasksByDateKey.get(dateKey) || [];
                  const isToday = dateKey === todayKey;

                  return (
                    <div key={dateKey} className="task-day-column">
                      <div className="task-day-header">
                        <span className="task-day-label">{day.shortLabel}</span>
                        <span className={`task-day-number ${isToday ? 'selected' : ''}`}>{date.getDate()}</span>
                      </div>
                      <div className="task-day-content">
                        {dayTasks.length === 0 ? (
                          <div className="task-day-empty">Không có việc cần làm</div>
                        ) : (
                          dayTasks.map((task) => renderDutyTaskCard(task))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </>
      )}
      {showProofModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowProofModal(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Hoàn thành nhiệm vụ</h2>
              <button type="button" onClick={() => !saving && setShowProofModal(false)}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="modal-body">
              <p className="proof-title">{proofTarget?.item?.title}</p>
              <label htmlFor="proof-images">Ảnh minh chứng (tuỳ chọn)</label>
              <input id="proof-images" type="file" accept="image/*" multiple onChange={handleSelectProofImages} />
              <small className="proof-note">Bạn có thể nộp có ảnh hoặc không ảnh đều được.</small>
              <div className="proof-preview-grid">
                {proofImages.map((image, index) => (
                  <img key={`preview-${index}`} src={image} alt="proof preview" />
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={() => !saving && setShowProofModal(false)} disabled={saving}>Hủy</button>
              <button type="button" className="btn-primary" onClick={handleCompleteWithProof} disabled={saving}>
                {saving ? 'Đang cập nhật...' : 'Xác nhận hoàn thành'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracking;
