'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Loader2, ArrowRight, FlaskConical, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
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
        const systemRoles = ['Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C', 'NhaCungCap'];

        if (systemRoles.includes(role)) {
          router.push('/dashboard');
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
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md animate-in fade-in zoom-in slide-in-from-bottom-10 duration-700">
          <div className="glass-morphism rounded-3xl p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden backdrop-blur-3xl">
            {/* Subtle glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-800/20 rounded-full blur-[60px]"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-black mb-1">Đăng nhập</h2>
                  <p className="text-black text-sm">Chào mừng trở lại với VTSC</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-white/20 tracking-tighter italic">VTSC</span>
                  <span className="text-[8px] font-bold text-blue-500 tracking-[0.2em] uppercase -mt-1">PaintPro</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-400 shrink-0" size={18} />
                    <span className="text-xs font-medium text-red-300">{error}</span>
                  </div>
                )}

                <div className="space-y-1.5 transition-transform">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tài khoản</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white placeholder:text-slate-600 transition-all text-base"
                      placeholder="Email hoặc số điện thoại"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 transition-transform">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none text-white placeholder:text-slate-600 transition-all text-base"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <a href="#" className="text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium">Quên mật khẩu?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Đăng nhập <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="pt-6 flex flex-col items-center gap-4">
                  <div className="w-full flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10"></div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hoặc</span>
                    <div className="h-px flex-1 bg-white/10"></div>
                  </div>

                  <button
                    type="button"
                    className="text-sm text-slate-300 hover:text-white transition-colors font-semibold"
                    onClick={() => alert('Vui lòng liên hệ quản trị viên để tạo tài khoản mới.')}
                  >
                    Yêu cầu cấp tài khoản mới
                  </button>
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
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 w-full text-center z-20">
        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
          VTSC PaintPro © 2024 — Industrial Intelligence Solution
        </p>
      </footer>
    </div>
  );
}
