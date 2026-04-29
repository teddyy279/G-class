import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import classApi from '../services/classApi';
import useAuthStore from '../store/useAuthStore';
import StreamTab from '../features/stream/StreamTab';
import ClassworkTab from '../features/classwork/ClassworkTab';
import MembersTab from '../features/members/MembersTab';

const TABS = [
  { key: 'stream', label: 'Bảng tin' },
  { key: 'classwork', label: 'Bài tập trên lớp' },
  { key: 'members', label: 'Thành viên' },
];

// Class header banner colors
const BANNER_COLORS = [
  'from-teal-500 to-teal-700',
  'from-blue-500 to-blue-700',
  'from-indigo-500 to-indigo-700',
  'from-green-500 to-green-700',
  'from-purple-500 to-purple-700',
];

export default function ClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const activeTab = searchParams.get('tab') || 'stream';
  const setActiveTab = (tab) => setSearchParams({ tab });

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [detailRes, membersRes] = await Promise.all([
          classApi.getClassDetail(classId),
          classApi.getMembers(classId).catch(() => ({ data: { result: { teachers: [] } } }))
        ]);
        
        const data = detailRes.data.result;
        setClassData(data);
        
        const teachers = membersRes.data?.result?.teachers || [];
        const isOwner = String(data?.ownerId) === String(user?.id);
        const isTeacherMember = teachers.some(t => String(t.userId) === String(user?.id));
        
        setIsTeacher(isOwner || isTeacherMember);
      } catch {
        toast.error('Không thể tải thông tin lớp học!');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetch();
  }, [classId, user?.id]);
  const bannerColor = BANNER_COLORS[(classId?.charCodeAt(0) || 0) % BANNER_COLORS.length];

  const handleLeaveClass = async () => {
    if (!confirm('Bạn có chắc muốn rời khỏi lớp học này không?')) return;
    try {
      await classApi.leaveClass(classId);
      toast.success('Đã rời khỏi lớp học!');
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể rời lớp!');
    }
  };

  if (loading) {
    return (
      <div>
        {/* Banner skeleton */}
        <div className="h-48 bg-gray-200 animate-pulse rounded-xl mb-4" />
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <div key={t.key} className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Class Banner */}
      <div className={`relative bg-gradient-to-r ${bannerColor} rounded-2xl overflow-hidden mb-6`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-16 w-32 h-32 border-4 border-white rounded-full" />
          <div className="absolute -bottom-8 right-8 w-48 h-48 border-4 border-white rounded-full" />
          <div className="absolute top-8 right-40 w-16 h-16 border-4 border-white rounded-full" />
        </div>

        <div className="relative z-10 px-8 py-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{classData?.name}</h1>
            {classData?.section && (
              <p className="text-white/80 text-base">{classData.section}</p>
            )}
            {classData?.subject && (
              <p className="text-white/70 text-sm mt-1">{classData.subject}</p>
            )}
          </div>
          {!isTeacher && (
            <button
              onClick={handleLeaveClass}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Rời lớp
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'stream' && (
        <StreamTab classId={classId} classData={classData} />
      )}
      {activeTab === 'classwork' && (
        <ClassworkTab classId={classId} classData={classData} isTeacher={isTeacher} />
      )}
      {activeTab === 'members' && (
        <MembersTab classId={classId} classData={classData} />
      )}
    </div>
  );
}
