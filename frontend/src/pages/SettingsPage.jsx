import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import userApi from '../services/userApi';

const TABS = [
  { key: 'profile', label: 'Hồ sơ', icon: '👤' },
  { key: 'avatar', label: 'Ảnh đại diện', icon: '🖼️' },
  { key: 'password', label: 'Đổi mật khẩu', icon: '🔒' },
];

function ProfileTab({ user, onSaved }) {
  const [form, setForm] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error('Tên không được để trống!'); return; }
    setLoading(true);
    try {
      const res = await userApi.updateUser({ fullName: form.fullName, email: form.email });
      onSaved(res.data.result);
      toast.success('Đã cập nhật hồ sơ!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
        <input
          value={form.fullName}
          onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition"
          placeholder="Nhập họ và tên"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          type="email"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition"
          placeholder="Nhập email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
        <input
          value={user?.username || ''}
          disabled
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">Tên đăng nhập không thể thay đổi</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] disabled:opacity-60 transition"
      >
        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
      </button>
    </form>
  );
}

function AvatarTab({ user, onSaved }) {
  const [preview, setPreview] = useState(user?.avatar || null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Ảnh không được lớn hơn 5MB!'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Vui lòng chọn ảnh!'); return; }
    setLoading(true);
    try {
      const res = await userApi.uploadAvatar(file);
      onSaved(res.data.result);
      toast.success('Đã cập nhật ảnh đại diện!');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload ảnh thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-sm">
      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {preview ? (
            <img
              src={preview}
              alt="avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-4xl font-medium shadow-lg border-4 border-white">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{user?.fullName || user?.username}</p>
          <p className="text-xs text-gray-400 mt-0.5">JPG, PNG tối đa 5MB</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition text-gray-700"
        >
          Chọn ảnh
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="flex-1 px-4 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] disabled:opacity-50 transition"
        >
          {loading ? 'Đang tải...' : 'Lưu ảnh'}
        </button>
      </div>
    </div>
  );
}

function PasswordField({ label, field, value, onChange, show, toggleShow }) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition"
          placeholder="••••••••"
        />
        <button type="button" onClick={() => toggleShow(field)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show
            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          }
        </button>
      </div>
    </div>
  );
}

function PasswordTab({ user }) {
  const isGoogleUser = user?.authProvider === 'GOOGLE';
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ oldPassword: false, newPassword: false, confirmPassword: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Mật khẩu xác nhận không khớp!'); return; }
    if (form.newPassword.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return; }
    setLoading(true);
    try {
      await userApi.changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => setForm(p => ({ ...p, [field]: value }));
  const toggleShow = (field) => setShow(p => ({ ...p, [field]: !p[field] }));

  if (isGoogleUser) {
    return (
      <div className="max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">Tài khoản Google</p>
            <p className="text-sm text-blue-600 mt-1">Bạn đang đăng nhập bằng Google. Vui lòng thay đổi mật khẩu trên <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="underline font-medium">myaccount.google.com</a>.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <PasswordField label="Mật khẩu hiện tại" field="oldPassword" value={form.oldPassword} onChange={handleChange} show={show.oldPassword} toggleShow={toggleShow} />
      <PasswordField label="Mật khẩu mới" field="newPassword" value={form.newPassword} onChange={handleChange} show={show.newPassword} toggleShow={toggleShow} />
      <PasswordField label="Xác nhận mật khẩu mới" field="confirmPassword" value={form.confirmPassword} onChange={handleChange} show={show.confirmPassword} toggleShow={toggleShow} />
      <button
        type="submit"
        disabled={loading || !form.oldPassword || !form.newPassword || !form.confirmPassword}
        className="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] disabled:opacity-50 transition"
      >
        {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => { setCurrentUser(user); }, [user]);

  const handleSaved = (updatedUser) => {
    setCurrentUser(updatedUser);
    setAuth(updatedUser, accessToken);
  };

  return (
    <div className="max-w-3xl mx-auto" style={{ fontFamily: "'Google Sans', Roboto, sans-serif" }}>
      <h1 className="text-2xl font-normal text-[#1f1f1f] mb-6">Cài đặt tài khoản</h1>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition ${
                  activeTab === tab.key
                    ? 'bg-[#e8f0fe] text-[#1a73e8]'
                    : 'text-[#3c4043] hover:bg-[#f1f3f4]'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-[#e0e0e0] p-6">
          {activeTab === 'profile' && (
            <>
              <h2 className="text-lg font-medium text-[#1f1f1f] mb-5">Hồ sơ cá nhân</h2>
              <ProfileTab user={currentUser} onSaved={handleSaved} />
            </>
          )}
          {activeTab === 'avatar' && (
            <>
              <h2 className="text-lg font-medium text-[#1f1f1f] mb-5">Ảnh đại diện</h2>
              <AvatarTab user={currentUser} onSaved={handleSaved} />
            </>
          )}
          {activeTab === 'password' && (
            <>
              <h2 className="text-lg font-medium text-[#1f1f1f] mb-5">Đổi mật khẩu</h2>
              <PasswordTab user={currentUser} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
