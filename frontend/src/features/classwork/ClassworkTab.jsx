import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import classworkApi from '../../services/classworkApi';
import { TYPE_CONFIG } from './components/ClassworkIcons';
import { ClassworkItem, TopicSection } from './components/TopicSection';
import CreateMenu from './components/CreateMenu';


// ─── Main Export ──────────────────────────────────────────────────────────────
export default function ClassworkTab({ classId, classData, isTeacher }) {
  const navigate = useNavigate();
  const [classworks, setClassworks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showTopicInput, setShowTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cwRes, topicRes] = await Promise.all([
        classworkApi.getClassworks(classId),
        classworkApi.getTopics(classId),
      ]);
      setClassworks(cwRes.data.result || []);
      setTopics(topicRes.data.result || []);
    } catch { toast.error('Không thể tải bài tập!'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [classId]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setCreatingTopic(true);
    try {
      await classworkApi.createTopic(classId, { name: newTopicName.trim() });
      toast.success('Đã tạo chủ đề!');
      setNewTopicName(''); setShowTopicInput(false);
      fetchData();
    } catch { toast.error('Tạo chủ đề thất bại!'); }
    finally { setCreatingTopic(false); }
  };

  const openCreate = (type) => navigate(`/classes/${classId}/classworks/create?type=${type}`);
  const handleItemClick = (item) => navigate(`/classes/${classId}/classworks/${item.id}`);

  const handleDeleteTopic = async (topicId) => {
    if (!confirm('Xóa chủ đề này? Các bài tập trong chủ đề sẽ không bị xóa.')) return;
    try {
      await classworkApi.deleteTopic(classId, topicId);
      toast.success('Đã xóa chủ đề!');
      fetchData();
    } catch { toast.error('Xóa chủ đề thất bại!'); }
  };

  const handleRenameTopic = async (topicId, newName) => {
    try {
      await classworkApi.updateTopic(classId, { id: topicId, name: newName });
      toast.success('Đã đổi tên chủ đề!');
      fetchData();
    } catch { toast.error('Đổi tên thất bại!'); }
  };

  // Group
  const noTopic = classworks.filter(cw => !cw.topicId || !topics.find(t => t.id === cw.topicId));
  const grouped = topics.map(topic => ({
    topic,
    items: classworks.filter(cw => cw.topicId === topic.id),
  }));

  return (
    <div className="max-w-3xl mx-auto" style={{ fontFamily: "'Google Sans',Roboto,sans-serif" }}>

      {/* Teacher toolbar */}
      {isTeacher && (
        <div className="mb-6 space-y-4">
          <CreateMenu 
            openCreate={openCreate} 
            onOpenTopicInput={() => { setShowTopicInput(true); setCreateMenuOpen(false); }} 
          />

          {/* Inline topic creation */}
          {showTopicInput && (
            <form onSubmit={handleCreateTopic} className="flex items-center gap-2 mt-2 w-1/2">
              <input autoFocus value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
                placeholder="Tên chủ đề..."
                className="flex-1 border border-[#0b57d0] rounded-lg px-4 py-2 text-[14px] focus:outline-none"
              />
              <button type="submit" disabled={creatingTopic || !newTopicName.trim()}
                className="px-4 py-2 bg-[#0b57d0] text-white text-[14px] font-medium rounded-lg disabled:opacity-60 hover:bg-[#084298] transition">
                {creatingTopic ? '...' : 'Thêm'}
              </button>
              <button type="button" onClick={() => setShowTopicInput(false)}
                className="px-3 py-2 text-[14px] text-[#5f6368] hover:bg-gray-100 rounded-lg transition">
                Hủy
              </button>
            </form>
          )}
        </div>
      )}

      {/* Filter and Collapse All Row */}
      <div className="flex items-end justify-between mb-4">
        {/* Filter */}
        <div className="relative w-64">
          <label className="absolute -top-2 left-2 bg-white px-1 text-[12px] text-[#5f6368] z-10">
            Bộ lọc theo chủ đề
          </label>
          <select className="w-full border border-[#747775] rounded p-3 text-[14px] text-[#1f1f1f] bg-transparent focus:outline-none focus:border-[#0b57d0] focus:border-2 appearance-none cursor-pointer">
            <option value="ALL">Tất cả chủ đề</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#5f6368]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z"/></svg>
          </div>
        </div>

        {/* Collapse all */}
        <button className="flex items-center gap-2 text-[14px] font-medium text-[#0b57d0] hover:bg-[#e8f0fe] px-3 py-2 rounded transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
          Thu gọn tất cả
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-[#e0e0e0] p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/2"/>
                  <div className="h-3 bg-gray-200 rounded w-1/4"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : classworks.length === 0 && topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-[#1a73e8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <p className="text-[16px] text-[#3c4043] font-medium">Chưa có bài tập nào</p>
          {isTeacher && <p className="text-[14px] text-[#5f6368] mt-1">Nhấn "Tạo" để thêm bài tập hoặc tài liệu cho lớp</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {/* No-topic items */}
          {noTopic.length > 0 && (
            <TopicSection
              topic={{ id: 'no-topic', name: 'Không có chủ đề' }}
              items={noTopic}
              classId={classId}
              onItemClick={handleItemClick}
              isTeacher={isTeacher}
            />
          )}
          {/* Topic sections */}
          {grouped.map(({ topic, items }) => (
            <TopicSection
              key={topic.id}
              topic={topic}
              items={items}
              classId={classId}
              onItemClick={handleItemClick}
              isTeacher={isTeacher}
              onDeleteTopic={handleDeleteTopic}
              onRenameTopic={handleRenameTopic}
            />
          ))}
        </div>
      )}

    </div>
  );
}
