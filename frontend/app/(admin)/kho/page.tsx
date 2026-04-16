'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, ArrowDownToLine, ArrowUpToLine, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface KhoItem {
  id: string;
  tenVatTu: string;
  loai: string;
  tonKho: number;
  donVi: string;
  trangThai: 'Đầy đủ' | 'Sắp hết' | 'Hết hàng';
  ngayCapNhat: string;
}

const mockKho: KhoItem[] = [
  { id: 'VT001', tenVatTu: 'Nhựa Acrylic', loai: 'Nguyên liệu chính', tonKho: 1250, donVi: 'kg', trangThai: 'Đầy đủ', ngayCapNhat: '2026-04-15' },
  { id: 'VT002', tenVatTu: 'Bột màu Trắng Titan', loai: 'Bột màu', tonKho: 45, donVi: 'kg', trangThai: 'Sắp hết', ngayCapNhat: '2026-04-16' },
  { id: 'VT003', tenVatTu: 'Dung môi Xylene', loai: 'Dung môi', tonKho: 500, donVi: 'lít', trangThai: 'Đầy đủ', ngayCapNhat: '2026-04-10' },
  { id: 'VT004', tenVatTu: 'Phụ gia chống lắng', loai: 'Phụ gia', tonKho: 0, donVi: 'kg', trangThai: 'Hết hàng', ngayCapNhat: '2026-04-12' },
];

export default function QuanLyKhoPage() {
  const [data, setData] = useState<KhoItem[]>(mockKho);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const STATS = {
    total: data.length,
    inType1: data.filter(d => d.loai === 'Nguyên liệu chính').length,
    warning: data.filter(d => d.trangThai === 'Sắp hết' || d.trangThai === 'Hết hàng').length,
    tonTotal: data.reduce((sum, d) => sum + d.tonKho, 0),
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.tenVatTu.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || 
                        (filter === 'low' && (item.trangThai === 'Sắp hết' || item.trangThai === 'Hết hàng')) ||
                        (filter === 'ok' && item.trangThai === 'Đầy đủ');
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Package size={22} /></div>
          <div className="kpi-label">Tổng Mặt Hàng</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><ArrowDownToLine size={22} /></div>
          <div className="kpi-label">Tổng Tồn (Đv)</div>
          <div className="kpi-value">{STATS.tonTotal}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><ArrowUpToLine size={22} /></div>
          <div className="kpi-label">Dòng Nguyên Liệu</div>
          <div className="kpi-value">{STATS.inType1}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><AlertTriangle size={22} /></div>
          <div className="kpi-label">Cảnh Báo Thiếu Hụt</div>
          <div className="kpi-value">{STATS.warning}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Tìm mã VT, tên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'ok', label: 'Đầy đủ' },
                { id: 'low', label: 'Cần nhập' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> Nhập / Xuất Kho
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Vật Tư</th>
              <th>Tên Vật Tư</th>
              <th>Phân loại</th>
              <th>Tồn Kho</th>
              <th>Trạng thái</th>
              <th>Cập nhật cuối</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.id}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.tenVatTu}</td>
                <td>{item.loai}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{item.tonKho} {item.donVi}</td>
                <td>
                  <span className={`badge ${item.trangThai === 'Đầy đủ' ? 'approved' : item.trangThai === 'Hết hàng' ? 'rejected' : 'testing'}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td>{item.ngayCapNhat}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-sm"><Edit size={16} /></button>
                  <button className="btn btn-ghost btn-sm"><Trash2 size={16} color="var(--accent-rose)" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>Thêm Lệnh Nhập / Xuất</h3>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div><label style={{ color: 'var(--text-secondary)' }}>Mã Vật Tư</label><input type="text" className="form-input" /></div>
              <div><label style={{ color: 'var(--text-secondary)' }}>Loại Phiếu</label>
                <select className="form-input"><option>Phiếu Nhập</option><option>Phiếu Xuất</option></select>
              </div>
              <div><label style={{ color: 'var(--text-secondary)' }}>Số Lượng</label><input type="number" className="form-input" /></div>
            </div>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Hủy</button>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-primary">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
