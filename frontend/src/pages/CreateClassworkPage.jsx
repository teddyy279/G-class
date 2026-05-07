import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import classworkApi from '../services/classworkApi';
import classApi from '../services/classApi';
import attachmentApi from '../services/attachmentApi';
import useGoogleDrivePicker from '../hooks/useGoogleDrivePicker';
import { AssignmentIcon, MaterialIcon, QuestionIcon, QuizIcon } from '../features/classwork/components/ClassworkIcons';

const TYPE_META = {
  ASSIGNMENT: { label: 'Bài tập', Icon: AssignmentIcon, actionLabel: 'Giao bài' },
  MATERIAL:   { label: 'Tài liệu', Icon: MaterialIcon, actionLabel: 'Đăng' },
  QUESTION:   { label: 'Câu hỏi', Icon: QuestionIcon, actionLabel: 'Hỏi' },
  QUIZ:       { label: 'Bài kiểm tra', Icon: QuizIcon, actionLabel: 'Giao bài' },
};

export default function CreateClassworkPage() {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { openPicker, isReady: isDriveReady } = useGoogleDrivePicker();
  
  const type = searchParams.get('type') || 'ASSIGNMENT';
  const meta = TYPE_META[type] || TYPE_META.ASSIGNMENT;

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: type,
    maxPoints: 100,
    dueDate: '',
    topicId: '',
    questionType: 'SHORT_ANSWER',
    externalLink: type === 'QUIZ' ? 'https://docs.google.com/forms' : '',
    options: ['Tùy chọn 1'],
    canReply: true,
    canEditAnswer: false,
    showClasssummary: true,
    attachmentIds: [],
    targetStudentIds: [],
  });

  const [topics, setTopics] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, membersRes] = await Promise.all([
          classworkApi.getTopics(classId),
          classApi.getMembers(classId)
        ]);
        
        setTopics(topicsRes.data.result || []);
        
        const students = (membersRes.data.result?.students || []).map((s, idx) => {
          const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
          return {
            id: s.userId,          // API trả về userId, không phải id
            name: s.fullName,
            avatar: s.avatar,      // API trả về avatar, không phải avatarUrl
            initial: !s.avatar ? s.fullName.charAt(0).toUpperCase() : null,
            color: colors[idx % colors.length],
            checked: true
          };
        });
        setSelectedStudents(students);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [classId]);

  const isAllStudentsChecked = selectedStudents.length > 0 && selectedStudents.every(s => s.checked);

  const toggleStudent = (id) => {
    if (id === 'all') {
      const newValue = !isAllStudentsChecked;
      setSelectedStudents(p => p.map(s => ({ ...s, checked: newValue })));
    } else {
      setSelectedStudents(p => p.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await attachmentApi.uploadFile(file);
      const newAtt = res.data.result;
      setAttachments(p => [...p, newAtt]);
      setForm(p => ({ ...p, attachmentIds: [...p.attachmentIds, newAtt.id] }));
      toast.success('Đã tải tệp lên');
    } catch (err) {
      toast.error('Tải tệp thất bại!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = async (type) => {
    const promptType = typeof type === 'string' ? type : 'liên kết';
    const url = prompt(`Nhập đường dẫn ${promptType}:`);
    if (!url) return;
    
    setUploading(true);
    try {
      const res = await attachmentApi.createLink(url);
      const newAtt = res.data.result;
      setAttachments(p => [...p, newAtt]);
      setForm(p => ({ ...p, attachmentIds: [...p.attachmentIds, newAtt.id] }));
      toast.success('Đã thêm đường liên kết');
    } catch (err) {
      toast.error('Thêm liên kết thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleDrivePicker = () => {
    openPicker(
      async (files) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setUploading(true);
        try {
          const res = await attachmentApi.createLink(file.url);
          const newAtt = res.data.result;
          setAttachments(p => [...p, newAtt]);
          setForm(p => ({ ...p, attachmentIds: [...p.attachmentIds, newAtt.id] }));
          toast.success(`Đã đính kèm: ${file.name}`);
        } catch (err) {
          toast.error('Thêm tệp Drive thất bại!');
        } finally {
          setUploading(false);
        }
      },
      (error) => {
        console.error('Google Picker error:', error);
      }
    );
  };

  const handleRemoveAttachment = (idx) => {
    const attToRemove = attachments[idx];
    setAttachments(p => p.filter((_, i) => i !== idx));
    setForm(p => ({ ...p, attachmentIds: p.attachmentIds.filter(id => id !== attToRemove.id) }));
  };

  // Tính min datetime-local string (giờ hiện tại, bỏ giây/ms)
  const getNowLocalMin = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    // Format: YYYY-MM-DDTHH:MM
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const isDueDateInPast = form.dueDate && new Date(form.dueDate) <= new Date();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return; // Tránh bấm nhiều lần
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề!'); return; }
    if (isDueDateInPast) {
      toast.error('Hạn nộp phải sau thời điểm hiện tại!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        maxPoints: form.type === 'MATERIAL' ? null : form.maxPoints,
        topicId: form.topicId || null,
        questionType: form.type === 'QUESTION' ? form.questionType : null,
        externalLink: form.externalLink,
        attachmentIds: form.attachmentIds,
        targetStudentIds: isAllStudentsChecked ? [] : selectedStudents.filter(s => s.checked).map(s => s.id),
        options: (form.type === 'QUESTION' && form.questionType === 'MULTIPLE_CHOICE') ? form.options.filter(o => o.trim() !== '') : [],
        canReply: form.canReply,
        canEditAnswer: form.canEditAnswer,
        showClasssummary: form.showClasssummary,
      };

      await classworkApi.createClasswork(classId, payload);
      toast.success('Đã tạo thành công!');
      navigate(`/classes/${classId}?tab=classwork`); // Quay lại đúng tab Classwork (bỏ chữ 's')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (idx, val) => {
    const newOptions = [...form.options];
    newOptions[idx] = val;
    setForm(p => ({ ...p, options: newOptions }));
  };

  const handleAddOption = () => {
    setForm(p => ({ ...p, options: [...p.options, `Tùy chọn ${p.options.length + 1}`] }));
  };

  const handleRemoveOption = (idx) => {
    setForm(p => ({ ...p, options: p.options.filter((_, i) => i !== idx) }));
  };

  if (fetchingData) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Google Sans', Roboto, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#e8f0fe] text-[#1967d2]">
            <meta.Icon />
          </div>
          <h1 className="text-xl font-normal text-[#3c4043]">{meta.label}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Đã lưu</span>
          <div className="flex items-center">
            <button onClick={() => handleSubmit()} disabled={loading || !form.title.trim() || isDueDateInPast} 
              className="px-6 py-2 bg-[#0b57d0] text-white text-sm font-medium rounded-l-md hover:bg-[#084298] disabled:opacity-50 transition-colors">
              {loading ? 'Đang lưu...' : meta.actionLabel}
            </button>
            <button className="px-2 py-2 bg-[#0b57d0] text-white rounded-r-md border-l border-[#084298] hover:bg-[#084298] disabled:opacity-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body Layout */}
      <div className="flex flex-col lg:flex-row max-w-[1280px] mx-auto px-6 py-6 gap-8">
        
        {/* Left Column (Main Form) */}
        <div className="flex-1 space-y-6">
          
          {/* Title & Instructions */}
          <div className="bg-[#f8f9fa] rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="relative mb-6">
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-[#f1f3f4] border-b-2 border-gray-400 px-4 py-4 pt-6 text-[15px] focus:outline-none focus:border-[#0b57d0] transition-colors rounded-t-md"
                />
                <label className={`absolute left-4 transition-all ${form.title ? 'top-2 text-xs text-[#0b57d0]' : 'top-4 text-sm text-gray-600'}`}>
                  Tiêu đề {meta.label !== 'Tài liệu' && '*'}
                </label>
              </div>

              <div className="border border-gray-300 rounded-md bg-white overflow-hidden focus-within:border-[#0b57d0] focus-within:ring-1 focus-within:ring-[#0b57d0]">
                <textarea 
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 min-h-[120px] text-sm focus:outline-none resize-y"
                  placeholder="Hướng dẫn (không bắt buộc)"
                />
                {/* Fake Rich Text Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 bg-[#f8f9fa] text-gray-600">
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm font-bold">B</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm italic">I</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm underline">U</button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 15h16v-2H4v2zm0 4h16v-2H4v2zm0-8h16V9H4v2zm0-6v2h16V5H4z"/></svg>
                  </button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multiple Choice Options (If Question & Multiple Choice) */}
          {form.type === 'QUESTION' && form.questionType === 'MULTIPLE_CHOICE' && (
            <div className="space-y-3">
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0" />
                  <input 
                    type="text" 
                    value={opt} 
                    onChange={e => handleOptionChange(idx, e.target.value)}
                    className="flex-1 border-b border-gray-300 px-1 py-2 text-[15px] focus:outline-none focus:border-[#0b57d0] hover:bg-gray-50"
                  />
                  {form.options.length > 1 && (
                    <button onClick={() => handleRemoveOption(idx)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-5 h-5 flex-shrink-0" />
                <button onClick={handleAddOption} className="text-[#0b57d0] text-sm font-medium hover:bg-[#e8f0fe] px-3 py-1.5 rounded">
                  + Thêm tùy chọn
                </button>
              </div>
            </div>
          )}

          {/* Blank Quiz Card (If Quiz) */}
          {form.type === 'QUIZ' && (
            <div 
              onClick={() => window.open('https://docs.google.com/forms/create', '_blank')}
              className="border border-gray-300 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer mb-6"
            >
              <div className="w-12 h-12 bg-[#7627bb] rounded flex items-center justify-center text-white flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[15px] text-[#0b57d0] font-medium">Blank Quiz (Bấm để tạo biểu mẫu)</p>
                <p className="text-[13px] text-gray-500">Google Biểu mẫu</p>
              </div>
            </div>
          )}

          {/* Attachments UI Mockup */}
          <div className="border border-gray-300 rounded-xl p-4">
            <h3 className="text-[15px] font-medium text-[#3c4043] mb-4">Đính kèm</h3>
            <div className="flex items-center justify-center gap-8 text-center text-xs text-gray-600 mb-6">
              <button onClick={handleDrivePicker} disabled={uploading || !isDriveReady} className="flex flex-col items-center gap-2 hover:text-[#0b57d0] transition-colors disabled:opacity-50">
                <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm hover:shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0F9D58"><path d="M19.59 7L12 21.12 4.41 7h15.18z" fill="#0F9D58"/><path d="M4.41 7L0 14l7.59 14.12z" fill="#FFC107"/><path d="M19.59 7L24 14l-7.59 14.12z" fill="#4285F4"/></svg>
                </div>
                Drive
              </button>
              <button onClick={() => handleAddLink('YouTube')} disabled={uploading} className="flex flex-col items-center gap-2 hover:text-[#0b57d0] transition-colors disabled:opacity-50">
                <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm hover:shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </div>
                YouTube
              </button>
              <button onClick={() => alert('Tính năng Tạo tài liệu Google đang phát triển')} disabled={uploading} className="flex flex-col items-center gap-2 hover:text-[#0b57d0] transition-colors disabled:opacity-50">
                <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm hover:shadow-md text-gray-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </div>
                Tạo
              </button>
              
              <input type="file" ref={fileInputRef} onChange={handleUploadFile} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex flex-col items-center gap-2 hover:text-[#0b57d0] transition-colors disabled:opacity-50">
                <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm hover:shadow-md text-gray-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                </div>
                Tải lên
              </button>
              <button onClick={handleAddLink} disabled={uploading} className="flex flex-col items-center gap-2 hover:text-[#0b57d0] transition-colors disabled:opacity-50">
                <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm hover:shadow-md text-gray-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                </div>
                Đường liên kết
              </button>
            </div>

            {/* List of Attachments */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white relative group hover:bg-gray-50 transition">
                    <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded">
                      {att.type === 'LINK' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ea4335"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-[#3c4043] truncate">{att.fileName || att.fileUrl}</p>
                      <p className="text-xs text-gray-500 uppercase">{att.type === 'LINK' ? 'Liên kết' : 'Tệp đính kèm'}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveAttachment(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      title="Xóa"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Settings) */}
        <div className="w-full lg:w-[320px] flex-shrink-0 space-y-5">
          
          {/* Specific Setting: Question Type Toggle */}
          {form.type === 'QUESTION' && (
            <div className="mb-6">
              <select 
                value={form.questionType} 
                onChange={e => setForm(p => ({ ...p, questionType: e.target.value }))}
                className="w-full border border-gray-300 rounded p-2.5 text-sm bg-gray-50 focus:outline-none focus:border-[#0b57d0]"
              >
                <option value="SHORT_ANSWER">Câu trả lời ngắn</option>
                <option value="MULTIPLE_CHOICE">Nhiều lựa chọn</option>
              </select>
            </div>
          )}

          {/* Dành cho */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Dành cho</label>
            <div className="flex items-center gap-2">
              <select className="flex-1 border border-gray-300 rounded p-2 text-sm bg-gray-50 text-[#3c4043] focus:outline-none focus:border-[#0b57d0]">
                <option>Lớp hiện tại</option>
              </select>
              <button onClick={() => setShowStudentModal(true)} className="flex-[1.5] border border-gray-300 rounded p-2 text-sm hover:bg-gray-50 flex items-center justify-between text-[#3c4043]">
                <span className="truncate pr-2">
                  {selectedStudents.length === 0 || isAllStudentsChecked ? 'Tất cả học viên' : 
                    selectedStudents.filter(s => s.checked).length === 1 
                    ? selectedStudents.find(s => s.checked).name 
                    : `${selectedStudents.filter(s => s.checked).length} học viên`
                  }
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500 flex-shrink-0"><path d="M7 10l5 5 5-5z"/></svg>
              </button>
            </div>
          </div>

          {/* Điểm */}
          {form.type !== 'MATERIAL' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Điểm</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0"
                  max="1000"
                  value={form.maxPoints === null ? '' : form.maxPoints} 
                  onChange={e => setForm(p => ({ ...p, maxPoints: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="Chưa chấm điểm"
                  className="flex-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#0b57d0] hover:bg-gray-50"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Xóa trắng để Không chấm điểm</p>
            </div>
          )}

          {/* Hạn nộp */}
          {form.type !== 'MATERIAL' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hạn nộp</label>
              <input 
                type="datetime-local" 
                value={form.dueDate}
                min={getNowLocalMin()}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className={`w-full border rounded p-2 text-sm focus:outline-none hover:bg-gray-50 transition-colors ${
                  isDueDateInPast
                    ? 'border-red-400 focus:border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 focus:border-[#0b57d0]'
                }`}
              />
              {isDueDateInPast && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  Hạn nộp phải sau thời điểm hiện tại
                </p>
              )}
            </div>
          )}

          {/* Chủ đề */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Chủ đề</label>
            <select 
              value={form.topicId} 
              onChange={e => setForm(p => ({ ...p, topicId: e.target.value }))}
              className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 focus:outline-none focus:border-[#0b57d0]"
            >
              <option value="">Không có chủ đề</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-200 my-4" />

          {/* Checkboxes */}
          {form.type === 'QUESTION' && form.questionType === 'SHORT_ANSWER' && (
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm text-[#3c4043] cursor-pointer">
                <input type="checkbox" checked={form.canReply} onChange={e => setForm(p => ({ ...p, canReply: e.target.checked }))} className="w-4 h-4 text-[#0b57d0] rounded" />
                Học viên có thể trả lời nhau
              </label>
              <label className="flex items-center gap-3 text-sm text-[#3c4043] cursor-pointer">
                <input type="checkbox" checked={form.canEditAnswer} onChange={e => setForm(p => ({ ...p, canEditAnswer: e.target.checked }))} className="w-4 h-4 text-[#0b57d0] rounded" />
                Học viên có thể chỉnh sửa câu trả lời
              </label>
            </div>
          )}
          
          {form.type === 'QUESTION' && form.questionType === 'MULTIPLE_CHOICE' && (
            <div>
              <label className="flex items-center gap-3 text-sm text-[#3c4043] cursor-pointer">
                <input type="checkbox" checked={form.showClasssummary} onChange={e => setForm(p => ({ ...p, showClasssummary: e.target.checked }))} className="w-4 h-4 text-[#0b57d0] rounded" />
                Sinh viên có thể xem tóm tắt lớp
              </label>
            </div>
          )}

        </div>
      </div>

      {/* ── Student Selection Modal ── */}
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: '#1f1f1f' }}>Dành cho</h3>
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
          </div>
        </div>
      )}

    </div>
  );
}
