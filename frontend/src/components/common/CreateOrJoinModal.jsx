import { useState } from 'react';
import { toast } from 'react-hot-toast';
import classApi from '../../services/classApi';
import useAuthStore from '../../store/useAuthStore';

export default function CreateOrJoinModal({ type, onClose, onFinish }) {
  const [form, setForm] = useState({ name: '', section: '', subject: '', room: '', code: '' });
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'create') {
        await classApi.createClass(form);
        toast.success('Tạo lớp thành công!');
      } else {
        await classApi.joinClass({ classCode: form.code });
        toast.success('Tham gia lớp thành công!');
      }
      if (onFinish) onFinish();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex justify-between items-center text-[#202124]">
          <h2 className="text-xl font-normal">
            {type === 'create' ? 'Tạo lớp học' : 'Tham gia lớp học'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f1f3f4] rounded-full text-[#5f6368] -mr-2 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          {type === 'create' ? (
            <div className="space-y-6">
              <div className="relative">
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block px-4 pb-2 pt-6 w-full text-base text-[#202124] bg-[#f1f3f4] rounded-t-md border-b-2 border-[#5f6368] appearance-none focus:outline-none focus:border-[#1a73e8] peer"
                  placeholder=" "
                  required
                />
                <label htmlFor="name" className="absolute text-[13px] text-[#5f6368] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a73e8]">Tên lớp học (bắt buộc)</label>
              </div>

              <div className="relative">
                <input
                  id="section"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="block px-4 pb-2 pt-6 w-full text-base text-[#202124] bg-[#f1f3f4] rounded-t-md border-b-2 border-[#5f6368] appearance-none focus:outline-none focus:border-[#1a73e8] peer"
                  placeholder=" "
                />
                <label htmlFor="section" className="absolute text-[13px] text-[#5f6368] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a73e8]">Phần</label>
              </div>

              <div className="relative">
                <input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="block px-4 pb-2 pt-6 w-full text-base text-[#202124] bg-[#f1f3f4] rounded-t-md border-b-2 border-[#5f6368] appearance-none focus:outline-none focus:border-[#1a73e8] peer"
                  placeholder=" "
                />
                <label htmlFor="subject" className="absolute text-[13px] text-[#5f6368] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a73e8]">Chủ đề</label>
              </div>

              <div className="relative">
                <input
                  id="room"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="block px-4 pb-2 pt-6 w-full text-base text-[#202124] bg-[#f1f3f4] rounded-t-md border-b-2 border-[#5f6368] appearance-none focus:outline-none focus:border-[#1a73e8] peer"
                  placeholder=" "
                />
                <label htmlFor="room" className="absolute text-[13px] text-[#5f6368] duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1a73e8]">Phòng</label>
              </div>
            </div>
          ) : (
            <div className="border border-[#e0e0e0] rounded-lg p-6">
              <div>
                <h3 className="text-base font-medium text-[#202124] mb-2">Mã lớp</h3>
                <input
                  placeholder="Mã lớp"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border border-[#dadce0] rounded-md px-4 py-3 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] focus:outline-none text-base transition"
                  required
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-8 pb-2 px-2 bg-white">
            <button type="button" onClick={onClose} className="px-6 py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4] rounded transition">Hủy</button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#1a73e8] text-white text-[14px] font-medium rounded hover:bg-[#1557b0] disabled:bg-[#e8eaed] disabled:text-[#9aa0a6] transition"
            >
              {loading ? 'Đang xử lý...' : (type === 'create' ? 'Tạo' : 'Tham gia')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
