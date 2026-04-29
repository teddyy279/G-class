import axiosClient from './axiosClient';

const classApi = {
  // Lấy danh sách lớp của tôi (G-class/class/my-class)
  getMyClasses: () => axiosClient.get('/class/my-class'),

  // Lấy chi tiết lớp (G-class/class/{id})
  getClassDetail: (classId) => axiosClient.get(`/class/${classId}`),

  // Tạo lớp mới (G-class/class)
  createClass: (data) => axiosClient.post('/class', data),

  // Cập nhật thông tin lớp (G-class/class/{id})
  updateClass: (classId, data) => axiosClient.put(`/class/${classId}`, data),

  // Lưu trữ lớp (G-class/class/{id}/archive)
  archiveClass: (classId) => axiosClient.patch(`/class/${classId}/archive`),

  // Tham gia lớp bằng mã (G-class/class/join)
  joinClass: (data) => axiosClient.post('/class/join', data),

  // Lấy danh sách thành viên (G-class/class/{id}/members)
  getMembers: (classId) => axiosClient.get(`/class/${classId}/members`),

  // Mời thành viên (G-class/class/invite)
  sendInvitation: (data) => axiosClient.post('/class/invite', data),

  // Chấp nhận lời mời (G-class/class/accept-invitation/{token})
  acceptInvitation: (token) => axiosClient.post(`/class/accept-invitation/${token}`),

  // Rời lớp (G-class/class/{id}/leave)
  leaveClass: (classId) => axiosClient.delete(`/class/${classId}/leave`),

  // Xóa thành viên khỏi lớp (teacher only)
  removeMember: (classId, memberId) => axiosClient.delete(`/class/${classId}/members/${memberId}`),
};

export default classApi;
