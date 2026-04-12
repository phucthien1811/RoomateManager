import api from './api';

const postService = {
  /**
   * Lấy danh sách bài viết (posts) trên bảng thông báo
   */
  getPosts: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}/posts`);
      return response.data.posts || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Tạo bài viết mới
   */
  createPost: async (roomId, postData) => {
    try {
      const response = await api.post(`/rooms/${roomId}/posts`, postData);
      return response.data.post;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cập nhật bài viết
   */
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/posts/${postId}`, postData);
      return response.data.post;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa bài viết
   */
  deletePost: async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy bài viết theo ID
   */
  getPostDetail: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      return response.data.post;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Thích bài viết
   */
  likePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return response.data.post;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Bỏ thích bài viết
   */
  unlikePost: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/unlike`);
      return response.data.post;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Bình luận trên bài viết
   */
  commentPost: async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content,
      });
      return response.data.comment;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy bình luận của bài viết
   */
  getPostComments: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return response.data.comments || [];
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Xóa bình luận
   */
  deleteComment: async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      return { success: true };
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default postService;
