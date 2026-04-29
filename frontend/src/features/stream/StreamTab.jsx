import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import streamApi from '../../services/streamApi';
import axiosClient from '../../services/axiosClient';
import classApi from '../../services/classApi';
import classworkApi from '../../services/classworkApi';
import useWebSocket from '../../hooks/useWebSocket';

// Format thời gian
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// Avatar helper
const COLORS = ['bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
function getAvatar(name = '') {
  const idx = (name.charCodeAt(0) || 0) % COLORS.length;
  const initials = name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() || 'U';
  return { color: COLORS[idx], initials };
}

// PostCard component
function PostCard({ post, classId, onDeleted, onUpdated }) {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [saving, setSaving] = useState(false);
  const { color, initials } = getAvatar(post.authorName);

  const isOwner = user?.id === post.authorId;
  const isExpanded = isCommentFocused || commentText.trim().length > 0;
  // Track IDs received from WS to avoid duplicates with HTTP response
  const wsReceivedIds = useRef(new Set());

  const handleDelete = async () => {
    if (!confirm('Xóa bài đăng này?')) return;
    try {
      await streamApi.deletePost(classId, post.id);
      toast.success('Đã xóa bài đăng!');
      onDeleted(post.id);
    } catch {
      toast.error('Không thể xóa bài đăng!');
    }
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) { toast.error('Nội dung không được để trống!'); return; }
    setSaving(true);
    try {
      const res = await streamApi.updatePost(classId, post.id, { content: editContent.trim() });
      onUpdated?.({ ...post, content: editContent.trim() });
      setEditing(false);
      toast.success('Đã cập nhật bài đăng!');
    } catch {
      toast.error('Cập nhật thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await streamApi.getComments(post.id);
      setComments(res.data.result || []);
    } catch {}
  };

  // Load comment count on mount (so the button shows the correct number)
  useEffect(() => { loadComments(); }, [post.id]);

  const handleIncomingComment = useCallback((newComment) => {
    setComments(prev => {
      if (prev.some(c => c.id === newComment.id)) return prev;
      wsReceivedIds.current.add(newComment.id);
      return [...prev, newComment];
    });
  }, []);

  useWebSocket(post?.id ? `/topic/comments.${post.id}` : null, handleIncomingComment, !!post?.id);

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, content: text, authorName: user?.fullName, authorId: user?.id, createdAt: new Date().toISOString() };
    setComments(prev => [...prev, optimistic]);
    setShowComments(true); // auto-expand after commenting
    setCommentText('');
    setIsCommentFocused(false);
    try {
      const res = await streamApi.addComment(post.id, { content: text });
      const realComment = res.data.result;
      setComments(prev => {
        if (realComment?.id && (prev.some(c => c.id === realComment.id && c.id !== tempId) || wsReceivedIds.current.has(realComment.id))) {
          wsReceivedIds.current.delete(realComment.id);
          return prev.filter(c => c.id !== tempId);
        }
        return prev.map(c => c.id === tempId ? (realComment || optimistic) : c);
      });
    } catch {
      toast.error('Không thể đăng bình luận!');
      setComments(prev => prev.filter(c => c.id !== tempId));
    }
  };

  const handleDeleteComment = async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await streamApi.deleteComment(post.id, commentId);
    } catch {
      toast.error('Không thể xóa bình luận!');
      loadComments();
    }
  };

  return (
    <div className="mb-4 overflow-hidden" style={{ backgroundColor: 'var(--gm3-sys-color-surface-container, #f0f4f9)', borderRadius: '.75rem', fontFamily: "'Google Sans', Roboto, Arial, sans-serif", color: 'var(--gm3-sys-color-on-surface, #1f1f1f)' }}>
      {/* Post Content Wrapper */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-[15px] font-medium flex-shrink-0 mt-1`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[14px] font-medium text-[#1f1f1f]">{post.authorName}</span>
                <div className="text-[12px] text-[#5f6368] mt-0.5">{timeAgo(post.createdAt)}</div>
              </div>
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 -mt-2 -mr-2 rounded-full hover:bg-[#e8eaed] flex items-center justify-center text-[#5f6368] transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-8 bg-white rounded-[4px] shadow-[0_2px_6px_rgba(0,0,0,0.2)] py-2 w-36 z-10 border border-[#f1f3f4]">
                      <button
                        onClick={() => { setShowMenu(false); setEditing(true); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-[14px] text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        Sửa
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 w-full px-4 py-2 text-[14px] text-[#d93025] hover:bg-[#fce8e6] transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Post text or Edit mode */}
            {editing ? (
              <div className="mt-3">
                <textarea
                  autoFocus
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full border border-[#1a73e8] rounded-lg px-3 py-2 text-[14px] leading-relaxed resize-none focus:outline-none min-h-[80px]"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => { setEditing(false); setEditContent(post.content || ''); }}
                    className="px-4 py-1.5 text-sm text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition">Hủy</button>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className="px-4 py-1.5 text-sm bg-[#1a73e8] text-white rounded-full hover:bg-[#1557b0] disabled:opacity-60 transition">{saving ? 'Đang lưu...' : 'Lưu'}</button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-[14px] leading-[1.25rem] text-[#1f1f1f] whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {/* Attachments */}
            {post.attachments?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {post.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl || att.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 border border-[#c4c7c5] rounded-xl p-2.5 hover:bg-[#e8eaed] transition-colors max-w-[320px] w-full sm:w-auto"
                  >
                    <div className="w-10 h-10 bg-white border border-[#e0e0e0] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[14px] font-medium text-[#1f1f1f] truncate w-full">{att.name || att.fileName || 'Tệp đính kèm'}</span>
                      <span className="text-[12px] text-[#444746] uppercase truncate w-full mt-0.5">{att.contentType || 'Tài liệu'}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#c4c7c5] mx-6"></div>

      {/* Comment Section */}
      <div className="px-6 py-3 pb-5">
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 text-[14px] font-medium text-[#444746] hover:bg-[#e8eaed] px-4 py-2 -ml-4 rounded-full transition-colors mb-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 8c0-1.42-.5-2.73-1.33-3.76.42-.14.86-.24 1.33-.24 2.21 0 4 1.79 4 4s-1.79 4-4 4c-.43 0-.84-.09-1.23-.21-.03-.01-.06-.02-.1-.03A5.98 5.98 0 0 0 15 8zm1.66 5.13C18.03 14.06 19 15.32 19 17v3h4v-3c0-2.18-3.58-3.47-6.34-3.87zM9 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 9c-2.7 0-5.8 1.29-6 2.01V18h12v-1c-.2-.71-3.3-2-6-2M9 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 9c2.67 0 8 1.34 8 4v3H1v-3c0-2.66 5.33-4 8-4z"/>
          </svg>
          {showComments ? 'Ẩn nhận xét về lớp học' : `${comments.length || 0} nhận xét về lớp học`}
        </button>

        {showComments && (
          <div className="space-y-4 mb-5 mt-2">
            {comments.map((c) => {
              const ca = getAvatar(c.authorName);
              return (
                <div key={c.id} className="flex gap-4 group">
                  <div className={`w-8 h-8 rounded-full ${ca.color} flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0 mt-0.5`}>
                    {ca.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-[#1f1f1f] hover:underline cursor-pointer">{c.authorName}</span>
                      <span className="text-[12px] text-[#5f6368]">• {timeAgo(c.createdAt)}</span>
                    </div>
                    <div className="text-[13px] text-[#1f1f1f] mt-0.5 leading-relaxed">{c.content}</div>
                  </div>
                  {user?.id === c.authorId && (
                    <div className="relative">
                      <button 
                        onClick={() => handleDeleteComment(c.id)}
                        className="w-8 h-8 rounded-full hover:bg-[#e8eaed] text-[#5f6368] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa bình luận"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Comment input area matching Google Classroom new UI */}
        <div className="flex gap-4 items-start">
          <div className={`w-8 h-8 mt-1 rounded-full ${getAvatar(user?.fullName).color} flex items-center justify-center text-white text-[13px] font-medium flex-shrink-0`}>
            {getAvatar(user?.fullName).initials}
          </div>
          <div 
            className={`flex-1 border border-[#747775] bg-white overflow-hidden transition-colors focus-within:border-[#0b57d0] focus-within:shadow-[0_0_0_1px_#0b57d0] ${isExpanded ? 'rounded-[16px]' : 'rounded-full'}`}
            onFocus={() => setIsCommentFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsCommentFocused(false);
              }
            }}
          >
            <div className={`min-h-[44px] px-4 flex items-center ${isExpanded ? 'py-3' : 'py-2.5'}`}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) { e.preventDefault(); handleAddComment(); } }}
                placeholder="Thêm nhận xét trong lớp học..."
                className="w-full text-[14px] bg-transparent border-none outline-none placeholder-[#5f6368] text-[#1f1f1f]"
              />
              {!isExpanded && (
                <button 
                  type="button"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className={`w-8 h-8 ml-2 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${commentText.trim() ? 'text-[#0b57d0] hover:bg-[#e8eaed]' : 'text-[#c4c7c5] bg-transparent'}`}
                  title="Đăng"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 3v18l20-9L2 3zm2 11l9-2-9-2V6.09L17.13 12 4 17.91V14z"/>
                  </svg>
                </button>
              )}
            </div>
            {/* Toolbar for comment */}
            {isExpanded && (
              <div className="bg-white px-2 py-1.5 flex items-center">
                <button type="button" className="w-10 h-10 hover:bg-[#f1f3f4] rounded-full text-[#444746] font-bold text-[14px] flex items-center justify-center transition-colors">B</button>
                <button type="button" className="w-10 h-10 hover:bg-[#f1f3f4] rounded-full text-[#444746] italic text-[14px] flex items-center justify-center transition-colors">I</button>
                <button type="button" className="w-10 h-10 hover:bg-[#f1f3f4] rounded-full text-[#444746] underline text-[14px] flex items-center justify-center transition-colors">U</button>
                <div className="w-[1px] h-[20px] bg-[#e0e0e0] mx-1"></div>
                <button type="button" className="w-10 h-10 hover:bg-[#f1f3f4] rounded-full text-[#444746] flex items-center justify-center transition-colors" title="Danh sách">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                  </svg>
                </button>
                <button type="button" className="w-10 h-10 hover:bg-[#f1f3f4] rounded-full text-[#444746] flex items-center justify-center transition-colors" title="Xoá định dạng">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          {/* Submit button when expanded */}
          {isExpanded && (
            <button 
              type="button"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className={`mt-1.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${commentText.trim() ? 'text-[#0b57d0] hover:bg-[#e8eaed]' : 'text-[#c4c7c5] bg-transparent'}`}
              title="Đăng"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 3v18l20-9L2 3zm2 11l9-2-9-2V6.09L17.13 12 4 17.91V14z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── CreatePostBox ────────────────────────────────────────────────────────────
// Google Classroom–style announcement dialog
function CreatePostBox({ classId, onPosted, classData }) {
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // Real data state for dropdowns
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    if (expanded) {
      // Tải danh sách lớp
      classApi.getMyClasses().then(res => {
        const classes = res.data.result || [];
        setSelectedClasses(classes.map(c => ({ ...c, checked: c.id === classId })));
      }).catch(() => {});

      // Tải danh sách thành viên (chỉ lấy học sinh nếu có phân biệt)
      classApi.getMembers(classId).then(res => {
        const members = res.data.result || [];
        const students = members.filter(m => m.role !== 'TEACHER');
        setSelectedStudents(students.map(s => ({
          id: s.id || s.userId,
          name: s.fullName || s.name || 'Học viên',
          avatar: s.avatarUrl || s.avatar,
          initial: (s.fullName || s.name || 'U').charAt(0).toUpperCase(),
          color: 'bg-[#1a73e8]',
          checked: true
        })));
      }).catch(() => {});
    }
  }, [expanded, classId]);

  const toggleClass = (id) => {
    setSelectedClasses(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  const toggleStudent = (id) => {
    if (id === 'all') {
      const allChecked = selectedStudents.every(s => s.checked);
      setSelectedStudents(prev => prev.map(s => ({ ...s, checked: !allChecked })));
    } else {
      setSelectedStudents(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
    }
  };

  const isAllStudentsChecked = selectedStudents.length > 0 && selectedStudents.every(s => s.checked);

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const { color, initials } = getAvatar(user?.fullName);

  const getContent = () => editorRef.current?.innerHTML?.trim() ?? '';
  const isEmpty = () => {
    const text = editorRef.current?.innerText?.trim() ?? '';
    return text === '' && attachments.length === 0;
  };

  const handleReset = () => {
    setExpanded(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setAttachments([]);
    setLinkUrl('');
    setLinkTitle('');
    setShowDriveModal(false);
    setShowYouTubeModal(false);
    setShowStudentModal(false);
    setShowClassDropdown(false);
  };

  // Rich text commands
  const execFormat = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosClient.post('/attachments/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const att = res.data?.result;
      if (att) setAttachments((p) => [...p, att]);
      toast.success('Đã tải file lên!');
    } catch {
      toast.error('Tải file thất bại!');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    try {
      const res = await axiosClient.post('/attachments/link', {
        url: linkUrl.trim(),
        title: linkTitle.trim() || linkUrl.trim(),
      });
      const att = res.data?.result;
      if (att) setAttachments((p) => [...p, att]);
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkTitle('');
      toast.success('Đã thêm liên kết!');
    } catch {
      toast.error('Thêm liên kết thất bại!');
    }
  };

  const removeAttachment = (id) => setAttachments((p) => p.filter((a) => a.id !== id));

  const handlePost = async () => {
    if (isEmpty()) return;
    setLoading(true);
    try {
      // Strip HTML to plain text for content, or send raw HTML if backend supports it
      const rawHtml = getContent();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;
      const plainText = tempDiv.innerText || tempDiv.textContent || '';

      const res = await streamApi.createPost(classId, {
        content: plainText,
        attachmentIds: attachments.map((a) => a.id),
      });
      toast.success('Đã đăng thông báo!');
      handleReset();
      onPosted(); // Refresh stream list
      // Navigate to the newly created post so user can see it immediately
      if (res.data?.result?.id) {
        navigate(`/classes/${classId}/posts/${res.data.result.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // Collapsed state
  if (!expanded) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 bg-[#c2e7ff] hover:bg-[#b3dcf2] text-[#001d35] px-6 py-3.5 rounded-full text-[14px] font-medium transition-colors"
            style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Thông báo mới
          </button>
        </div>
      </div>
    );
  }

  // Expanded — Google Classroom Material 3 dialog
  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.32)' }}
        onClick={handleReset}
      >
        <div
          className="relative flex flex-col overflow-hidden w-full"
          style={{
            maxWidth: 792,
            background: '#f0f4f9',
            borderRadius: 28,
            boxShadow: '0 11px 15px -7px rgba(0,0,0,.2),0 24px 38px 3px rgba(0,0,0,.14),0 9px 46px 8px rgba(0,0,0,.12)',
            maxHeight: 'min(49.5rem, 100vh - 2rem)',
            fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 400, color: '#1f1f1f', lineHeight: '28px', letterSpacing: 0 }}>
              Thông báo
            </h2>
          </div>

          {/* ── "Dành cho" row ── */}
          <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#444746', fontFamily: 'Roboto, sans-serif', letterSpacing: '.03125em' }}>Dành cho</span>

            {/* Class selector chip */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px',
                  border: '1px solid #747775', borderRadius: 8,
                  fontSize: 14, color: '#1f1f1f', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'Roboto, sans-serif', transition: 'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8eaed'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {selectedClasses.length === 0 ? (classData?.name || 'Lớp học') :
                   selectedClasses.filter(c => c.checked).length === 1 
                    ? selectedClasses.find(c => c.checked)?.name || 'Lớp học'
                    : `${selectedClasses.filter(c => c.checked).length} lớp học`}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#444746"><path d="M7 10l5 5 5-5H7z"/></svg>
              </button>
              
              {showClassDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                  background: '#fff', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,.2)',
                  minWidth: 240, padding: '8px 0', maxHeight: 300, overflowY: 'auto'
                }}>
                  {selectedClasses.map(cls => (
                    <label key={cls.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <input type="checkbox" checked={cls.checked} onChange={() => toggleClass(cls.id)} style={{ marginRight: 16, width: 18, height: 18, accentColor: '#0b57d0' }} />
                      <div className={`w-8 h-8 rounded-full ${cls.checked ? 'bg-[#188038]' : 'bg-[#1a73e8]'} flex items-center justify-center text-white text-xs font-bold mr-3 flex-shrink-0`}>
                        {(cls.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, color: '#1f1f1f', fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>{cls.name}</span>
                        {cls.section && <span style={{ fontSize: 12, color: '#5f6368', fontFamily: 'Roboto, sans-serif' }}>{cls.section}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* All students chip */}
            <div>
              <button
                onClick={() => setShowStudentModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px 6px 12px',
                  border: '1px solid #747775', borderRadius: 20,
                  fontSize: 14, lineHeight: '20px', color: '#0b57d0', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'Roboto, sans-serif',
                  transition: 'background .2s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8f0fe'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0b57d0" style={{ flexShrink: 0 }}>
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                {selectedStudents.length === 0 || isAllStudentsChecked ? 'Tất cả học viên' : 
                  selectedStudents.filter(s => s.checked).length === 1 
                  ? selectedStudents.find(s => s.checked).name 
                  : `${selectedStudents.filter(s => s.checked).length} học viên`
                }
              </button>
            </div>
          </div>

          {/* ── Editor card ── */}
          <div
            style={{
              margin: '0 24px',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #c4c7c5',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {/* Editable area */}
            <div style={{ padding: '16px 16px 0', minHeight: 120, flex: 1 }}>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Thông báo nội dung nào đó cho lớp học của bạn"
                style={{
                  minHeight: 100,
                  outline: 'none',
                  fontSize: 16,
                  lineHeight: '24px',
                  color: '#1f1f1f',
                  fontFamily: 'Roboto, sans-serif',
                  letterSpacing: '.03125em',
                  fontWeight: 400,
                  WebkitFontSmoothing: 'antialiased',
                }}
                className="empty:before:content-[attr(data-placeholder)] empty:before:text-[#9aa0a6]"
              />
            </div>

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {attachments.map(att => (
                  <div
                    key={att.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#e8f0fe', borderRadius: 8, padding: '6px 10px',
                      fontSize: 13, color: '#0b57d0', maxWidth: 220,
                    }}
                    className="group"
                  >
                    {att.attachmentType === 'LINK'
                      ? <svg width="18" height="18" fill="none" stroke="#0b57d0" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="#0b57d0"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                    }
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.fileName || att.title || 'Tệp đính kèm'}
                    </span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#0b57d0', fontSize: 16, lineHeight: 1, padding: 0 }}
                      title="Xóa"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Formatting toolbar */}
            <div style={{ padding: '4px 8px', borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
              {[
                { cmd: 'bold',                label: <strong style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0 }}>B</strong>, title: 'Đậm' },
                { cmd: 'italic',              label: <em style={{ fontSize: 14, fontStyle: 'italic' }}>I</em>, title: 'Nghiêng' },
                { cmd: 'underline',           label: <span style={{ fontSize: 14, textDecoration: 'underline' }}>U</span>, title: 'Gạch dưới' },
                { cmd: 'insertUnorderedList', label: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, title: 'Danh sách' },
                { cmd: 'removeFormat',        label: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6zm14 15.59L17.41 18H13l-2 4H9l2-4H4.41L3 16.59 17.59 3 21 6.41 20 7.41l-2-2L6 18h4l.5-1h5.09l2 2L20.59 20 20 20.59z"/></svg>, title: 'Xóa định dạng' },
              ].map(({ cmd, label, title }) => (
                <button
                  key={cmd}
                  onMouseDown={e => { e.preventDefault(); execFormat(cmd); }}
                  title={title}
                  style={{
                    width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer',
                    borderRadius: 4, color: '#444746', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e8eaed'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bottom bar: attachment icons + action buttons ── */}
          <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Attachment icon buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="file" ref={fileInputRef} onChange={handleUploadFile} style={{ display: 'none' }} />

              {/* Google Drive */}
              <button
                onClick={() => setShowDriveModal(true)}
                title="Thêm tệp từ Google Drive"
                style={{
                  width: 40, height: 40, border: '1px solid #747775', borderRadius: '50%', background: 'transparent',
                  cursor: 'pointer', color: '#444746', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s, border-color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8eaed'; e.currentTarget.style.borderColor = '#444746'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#747775'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#444746"><path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5M9.73 15L6.3 21h13.12l3.43-6m-3.99-11.5l-6.55 11.5h-6.86l6.56-11.5"/></svg>
              </button>

              {/* YouTube */}
              <button
                onClick={() => setShowYouTubeModal(true)}
                title="Thêm video trên YouTube"
                style={{
                  width: 40, height: 40, border: '1px solid #747775', borderRadius: '50%', background: 'transparent',
                  cursor: 'pointer', color: '#444746', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s, border-color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8eaed'; e.currentTarget.style.borderColor = '#444746'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#747775'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#444746"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/></svg>
              </button>

              {/* Upload file */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                title="Tải tệp lên"
                style={{
                  width: 40, height: 40, border: '1px solid #747775', borderRadius: '50%', background: 'transparent',
                  cursor: 'pointer', color: '#444746', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s, border-color .15s', opacity: uploadingFile ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8eaed'; e.currentTarget.style.borderColor = '#444746'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#747775'; }}
              >
                {uploadingFile
                  ? <svg className="animate-spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="#444746" strokeWidth="4"/><path className="opacity-75" fill="#444746" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="#444746"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                }
              </button>

              {/* Add link */}
              <button
                onClick={() => setShowLinkModal(true)}
                title="Thêm đường liên kết"
                style={{
                  width: 40, height: 40, border: '1px solid #747775', borderRadius: '50%', background: 'transparent',
                  cursor: 'pointer', color: '#444746', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s, border-color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8eaed'; e.currentTarget.style.borderColor = '#444746'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#747775'; }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#444746"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Huỷ — text button */}
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 20, background: 'none',
                  fontSize: 14, fontWeight: 500, color: '#0b57d0', cursor: 'pointer',
                  fontFamily: 'Roboto, sans-serif', letterSpacing: '.0178571em',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8f0fe'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Huỷ
              </button>

              {/* Đăng — filled button */}
              <button
                onClick={handlePost}
                disabled={loading}
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 20,
                  background: loading ? '#e8eaed' : '#0b57d0',
                  color: loading ? '#9aa0a6' : '#fff',
                  fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'Roboto, sans-serif', letterSpacing: '.0178571em',
                  transition: 'background .2s',
                  boxShadow: loading ? 'none' : '0 1px 2px rgba(0,0,0,.3),0 1px 3px 1px rgba(0,0,0,.15)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0842a0'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0b57d0'; }}
              >
                {loading ? 'Đang đăng...' : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Link modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.32)' }} onClick={() => setShowLinkModal(false)} />
          <div
            className="relative flex flex-col z-10 w-full"
            style={{
              maxWidth: 420, background: '#f0f4f9', borderRadius: 28, padding: 24,
              boxShadow: '0 11px 15px -7px rgba(0,0,0,.2),0 24px 38px 3px rgba(0,0,0,.14)',
              fontFamily: "'Google Sans', Roboto, sans-serif",
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 400, color: '#1f1f1f' }}>Thêm đường liên kết</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#444746', marginBottom: 4, fontFamily: 'Roboto, sans-serif' }}>URL *</label>
                <input
                  autoFocus type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 16px',
                    border: '1px solid #747775', borderRadius: 8, fontSize: 14, color: '#1f1f1f',
                    background: '#fff', outline: 'none', fontFamily: 'Roboto, sans-serif',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0b57d0'}
                  onBlur={e => e.target.style.borderColor = '#747775'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#444746', marginBottom: 4, fontFamily: 'Roboto, sans-serif' }}>Tiêu đề (tuỳ chọn)</label>
                <input
                  type="text" value={linkTitle} onChange={e => setLinkTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..."
                  onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '12px 16px',
                    border: '1px solid #747775', borderRadius: 8, fontSize: 14, color: '#1f1f1f',
                    background: '#fff', outline: 'none', fontFamily: 'Roboto, sans-serif',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0b57d0'}
                  onBlur={e => e.target.style.borderColor = '#747775'}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button
                onClick={() => setShowLinkModal(false)}
                style={{ padding: '10px 24px', border: 'none', borderRadius: 20, background: 'none', fontSize: 14, fontWeight: 500, color: '#0b57d0', cursor: 'pointer', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e8f0fe'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >Hủy</button>
              <button
                onClick={handleAddLink} disabled={!linkUrl.trim()}
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 500,
                  background: linkUrl.trim() ? '#0b57d0' : '#e8eaed',
                  color: linkUrl.trim() ? '#fff' : '#9aa0a6',
                  cursor: linkUrl.trim() ? 'pointer' : 'default',
                  boxShadow: linkUrl.trim() ? '0 1px 2px rgba(0,0,0,.3)' : 'none',
                  transition: 'background .2s',
                }}
              >Thêm</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drive modal (Mock) ── */}
      {showDriveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDriveModal(false)} />
          <div
            className="relative flex flex-col z-10 w-full bg-white"
            style={{
              maxWidth: 800, height: '80vh', borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0,0,0,.1)',
              fontFamily: "'Google Sans', Roboto, sans-serif",
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: 12 }}><path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5M9.73 15L6.3 21h13.12l3.43-6m-3.99-11.5l-6.55 11.5h-6.86l6.56-11.5" fill="#1f1f1f"/></svg>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: '#1f1f1f' }}>Chèn tệp bằng cách sử dụng Google Drive</h3>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input type="text" placeholder="Tìm trong Drive hoặc dán URL" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 16px 10px 40px', borderRadius: 8, border: 'none', background: '#f1f3f4', outline: 'none' }} />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368" style={{ position: 'absolute', left: 12, top: 10 }}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              </div>
              <button onClick={() => setShowDriveModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: 16 }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', padding: '0 24px' }}>
              {['Gần đây', 'Tải lên', 'Drive của tôi', 'Được gắn dấu sao', 'Được chia sẻ với tôi'].map((tab, i) => (
                <div key={tab} style={{ padding: '16px 12px', fontSize: 14, color: i === 0 ? '#1a73e8' : '#5f6368', borderBottom: i === 0 ? '3px solid #1a73e8' : 'none', cursor: 'pointer', fontWeight: i === 0 ? 500 : 400 }}>{tab}</div>
              ))}
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#5f6368', background: '#fff' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#dadce0" style={{ marginBottom: 16 }}><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
              <div style={{ fontSize: 16 }}>Giao diện Google Drive Demo</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>Chưa tích hợp API thật</div>
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
               <button onClick={() => setShowDriveModal(false)} style={{ padding: '8px 24px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: 4, cursor: 'not-allowed', fontWeight: 500 }}>Chèn</button>
            </div>
          </div>
        </div>
      )}

      {/* ── YouTube modal (Mock) ── */}
      {showYouTubeModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowYouTubeModal(false)} />
          <div
            className="relative flex flex-col z-10 w-full bg-white"
            style={{
              maxWidth: 800, height: '80vh', borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0,0,0,.1)',
              fontFamily: "'Google Sans', Roboto, sans-serif",
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="80" height="24" viewBox="0 0 90 20" fill="red" style={{ marginRight: 8 }}><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/><text x="26" y="15" fill="#282828" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">YouTube</text></svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => setShowYouTubeModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="Trợ giúp">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                </button>
                <button onClick={() => setShowYouTubeModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }} title="Đóng">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="#5f6368"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
              </div>
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ width: '100%', maxWidth: 500 }}>
                 <div style={{ position: 'relative' }}>
                   <input type="text" placeholder="Tìm trên YouTube hoặc dán URL" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', paddingRight: 40, borderRadius: 4, border: '1px solid #1a73e8', outline: 'none', fontSize: 16 }} />
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" style={{ position: 'absolute', right: 12, top: 14 }}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                 </div>
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
               <button onClick={() => setShowYouTubeModal(false)} style={{ padding: '8px 24px', background: '#e0e0e0', color: '#5f6368', border: 'none', borderRadius: 4, cursor: 'not-allowed', fontWeight: 500 }}>Thêm video</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Selection Modal (Mock) ── */}
      {showStudentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowStudentModal(false)} />
          <div
            className="relative flex flex-col z-10 bg-white"
            style={{
              width: 500, maxWidth: '100%', borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0,0,0,.1)',
              fontFamily: "'Google Sans', Roboto, sans-serif",
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '24px 24px 16px' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: '#1f1f1f' }}>Thông báo cho</h3>
            </div>
            
            {/* Content List */}
            <div style={{ padding: '0 0 16px', maxHeight: '50vh', overflowY: 'auto' }}>
              <label style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <input type="checkbox" checked={isAllStudentsChecked} onChange={() => toggleStudent('all')} style={{ marginRight: 24, width: 18, height: 18, accentColor: '#0b57d0' }} />
                <span style={{ fontSize: 14, color: '#1f1f1f', fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}>Tất cả học viên</span>
              </label>

              {selectedStudents.map(student => (
                <label key={student.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f3f4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <input type="checkbox" checked={student.checked} onChange={() => toggleStudent(student.id)} style={{ marginRight: 24, width: 18, height: 18, accentColor: '#0b57d0' }} />
                  {student.avatar && (
                    <img src={student.avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 16 }} />
                  )}
                  {student.initial && (
                    <div className={`w-8 h-8 rounded-full ${student.color} flex items-center justify-center text-white text-sm font-bold mr-4 flex-shrink-0`}>
                      {student.initial}
                    </div>
                  )}
                  <span style={{ fontSize: 14, color: '#1f1f1f', fontFamily: 'Roboto, sans-serif', fontWeight: 400 }}>{student.name}</span>
                </label>
              ))}
            </div>
            
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={() => setShowStudentModal(false)} style={{ padding: '10px 24px', background: '#0b57d0', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>Xong</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default function StreamTab({ classId, classData }) {

  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [upcomingWorks, setUpcomingWorks] = useState([]);

  const fetchPosts = async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await streamApi.getStream(classId, pageNum, 10);
      const slice = res.data.result;
      const newPosts = slice?.content || slice || [];
      const more = slice?.last === false;  // Spring Slice có field "last", không phải "hasNext"
      setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setHasNext(more);
      setPage(pageNum);
    } catch {
      toast.error('Không thể tải bảng tin!');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
    // Fetch upcoming classworks (due in the future, sorted by dueDate)
    classworkApi.getClassworks(classId)
      .then(r => {
        const all = r.data.result || [];
        const now = new Date();
        const upcoming = all
          .filter(cw => cw.dueDate && new Date(cw.dueDate) > now)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5); // max 5 items
        setUpcomingWorks(upcoming);
      })
      .catch(() => {});
  }, [classId]);

  const handleDeleted = (postId) =>
    setPosts((prev) => prev.filter((p) => p.id !== postId));

  const handleUpdated = (updatedPost) =>
    setPosts((prev) => prev.map((p) => p.id === updatedPost.id ? updatedPost : p));

  const handleLoadMore = () => fetchPosts(page + 1, true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-6 max-w-[1000px] mx-auto px-4">
      {/* Left: Class Info Card */}
      <div className="space-y-4">
        {/* Compact class info card */}
        <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e0e0e0]">
            <h2 className="text-[14px] font-medium text-[#1f1f1f] truncate" style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}>Mã lớp</h2>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[1.25rem] font-medium text-[#1a73e8] tracking-widest">{classData?.classCode}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(classData?.classCode); toast.success('Đã sao chép mã lớp!'); }}
                className="text-[#5f6368] hover:text-[#1a73e8] transition-colors p-1"
                title="Sao chép mã lớp"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming assignments */}
        <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden">
          <div className="px-4 py-3">
            <h2 className="text-[14px] font-medium text-[#1f1f1f]" style={{ fontFamily: "'Google Sans', Roboto, Arial, sans-serif" }}>Sắp đến hạn</h2>
          </div>
          {upcomingWorks.length === 0 ? (
            <div className="px-4 pb-4">
              <p className="text-[13px] text-[#5f6368] leading-relaxed">Tuyệt vời, không có bài tập nào sắp đến hạn!</p>
            </div>
          ) : (
            <div>
              {upcomingWorks.map(cw => (
                <button
                  key={cw.id}
                  onClick={() => navigate(`/classes/${classId}/classworks/${cw.id}`)}
                  className="w-full px-4 py-2.5 flex flex-col items-start hover:bg-[#f1f3f4] transition-colors border-b border-[#e0e0e0] last:border-0"
                >
                  <span className="text-[12px] font-medium text-[#1f1f1f] truncate w-full text-left">{cw.title}</span>
                  <span className="text-[11px] text-[#d93025] mt-0.5">
                    Hạn: {new Date(cw.dueDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-[#e0e0e0]">
            <button
              onClick={() => navigate(`/classes/${classId}?tab=classwork`)}
              className="text-[12px] text-[#1a73e8] hover:underline font-medium"
            >
              Xem tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Right: Stream Feed */}
      <div className="space-y-4">
        <CreatePostBox classId={classId} onPosted={() => { setPage(0); fetchPosts(0); }} classData={classData} />

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/6" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">Chưa có bài đăng nào</p>
            <p className="text-gray-400 text-xs mt-1">Hãy đăng thông báo đầu tiên cho lớp học!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} classId={classId} onDeleted={handleDeleted} onUpdated={handleUpdated} />
          ))
        )}

        {/* Load more */}
        {!loading && hasNext && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-[#1a73e8] bg-white border border-[#e0e0e0] rounded-xl hover:bg-[#e8f0fe] disabled:opacity-60 transition"
          >
            {loadingMore ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Đang tải...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Xem thêm bài đăng
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
