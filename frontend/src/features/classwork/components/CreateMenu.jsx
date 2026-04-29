import { useState, useRef, useEffect } from 'react';
import { AssignmentIcon, MaterialIcon, QuestionIcon, QuizIcon, ReuseIcon, TopicIcon } from './ClassworkIcons';

export default function CreateMenu({ openCreate, onOpenTopicInput }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-medium transition-colors shadow-sm hover:shadow-md"
        style={{ background: '#0b57d0', color: 'white' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Tạo
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 bg-white rounded-lg shadow-lg border border-[#e0e0e0] py-2 w-64 z-20" style={{ fontFamily: "'Google Sans', Roboto, sans-serif" }}>
          <MenuItem 
            icon={<AssignmentIcon />} label="Bài tập" 
            onClick={() => handleAction(() => openCreate('ASSIGNMENT'))} 
          />
          <MenuItem 
            icon={<QuizIcon />} label="Bài kiểm tra" 
            onClick={() => handleAction(() => openCreate('QUIZ'))} 
          />
          <MenuItem 
            icon={<QuestionIcon />} label="Câu hỏi" 
            onClick={() => handleAction(() => openCreate('QUESTION'))} 
          />
          <MenuItem 
            icon={<MaterialIcon />} label="Tài liệu" 
            onClick={() => handleAction(() => openCreate('MATERIAL'))} 
          />
          <MenuItem 
            icon={<ReuseIcon />} label="Sử dụng lại bài đăng" 
            onClick={() => handleAction(() => alert('Tính năng đang phát triển'))} 
          />
          <div className="border-t border-[#e0e0e0] my-2" />
          <MenuItem 
            icon={<TopicIcon />} label="Chủ đề" 
            onClick={() => handleAction(onOpenTopicInput)} 
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 w-full px-5 py-2.5 text-[14px] text-[#3c4043] hover:bg-[#f1f3f4] transition-colors font-medium">
      <div className="text-[#5f6368] flex-shrink-0">
        {icon}
      </div>
      {label}
    </button>
  );
}
