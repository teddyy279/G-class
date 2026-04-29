import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import authApi from '../../services/authApi';

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
];

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    clearAuth();
    toast.success('Đã đăng xuất!');
    navigate('/login');
  };

  const avatarColor = AVATAR_COLORS[(user?.fullName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
      {/* Hamburger */}
      <button
        id="menu-toggle"
        onClick={onMenuClick}
        className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-1.5 select-none">
        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 3a1 1 0 011-1h18a1 1 0 011 1v18a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 2v14h14V5H4zm2 2h10v2H6V7zm0 4h10v2H6v-2zm0 4h6v2H6v-2z" />
        </svg>
        <span className="text-xl font-medium text-green-700 hidden sm:block">Classroom</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Apps icon */}
      <button className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 8a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM6 14a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zM6 20a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {/* Avatar Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          id="avatar-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-9 h-9 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold`}>
              {initials}
            </div>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            {/* User info */}
            <div className="p-4 border-b border-gray-100 text-center">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xl font-bold mx-auto mb-2`}>
                {initials}
              </div>
              <p className="font-medium text-gray-800">{user?.fullName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setDropdownOpen(false)}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Hồ sơ cá nhân
              </Link>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
