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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <Plus size={16} /> Lập Phiếu Nhắc Nợ
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
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
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.id}</td>
                <td style={{ fontWeight: 600, color: '#475569' }}>{item.hopDong}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.doiTac}</td>
                <td>{item.dotThanhToan}</td>
                <td style={{ fontWeight: 700, color: '#059669' }}>{item.soTien.toLocaleString()} ₫</td>
                <td style={{ fontWeight: 600, color: '#94a3b8' }}>{item.nhanVien}</td>
                <td style={{ fontWeight: 600, color: item.trangThai === 'Quá Hạn' ? '#e11d48' : 'inherit' }}>{item.hanChot}</td>
                <td>
                  <span className={`badge ${item.trangThai === 'Đã Nhận' ? 'approved' : item.trangThai === 'Quá Hạn' ? 'rejected' : 'pending'}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Eye size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
