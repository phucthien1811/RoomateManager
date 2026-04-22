import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faClipboardCheck,
  faImage,
  faPlus,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import choreService from '../services/chore.service.js';
import roomService from '../services/room.service.js';
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

const getEntityId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || value.id || '';
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Không thể đọc ảnh'));
  reader.readAsDataURL(file);
});

const TaskTracking = () => {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [displayWeekStart, setDisplayWeekStart] = useState(() => getWeekStart(new Date()));
  const [members, setMembers] = useState([]);
  const [manualTasks, setManualTasks] = useState([]);
  const [dutyTasks, setDutyTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofTarget, setProofTarget] = useState(null);
  const [proofImages, setProofImages] = useState([]);
  const [createForm, setCreateForm] = useState({
    title: '',
    choreDate: formatDateOnly(new Date()),
    startHour: '',
    endHour: '',
    note: '',
    memberIds: [],
  });

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

  const memberNameById = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(getEntityId(member), member.name || member.email || 'Thành viên'));
    return map;
  }, [members]);

  const fetchData = async () => {
    if (!selectedRoomId) {
      setMembers([]);
      setManualTasks([]);
      setDutyTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [roomMembers, chores, dutyItems] = await Promise.all([
        roomService.getRoomMembers(selectedRoomId),
        choreService.getChoresByRoom(selectedRoomId),
        choreService.getMyDutyTasks(selectedRoomId, displayWeekKey),
      ]);
      setMembers(Array.isArray(roomMembers) ? roomMembers : []);
      setManualTasks(Array.isArray(chores) ? chores : []);
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

  const openCreateModal = () => {
    setCreateForm({
      title: '',
      choreDate: formatDateOnly(new Date()),
      startHour: '',
      endHour: '',
      note: '',
      memberIds: [],
    });
    setError('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;
    setShowCreateModal(false);
  };

  const toggleMember = (memberId) => {
    setCreateForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((item) => item !== memberId)
        : [...prev.memberIds, memberId],
    }));
  };

  const handleCreateTask = async () => {
    if (!selectedRoomId) {
      setError('Bạn chưa chọn phòng');
      return;
    }
    if (!createForm.title.trim()) {
      setError('Vui lòng nhập tiêu đề công việc');
      return;
    }
    if (!createForm.choreDate) {
      setError('Vui lòng chọn ngày thực hiện');
      return;
    }
    if (createForm.memberIds.length === 0) {
      setError('Vui lòng tag ít nhất 1 thành viên');
      return;
    }
    if ((createForm.startHour && !createForm.endHour) || (!createForm.startHour && createForm.endHour)) {
      setError('Nếu dùng khung giờ thì cần nhập đủ giờ bắt đầu và kết thúc');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await choreService.createChore({
        room_id: selectedRoomId,
        title: createForm.title.trim(),
        chore_date: createForm.choreDate,
        note: createForm.note.trim(),
        member_ids: createForm.memberIds,
        start_hour: createForm.startHour ? Number(createForm.startHour) : null,
        end_hour: createForm.endHour ? Number(createForm.endHour) : null,
      });
      setShowCreateModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Không thể tạo công việc');
    } finally {
      setSaving(false);
    }
  };

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
    if (proofImages.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ảnh minh chứng');
      return;
    }

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

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      setSaving(true);
      await choreService.deleteChore(taskId);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Không thể xóa công việc');
    } finally {
      setSaving(false);
    }
  };

  const isMine = (task) => {
    const userId = String(user?.id || '');
    const assignedMembers = Array.isArray(task.assigned_members) ? task.assigned_members : [];
    return assignedMembers.some((item) => String(getEntityId(item)) === userId)
      || String(getEntityId(task.assigned_to)) === userId;
  };

  const canDelete = (task) => {
    const creatorId = String(getEntityId(task.created_by));
    return creatorId && creatorId === String(user?.id || '');
  };

  const myManualTasks = useMemo(() => {
    const weekStart = new Date(displayWeekStart);
    const weekEnd = new Date(displayWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return manualTasks
      .filter((task) => isMine(task))
      .filter((task) => {
        const taskDate = new Date(task.chore_date);
        return !Number.isNaN(taskDate.getTime()) && taskDate >= weekStart && taskDate <= weekEnd;
      })
      .sort((a, b) => new Date(a.chore_date) - new Date(b.chore_date));
  }, [manualTasks, displayWeekStart]);

  return (
    <div className="task-tracking-page">
      <PageHeader title="Công Việc" />

      <div className="week-toolbar">
        <button type="button" onClick={() => setDisplayWeekStart((prev) => getWeekStart(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7)))}>
          <FontAwesomeIcon icon={faChevronLeft} /> Tuần trước
        </button>
        <strong>Tuần {displayWeekKey}</strong>
        <button type="button" onClick={() => setDisplayWeekStart((prev) => getWeekStart(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7)))}>
          Tuần sau <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {!selectedRoomId && <div className="empty-box">Vui lòng chọn phòng ở sidebar trước khi dùng trang này.</div>}

      {selectedRoomId && (
        <>
          <section className="task-section">
            <div className="section-title">
              <FontAwesomeIcon icon={faClipboardCheck} /> Nhiệm vụ của tôi theo lịch trực
            </div>
            {loading ? (
              <div className="empty-box">Đang tải...</div>
            ) : dutyTasks.length === 0 ? (
              <div className="empty-box">Tuần này bạn chưa được tag vào lịch trực nào.</div>
            ) : (
              <div className="task-grid">
                {dutyTasks.map((task) => (
                  <article key={task.duty_id || task._id} className={`task-card ${task.status}`}>
                    <h3>{task.title}</h3>
                    <p>{new Date(task.chore_date).toLocaleDateString('vi-VN')} • {task.duty_day_label}</p>
                    <p>{task.start_hour}:00 - {task.end_hour}:00</p>
                    {task.note && <small>{task.note}</small>}
                    <div className="proof-list">
                      {(task.proof_images || []).map((image, index) => (
                        <img key={`${task._id}-proof-${index}`} src={image} alt="proof" />
                      ))}
                    </div>
                    {task.status === 'completed' ? (
                      <span className="status done"><FontAwesomeIcon icon={faCheck} /> Đã hoàn thành</span>
                    ) : (
                      <button type="button" className="btn-secondary" onClick={() => openProofModal({ type: 'duty', item: task })}>
                        <FontAwesomeIcon icon={faImage} /> Hoàn thành + ảnh
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="task-section">
            <div className="section-title" style={{ justifyContent: 'space-between' }}>
              <span><FontAwesomeIcon icon={faClipboardCheck} /> Công việc chung được tag</span>
              <button type="button" className="btn-primary" onClick={openCreateModal}>
                <FontAwesomeIcon icon={faPlus} /> Tạo công việc
              </button>
            </div>
            {loading ? (
              <div className="empty-box">Đang tải...</div>
            ) : myManualTasks.length === 0 ? (
              <div className="empty-box">Tuần này bạn chưa được tag vào công việc chung nào.</div>
            ) : (
              <div className="task-grid">
                {myManualTasks.map((task) => {
                  const assignedMembers = Array.isArray(task.assigned_members) ? task.assigned_members : [];
                  const tags = assignedMembers
                    .map((member) => memberNameById.get(getEntityId(member)) || member?.name || member?.email)
                    .filter(Boolean);

                  return (
                    <article key={task._id} className={`task-card ${task.status}`}>
                      <h3>{task.title}</h3>
                      <p>{new Date(task.chore_date).toLocaleDateString('vi-VN')}</p>
                      {task.start_hour !== null && task.end_hour !== null && (
                        <p>{task.start_hour}:00 - {task.end_hour}:00</p>
                      )}
                      {task.note && <small>{task.note}</small>}
                      {tags.length > 0 && (
                        <div className="tag-list">
                          {tags.map((tagName) => <span key={`${task._id}-${tagName}`}>{tagName}</span>)}
                        </div>
                      )}
                      <div className="proof-list">
                        {(task.proof_images || []).map((image, index) => (
                          <img key={`${task._id}-proof-${index}`} src={image} alt="proof" />
                        ))}
                      </div>
                      <div className="task-actions">
                        {task.status === 'completed' ? (
                          <span className="status done"><FontAwesomeIcon icon={faCheck} /> Đã hoàn thành</span>
                        ) : (
                          <button type="button" className="btn-secondary" onClick={() => openProofModal({ type: 'manual', item: task })}>
                            <FontAwesomeIcon icon={faImage} /> Hoàn thành + ảnh
                          </button>
                        )}
                        {canDelete(task) && (
                          <button type="button" className="btn-danger" onClick={() => handleDeleteTask(task._id)} disabled={saving}>
                            <FontAwesomeIcon icon={faTrash} /> Xóa
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

        </>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <h2>Tạo công việc chung</h2>
              <button type="button" onClick={closeCreateModal}><FontAwesomeIcon icon={faXmark} /></button>
            </div>
            <div className="modal-body">
              <label htmlFor="task-title">Tiêu đề *</label>
              <input
                id="task-title"
                type="text"
                value={createForm.title}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ví dụ: Lau bếp, đổ rác..."
              />

              <label htmlFor="task-date">Ngày thực hiện *</label>
              <input
                id="task-date"
                type="date"
                value={createForm.choreDate}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, choreDate: event.target.value }))}
              />

              <div className="time-grid">
                <div>
                  <label htmlFor="task-start-hour">Giờ bắt đầu</label>
                  <input
                    id="task-start-hour"
                    type="number"
                    min="0"
                    max="23"
                    value={createForm.startHour}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, startHour: event.target.value }))}
                    placeholder="Ví dụ: 18"
                  />
                </div>
                <div>
                  <label htmlFor="task-end-hour">Giờ kết thúc</label>
                  <input
                    id="task-end-hour"
                    type="number"
                    min="1"
                    max="24"
                    value={createForm.endHour}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, endHour: event.target.value }))}
                    placeholder="Ví dụ: 19"
                  />
                </div>
              </div>

              <label htmlFor="task-note">Ghi chú</label>
              <textarea
                id="task-note"
                rows={3}
                value={createForm.note}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Mô tả ngắn (không bắt buộc)"
              />

              <label>Tag thành viên *</label>
              <div className="member-pick-list">
                {members.map((member) => {
                  const memberId = getEntityId(member);
                  return (
                    <label key={memberId} className="member-item">
                      <input
                        type="checkbox"
                        checked={createForm.memberIds.includes(memberId)}
                        onChange={() => toggleMember(memberId)}
                      />
                      <span>{member.name || member.email || 'Thành viên'}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={closeCreateModal} disabled={saving}>Hủy</button>
              <button type="button" className="btn-primary" onClick={handleCreateTask} disabled={saving}>
                {saving ? 'Đang tạo...' : 'Tạo công việc'}
              </button>
            </div>
          </div>
        </div>
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
              <label htmlFor="proof-images">Ảnh minh chứng *</label>
              <input id="proof-images" type="file" accept="image/*" multiple onChange={handleSelectProofImages} />
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
