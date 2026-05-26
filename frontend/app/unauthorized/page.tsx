'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-10 text-center border border-slate-100 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-inner">
          <ShieldAlert size={40} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">
          Truy cập bị từ chối
        </h1>
        
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          Tài khoản của bạn không có đủ quyền hạn để truy cập vào trang này. 
          Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một lỗi.
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 no-underline"
          >
            <Home size={18} /> Quay lại trang chủ
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-4 rounded-2xl font-bold text-sm transition-all no-underline cursor-pointer"
          >
            <ArrowLeft size={18} /> Quay lại trang trước
          </button>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-50">
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em]">
            VTSC PaintPro — Security System
          </p>
        </div>
      </div>
    </div>
  );
}
