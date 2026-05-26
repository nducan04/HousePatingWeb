'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Megaphone, FileText, Send, Users, FileCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '@/lib/utils/axiosAuth';

const API_PATH = '/tin-tuc';
import { resolveImageUrl, BACKEND_URL } from '@/lib/utils/imageUrl';

interface TinTuc {
  _id?: string;
  MaTinTuc: string;
  TieuDe: string;
  Abstract?: string;
  NoiDung: string;
  HinhAnh: string;
  GhiChu: string;
  NhanVienDang?: {
    MaNV: string;
    HoTen: string;
  };
  TrangThai: 'Draft' | 'Published';
  NgayDang?: string;
  createdAt?: string;
}

const getImageUrl = (path: any) => {
  return resolveImageUrl(path);
};

export default function TinTucPage() {
  const [data, setData] = useState<TinTuc[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal STates
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState<TinTuc>({
    MaTinTuc: '', TieuDe: '', Abstract: '', NoiDung: '', HinhAnh: '', GhiChu: '', TrangThai: 'Published'
  });

  const printRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(API_PATH);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setUploading(true);
    try {
      const res = await api.post('/files/upload-image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFormData(prev => ({ ...prev, HinhAnh: res.data.url }));
        alert('Tải ảnh lên thành công!');
      }
    } catch (err) {
      alert('Lỗi khi tải ảnh lên');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const exportToPDF = async (item: TinTuc) => {
    // We will use html2canvas to capture a preview
    // For that, we temp update formData to the selected item and wait for render
    setFormData(item);
    setExporting(true);

    // Wait for the DOM to update
    setTimeout(async () => {
      if (!printRef.current) return;
      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`VTSC_TinTuc_${item.MaTinTuc}.pdf`);
      } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Lỗi khi xuất PDF. Vui lòng thử lại.');
      } finally {
        setExporting(false);
      }
    }, 500);
  };

  const openForm = (item?: TinTuc) => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({ MaTinTuc: `TT${Date.now().toString().slice(-6)}`, TieuDe: '', Abstract: '', NoiDung: '', HinhAnh: '', GhiChu: '', TrangThai: 'Published' });
    }
    setIsModalOpen(true);
  };

  const openDetail = (item: TinTuc) => {
    setFormData(item);
    setIsDetailOpen(true);
  };

  const submitForm = async () => {
    try {
      if (formData._id) {
        await api.put(`${API_PATH}/${formData._id}`, formData);
      } else {
        await api.post(API_PATH, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi thao tác');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Chắc chắn xóa bài viết này?')) return;
    try {
      await api.delete(`${API_PATH}/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const STATS = {
    total: data.length,
    published: data.filter(d => d.TrangThai === 'Published').length,
    drafts: data.filter(d => d.TrangThai !== 'Published').length,
    views: 0,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'published' && item.TrangThai === 'Published') ||
      (filter === 'draft' && item.TrangThai !== 'Published');
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Megaphone size={22} /></div>
          <div className="kpi-label">Tổng Chiến Dịch</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><Send size={22} /></div>
          <div className="kpi-label">Đã Xuất Bản</div>
          <div className="kpi-value">{STATS.published}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><FileText size={22} /></div>
          <div className="kpi-label">Nháp / Lên lịch</div>
          <div className="kpi-value">{STATS.drafts}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-label">Tổng Lượt Tiếp Cận</div>
          <div className="kpi-value">{STATS.views.toLocaleString()}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Tìm tiêu đề chiến dịch..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'published', label: 'Đã xuất bản' },
                { id: 'draft', label: 'Bản nháp' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => openForm()} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <Plus size={16} /> Soạn Bài Mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead className="justify-center text-center">
            <tr>
              <th>Mã BV</th>
              <th>Hình Ảnh</th>
              <th>Tiêu đề quảng bá</th>
              <th>Teaser</th>
              <th>Biên tập viên</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaTinTuc}</td>
                <td>
                  {item.HinhAnh ? (
                    <img src={getImageUrl(item.HinhAnh)} alt={item.TieuDe} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 60, height: 40, background: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#aaa" /></div>
                  )}
                </td>
                <td
                  onClick={() => openDetail(item)}
                  style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {item.TieuDe}
                </td>
                <td style={{ color: '#475569', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.Abstract || item.GhiChu || 'N/A'}
                </td>
                <td style={{ fontWeight: 600, color: '#94a3b8' }}>{item.NhanVienDang?.HoTen || 'ADMIN'}</td>
                <td>
                  <span className={`badge ${item.TrangThai === 'Published' ? 'approved' : 'pending'}`}>
                    {item.TrangThai}
                  </span>
                </td>
                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => exportToPDF(item)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" title="Xuất PDF"><FileCheck size={16} color="#059669" /></button>
                  <button onClick={() => openForm(item)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id!)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Trash2 size={16} color="#e11d48" /></button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Không có chiến dịch truyền thông nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Soạn Bài Tức Thời */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '12px', padding: '30px', margin: '2rem auto', color: '#000', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 15, marginBottom: 20 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Soạn / Sửa Chiến Dịch Bài Viết</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Mã Bài Viết (*)</label>
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="VD: NEWS001" value={formData.MaTinTuc} onChange={e => setFormData({ ...formData, MaTinTuc: e.target.value })} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Tiêu Đề Bài Viết (*)</label>
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="VD: Khai trương dòng sơn Mới..." value={formData.TieuDe} onChange={e => setFormData({ ...formData, TieuDe: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Ảnh Bìa Bài Viết / Banner</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="text" style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="URL Ảnh hoặc tải lên file..." value={formData.HinhAnh} onChange={e => setFormData({ ...formData, HinhAnh: e.target.value })} />
                  <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #ddd' }}>
                    <Plus size={14} /> {uploading ? 'Đang tải...' : 'Tải ảnh'}
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
                {formData.HinhAnh && <img src={getImageUrl(formData.HinhAnh)} alt="Preview" style={{ marginTop: 10, height: 120, width: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }} />}
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Nội dung quảng cáo (Short Teaser)</label>
                <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Mô tả ngắn gọn thu hút người đọc" value={formData.Abstract || ''} onChange={e => setFormData({ ...formData, Abstract: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Ghi Chú Nội Bộ</label>
                <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Ghi chú thêm cho biên tập viên" value={formData.GhiChu} onChange={e => setFormData({ ...formData, GhiChu: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Nội Dung Chi Tiết (*)</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: 250, fontFamily: 'monospace' }} placeholder="Nội dung truyền thông chi tiết..." value={formData.NoiDung} onChange={e => setFormData({ ...formData, NoiDung: e.target.value })}></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Trạng Thái Hiển Thị</label>
                <select style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} value={formData.TrangThai} onChange={e => setFormData({ ...formData, TrangThai: e.target.value as any })}>
                  <option value="Published">Xuất Bản</option>
                  <option value="Draft">Bản Nháp (Lưu tạm)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: 10 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#eee', color: '#333', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>Hủy Bỏ</button>
              <button onClick={submitForm} style={{ flex: 1, background: '#28a745', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                Lưu Bài
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hidden Printable Area for PDF Export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          ref={printRef}
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            background: '#fff',
            color: '#000',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10mm', marginBottom: '10mm' }}>
            <h1 style={{ fontSize: '28px', margin: '0 0 5px 0', color: '#1a1a1a' }}>VTSC PAINTPRO</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>HỆ THỐNG QUẢN TRỊ TIN TỨC & TRUYỀN THÔNG</p>
          </div>

          {/* Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10mm', fontSize: '12px' }}>
            <div>
              <strong>Mã bài viết:</strong> {formData.MaTinTuc}<br />
              <strong>Người đăng:</strong> {formData.NhanVienDang?.HoTen || 'Admin'}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Ngày lập:</strong> {new Date().toLocaleDateString('vi-VN')}<br />
              <strong>Trạng thái:</strong> {formData.TrangThai}
            </div>
          </div>

          {/* Banner Image */}
          {formData.HinhAnh && (
            <div style={{ marginBottom: '10mm' }}>
              <img
                src={getImageUrl(formData.HinhAnh)}
                alt="Banner"
                style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
          )}

          {/* Article Title */}
          <h2 style={{ fontSize: '24px', marginBottom: '5mm', color: '#000', borderLeft: '5px solid #000', paddingLeft: '15px' }}>
            {formData.TieuDe}
          </h2>

          {/* Teaser */}
          {formData.Abstract && (
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '10mm', borderLeft: '3px solid #666', fontStyle: 'italic' }}>
              <strong>Tóm tắt quảng cáo:</strong> {formData.Abstract}
            </div>
          )}

          {/* Main Content */}
          <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
            {formData.NoiDung || 'Không có nội dung chi tiết.'}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '30mm', borderTop: '1px solid #eee', paddingTop: '10mm', textAlign: 'center', color: '#999', fontSize: '11px' }}>
            <p>© 2024 VTSC PaintPro. Tất cả các quyền được bảo lưu.</p>
            <p>Tài liệu này được trích xuất từ hệ thống quản trị nội bộ.</p>
          </div>
        </div>
      </div>

      {/* Modern Detail View (READ ONLY) */}
      {isDetailOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '900px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }}>
            {/* Close Button UI */}
            <button
              onClick={() => setIsDetailOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}
            >
              <div style={{ fontSize: 24, color: '#333' }}>×</div>
            </button>

            {/* Content Container */}
            <div style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Hero Banner */}
              {formData.HinhAnh && (
                <div style={{ width: '100%', height: '400px' }}>
                  <img src={getImageUrl(formData.HinhAnh)} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '40px 60px' }}>
                {/* Abstract / Teaser */}
                {formData.Abstract && (
                  <div style={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', marginBottom: '10px' }}>
                    {formData.Abstract}
                  </div>
                )}

                {/* Header Title */}
                <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#111', lineHeight: '1.2', marginBottom: '20px' }}>
                  {formData.TieuDe}
                </h1>

                <div style={{ width: '60px', height: '4px', background: '#000', marginBottom: '30px' }}></div>

                {/* Detailed Content */}
                <div style={{ fontSize: '18px', lineHeight: '1.8', color: '#444', textAlign: 'justify', whiteSpace: 'pre-wrap' }}>
                  {formData.NoiDung}
                </div>

                {/* Signature */}
                <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#999', fontSize: '14px' }}>VTSC PaintPro Editorial Board</div>
                  <button onClick={() => setIsDetailOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Xong, đã đọc tài liệu</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
