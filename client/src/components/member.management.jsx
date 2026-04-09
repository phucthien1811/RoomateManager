import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faEnvelope,
  faPhone,
  faCrown,
  faCheckCircle,
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';
import '../styles/member.management.css';

const MemberManagement = () => {
  const [members, setMembers] = useState([
    {
      id: 1,
      name: 'Duy Nguyễn',
      email: 'duy.nguyen@email.com',
      phone: '0901234567',
      room: 'Trần Hùng Đạo',
      role: 'Chủ phòng',
      status: 'active',
      joinDate: '2024-01-15',
      totalDebt: 0,
    },
    {
      id: 2,
      name: 'Iris Trần',
      email: 'iris.tran@email.com',
      phone: '0912345678',
      room: 'Trần Hùng Đạo',
      role: 'Thành viên',
      status: 'active',
      joinDate: '2024-02-10',
      totalDebt: 850000,
    },
    {
      id: 3,
      name: 'An Phạm',
      email: 'an.pham@email.com',
      phone: '0923456789',
      room: 'An Dương Vương',
      role: 'Thành viên',
      status: 'active',
      joinDate: '2024-03-05',
      totalDebt: 0,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    room: '',
    role: 'Thành viên',
  });
  const [editingId, setEditingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleOpenModal = (type, member = null) => {
    setModalType(type);
    if (type === 'edit' && member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone,
        room: member.room,
        role: member.role,
      });
      setEditingId(member.id);
    } else {
      setFormData({ name: '', email: '', phone: '', room: '', role: 'Thành viên' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', room: '', role: 'Thành viên' });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveMember = () => {
    if (modalType === 'create') {
      const newMember = {
        ...formData,
        id: members.length + 1,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        totalDebt: 0,
      };
      setMembers([...members, newMember]);
    } else if (modalType === 'edit') {
      setMembers(
        members.map((member) =>
          member.id === editingId ? { ...member, ...formData } : member
        )
      );
    }
    handleCloseModal();
  };

  const handleDeleteMember = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) {
      setMembers(members.filter((member) => member.id !== id));
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

  const getStatusClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  return (
    <div className="member-management">
      <div className="member-management-header">
        <div className="header-content">
          <h1>Quản Lý Thành Viên</h1>
          <p>Quản lý thông tin thành viên phòng và các quyền lợi liên quan</p>
        </div>
        <button
          className="btn-add-member"
          onClick={() => handleOpenModal('create')}
        >
          <FontAwesomeIcon icon={faPlus} /> Thêm Thành Viên
        </button>
      </div>

      <div className="members-table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th>Tên Thành Viên</th>
              <th>Email</th>
              <th>Điện Thoại</th>
              <th>Phòng</th>
              <th>Vai Trò</th>
              <th>Nợ Tiền</th>
              <th>Trạng Thái</th>
              <th>Ngày Tham Gia</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="member-row">
                <td className="member-name">
                  <div className="name-cell">
                    <div className="member-avatar">{member.name.charAt(0)}</div>
                    <div>
                      <div className="member-full-name">{member.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="email-cell">
                    <FontAwesomeIcon icon={faEnvelope} /> {member.email}
                  </div>
                </td>
                <td>
                  <div className="phone-cell">
                    <FontAwesomeIcon icon={faPhone} /> {member.phone}
                  </div>
                </td>
                <td>{member.room}</td>
                <td>
                  <div className="role-cell">
                    {member.role === 'Chủ phòng' && (
                      <FontAwesomeIcon icon={faCrown} className="role-icon" />
                    )}
                    {member.role}
                  </div>
                </td>
                <td>
                  <div
                    className={`debt-cell ${
                      member.totalDebt > 0 ? 'has-debt' : 'no-debt'
                    }`}
                  >
                    {member.totalDebt > 0 ? formatCurrency(member.totalDebt) : '✓'}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(member.status)}`}>
                    {member.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="date-cell">{formatDate(member.joinDate)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-table-action edit"
                      onClick={() => handleOpenModal('edit', member)}
                      title="Chỉnh sửa"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="btn-table-action delete"
                      onClick={() => handleDeleteMember(member.id)}
                      title="Xóa"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {modalType === 'create'
                  ? 'Thêm Thành Viên Mới'
                  : 'Chỉnh Sửa Thành Viên'}
              </h2>
              <button
                className="btn-close-modal"
                onClick={handleCloseModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Tên Thành Viên</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên thành viên"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Điện Thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="090xxxxxxxx"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="room">Phòng</label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="Chọn phòng"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Vai Trò</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="Thành viên">Thành viên</option>
                    <option value="Chủ phòng">Chủ phòng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
              >
                Hủy
              </button>
              <button
                className="btn-submit"
                onClick={handleSaveMember}
              >
                {modalType === 'create' ? 'Thêm Thành Viên' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
