'use client';

import React, { useState } from 'react';
import { Upload, FileUp, Save, Database, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

type ImportType = 'products' | 'materials' | 'customers' | 'staff';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>('products');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleSync = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection', importType);

    try {
      const res = await api.post('/files/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResult({
          success: true,
          ...res.data.data
        });
        setFile(null);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Có lỗi xảy ra trong quá trình đồng bộ.';
      setResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Công cụ Đồng bộ Dữ liệu Toàn Hệ Thống</h2>
        <p style={{ color: '#475569', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> Hệ thống chấp nhận file định dạng .xlsx, .xls, .csv với dung lượng tối đa 50MB. <br />
          Tải hệ quy chiếu mẫu ở dưới đây để tránh xung đột Data Source.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.75rem' }}>

        {/* Dropzone */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Tải lên File Excel</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={importType}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 12px', fontSize: 13 }}
              >
                <option value="products">Dữ liệu Sản phẩm</option>
                <option value="materials">Kho Vật tư / NVL</option>
                <option value="customers">Đối tác B2B (Khách hàng)</option>
                <option value="staff">Danh sách Nhân viên</option>
              </select>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
            style={{
              border: '2px dashed #e2e8f0',
              borderRadius: '16px',
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <input
              type="file"
              id="fileInput"
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <FileUp size={32} color="#2563eb" />
            </div>

            {file ? (
              <div>
                <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8, fontSize: '1.375rem' }}>{file.name}</p>
                <p style={{ color: '#059669' }}>File hợp lệ • {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 8, fontSize: '1.375rem' }}>Kéo thả file vào đây hoặc nhấn để chọn thẻ tải lên</p>
                <p style={{ color: '#94a3b8' }}>Hỗ trợ: CSV, XLSX. Kích thước tối đa: 50MB</p>
              </div>
            )}
          </div>

          {result && (
            <div className={`bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden ${result.success ? 'border-emerald' : 'border-rose'}`} style={{ padding: 16, background: result.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {result.success ? <CheckCircle size={18} color="#059669" /> : <XCircle size={18} color="#e11d48" />}
                <span style={{ fontWeight: 700, fontSize: 14 }}>{result.success ? 'ĐỒNG BỘ THÀNH CÔNG' : 'CÓ LỖI XẢY RA'}</span>
              </div>
              {result.success ? (
                <div style={{ fontSize: 13, color: '#475569' }}>
                  <p>• Tổng số dòng xử lý: {result.totalProcessed}</p>
                  <p>• Đã cập nhật/thêm mới: <span style={{ color: '#059669', fontWeight: 700 }}>{result.insertedCount}</span></p>
                  <p>• Số dòng lỗi: <span style={{ color: '#e11d48', fontWeight: 700 }}>{result.errorCount}</span></p>
                  {result.errors && result.errors.length > 0 && (
                    <div style={{ marginTop: 8, color: '#e11d48', fontSize: 11, fontStyle: 'italic' }}>
                      Chi tiết lỗi (10 dòng đầu): {result.errors.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#475569' }}>{result.message}</p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={handleSync}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline ${file ? 'btn-primary' : 'btn-ghost'}`}
              disabled={!file || loading}
              style={(!file || loading) ? { opacity: 0.5 } : {}}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {loading ? ' Đang xử lý...' : ' Tiến Hành Đồng Bộ'}
            </button>
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.125rem' }}>Tải File Mẫu (Templates)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

            <div className="kpi-card" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: '#ffffff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Danh sách Sản phẩm</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>san-pham-template.xlsx</div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ padding: '4px 8px' }}>Tải</button>
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: '#ffffff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Kho Vật Tư</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>kho-template.xlsx</div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ padding: '4px 8px' }}>Tải</button>
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: '#ffffff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Dữ liệu Đối tác B2B</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>doitac-template.xlsx</div>
                </div>
                <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ padding: '4px 8px' }}>Tải</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
