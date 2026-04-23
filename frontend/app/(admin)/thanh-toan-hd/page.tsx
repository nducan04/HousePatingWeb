'use client';

import React, { useState } from 'react';
import { Search, Eye, DollarSign, Wallet, FileCheck, Landmark, Plus } from 'lucide-react';

interface ThanhToanHD {
  id: string;
  hopDong: string;
  doiTac: string;
  dotThanhToan: 'Đợt 1 (30% Cọc)' | 'Đợt 2 (Theo Tiến độ)' | 'Đợt 3 (Quyết Toán)';
  soTien: number;
  hanChot: string;
  nhanVien: string;
  trangThai: 'Đã Nhận' | 'Đang Chờ Kế Toán' | 'Chưa Thanh Toán' | 'Quá Hạn';
}

const mockData: ThanhToanHD[] = [
  { id: 'PAYHD-001', hopDong: 'HD-GC-2601', doiTac: 'Công ty XD Thái Hưng', dotThanhToan: 'Đợt 1 (30% Cọc)', soTien: 750000000, hanChot: '15-04-2026', nhanVien: 'KT001 - Phạm Mai', trangThai: 'Đã Nhận' },
  { id: 'PAYHD-002', hopDong: 'HD-GC-2601', doiTac: 'Công ty XD Thái Hưng', dotThanhToan: 'Đợt 2 (Theo Tiến độ)', soTien: 1000000000, hanChot: '30-05-2026', nhanVien: 'KT001 - Phạm Mai', trangThai: 'Chưa Thanh Toán' },
  { id: 'PAYHD-003', hopDong: 'HD-PP-2602', doiTac: 'Tập Đoàn Nam Phương', dotThanhToan: 'Đợt 1 (30% Cọc)', soTien: 1500000000, hanChot: '10-04-2026', nhanVien: 'KT002 - Lê Tuấn', trangThai: 'Quá Hạn' },
  { id: 'PAYHD-004', hopDong: 'HD-GC-2603', doiTac: 'Xưởng Cơ Khí Vina', dotThanhToan: 'Đợt 3 (Quyết Toán)', soTien: 240000000, hanChot: '01-02-2025', nhanVien: 'KT005 - Trần D', trangThai: 'Đã Nhận' },
];

export default function ThanhToanHopDongPage() {
  const [data, setData] = useState<ThanhToanHD[]>(mockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const STATS = {
    totalExpected: data.reduce((sum, d) => sum + d.soTien, 0),
    totalReceived: data.filter(d => d.trangThai === 'Đã Nhận').reduce((sum, d) => sum + d.soTien, 0),
    totalOverdue: data.filter(d => d.trangThai === 'Quá Hạn').reduce((sum, d) => sum + d.soTien, 0),
    pendingItems: data.filter(d => d.trangThai === 'Chưa Thanh Toán' || d.trangThai === 'Đang Chờ Kế Toán').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.hopDong.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.doiTac.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || 
                        (filter === 'received' && item.trangThai === 'Đã Nhận') ||
                        (filter === 'overdue' && item.trangThai === 'Quá Hạn') ||
                        (filter === 'pending' && (item.trangThai === 'Chưa Thanh Toán' || item.trangThai === 'Đang Chờ Kế Toán'));
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><Landmark size={22} /></div>
          <div className="kpi-label">Tổng Dòng Tiền Đã Nhập Quỹ</div>
          <div className="kpi-value">{(STATS.totalReceived / 1000000000).toFixed(2)} Tỷ</div>
        </div>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><DollarSign size={22} /></div>
          <div className="kpi-label">Dự Kiến Thu Về Hợp Đồng</div>
          <div className="kpi-value">{(STATS.totalExpected / 1000000000).toFixed(2)} Tỷ</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Wallet size={22} /></div>
          <div className="kpi-label">Số Đợt Chờ Thu</div>
          <div className="kpi-value">{STATS.pendingItems} Lần</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><FileCheck size={22} /></div>
          <div className="kpi-label">Gia Vốn Bị Kẹt Quá Hạn</div>
          <div className="kpi-value">{(STATS.totalOverdue / 1000000000).toFixed(2)} Tỷ</div>
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
                placeholder="Truy vấn số Hợp Đồng, Tên Đối Tác..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'received', label: 'Đã Quyết Toán' },
                { id: 'pending', label: 'Chờ Thu' },
                { id: 'overdue', label: 'Khách Chậm Trả' }
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
            <Plus size={16} /> Lập Phiếu Nhắc Nợ
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Giao Dịch</th>
              <th>Mã Hợp Đồng</th>
              <th>Thương Hiệu Đối Tác</th>
              <th>Hạng Mục Cần Thu</th>
              <th>Số Tiền Thực Tế / Đợt</th>
              <th>Kế Toán Doanh Nghiệp</th>
              <th>Hạn Thanh Toán Còn Lại</th>
              <th>Khớp Số Dư</th>
              <th style={{ textAlign: 'right' }}>Ủy nhiệm</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.id}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.hopDong}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.doiTac}</td>
                <td>{item.dotThanhToan}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{item.soTien.toLocaleString()} ₫</td>
                <td style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>{item.nhanVien}</td>
                <td style={{ fontWeight: 600, color: item.trangThai === 'Quá Hạn' ? 'var(--accent-rose)' : 'inherit' }}>{item.hanChot}</td>
                <td>
                  <span className={`badge ${item.trangThai === 'Đã Nhận' ? 'approved' : item.trangThai === 'Quá Hạn' ? 'rejected' : 'pending'}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost btn-sm"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
