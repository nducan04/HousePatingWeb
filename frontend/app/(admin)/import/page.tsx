'use client';

import React, { useState } from 'react';
import { Upload, FileUp, Save, Database, AlertCircle } from 'lucide-react';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      {/* Header Info */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Công cụ Đồng bộ Dữ liệu Toàn Hệ Thống</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} /> Hệ thống chấp nhận file định dạng .xlsx, .xls, .csv với dung lượng tối đa 50MB. <br/>
          Tải hệ quy chiếu mẫu ở dưới đây để tránh xung đột Data Source.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)' }}>
        
        {/* Dropzone */}
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700 }}>Tải lên File Excel</h3>
          
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-cyan-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
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
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button className={`btn ${file ? 'btn-primary' : 'btn-ghost'}`} disabled={!file} style={!file ? {opacity: 0.5}: {}}>
              <Upload size={16} /> Tiến Hành Đồng Bộ
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
