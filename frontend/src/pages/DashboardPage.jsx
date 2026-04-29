import { useNavigate, useOutletContext } from 'react-router-dom';

const BANNER_STYLES = [
  { bg: 'bg-[#12b5cb]', image: 'https://www.gstatic.com/classroom/themes/img_read.jpg' },
  { bg: 'bg-[#4285f4]', image: 'https://www.gstatic.com/classroom/themes/img_reachout.jpg' },
  { bg: 'bg-[#10a37f]', image: 'https://www.gstatic.com/classroom/themes/img_code.jpg' },
  { bg: 'bg-[#f4b400]', image: 'https://www.gstatic.com/classroom/themes/img_breakfast.jpg' },
  { bg: 'bg-[#a142f4]', image: 'https://www.gstatic.com/classroom/themes/img_graduation.jpg' },
];

import { useState, useRef, useEffect } from 'react';

const FolderIcon = () => (
  <svg focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"></path>
  </svg>
);

const UserWorkIcon = () => (
  <svg focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 4h4v2h-4V7zm6 10H8v-2h8v2zm0-4H8v-2h8v2z"></path>
  </svg>
);

const MoreIcon = () => (
  <svg focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
  </svg>
);

function ClassCard({ cls, index }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const style = BANNER_STYLES[index % BANNER_STYLES.length];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      onClick={() => navigate(`/classes/${cls.id}`)}
      className="group bg-white rounded-lg border border-[#e0e0e0] overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-[300px] relative"
      style={{ fontFamily: "'Google Sans', Roboto, sans-serif" }}
    >
      {/* Banner */}
      <div className={`relative h-[100px] p-4 text-white overflow-hidden ${style.bg}`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${style.image})` }}
        />
        <div className="relative z-10 flex flex-col items-start w-[85%]">
          <h2 className="font-medium text-[22px] hover:underline truncate w-full" style={{ lineHeight: '1.2' }}>
            {cls.name}
          </h2>
          {cls.section && (
            <p className="text-[13px] hover:underline truncate w-full mt-1">{cls.section}</p>
          )}
          <p className="text-[12px] mt-1 truncate hover:underline">{cls.ownerName || 'Giảng viên'}</p>
        </div>
      </div>

      {/* Teacher Avatar */}
      <div className="absolute right-4 top-[62px] w-[75px] h-[75px] rounded-full overflow-hidden border-4 border-white bg-[#1da462] flex items-center justify-center text-3xl font-normal text-white z-20">
        {cls.ownerAvatar
          ? <img src={cls.ownerAvatar} alt="avatar" className="w-full h-full object-cover" />
          : (cls.ownerName || 'U')[0].toUpperCase()}
      </div>

      <div className="flex-1 p-4 bg-white flex flex-col justify-end">
        {/* Placeholder text for assignments */}
        {/* <span className="text-[12px] text-[#5f6368]">Không có bài tập nào sắp đến hạn</span> */}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Use classes from MainLayout context — no extra fetch, no flicker
  const { setModalType, classes, classesLoading } = useOutletContext();

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-[#5f6368]">
          <svg className="animate-spin w-8 h-8 text-[#1a73e8]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-[14px]">Đang tải lớp học...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          <div className="mb-8 w-[350px] max-w-full aspect-square">
            <img src="https://www.gstatic.com/classroom/empty_states_home.svg" alt="empty" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-google-sans text-[22px] text-[#3c4043] font-normal mb-8">Thêm lớp học để bắt đầu</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setModalType('join')}
              className="px-6 py-2.5 bg-white border border-[#dadce0] text-[#1a73e8] font-medium text-[14px] rounded-[4px] hover:bg-[#f8f9fa] transition"
            >
              Tham gia lớp học
            </button>
            <button
              onClick={() => setModalType('create')}
              className="px-6 py-2.5 bg-[#1a73e8] text-white font-medium text-[14px] rounded-[4px] hover:bg-[#1557b0] transition shadow-sm"
            >
              Tạo lớp học
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 p-6 max-w-[1600px] mx-auto">
          {classes.map((cls, idx) => (
            <div key={cls.id} className="w-full sm:w-[300px]">
              <ClassCard cls={cls} index={idx} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


