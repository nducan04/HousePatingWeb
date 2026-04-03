'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import api from '@/lib/utils/axiosAuth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { loginState } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', {
        TenDangNhap: username,
        MatKhau: password,
      });

      if (response.data.success) {
        loginState(response.data.user, response.data.accessToken);
        
        const role = response.data.user.role;
        if (role === 'Admin' || role === 'NhanVien') {
          router.push('/dashboard'); // Hoán chuyển các URL đúng sau
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Kết nối thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-100 font-sans" style={{ background: '#0B0F19' }}>
      
      {/* Left side: Animated branding background (Hide on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Animated gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse" style={{ animationDuration: '10s' }}></div>
        
        <div className="relative z-10 max-w-lg">
          <Link href="/" className="inline-flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
              V
            </div>
            <span className="text-2xl font-bold tracking-tight">VTSC PaintPro</span>
          </Link>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Khóa Không Gian Sinh Thái <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Công Nghiệp Số
            </span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed font-light">
            Nền tảng quản lý dự án B2B, Hợp đồng Blockchain & Theo dõi pha chế chuẩn AkzoNobel. Truy cập để kiểm soát rủi ro và tăng tốc kinh doanh.
          </p>
        </div>
        
        {/* Subtle geometric patterns overlays */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Right side: Modern Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12" style={{ background: '#0F1523', borderLeft: '1px solid rgba(255,255,255,0.05)', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
             <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
              V
            </div>
            <span className="text-xl font-bold tracking-tight">VTSC PaintPro</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Chào mừng trở lại</h2>
            <p className="text-slate-400">Vui lòng đăng nhập vào tài khoản của bạn</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-2 transition-colors group-focus-within:text-blue-400">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-slate-800 transition-all hover:bg-slate-800/80 shadow-sm"
                    placeholder="Nhập tên đăng nhập"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-2 transition-colors group-focus-within:text-blue-400">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-700/50 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-slate-800 transition-all hover:bg-slate-800/80 shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <label className="flex items-center text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                <input type="checkbox" className="mr-2.5 w-4 h-4 rounded border-slate-600 bg-slate-800 focus:ring-blue-500 checked:bg-blue-500" />
                Ghi nhớ thiết bị
              </label>
              <a href="#" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center py-4 px-4 border border-transparent text-[15px] font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0F1523] focus:ring-blue-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-blue-500/40 transform active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Truy cập hệ thống</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-800 text-center">
             <p className="text-sm text-slate-500">
               Chưa có tài khoản Doanh nghiệp? <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">Liên hệ VTSC</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
