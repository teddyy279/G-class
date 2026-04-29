import axiosClient from './axiosClient';

const userApi = {
  // Lấy thông tin cá nhân
  getMyInfo: () =>
    axiosClient.get('/user/my-info'),

  // Cập nhật thông tin cá nhân
  updateUser: (data) =>
    axiosClient.post('/user/update-user', data),

  // Upload/cập nhật ảnh đại diện
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return axiosClient.post('/user/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Đổi mật khẩu
  changePassword: (data) =>
    axiosClient.post('/user/change-password', data),
};

export default userApi;
