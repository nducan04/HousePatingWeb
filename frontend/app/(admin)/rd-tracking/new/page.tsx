'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Plus, Droplets } from 'lucide-react';
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Link href="/rd-tracking" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <ArrowLeft size={16} /> Quay lại
      </Link>

      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 'var(--radius-md)', 
            background: 'var(--accent-purple-soft)', color: 'var(--accent-purple)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Droplets size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>Tạo Yêu cầu R&D Mới</h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>Yêu cầu sẽ được tạo với Version 1.0</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <div className="form-group">
              <label className="form-label">Khách hàng *</label>
              <select className="form-select" required value={formData.customer} onChange={e => setFormData(p => ({ ...p, customer: e.target.value }))}>
                <option value="">Chọn khách hàng</option>
                <option value="NCC Aluminium">NCC Aluminium</option>
                <option value="VPIC Steel">VPIC Steel</option>
                <option value="Daikin Vietnam">Daikin Vietnam</option>
                <option value="Huihoang Interior">Huihoang Interior</option>
                <option value="Eurowindow">Eurowindow</option>
                <option value="Austdoor Group">Austdoor Group</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mã Màu Mục tiêu *</label>
              <input className="form-input" type="text" placeholder="VD: INT-D2525" required
                value={formData.colorCode} onChange={e => setFormData(p => ({ ...p, colorCode: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Tên Màu</label>
              <input className="form-input" type="text" placeholder="VD: Silver Metallic"
                value={formData.colorName} onChange={e => setFormData(p => ({ ...p, colorName: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Loại Bề mặt *</label>
              <select className="form-select" required value={formData.surface} onChange={e => setFormData(p => ({ ...p, surface: e.target.value }))}>
                <option value="">Chọn bề mặt</option>
                <option value="Nhôm định hình">Nhôm định hình</option>
                <option value="Nhôm đúc">Nhôm đúc</option>
                <option value="Nhôm thanh">Nhôm thanh</option>
                <option value="Thép tấm">Thép tấm</option>
                <option value="Thép ống">Thép ống</option>
                <option value="Thép cuộn">Thép cuộn</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lớp nền (Substrate)</label>
              <input className="form-input" type="text" placeholder="VD: Primer + Topcoat"
                value={formData.substrate} onChange={e => setFormData(p => ({ ...p, substrate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--spacing-lg)' }}>
            <label className="form-label">Yêu cầu Chi tiết</label>
            <textarea className="form-textarea" rows={4} placeholder="Mô tả yêu cầu kỹ thuật, độ bóng, ΔE cho phép, ứng dụng..."
              value={formData.requirements} onChange={e => setFormData(p => ({ ...p, requirements: e.target.value }))} />
          </div>

          {/* File Upload */}
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <label className="form-label" style={{ marginBottom: 'var(--spacing-sm)', display: 'block' }}>Ảnh/Tài liệu Đính kèm</label>
            <div 
              className={`upload-zone ${dragOver ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={32} className="upload-icon" style={{ margin: '0 auto var(--spacing-sm)' }} />
              <p className="upload-text">
                Kéo thả file vào đây hoặc <strong>click để chọn</strong>
              </p>
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                PNG, JPG, PDF — Tối đa 10MB
              </p>
              <input id="file-input" type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} 
                onChange={e => {
                  const names = Array.from(e.target.files || []).map(f => f.name);
                  setFiles(prev => [...prev, ...names]);
                }}
              />
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {files.map((f, i) => (
                  <span key={i} className="badge signed" style={{ cursor: 'pointer' }} onClick={() => setFiles(fls => fls.filter((_, j) => j !== i))}>
                    📎 {f} ✕
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
            <Link href="/rd-tracking" className="btn btn-secondary">Hủy</Link>
            <button type="submit" className="btn btn-primary btn-lg">
              <Plus size={18} /> Tạo Yêu cầu (v1.0)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
