import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import axiosClient from '../services/axiosClient';
import useAuthStore from '../store/useAuthStore';

/**
 * Trang này Google sẽ redirect về sau khi user đồng ý login.
 * URL dạng: /auth/google/callback?code=XXXX
 * Ta sẽ lấy code và gọi backend để exchange lấy token.
 */

// Đặt cờ ở ngoài component để React StrictMode không thể reset được
let isCallbackProcessed = false;

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  const isCalled = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      toast.error('Lỗi xác thực Google!');
      navigate('/login');
      return;
    }

    if (isCallbackProcessed) return;
    isCallbackProcessed = true;

    const handleCallback = async () => {
      try {
        // Dùng axios thẳng (không qua interceptor) để tránh gắn Bearer token cũ vào request public này
        const currentRedirectUri = `${window.location.origin}/auth/google/callback`;
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/auth/outbound/authentication?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(currentRedirectUri)}`,
          { withCredentials: true }
        );
        const token = res.data.result?.token;
        if (!token) throw new Error('No token');

        localStorage.setItem('accessToken', token);
        const meRes = await axiosClient.get('/user/my-info', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(meRes.data.result, token);
        toast.success(`Chào mừng, ${meRes.data.result?.fullName || 'bạn'}!`);
        
        const pendingToken = localStorage.getItem('pendingInviteToken');
        if (pendingToken) {
          navigate(`/accept-invite?token=${pendingToken}`);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Google callback error:', err.response?.data || err.message);
        toast.error('Đăng nhập Google thất bại, vui lòng thử lại!');
        navigate('/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">Đang xác thực với Google...</p>
        <p className="text-slate-400 text-sm mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  );
}
