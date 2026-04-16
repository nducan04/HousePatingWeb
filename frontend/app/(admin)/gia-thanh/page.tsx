'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Percent, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface GiaThanh {
  id: string;
  chietKhauDaily: number;
  giaB2b: number;
  giaB2c: number;
  giaGoc: number;
  maSP: string;
  tenSP: string;
}

const mockGia: GiaThanh[] = [
  { id: 'P001', maSP: 'SP-001', tenSP: 'Sơn tĩnh điện PE Ngoài trời', giaGoc: 55000, giaB2b: 65000, giaB2c: 80000, chietKhauDaily: 15 },
  { id: 'P002', maSP: 'SP-002', tenSP: 'Sơn tĩnh điện EPOXY Trong nhà', giaGoc: 45000, giaB2b: 55000, giaB2c: 70000, chietKhauDaily: 12 },
  { id: 'P003', maSP: 'SP-003', tenSP: 'Sơn tàu biển gốc Alkyd', giaGoc: 120000, giaB2b: 150000, giaB2c: 180000, chietKhauDaily: 20 },
];

export default function GiaThanhPage() {
  const [data, setData] = useState<GiaThanh[]>(mockGia);
  const [searchTerm, setSearchTerm] = useState('');

  const STATS = {
    total: data.length,
    avgB2C: data.reduce((sum, d) => sum + d.giaB2c, 0) / (data.length || 1),
    avgB2B: data.reduce((sum, d) => sum + d.giaB2b, 0) / (data.length || 1),
    avgMargin: data.reduce((sum, d) => sum + (d.giaB2b - d.giaGoc)/d.giaGoc, 0) * 100 / (data.length || 1),
  };

  const filteredData = data.filter(item => 
    item.tenSP.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.maSP.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><DollarSign size={22} /></div>
          <div className="kpi-label">Số Lượng Bảng Giá</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-label">Biên Lợi Nhuận (Trung Bình)</div>
          <div className="kpi-value">+{STATS.avgMargin.toFixed(1)}%</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-label">Trung Bình Giá B2B</div>
          <div className="kpi-value">{(STATS.avgB2B/1000).toFixed(0)}k/kg</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Percent size={22} /></div>
          <div className="kpi-label">Trung Bình Giá B2C</div>
          <div className="kpi-value">{(STATS.avgB2C/1000).toFixed(0)}k/kg</div>
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
                placeholder="Tìm mã SP, tên sơn..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary">
            <Plus size={16} /> Thiết Lập Giá Mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tham chiếu</th>
              <th>Mã Sản Phẩm / Tên</th>
              <th>Giá Giá Công (COGS)</th>
              <th>Giá Đại Lý (B2B)</th>
              <th>Giá Phân Phối (B2C)</th>
              <th>% Chiết khấu đại lý</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.id}</td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.maSP}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{item.tenSP}</div>
                </td>
                <td style={{ color: 'var(--text-tertiary)' }}>{item.giaGoc.toLocaleString()} ₫</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{item.giaB2b.toLocaleString()} ₫</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{item.giaB2c.toLocaleString()} ₫</td>
                <td>
                  <span className="badge testing">
                    {item.chietKhauDaily}%
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-sm"><Edit size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
