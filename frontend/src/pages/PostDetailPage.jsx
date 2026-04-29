import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import streamApi from '../services/streamApi';
import classApi from '../services/classApi';
import useWebSocket from '../hooks/useWebSocket';

const COLORS = ['bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
function getAvatar(name = '') {
  const idx = (name.charCodeAt(0) || 0) % COLORS.length;
  const initials = name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase() || 'U';
  return { color: COLORS[idx], initials };
}

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

export default function PostDetailPage() {
  const { classId, postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [post, setPost] = useState(null);
  const [classData, setClassData] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // Track IDs received from WS to avoid duplicates with HTTP response
  const wsReceivedIds = useRef(new Set());

  useEffect(() => {
    Promise.all([
      streamApi.getPostById(classId, postId),
      classApi.getClassDetail(classId),
      streamApi.getComments(postId),
    ])
      .then(([postRes, classRes, commentsRes]) => {
        setPost(postRes.data.result);
        setClassData(classRes.data.result);
        setComments(commentsRes.data.result || []);
      })
      .catch(() => {
        toast.error('Không tải được bài đăng!');
        navigate(`/classes/${classId}`);
      })
      .finally(() => setLoading(false));
  }, [classId, postId]);

  // Real-time: nhận comment của người khác qua WebSocket
  const handleIncomingComment = useCallback((newComment) => {
    setComments(prev => {
      if (prev.some(c => c.id === newComment.id)) return prev;
      wsReceivedIds.current.add(newComment.id);
      return [...prev, newComment];
    });
  }, []);

  useWebSocket(
    postId ? `/topic/comments.${postId}` : null,
    handleIncomingComment,
    !!postId
  );

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, content: text, authorName: user?.fullName || user?.name, authorId: user?.id, createdAt: new Date().toISOString() };
    setComments(prev => [...prev, optimistic]);
    setCommentText('');
    try {
      const res = await streamApi.addComment(postId, { content: text });
      const realComment = res.data.result;
      setComments(prev => {
        // WS có thể đã add realId trước khi HTTP response về → tránh duplicate
        if (realComment?.id && (prev.some(c => c.id === realComment.id && c.id !== tempId) || wsReceivedIds.current.has(realComment.id))) {
          wsReceivedIds.current.delete(realComment.id);
          return prev.filter(c => c.id !== tempId);
        }
        return prev.map(c => c.id === tempId ? (realComment || optimistic) : c);
      });
    } catch {
      toast.error('Không thể đăng bình luận!');
      setComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await streamApi.deleteComment(postId, commentId);
    } catch {
      toast.error('Không thể xoá bình luận!');
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="bg-white rounded-2xl h-48 border border-gray-200" />
      <div className="bg-white rounded-2xl h-64 border border-gray-200" />
    </div>
  );

  const { color, initials } = getAvatar(post?.authorName || '');
  const isOwner = String(user?.id) === String(post?.authorId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
        <button
          onClick={() => navigate(`/classes/${classId}`)}
          className="hover:text-blue-600 transition"
        >
          {classData?.name}
        </button>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-700 font-medium">Bài đăng</span>
      </div>

      {/* Post card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        <div className="p-5">
          {/* Author header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
              {post?.authorAvatar
                ? <img src={post.authorAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                : initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{post?.authorName}</p>
              <p className="text-xs text-gray-400">{timeAgo(post?.createdAt)}</p>
            </div>
          </div>

          {/* Content */}
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
            {post?.content}
          </p>

          {/* Attachments */}
          {post?.attachments?.length > 0 && (
            <div className="mt-4 space-y-2">
              {post.attachments.map(att => (
                <a
                  key={att.id}
                  href={att.fileUrl || att.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition group"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📎</div>
                  <span className="text-sm text-blue-700 group-hover:text-blue-800 truncate flex-1">
                    {att.fileName || att.name || 'Tệp đính kèm'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">
            {comments.length > 0 ? `${comments.length} nhận xét` : 'Nhận xét lớp học'}
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          {comments.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center italic">Chưa có nhận xét nào. Hãy là người đầu tiên!</p>
          )}
          {comments.map(c => {
            const av = getAvatar(c.authorName || '');
            const isCommentOwner = String(user?.id) === String(c.authorId);
            return (
              <div key={c.id} className="flex items-start gap-3 px-5 py-3.5 group hover:bg-gray-50 transition">
                <div className={`w-8 h-8 rounded-full ${av.color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5`}>
                  {av.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 rounded-2xl px-3.5 py-2.5 inline-block max-w-full">
                    <p className="text-xs font-semibold text-gray-800 mb-0.5">{c.authorName}</p>
                    <p className="text-sm text-gray-700 leading-relaxed break-words">{c.content}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 ml-1">{timeAgo(c.createdAt)}</p>
                </div>
                {isCommentOwner && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition mt-1 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment input */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${getAvatar(user?.fullName || user?.name || '').color} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
              {getAvatar(user?.fullName || user?.name || '').initials}
            </div>
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder="Thêm nhận xét lớp học..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || sending}
                className="text-blue-600 disabled:text-gray-300 hover:text-blue-800 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
