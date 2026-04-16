'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Users, Building2, Ribbon, Handshake } from 'lucide-react';

interface DoiTac {
  id: string;
  tenDoiTac: string;
  loaiKhach: 'B2B' | 'B2C' | 'Đại lý';
  sdt: string;
  email: string;
  doanhSo: number;
}

const mockData: DoiTac[] = [
  { id: 'DT001', tenDoiTac: 'Công ty Cổ phần Xây Dựng Số 1', loaiKhach: 'B2B', sdt: '0901234567', email: 'contact@xaydungso1.vn', doanhSo: 500000000 },
  { id: 'DT002', tenDoiTac: 'Đại lý Sơn Ngọc Yến', loaiKhach: 'Đại lý', sdt: '0988777666', email: 'ngocyen@gmail.com', doanhSo: 120000000 },
  { id: 'DT003', tenDoiTac: 'Chú Hoàng Gò Vấp', loaiKhach: 'B2C', sdt: '0911222333', email: 'hoang_gv@test.com', doanhSo: 5000000 },
];

export default function DoiTacPage() {
  const [data, setData] = useState<DoiTac[]>(mockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const STATS = {
    total: data.length,
    b2b: data.filter(d => d.loaiKhach === 'B2B').length,
    daily: data.filter(d => d.loaiKhach === 'Đại lý').length,
    b2c: data.filter(d => d.loaiKhach === 'B2C').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.tenDoiTac.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || item.loaiKhach === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Handshake size={22} /></div>
          <div className="kpi-label">Tổng Đối Tác</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><Building2 size={22} /></div>
          <div className="kpi-label">Khách Doanh Nghiệp (B2B)</div>
          <div className="kpi-value">{STATS.b2b}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Ribbon size={22} /></div>
          <div className="kpi-label">Đại Lý Trung Gian</div>
          <div className="kpi-value">{STATS.daily}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-label">Khách Lẻ (B2C)</div>
          <div className="kpi-value">{STATS.b2c}</div>
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
                placeholder="Tìm tên, mã đối tác..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'B2B', label: 'B2B' },
                { id: 'Đại lý', label: 'Đại lý' },
                { id: 'B2C', label: 'B2C' }
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
            <Plus size={16} /> Thêm Đối Tác
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Tên Khách Hàng / Đối tác</th>
              <th>Nhóm Khách</th>
              <th>Điện thoại</th>
              <th>Email</th>
              <th>Tổng Doanh Số</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.id}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.tenDoiTac}</td>
                <td>
                  <span className={`badge ${item.loaiKhach === 'B2B' ? 'approved' : item.loaiKhach === 'Đại lý' ? 'testing' : 'pending'}`}>
                    {item.loaiKhach}
                  </span>
                </td>
                <td>{item.sdt}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.email}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{item.doanhSo.toLocaleString()} ₫</td>
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
