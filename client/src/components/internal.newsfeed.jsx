import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext.jsx';
import postService from '../services/post.service.js';
import roomService from '../services/room.service.js';
import PageHeader from './PageHeader.jsx';
import '../styles/internal.newsfeed.css';

const emptyForm = {
  title: '',
  content: '',
};

const InternalNewsfeed = () => {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(localStorage.getItem('currentRoomId') || '');
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingPostId, setEditingPostId] = useState('');

  const isEditing = Boolean(editingPostId);

  const fetchPosts = async (roomId) => {
    if (!roomId) {
      setPosts([]);
      setRoomName('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [room, postList] = await Promise.all([roomService.getRoomById(roomId), postService.getPosts(roomId)]);
      setRoomName(room?.name || 'Phòng hiện tại');
      setPosts(Array.isArray(postList) ? postList : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải bảng tin nội bộ');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(selectedRoomId);
  }, [selectedRoomId]);

  useEffect(() => {
    const handleRoomSelected = (event) => {
      const roomId = event.detail?.roomId || localStorage.getItem('currentRoomId') || '';
      setSelectedRoomId(roomId);
    };

    window.addEventListener('room-selected', handleRoomSelected);
    return () => window.removeEventListener('room-selected', handleRoomSelected);
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingPostId('');
  };

  const handleSubmit = async () => {
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng để đăng bài');
      return;
    }
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (isEditing) {
        const updated = await postService.updatePost(editingPostId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
        });
        setPosts((prev) => prev.map((post) => (post._id === editingPostId ? updated : post)));
      } else {
        const created = await postService.createPost(selectedRoomId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
        });
        setPosts((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err?.message || 'Không thể lưu bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post._id);
    setFormData({
      title: post.title || '',
      content: post.content || '',
    });
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      if (editingPostId === postId) {
        resetForm();
      }
    } catch (err) {
      setError(err?.message || 'Không thể xóa bài viết');
    }
  };

  const canManagePost = (post) => {
    const authorId = post?.author?._id || post?.author;
    return String(authorId || '') === String(user?.id || '');
  };

  const postCountLabel = useMemo(() => {
    if (!posts.length) return 'Chưa có bài viết';
    return `${posts.length} bài viết`;
  }, [posts.length]);

  return (
    <div className="internal-newsfeed-page">
      <PageHeader 
        title="Bảng Tin Nội Bộ"
      />

      <div className="newsfeed-create-box">
        <h3>{isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h3>
        <input
          type="text"
          className="newsfeed-input"
          placeholder="Tiêu đề bài viết..."
          value={formData.title}
          onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
          disabled={submitting}
        />
        <textarea
          className="newsfeed-textarea"
          placeholder="Viết nội dung muốn thông báo cho cả phòng..."
          value={formData.content}
          onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
          rows={5}
          disabled={submitting}
        />

        {error && <div className="newsfeed-error">{error}</div>}

        <div className="newsfeed-create-actions">
          {isEditing && (
            <button type="button" className="btn-cancel-post" onClick={resetForm} disabled={submitting}>
              Hủy sửa
            </button>
          )}
          <button type="button" className="btn-submit-post" onClick={handleSubmit} disabled={submitting}>
            <FontAwesomeIcon icon={isEditing ? faPen : faPlus} /> {isEditing ? 'Lưu chỉnh sửa' : 'Đăng bài'}
          </button>
        </div>
      </div>

      <div className="newsfeed-list">
        {loading ? (
          <div className="newsfeed-empty">Đang tải bảng tin...</div>
        ) : posts.length === 0 ? (
          <div className="newsfeed-empty">Chưa có bài viết nào. Hãy đăng bài đầu tiên.</div>
        ) : (
          posts.map((post) => (
            <article key={post._id} className="newsfeed-post-card">
              <header className="post-card-header">
                <div className="post-author-avatar">
                  {(post?.author?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="post-author-meta">
                  <strong>{post?.author?.name || 'Thành viên'}</strong>
                  <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                {canManagePost(post) && (
                  <div className="post-card-actions">
                    <button type="button" onClick={() => startEdit(post)} title="Sửa bài viết">
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button type="button" onClick={() => handleDelete(post._id)} title="Xóa bài viết">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                )}
              </header>
              <div className="post-card-body">
                <h4>{post.title}</h4>
                <p>{post.content}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default InternalNewsfeed;
