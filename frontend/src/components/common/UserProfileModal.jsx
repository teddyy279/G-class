import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import axiosClient from '../../services/axiosClient';

export default function UserProfileModal({ onClose }) {
  const { user, fetchUser } = useAuthStore();
  const [form, setForm] = useState({ fullName: '', avatar: '', password: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName || '', avatar: user.avatar || '', password: '' });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // Don't send empty password

      await axiosClient.post('/user/update-user', payload);
      toast.success('Cập nhật thông tin thành công!');
      await fetchUser(); // reload user info in store
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center text-[#202124] border-b border-[#e0e0e0]">
          <h2 className="text-xl font-medium">Quản lý tài khoản</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f3f4] rounded-full text-[#5f6368] -mr-2 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex justify-center mb-6">
            <div className="w-[100px] h-[100px] rounded-full bg-[#1da462] flex items-center justify-center text-white text-4xl font-medium overflow-hidden border-4 border-white shadow-sm">
              {form.avatar || user?.avatar ? (
                <img src={form.avatar || user?.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (form.fullName || user?.username || 'U')[0].toUpperCase()
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#5f6368] mb-1">Họ và tên</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition"
                placeholder="Nhập họ và tên"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#5f6368] mb-1">URL Ảnh đại diện</label>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#5f6368] mb-1">Mật khẩu mới (bỏ trống nếu không đổi)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-[#dadce0] rounded-md focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none transition"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-5 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4] rounded transition">
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#1a73e8] text-white text-[14px] font-medium rounded hover:bg-[#1557b0] disabled:opacity-50 transition"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
