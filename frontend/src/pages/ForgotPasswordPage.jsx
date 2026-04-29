import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authApi from '../services/authApi';

const STEPS = { EMAIL: 'email', OTP: 'otp', NEW_PASSWORD: 'newPassword' };

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Vui lòng nhập email!'); return; }
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      toast.success('Mã OTP đã được gửi đến email của bạn!');
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otp) { toast.error('Vui lòng nhập mã OTP!'); return; }
    setStep(STEPS.NEW_PASSWORD);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Mật khẩu không khớp!'); return; }
    if (newPassword.length < 6) { toast.error('Mật khẩu phải có ít nhất 6 ký tự!'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP không hợp lệ hoặc đã hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  const stepInfo = {
    [STEPS.EMAIL]: { title: 'Quên mật khẩu?', subtitle: 'Nhập email để nhận mã OTP đặt lại mật khẩu', num: 1 },
    [STEPS.OTP]: { title: 'Nhập mã OTP', subtitle: `Mã OTP đã gửi đến ${email}`, num: 2 },
    [STEPS.NEW_PASSWORD]: { title: 'Mật khẩu mới', subtitle: 'Tạo mật khẩu mới cho tài khoản của bạn', num: 3 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`flex items-center gap-2 ${n < 3 ? 'flex-1' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  n <= stepInfo[step].num ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-500'
                }`}>
                  {n < stepInfo[step].num ? '✓' : n}
                </div>
                {n < 3 && <div className={`flex-1 h-px ${n < stepInfo[step].num ? 'bg-blue-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">{stepInfo[step].title}</h1>
          <p className="text-slate-400 text-center text-sm mb-8">{stepInfo[step].subtitle}</p>

          {/* Step 1: Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl text-sm hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/25">
                {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mã OTP</label>
                <input
                  id="otp-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập 6 chữ số"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl text-sm hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
                Xác nhận OTP
              </button>
              <button type="button" onClick={() => setStep(STEPS.EMAIL)}
                className="w-full text-slate-400 hover:text-slate-200 text-sm transition">
                ← Gửi lại OTP
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === STEPS.NEW_PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu mới</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Xác nhận mật khẩu</label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full bg-white/5 border text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    confirmPassword && newPassword !== confirmPassword ? 'border-red-400/50' : 'border-white/10'
                  }`}
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl text-sm hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-blue-500/25">
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-400 mt-6">
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
