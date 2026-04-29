import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import classApi from '../../services/classApi';
import useAuthStore from '../../store/useAuthStore';

const AVATAR_COLORS = [
  '#1a73e8','#1e8e3e','#e37400','#a142f4','#d93025','#007b83','#185abc',
];
function getAvatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';
}

function MemberAvatar({ name = '', avatarUrl, size = 40 }) {
  const color = getAvatarColor(name);
  const style = { width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' };
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={style} />;
  return (
    <div style={{ ...style, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 500, fontSize: size * 0.38 }}>
      {getInitials(name)}
    </div>
  );
}

function MemberRow({ member, canRemove, onRemove }) {
  const [showMenu, setShowMenu] = useState(false);
  const displayName = member.fullName || member.username || 'Thành viên';
  return (
    <div className="flex items-center gap-4 px-6 py-3 hover:bg-[#f1f3f4] group border-b border-[#e0e0e0] last:border-0 relative transition-colors">
      <MemberAvatar name={displayName} avatarUrl={member.avatar} />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#1f1f1f] truncate">{displayName}</p>
        {member.email && <p className="text-[12px] text-[#5f6368] truncate">{member.email}</p>}
      </div>
      {canRemove && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(o => !o)}
            className="w-9 h-9 rounded-full hover:bg-[#e8eaed] flex items-center justify-center text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-[#e0e0e0] py-1 w-44 z-20">
              <button
                onClick={() => { setShowMenu(false); onRemove(member.id || member.userId); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-[#d93025] hover:bg-[#fce8e6] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.121 7.121L8.05 13.192c-.47.47-.47 1.23 0 1.7.47.47 1.23.47 1.7 0L15.82 8.82l-1.7-1.7zm-9.293.172L11.293 14l-1.415 1.414L3.414 9.05l1.414-1.757zM12 4l3.536 1.464-1.414 1.414L12 6 6.464 8.878 5.05 7.464 12 4z"/>
                </svg>
                Xóa khỏi lớp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, count, onInvite, onCopyLink, inviteCode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
      <div>
        <h3 className="text-[20px] font-normal text-[#1a73e8]" style={{ fontFamily: "'Google Sans',sans-serif" }}>{title}</h3>
        <p className="text-[13px] text-[#5f6368]">{count} thành viên</p>
      </div>
      <div className="flex items-center gap-2">
        {inviteCode && (
          <button
            onClick={onCopyLink}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[14px] text-[#1a73e8] font-medium hover:bg-[#e8f0fe] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
            Sao chép liên kết
          </button>
        )}
        {onInvite && (
          <button
            onClick={onInvite}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[14px] text-white font-medium transition-colors hover:opacity-90"
            style={{ background: '#1a73e8' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            {title === 'Giáo viên' ? 'Mời giáo viên' : 'Mời học sinh'}
          </button>
        )}
      </div>
    </div>
  );
}

function InviteModal({ role, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await onInvite(email.trim(), role);
    setLoading(false);
    setEmail('');
  };
  
  const title = role === 'TEACHER' ? 'Mời giáo viên' : 'Mời học sinh';
  const desc = role === 'TEACHER' ? 'Nhập địa chỉ email của giáo viên cần mời' : 'Nhập địa chỉ email của học sinh cần mời';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ fontFamily: "'Google Sans',sans-serif" }}>
        <h2 className="text-[20px] font-normal text-[#1f1f1f] mb-1">{title}</h2>
        <p className="text-[14px] text-[#5f6368] mb-4">{desc}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Địa chỉ email..."
            className="w-full border border-[#e0e0e0] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 text-[14px] text-[#1a73e8] font-medium rounded-xl hover:bg-[#e8f0fe] transition">
              Hủy
            </button>
            <button type="submit" disabled={loading || !email.trim()}
              className="px-5 py-2.5 text-[14px] font-medium rounded-xl text-white disabled:opacity-60 transition"
              style={{ background: '#1a73e8' }}>
              {loading ? 'Đang mời...' : 'Mời'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MembersTab({ classId, classData }) {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteRole, setInviteRole] = useState(null); // 'TEACHER' or 'STUDENT'

  const isTeacher = String(classData?.ownerId) === String(user?.id);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await classApi.getMembers(classId);
      const data = res.data.result || {};
      setTeachers(data.teachers || []);
      setStudents(data.students || []);
    } catch { toast.error('Không thể tải danh sách thành viên!'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [classId]);

  const handleInvite = async (email, role) => {
    try {
      await classApi.sendInvitation({ classId, email, role });
      toast.success(`Đã gửi lời mời đến ${email}!`);
      setInviteRole(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi lời mời thất bại!');
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi lớp?')) return;
    try {
      await classApi.removeMember(classId, memberId);
      toast.success('Đã xóa thành viên!');
      setStudents(prev => prev.filter(s => (s.id || s.userId) !== memberId));
    } catch { toast.error('Không thể xóa thành viên!'); }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join?code=${classData?.classCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Đã sao chép liên kết mời!');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden animate-pulse">
            <div className="h-16 bg-gray-100" />
            {[1,2,3].map(j => (
              <div key={j} className="flex gap-4 px-6 py-3 border-t border-[#e0e0e0]">
                <div className="w-10 h-10 rounded-full bg-gray-200"/>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3"/>
                  <div className="h-3 bg-gray-200 rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4" style={{ fontFamily: "'Google Sans',Roboto,sans-serif" }}>
      {/* Teachers section */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        <SectionHeader 
          title="Giáo viên" 
          count={teachers.length} 
          onInvite={isTeacher ? () => setInviteRole('TEACHER') : null}
        />
        {teachers.length === 0
          ? <p className="px-6 py-5 text-[14px] text-[#9aa0a6]">Chưa có giáo viên nào</p>
          : teachers.map(m => <MemberRow key={m.id || m.userId} member={m} canRemove={false} />)
        }
      </div>

      {/* Students section */}
      <div className="bg-white rounded-xl border border-[#e0e0e0] overflow-hidden">
        <SectionHeader
          title="Học sinh"
          count={students.length}
          inviteCode={classData?.classCode}
          onCopyLink={isTeacher ? handleCopyLink : null}
          onInvite={isTeacher ? () => setInviteRole('STUDENT') : null}
        />
        {students.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[14px] text-[#9aa0a6]">Chưa có học sinh nào tham gia</p>
            {isTeacher && (
              <button onClick={() => setInviteRole('STUDENT')}
                className="mt-3 text-[14px] text-[#1a73e8] font-medium hover:underline">
                Mời học sinh tham gia
              </button>
            )}
          </div>
        ) : (
          students.map(m => (
            <MemberRow
              key={m.id || m.userId}
              member={m}
              canRemove={isTeacher}
              onRemove={handleRemove}
            />
          ))
        )}
      </div>

      {inviteRole && <InviteModal role={inviteRole} onClose={() => setInviteRole(null)} onInvite={handleInvite} />}
    </div>
  );
}
