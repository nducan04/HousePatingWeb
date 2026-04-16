'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Building, DollarSign, Briefcase, FileSignature } from 'lucide-react';

interface NhaCungCap {
  id: string;
  tenNCC: string;
  mst: string;
  sdt: string;
  loai: 'Chính' | 'Phụ' | 'Dự phòng';
  congNo: number;
}

const mockData: NhaCungCap[] = [
  { id: 'NCC001', tenNCC: 'Hóa chất Vinachem', mst: '010010802X', sdt: '0243825822', loai: 'Chính', congNo: 1500000000 },
  { id: 'NCC002', tenNCC: 'Bao bì Thuận Phát', mst: '031024399Y', sdt: '0283999999', loai: 'Phụ', congNo: 50000000 },
  { id: 'NCC003', tenNCC: 'Phụ gia Hưng Yên', mst: '090123543Z', sdt: '0321888777', loai: 'Dự phòng', congNo: 0 },
];

export default function NhaCungCapPage() {
  const [data, setData] = useState<NhaCungCap[]>(mockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const STATS = {
    total: data.length,
    chinh: data.filter(d => d.loai === 'Chính').length,
    noTotal: data.reduce((sum, d) => sum + d.congNo, 0),
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.tenNCC.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || item.loai === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Building size={22} /></div>
          <div className="kpi-label">Tổng Nhà Cung Cấp</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><FileSignature size={22} /></div>
          <div className="kpi-label">Đội Tác Chính Chiến Lược</div>
          <div className="kpi-value">{STATS.chinh}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Briefcase size={22} /></div>
          <div className="kpi-label">Đối Tác Dự Phòng</div>
          <div className="kpi-value">{STATS.total - STATS.chinh}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><DollarSign size={22} /></div>
          <div className="kpi-label">Tổng Nợ Còn Đọng</div>
          <div className="kpi-value">{(STATS.noTotal / 1000000).toLocaleString()} Tr</div>
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
                placeholder="Tìm mã NCC, tên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'Chính', label: 'Cấp 1' },
                { id: 'Phụ', label: 'Cấp 2' }
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
          <button className="btn btn-primary">
            <Plus size={16} /> Thêm NCC
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tễn Nhà Cung Cấp</th>
              <th>Mã Số Thuế</th>
              <th>Điện thoại</th>
              <th>Phân loại</th>
              <th>Công nợ hiện tại</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.id}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.tenNCC}</td>
                <td>{item.mst}</td>
                <td>{item.sdt}</td>
                <td>
                  <span className={`badge ${item.loai === 'Chính' ? 'approved' : item.loai === 'Phụ' ? 'testing' : 'pending'}`}>
                    {item.loai}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: item.congNo > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                  {item.congNo.toLocaleString()} ₫
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-sm"><Edit size={16} /></button>
                  <button className="btn btn-ghost btn-sm"><Trash2 size={16} color="var(--accent-rose)" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
