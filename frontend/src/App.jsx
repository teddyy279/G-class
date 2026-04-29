import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ClassDetailPage from './pages/ClassDetailPage';
import ClassworkDetailPage from './pages/ClassworkDetailPage';
import CreateClassworkPage from './pages/CreateClassworkPage';
import PostDetailPage from './pages/PostDetailPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import SettingsPage from './pages/SettingsPage';
import { CalendarPage, TodoPage, ArchivedPage } from './pages/PlaceholderPages';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        {/* Protected routes - bọc trong MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/classes/:classId" element={<ClassDetailPage />} />
            <Route path="/classes/:classId/posts/:postId" element={<PostDetailPage />} />
            <Route path="/classes/:classId/classworks/create" element={<CreateClassworkPage />} />
            <Route path="/classes/:classId/classworks/:classworkId" element={<ClassworkDetailPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/to-do" element={<TodoPage />} />
            <Route path="/archived" element={<ArchivedPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

