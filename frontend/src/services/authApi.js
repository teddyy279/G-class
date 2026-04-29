import axiosClient from './axiosClient';

const authApi = {
  // Đăng ký tài khoản mới
  register: (data) =>
    axiosClient.post('/user/create-user', data),

  // Đăng nhập bằng username/password
  login: (data) =>
    axiosClient.post('/auth/token', data),

  // Đăng xuất (xóa refresh-token cookie phía server)
  logout: () =>
    axiosClient.post('/auth/logout'),

  // Gửi OTP về email để reset mật khẩu
  sendOtp: (email) =>
    axiosClient.post('/auth/send-otp', { email }),

  // Đặt lại mật khẩu bằng OTP
  resetPassword: (data) =>
    axiosClient.post('/auth/reset-password', data),

  // Build Google OAuth URL - redirect_uri phải là frontend callback
  // Google sẽ redirect về frontend với code, frontend gọi backend exchange
  getGoogleLoginUrl: () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const frontendUrl = window.location.origin;
    const redirectUri = encodeURIComponent(`${frontendUrl}/auth/google/callback`);
    const scope = encodeURIComponent('email profile');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
  },

  // Backend exchange code lấy JWT (GET endpoint)
  exchangeGoogleCode: (code, redirectUri) =>
    axiosClient.get(`/auth/outbound/authentication?code=${code}&redirectUri=${encodeURIComponent(redirectUri)}`),
};

export default authApi;
