import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import classApi from '../services/classApi';
import useAuthStore from '../store/useAuthStore';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const token = searchParams.get('token');
  const isProcessed = useRef(false);

  useEffect(() => {
    if (!token) {
      toast.error('Đường dẫn lời mời không hợp lệ!');
      navigate('/');
      return;
    }

    if (isProcessed.current) return;
    isProcessed.current = true;

    // Nếu chưa đăng nhập, lưu token vào localStorage và đá sang trang login
    if (!isAuthenticated()) {
      localStorage.setItem('pendingInviteToken', token);
      toast.success('Vui lòng đăng nhập để tham gia lớp học!');
      navigate('/login');
      return;
    }

    // Nếu đã đăng nhập, tiến hành gọi API chấp nhận lời mời
    const processInvite = async () => {
      try {
        await classApi.acceptInvitation(token);
        toast.success('Đã tham gia lớp học thành công!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lời mời không hợp lệ hoặc đã hết hạn!');
      } finally {
        // Dọn dẹp token pending nếu có
        localStorage.removeItem('pendingInviteToken');
        navigate('/'); // Trở về màn hình chính
      }
    };

    processInvite();
  }, [token, navigate, isAuthenticated]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "'Google Sans', sans-serif" }}>
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-sm border border-[#e0e0e0]">
        <svg className="animate-spin w-10 h-10 text-[#1a73e8]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-[16px] text-[#3c4043] font-medium">Đang xử lý lời mời...</span>
        <span className="text-[13px] text-[#5f6368]">Vui lòng chờ trong giây lát</span>
      </div>
    </div>
  );
}
