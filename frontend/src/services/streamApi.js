import axiosClient from './axiosClient';

const streamApi = {
  // Lấy danh sách bài đăng (Bảng tin)
  getStream: (classId, page = 0, size = 10) =>
    axiosClient.get(`/class/${classId}/stream`, { params: { page, size } }),

  // Tạo bài đăng mới
  createPost: (classId, data) =>
    axiosClient.post(`/class/${classId}/post`, data),

  // Upload file cho bài đăng
  uploadPostFile: (classId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return axiosClient.post(`/class/${classId}/post/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Cập nhật bài đăng
  updatePost: (classId, postId, data) =>
    axiosClient.put(`/class/${classId}/post/${postId}`, data),

  // Lấy chi tiết một bài đăng
  getPostById: (classId, postId) =>
    axiosClient.get(`/class/${classId}/post/${postId}`),

  // Xóa bài đăng
  deletePost: (classId, postId) =>
    axiosClient.delete(`/class/${classId}/post/${postId}`),

  // ─── Comments ───────────────────────────────────────────────────────────────
  // Lấy danh sách bình luận
  getComments: (postId) =>
    axiosClient.get(`/post/${postId}/comments`),

  // Thêm bình luận
  addComment: (postId, data) =>
    axiosClient.post(`/post/${postId}/comments`, data),

  // Xóa bình luận
  deleteComment: (postId, commentId) =>
    axiosClient.delete(`/post/${postId}/comments/${commentId}`),

  // ─── Classwork Comments ─────────────────────────────────────────────────────
  getClassworkComments: (classworkId) =>
    axiosClient.get(`/classwork/${classworkId}/comments`),

  getClassworkPrivateComments: (classworkId) =>
    axiosClient.get(`/classwork/${classworkId}/private-comments`),

  addClassworkComment: (classworkId, data) =>
    axiosClient.post(`/classwork/${classworkId}/comments`, data),

  deleteClassworkComment: (classworkId, commentId) =>
    axiosClient.delete(`/classwork/${classworkId}/comments/${commentId}`),
};

export default streamApi;
