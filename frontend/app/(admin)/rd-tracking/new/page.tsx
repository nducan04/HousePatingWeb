'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Plus, Droplets, X } from 'lucide-react';
import Link from 'next/link';

export default function NewRDRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customer: '',
    colorCode: '',
    colorName: '',
    surface: '',
    substrate: '',
    requirements: '',
  });
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('✅ Yêu cầu R&D đã được tạo thành công! (Version 1.0)');
    router.push('/rd-tracking');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const names = Array.from(e.dataTransfer.files).map(f => f.name);
    setFiles(prev => [...prev, ...names]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      <Link
        href="/rd-tracking"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Quay lại
      </Link>

      <div className="bg-white border border-slate-100 rounded-[24px] shadow-xl shadow-slate-100/50 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
            <Droplets size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Tạo Yêu cầu R&D Mới</h2>
            <p className="text-sm font-medium text-slate-400 mt-0.5">Yêu cầu sẽ được tạo với Version 1.0</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Grid Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Khách hàng *</label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-600/10 outline-none transition-all"
                required
                value={formData.customer}
                onChange={e => setFormData(p => ({ ...p, customer: e.target.value }))}
              >
                <option value="">Chọn khách hàng</option>
                <option value="NCC Aluminium">NCC Aluminium</option>
                <option value="VPIC Steel">VPIC Steel</option>
                <option value="Daikin Vietnam">Daikin Vietnam</option>
                <option value="Huihoang Interior">Huihoang Interior</option>
                <option value="Eurowindow">Eurowindow</option>
                <option value="Austdoor Group">Austdoor Group</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mã Màu Mục tiêu *</label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-600/10 transition-all"
                type="text"
                placeholder="VD: INT-D2525"
                required
                value={formData.colorCode}
                onChange={e => setFormData(p => ({ ...p, colorCode: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tên Màu</label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-600/10 transition-all"
                type="text"
                placeholder="VD: Silver Metallic"
                value={formData.colorName}
                onChange={e => setFormData(p => ({ ...p, colorName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Loại Bề mặt *</label>
              <select
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-purple-600/10 outline-none transition-all"
                required
                value={formData.surface}
                onChange={e => setFormData(p => ({ ...p, surface: e.target.value }))}
              >
                <option value="">Chọn bề mặt</option>
                <option value="Nhôm định hình">Nhôm định hình</option>
                <option value="Nhôm đúc">Nhôm đúc</option>
                <option value="Nhôm thanh">Nhôm thanh</option>
                <option value="Thép tấm">Thép tấm</option>
                <option value="Thép ống">Thép ống</option>
                <option value="Thép cuộn">Thép cuộn</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Lớp nền (Substrate)</label>
              <input
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-600/10 transition-all"
                type="text"
                placeholder="VD: Primer + Topcoat"
                value={formData.substrate}
                onChange={e => setFormData(p => ({ ...p, substrate: e.target.value }))}
              />
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Yêu cầu Chi tiết</label>
            <textarea
              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-600/10 transition-all"
              rows={4}
              placeholder="Mô tả yêu cầu kỹ thuật, độ bóng, ΔE cho phép, ứng dụng..."
              value={formData.requirements}
              onChange={e => setFormData(p => ({ ...p, requirements: e.target.value }))}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Ảnh/Tài liệu Đính kèm</label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                ? 'border-purple-600 bg-purple-50'
                : 'border-slate-200 hover:border-purple-600 bg-slate-50/50'
                }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={32} className={`mx-auto mb-3 transition-colors ${dragOver ? 'text-purple-600' : 'text-slate-400'}`} />
              <p className="text-sm font-bold text-slate-600">
                Kéo thả file vào đây hoặc <span className="text-purple-600">click để chọn</span>
              </p>
              <p className="text-[12px] font-medium text-slate-400 mt-1">
                PNG, JPG, PDF — Tối đa 10MB
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => {
                  const names = Array.from(e.target.files || []).map(f => f.name);
                  setFiles(prev => [...prev, ...names]);
                }}
              />
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-[12px] font-bold cursor-pointer hover:bg-purple-100 transition-colors"
                    onClick={() => setFiles(fls => fls.filter((_, j) => j !== i))}
                  >
                    📎 {f} <X size={14} className="ml-1" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
            <Link
              href="/rd-tracking"
              className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus size={18} /> Tạo Yêu cầu (v1.0)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
