import { Outlet } from 'react-router-dom';

function PlaceholderPage({ title, description, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">{emoji}</div>
      <h1 className="text-[24px] font-medium text-[#3c4043] mb-3">{title}</h1>
      <p className="text-[15px] text-[#5f6368] max-w-md">{description}</p>
    </div>
  );
}

export function CalendarPage() {
  return (
    <PlaceholderPage
      emoji="📅"
      title="Lịch"
      description="Xem lịch học, hạn nộp bài tập và các sự kiện trong lớp học của bạn."
    />
  );
}

export function TodoPage() {
  return (
    <PlaceholderPage
      emoji="✅"
      title="Việc cần làm"
      description="Quản lý và theo dõi các bài tập, bài kiểm tra cần hoàn thành."
    />
  );
}

export function ArchivedPage() {
  return (
    <PlaceholderPage
      emoji="🗄️"
      title="Lớp học đã lưu trữ"
      description="Các lớp học đã kết thúc hoặc được lưu trữ sẽ hiển thị ở đây."
    />
  );
}

export function SettingsPage() {
  return (
    <PlaceholderPage
      emoji="⚙️"
      title="Cài đặt"
      description="Tùy chỉnh thông báo, giao diện và các tùy chọn khác."
    />
  );
}
