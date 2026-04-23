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
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Công cụ Đồng bộ Dữ liệu Toàn Hệ Thống</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> Hệ thống chấp nhận file định dạng .xlsx, .xls, .csv với dung lượng tối đa 50MB. <br />
          Tải hệ quy chiếu mẫu ở dưới đây để tránh xung đột Data Source.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)' }}>

        {/* Dropzone */}
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>Tải lên File Excel</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                className="form-input"
                value={importType}
                onChange={(e) => setImportType(e.target.value as ImportType)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 12px', fontSize: 13 }}
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
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <input
              type="file"
              id="fileInput"
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
            />
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <FileUp size={32} color="var(--accent-cyan)" />
            </div>

            {file ? (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 'var(--font-lg)' }}>{file.name}</p>
                <p style={{ color: 'var(--accent-emerald)' }}>File hợp lệ • {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: 'var(--font-lg)' }}>Kéo thả file vào đây hoặc nhấn để chọn thẻ tải lên</p>
                <p style={{ color: 'var(--text-tertiary)' }}>Hỗ trợ: CSV, XLSX. Kích thước tối đa: 50MB</p>
              </div>
            )}
          </div>

          {result && (
            <div className={`glass-card ${result.success ? 'border-emerald' : 'border-rose'}`} style={{ padding: 16, background: result.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {result.success ? <CheckCircle size={18} color="var(--accent-emerald)" /> : <XCircle size={18} color="var(--accent-rose)" />}
                <span style={{ fontWeight: 700, fontSize: 14 }}>{result.success ? 'ĐỒNG BỘ THÀNH CÔNG' : 'CÓ LỖI XẢY RA'}</span>
              </div>
              {result.success ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <p>• Tổng số dòng xử lý: {result.totalProcessed}</p>
                  <p>• Đã cập nhật/thêm mới: <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{result.insertedCount}</span></p>
                  <p>• Số dòng lỗi: <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{result.errorCount}</span></p>
                  {result.errors && result.errors.length > 0 && (
                    <div style={{ marginTop: 8, color: 'var(--accent-rose)', fontSize: 11, fontStyle: 'italic' }}>
                      Chi tiết lỗi (10 dòng đầu): {result.errors.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.message}</p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={handleSync}
              className={`btn ${file ? 'btn-primary' : 'btn-ghost'}`}
              disabled={!file || loading}
              style={(!file || loading) ? { opacity: 0.5 } : {}}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {loading ? ' Đang xử lý...' : ' Tiến Hành Đồng Bộ'}
            </button>
          </div>
        </div>

        {/* Templates Sidebar */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--spacing-md)' }}>Tải File Mẫu (Templates)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>

            <div className="kpi-card" style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Danh sách Sản phẩm</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>san-pham-template.xlsx</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>Tải</button>
              </div>
            </div>

            <div className="kpi-card" style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Kho Vật Tư</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>kho-template.xlsx</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>Tải</button>
              </div>
            </div>

            <div className="kpi-card" style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Dữ liệu Đối tác B2B</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>doitac-template.xlsx</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>Tải</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
