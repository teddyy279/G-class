import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import classApi from '../../services/classApi';
import CreateOrJoinModal from '../common/CreateOrJoinModal';
import UserProfileModal from '../common/UserProfileModal';

// Material Icons SVGs
const MenuIcon = () => (
  <svg className="w-6 h-6 text-gray-600" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
  </svg>
);

const AddIcon = () => (
  <svg className="w-6 h-6 text-gray-600" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
  </svg>
);

const AppsIcon = () => (
  <svg className="w-6 h-6 text-gray-600" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"></path>
  </svg>
);

const HomeIcon = () => (
  <svg className="w-6 h-6" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 8.18L12 14.82l-6.82-3.64l1.82-.97l5 2.67l5-2.67l1.82.97zM12 12.82L5.18 9.18L12 5.55l6.82 3.63L12 12.82z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"></path>
  </svg>
);

const TodoIcon = () => (
  <svg className="w-6 h-6" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"></path>
  </svg>
);

const ArchiveIcon = () => (
  <svg className="w-6 h-6" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.42l.82-1zM5 19V8h14v11H5zm8-4.5l5-5h-3.5V6h-3v3.5H8l5 5z"></path>
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" focusable="false" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"></path>
  </svg>
);


function SidebarItem({ icon, label, path, active, count }) {
  return (
    <Link
      to={path}
      className={`flex items-center gap-6 px-6 py-3 rounded-r-full text-[14px] font-medium transition-all mr-3 ${
        active
          ? 'bg-[#e8f0fe] text-[#1967d2]'
          : 'text-[#3c4043] hover:bg-[#f1f3f4]'
      }`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count && (
        <span className={`px-2 h-5 flex items-center justify-center rounded-full text-xs ${active ? 'bg-[#d2e3fc]' : 'bg-[#e8eaed] text-[#3c4043]'}`}>
          {count}
        </span>
      )}
    </Link>
  );
}

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  const fetchClasses = () => {
    if (!user) return;
    setClassesLoading(true);
    classApi.getMyClasses()
      .then(res => setClasses(res.data.result || []))
      .catch(err => console.error('Failed to fetch classes for sidebar', err))
      .finally(() => setClassesLoading(false));
  };

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const teachingClasses = classes.filter(c => String(c.ownerId) === String(user?.id));
  const enrolledClasses = classes.filter(c => String(c.ownerId) !== String(user?.id));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Màn hình chính', path: '/', icon: <HomeIcon /> },
    { label: 'Lịch', path: '/calendar', icon: <CalendarIcon /> },
  ];

  const subItems = [
    { label: 'Việc cần làm', path: '/to-do', icon: <TodoIcon /> },
    { label: 'Lớp học đã lưu trữ', path: '/archived', icon: <ArchiveIcon /> },
    { label: 'Cài đặt', path: '/settings', icon: <SettingsIcon /> },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#3c4043]">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-[64px] bg-white border-b border-[#e0e0e0] flex items-center justify-between px-4 z-[60]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-3 hover:bg-[#f1f3f4] rounded-full transition-colors flex-shrink-0"
          >
            <MenuIcon />
          </button>
          <Link to="/" className="flex items-center gap-2 px-2 hover:underline decoration-transparent transition-all">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8" viewBox="0 0 48 48">
                {/* Google Classroom Logo approximation */}
                <path fill="#0F9D58" d="M12 40v-4h24v4H12z"/>
                <path fill="#0F9D58" d="M12 12V8h24v4H12z"/>
                <path fill="#0F9D58" d="M8 36H4V12h4v24z"/>
                <path fill="#0F9D58" d="M44 36h-4V12h4v24z"/>
                <path fill="#F4B400" d="M16 26h16v4H16z"/>
              </svg>
            </div>
            <span className="font-google-sans text-[22px] font-normal text-[#5f6368] whitespace-nowrap hidden sm:block">Lớp học</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="p-2.5 hover:bg-[#f1f3f4] rounded-full transition-colors">
              <AddIcon />
            </button>
            {showAddMenu && (
              <div className="absolute top-12 right-0 w-[180px] bg-white rounded shadow-md border border-[#e0e0e0] py-2 z-[70]">
                <button 
                  onClick={() => { setModalType('join'); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#3c4043]"
                >
                  Tham gia lớp học
                </button>
                <button 
                  onClick={() => { setModalType('create'); setShowAddMenu(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-[#f1f3f4] text-sm text-[#3c4043]"
                >
                  Tạo lớp học
                </button>
              </div>
            )}
          </div>
          <button className="p-2.5 hover:bg-[#f1f3f4] rounded-full transition-colors hidden sm:block">
            <AppsIcon />
          </button>
          {/* Notification Bell */}
          <button className="p-2.5 hover:bg-[#f1f3f4] rounded-full transition-colors relative" title="Thông báo">
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </button>
          <div className="relative ml-2">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-[32px] h-[32px] rounded-full bg-[#1da462] text-white flex items-center justify-center font-medium text-sm overflow-hidden ring-2 ring-transparent hover:ring-[#e0e0e0] transition"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.fullName || user?.username || 'U')[0].toUpperCase()
              )}
            </button>
            {showProfileMenu && (
              <div className="absolute top-10 right-0 w-[300px] bg-white rounded-[24px] shadow-lg border border-[#e0e0e0] py-3 z-[70]">
                <div className="px-6 py-4 flex flex-col items-center text-center border-b border-[#e0e0e0]">
                  <div className="w-[80px] h-[80px] rounded-full bg-[#1da462] text-white flex items-center justify-center font-medium text-3xl mb-3 overflow-hidden">
                    {user?.avatar ? <img src={user.avatar} alt="avatar" /> : (user?.fullName || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <h3 className="text-base font-medium text-[#202124] m-0">{user?.fullName || user?.username}</h3>
                  <p className="text-sm text-[#5f6368] m-0">{user?.email}</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => { setShowProfileMenu(false); setShowProfileEditor(true); }}
                    className="w-full px-6 py-2.5 text-left text-sm text-[#3c4043] hover:bg-[#f1f3f4] transition"
                  >
                    Quản lý tài khoản
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-2.5 text-left text-sm text-[#3c4043] hover:bg-[#f1f3f4] transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex pt-[64px] h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static left-0 top-[64px] bottom-0 w-[300px] bg-white border-r lg:border-r-0 border-[#e0e0e0] overflow-y-auto flex-shrink-0 transition-transform duration-200 ease-in-out z-[55] ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden lg:w-0'
          }`}
        >
          <nav className="py-3">
            {navItems.map((item) => (
              <SidebarItem
                key={item.path}
                {...item}
                active={location.pathname === item.path}
              />
            ))}
            
            <div className="my-2 border-t border-[#e0e0e0]" />

            {teachingClasses.length > 0 && (
              <>
                <div className="px-6 py-3 text-[13px] font-medium text-[#5f6368]">
                  Giảng dạy
                </div>
                {teachingClasses.map(cls => (
                  <SidebarItem
                    key={cls.id}
                    label={cls.name}
                    path={`/classes/${cls.id}`}
                    icon={
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {cls.name.charAt(0).toUpperCase()}
                      </div>
                    }
                    active={location.pathname.startsWith(`/classes/${cls.id}`)}
                  />
                ))}
                <div className="my-2 border-t border-[#e0e0e0]" />
              </>
            )}

            {enrolledClasses.length > 0 && (
              <>
                <div className="px-6 py-3 text-[13px] font-medium text-[#5f6368]">
                  Đã đăng ký
                </div>
                {enrolledClasses.map(cls => (
                  <SidebarItem
                    key={cls.id}
                    label={cls.name}
                    path={`/classes/${cls.id}`}
                    icon={
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">
                        {cls.name.charAt(0).toUpperCase()}
                      </div>
                    }
                    active={location.pathname.startsWith(`/classes/${cls.id}`)}
                  />
                ))}
                <div className="my-2 border-t border-[#e0e0e0]" />
              </>
            )}
            
            {subItems.map((item) => (
              <SidebarItem
                key={item.path}
                {...item}
                active={location.pathname === item.path}
              />
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main
          className="flex-1 overflow-y-auto w-full"
        >
          <div className="p-6 h-full">
             <Outlet context={{ setModalType, fetchClasses, classes, classesLoading }} />
          </div>
        </main>
      </div>

      {modalType && (
        <CreateOrJoinModal 
          type={modalType} 
          onClose={() => setModalType(null)} 
          onFinish={() => fetchClasses()} 
        />
      )}

      {showProfileEditor && (
        <UserProfileModal onClose={() => setShowProfileEditor(false)} />
      )}
    </div>
  );
}
