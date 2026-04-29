import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import classworkApi from '../services/classworkApi';
import classApi from '../services/classApi';
import streamApi from '../services/streamApi';
import useWebSocket from '../hooks/useWebSocket';

// ─── ClassworkComments: Nhận xét công khai hoặc riêng tư ──────────────────
function ClassworkComments({ classworkId, isPrivate = false, studentId = null, label, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  // Track IDs received from WS to avoid duplicates with HTTP response
  const wsReceivedIds = useRef(new Set());

  useEffect(() => {
    const fetcher = isPrivate
      ? streamApi.getClassworkPrivateComments(classworkId)
      : streamApi.getClassworkComments(classworkId);
    fetcher.then(r => setComments(r.data.result || [])).catch(() => {});
  }, [classworkId, isPrivate]);

  const handleIncomingComment = useCallback((newComment) => {
    setComments(prev => {
      if (prev.some(c => c.id === newComment.id)) return prev;
      wsReceivedIds.current.add(newComment.id); // track it synchronously
      return [...prev, newComment];
    });
  }, []);

  const wsTopic = classworkId 
    ? (isPrivate ? `/user/queue/private-comments.${classworkId}` : `/topic/comments.${classworkId}`)
    : null;

  useWebSocket(wsTopic, handleIncomingComment, !!classworkId);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const payload = { content: text.trim(), isPrivate };
      if (isPrivate && studentId) payload.studentId = studentId;
      const r = await streamApi.addClassworkComment(classworkId, payload);
      const realComment = r.data.result;
      setText('');
      setComments(prev => {
        // If WS already delivered this, skip (wsReceivedIds is a reliable sync ref)
        if (realComment?.id && (prev.some(c => c.id === realComment.id) || wsReceivedIds.current.has(realComment.id))) {
          wsReceivedIds.current.delete(realComment.id);
          return prev;
        }
        return [...prev, realComment];
      });
    } catch { toast.error('Gửi nhận xét thất bại!'); }
    finally { setSending(false); }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Xoá nhận xét này?')) return;
    try {
      await streamApi.deleteClassworkComment(classworkId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { toast.error('Xoá thất bại!'); }
  };

  return (
    <div className="border-t border-gray-100">
      <div className="px-6 py-4">
        {label && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</p>}
        <div className="space-y-3 mb-3">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              {isPrivate ? 'Chưa có nhận xét riêng tư nào.' : 'Chưa có nhận xét nào.'}
            </p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2 group">
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {(c.authorName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700">{c.authorName}</span>
                  {(String(c.authorId) === String(currentUser?.id)) && (
                    <button onClick={() => handleDelete(c.id)}
                      className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs">
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {(currentUser?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={isPrivate ? 'Nhận xét riêng tư...' : 'Thêm nhận xét lớp học...'}
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="text-blue-600 disabled:text-gray-300 hover:text-blue-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function formatDate(d) {
  if (!d) return 'Không có hạn';
  return new Date(d).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function FileIcon({ type }) {
  const map = { pdf: '📄', doc: '📝', docx: '📝', xlsx: '📊', xls: '📊', ppt: '📊', pptx: '📊', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', mp4: '🎬', mp3: '🎵' };
  return <span>{map[type?.toLowerCase()] || '📎'}</span>;
}

// ─── STUDENT: "Bài làm của bạn" panel ───────────────────────────────────────
function StudentWorkPanel({ classId, classworkId, classwork }) {
  const [submission, setSubmission] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]); // {file, attachmentId, uploading}
  const [loading, setLoading] = useState(true);
  const [turning, setTurning] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    classworkApi.getMySubmission(classId, classworkId)
      .then(r => setSubmission(r.data.result))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAddFile = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const tmp = { name: file.name, uploading: true, attachmentId: null };
      setPendingFiles(p => [...p, tmp]);
      try {
        const res = await classworkApi.uploadSubmissionFile(classId, classworkId, file);
        const att = res.data.result;
        setPendingFiles(p => p.map(f => f.name === file.name ? { ...f, uploading: false, attachmentId: att.id, url: att.fileUrl } : f));
      } catch {
        toast.error(`Upload ${file.name} thất bại!`);
        setPendingFiles(p => p.filter(f => f.name !== file.name));
      }
    }
    e.target.value = '';
  };

  const removeFile = (name) => setPendingFiles(p => p.filter(f => f.name !== name));

  const handleTurnIn = async () => {
    setTurning(true);
    try {
      const ids = pendingFiles.filter(f => f.attachmentId).map(f => f.attachmentId);
      const res = await classworkApi.turnIn(classId, classworkId, { attachmentIds: ids });
      setSubmission(res.data.result);
      setPendingFiles([]);
      toast.success('Đã nộp bài!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Nộp bài thất bại!');
    } finally { setTurning(false); }
  };

  const handleUnsubmit = async () => {
    if (!confirm('Hủy nộp bài?')) return;
    try {
      const res = await classworkApi.unsubmit(classId, classworkId);
      setSubmission(res.data.result);
      toast.success('Đã hủy nộp!');
    } catch { toast.error('Hủy nộp thất bại!'); }
  };

  const isTurnedIn = submission?.status === 'TURNED_IN';
  const isGraded = submission?.status === 'GRADED';
  const canAdd = !isTurnedIn && !isGraded;

  const statusBadge = {
    TURNED_IN: <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Đã nộp</span>,
    GRADED: <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Đã chấm điểm</span>,
    ASSIGNED: <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Chưa nộp</span>,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Bài làm của bạn</h3>
        {submission && statusBadge[submission.status]}
      </div>

      {/* Grade display */}
      {isGraded && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-700">{submission.score}</span>
          <span className="text-gray-500 text-sm">/ {classwork?.maxPoints ?? 100}</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="h-12 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <>
            {/* Submitted files */}
            {submission?.attachments?.map(att => (
              <div key={att.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <FileIcon type={att.fileType} />
                <a href={att.fileUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate flex-1">{att.fileName || 'Tệp đính kèm'}</a>
              </div>
            ))}

            {/* Pending files (not yet turned in) */}
            {canAdd && pendingFiles.map(f => (
              <div key={f.name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                {f.uploading
                  ? <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <span className="text-sm">📎</span>
                }
                <span className="text-xs text-gray-600 truncate flex-1">{f.name}</span>
                {!f.uploading && (
                  <button onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-red-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            ))}

            {/* Add file button */}
            {canAdd && (
              <>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleAddFile} />
                <button onClick={() => fileRef.current.click()}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Thêm tệp đính kèm
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4">
        {!isTurnedIn && !isGraded ? (
          <button onClick={handleTurnIn}
            disabled={turning || pendingFiles.some(f => f.uploading)}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition">
            {turning ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        ) : isTurnedIn ? (
          <button onClick={handleUnsubmit}
            className="w-full py-2.5 border border-green-600 text-green-600 text-sm font-semibold rounded-lg hover:bg-green-50 transition">
            Hủy nộp bài
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── TEACHER: Danh sách bài nộp ────────────────────────────────────────────
function SubmissionsPanel({ classId, classworkId, classwork }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null); // studentId being graded
  const [scoreInput, setScoreInput] = useState('');

  useEffect(() => {
    classworkApi.getSubmissions(classId, classworkId)
      .then(r => setSubs(r.data.result || []))
      .catch(() => toast.error('Không tải được danh sách nộp!'))
      .finally(() => setLoading(false));
  }, []);

  const handleGrade = async (studentId) => {
    const score = Number(scoreInput);
    if (isNaN(score) || score < 0) { toast.error('Điểm không hợp lệ!'); return; }
    try {
      const res = await classworkApi.grade(classId, classworkId, studentId, { score });
      setSubs(p => p.map(s => s.studentId === studentId ? { ...s, score: res.data.result.score, status: 'GRADED' } : s));
      toast.success('Đã chấm điểm!');
      setGrading(null);
      setScoreInput('');
    } catch { toast.error('Chấm điểm thất bại!'); }
  };

  const turnedIn = subs.filter(s => s.status === 'TURNED_IN' || s.status === 'GRADED');
  const notTurnedIn = subs.filter(s => s.status === 'ASSIGNED' || !s.status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Bài nộp của học sinh</h3>
        <div className="flex gap-4 mt-1">
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{turnedIn.length}</span> đã nộp
          </span>
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{notTurnedIn.length}</span> chưa nộp
          </span>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg"/>)}
        </div>
      ) : subs.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">Chưa có học sinh nào nộp bài</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {subs.map(sub => (
            <div key={sub.studentId || sub.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(sub.studentName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{sub.studentName || 'Học sinh'}</p>
                  <p className="text-xs text-gray-400">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : 'Chưa nộp'}</p>
                </div>

                {/* Score or Grade button */}
                {grading === (sub.studentId || sub.id) ? (
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={scoreInput} onChange={e => setScoreInput(e.target.value)}
                      placeholder="Điểm"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min={0} max={classwork?.maxScore ?? 100}
                    />
                    <span className="text-xs text-gray-400">/{classwork?.maxScore ?? 100}</span>
                    <button onClick={() => handleGrade(sub.studentId || sub.id)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Lưu</button>
                    <button onClick={() => { setGrading(null); setScoreInput(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700">Hủy</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sub.status === 'GRADED' ? (
                      <span className="text-sm font-bold text-blue-600">{sub.score}<span className="text-xs text-gray-400">/{classwork?.maxScore ?? 100}</span></span>
                    ) : sub.status === 'TURNED_IN' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đã nộp</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Chưa nộp</span>
                    )}
                    {(sub.status === 'TURNED_IN' || sub.status === 'GRADED') && (
                      <button onClick={() => { setGrading(sub.studentId || sub.id); setScoreInput(sub.score ?? ''); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        {sub.status === 'GRADED' ? 'Sửa' : 'Chấm'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments */}
              {sub.attachments?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-11">
                  {sub.attachments.map(att => (
                    <a key={att.id} href={att.fileUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1 hover:bg-blue-100 transition">
                      <FileIcon type={att.fileType} />
                      {att.fileName || 'Tệp'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function ClassworkDetailPage() {
  const { classId, classworkId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classwork, setClasswork] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(null); // null = still loading role

  useEffect(() => {
    Promise.all([
      classworkApi.getClassworkDetail(classId, classworkId),
      classApi.getClassDetail(classId),
      classApi.getMembers(classId).catch(() => ({ data: { result: { teachers: [] } } })),
    ]).then(([cwRes, clRes, membersRes]) => {
      const cw = cwRes.data.result;
      const cl = clRes.data.result;
      setClasswork(cw);
      setClassData(cl);
      // Same logic as ClassDetailPage
      const teachers = membersRes.data?.result?.teachers || [];
      const isOwner = String(cl?.ownerId ?? '') === String(user?.id ?? '');
      const isTeacherMember = teachers.some(t => String(t.userId) === String(user?.id));
      setIsTeacher(isOwner || isTeacherMember);
    }).catch(() => { toast.error('Không tải được bài tập!'); navigate(`/classes/${classId}`); })
      .finally(() => setLoading(false));
  }, [classId, classworkId, user?.id]);

  const TYPE_LABELS = { ASSIGNMENT: 'Bài tập', MATERIAL: 'Tài liệu', QUESTION: 'Câu hỏi', QUIZ: 'Bài kiểm tra' };

  // Show loading if data or role is still being determined
  if (loading || isTeacher === null) return (
    <div className="max-w-5xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"/>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl"/>
        <div className="h-64 bg-gray-200 rounded-xl"/>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate(`/classes/${classId}`)} className="hover:text-blue-600 transition">
          {classData?.name}
        </button>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        <span className="text-gray-400">Bài tập trên lớp</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        <span className="text-gray-700 font-medium truncate">{classwork?.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Assignment info */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-gray-800">{classwork?.title}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                  <span>{classData?.name}</span>
                  <span>·</span>
                  <span>{TYPE_LABELS[classwork?.classworkType] || 'Bài tập'}</span>
                  {classwork?.maxPoints != null && (
                    <><span>·</span><span>{classwork.maxPoints} điểm</span></>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Hạn nộp: <span className={classwork?.dueDate && new Date(classwork.dueDate) < new Date() ? 'text-red-500' : ''}>
                    {formatDate(classwork?.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {classwork?.description && (
            <div className="px-6 py-5 border-b border-gray-100">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{classwork.description}</p>
            </div>
          )}

          {/* Teacher attachments */}
          {classwork?.attachments?.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tệp đính kèm</p>
              <div className="space-y-2">
                {classwork.attachments.map(att => (
                  <a key={att.id} href={att.fileUrl || att.linkUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 transition group">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-sm flex-shrink-0">
                      <FileIcon type={att.fileType} />
                    </div>
                    <span className="text-sm text-blue-700 group-hover:text-blue-800 truncate flex-1">
                      {att.fileName || att.name || 'Tệp đính kèm'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty description */}
          {!classwork?.description && !classwork?.attachments?.length && (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              Không có hướng dẫn thêm nào.
            </div>
          )}

          {/* Public classwork comments */}
          <ClassworkComments
            classworkId={classworkId}
            isPrivate={false}
            label="Nhận xét lớp học"
            currentUser={user}
          />
        </div>

        {/* RIGHT: Student work / Teacher submissions + private comments */}
        <div className="space-y-4">
          {isTeacher ? (
            <SubmissionsPanel classId={classId} classworkId={classworkId} classwork={classwork} />
          ) : (
            <StudentWorkPanel classId={classId} classworkId={classworkId} classwork={classwork} />
          )}

          {/* Private comments */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Nhận xét riêng tư</p>
              <p className="text-xs text-gray-400 mt-0.5">Chỉ bạn và giáo viên mới thấy</p>
            </div>
            <ClassworkComments
              classworkId={classworkId}
              isPrivate={true}
              label={null}
              currentUser={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
