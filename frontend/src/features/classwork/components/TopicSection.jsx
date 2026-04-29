import { useState, useRef, useEffect } from 'react';
import { TYPE_CONFIG } from './ClassworkIcons';

export function ClassworkItem({ item, onClick, isTeacher, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.ASSIGNMENT;
  const isPastDue = item.dueDate && new Date(item.dueDate) < new Date();
  const formatDue = (d) => new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 hover:bg-[#f1f3f4] cursor-pointer group border-b border-[#e0e0e0] last:border-0 transition-colors">
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg, color: cfg.color }}>
        <cfg.Icon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-[#1f1f1f] truncate font-medium" style={{ letterSpacing: '.01785714em' }}>{item.title}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-[12px] text-[#5f6368]">
          {isPastDue && item.dueDate ? <span className="text-[#d93025] font-medium mr-1">Thiếu</span> : ''}
          {item.status === 'DRAFT' ? <span className="italic font-medium">Bản nháp</span> : 
           item.dueDate ? `Hạn: ${formatDue(item.dueDate)}` : `Đã đăng ${formatDue(item.createdAt || new Date())}`}
        </span>
        {/* Three-dot menu - only for teachers */}
        {isTeacher && (
          <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(o => !o)}
              className="w-8 h-8 rounded-full hover:bg-[#e8eaed] flex items-center justify-center text-[#5f6368] transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-lg border border-[#e0e0e0] py-1 w-40 z-[999]">
                <button
                  onClick={() => { setShowMenu(false); onDelete?.(item.id); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#d93025] hover:bg-[#fce8e6] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  Xóa bài tập
                </button>
              </div>
            )}
          </div>
        )}
        {!isTeacher && (
          <button className="w-8 h-8 rounded-full hover:bg-[#e8eaed] flex items-center justify-center text-[#5f6368] transition-colors" onClick={(e) => e.stopPropagation()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function TopicSection({ topic, items, onItemClick, isTeacher, onDeleteTopic, onRenameTopic }) {
  const [open, setOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(topic.name);
  const menuRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRename = () => {
    if (name.trim() && name.trim() !== topic.name) {
      onRenameTopic?.(topic.id, name.trim());
    }
    setEditing(false);
  };

  return (
    <div className="mb-2">
      <div className="w-full flex items-center gap-2 py-2 px-1 group">
        <button onClick={() => setOpen(o => !o)} className="flex-1 flex items-center gap-2 text-left">
          {editing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setName(topic.name); setEditing(false); } }}
              className="text-[20px] font-normal text-[#1f1f1f] flex-1 bg-transparent border-b-2 border-[#1a73e8] outline-none pb-0.5"
              style={{ fontFamily: "'Google Sans',sans-serif" }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="text-[22px] font-normal text-[#1f1f1f] flex-1" style={{ fontFamily: "'Google Sans',sans-serif", lineHeight: '28px' }}>
              {topic.name}
            </span>
          )}
          <svg className={`w-6 h-6 text-[#5f6368] transition-transform ${open ? '' : '-rotate-180'}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>

        {/* Topic 3-dot menu (teacher only) */}
        {isTeacher && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(o => !o)}
              className="w-8 h-8 rounded-full hover:bg-[#e8eaed] flex items-center justify-center text-[#5f6368] opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-lg border border-[#e0e0e0] py-1 w-44 z-[999]">
                <button
                  onClick={() => { setShowMenu(false); setEditing(true); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#3c4043] hover:bg-[#f1f3f4] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  Đổi tên chủ đề
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDeleteTopic?.(topic.id); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-[#d93025] hover:bg-[#fce8e6] transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  Xóa chủ đề
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="h-px w-full bg-[#1a73e8] mt-1 mb-2" />
      {open && (
        <div className="bg-white overflow-hidden">
          {items.length === 0
            ? <p className="text-[13px] text-[#9aa0a6] px-2 py-4">Chưa có bài tập trong chủ đề này</p>
            : items.map(item => (
                <ClassworkItem
                  key={item.id}
                  item={item}
                  onClick={() => onItemClick(item)}
                  isTeacher={isTeacher}
                />
              ))
          }
        </div>
      )}
    </div>
  );
}
