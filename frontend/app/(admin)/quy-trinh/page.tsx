'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Layers, Palette, ShieldCheck, Package, Plus, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/utils/axiosAuth';

interface QuyTrinh {
  _id: string;
  MaLenhSanXuat: string;
  ContractID?: { MaHopDong: string; title: string };
  CongThucID?: { TenCongThuc: string; MaMau: string };
  TargetWeight: number;
  TrangThai: string;
  Assignee?: { HoTen: string; MaNV: string };
  updatedAt: string;
}

export default function QuyTrinhPage() {
  const [data, setData] = useState<QuyTrinh[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch production data:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATS = {
    total: data.reduce((sum, d) => sum + d.TargetWeight, 0),
    mixing: data.filter(d => d.TrangThai === 'in_progress').length,
    qc: data.filter(d => d.TrangThai === 'testing' || d.TrangThai === 'in_progress').length, // Logic tùy chỉnh
    packing: data.filter(d => d.TrangThai === 'completed').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.MaLenhSanXuat.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.ContractID?.MaHopDong.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchSearch;
    if (filter === 'mixing') return matchSearch && item.TrangThai === 'in_progress';
    if (filter === 'packing') return matchSearch && item.TrangThai === 'completed';
    return matchSearch;
  });

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Layers size={22} /></div>
          <div className="kpi-label">Tổng Khối Lượng Sản Xuất (Kg)</div>
          <div className="kpi-value">{STATS.total.toLocaleString()}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Palette size={22} /></div>
          <div className="kpi-label">Lô Hàng Đang Pha Màu</div>
          <div className="kpi-value">{STATS.mixing}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><ShieldCheck size={22} /></div>
          <div className="kpi-label">Lô Hàng Đang Test QC</div>
          <div className="kpi-value">{STATS.qc}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><Package size={22} /></div>
          <div className="kpi-label">Đang Đóng Thùng / Ra Kho</div>
          <div className="kpi-value">{STATS.packing}</div>
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
                placeholder="Truy vết Batch ID, Sản phẩm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'mixing', label: 'CĐ. Pha Chế' },
                { id: 'qc', label: 'CĐ. KCS' },
                { id: 'packing', label: 'CĐ. Đóng Gói' }
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
          <Link href="/production/new" className="btn btn-primary">
            <Plus size={16} /> Phát Sinh Lệnh Sản Xuất
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cấu Hình Trace Batch Chuyển Chuỗi Cung Ứng Line Pha</th>
              <th>Mã Phiếu Hợp Đồng Mẹ </th>
              <th>Tên Mẫu Model Cân Chuẩn</th>
              <th>Target Cần Chiết Rót Tính Bình Nhựa Tấn (Kg)</th>
              <th>Label Zone Status - Mã Màu Khoảng Đen Trắng Hệ Trạm Khung KCS </th>
              <th>Kỹ Thuật / Master Chặn KCS Trực Ca</th>
              <th>Lốc Time Cấu Kết Nạp Nhựa Tròn Auto Log Traceability Time </th>
              <th style={{ textAlign: 'right' }}>Log</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaLenhSanXuat}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{item.ContractID?.MaHopDong}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.CongThucID?.TenCongThuc} <br />
                  <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>{item.CongThucID?.MaMau}</span>
                </td>
                <td style={{ fontWeight: 700 }}>{item.TargetWeight.toLocaleString()} <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Kg</span></td>
                <td>
                  <span className={`badge ${item.TrangThai === 'completed' ? 'approved' : item.TrangThai === 'in_progress' ? 'testing' : 'pending'}`}>
                    {item.TrangThai === 'in_progress' ? 'Đang pha chế' : item.TrangThai === 'completed' ? 'Hoàn thành' : item.TrangThai}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>
                  {item.Assignee?.HoTen} <br />
                  <span style={{ fontSize: 10 }}>{item.Assignee?.MaNV}</span>
                </td>
                <td>{new Date(item.updatedAt).toLocaleString('vi-VN')}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link href={`/production/${item._id}`} className="btn btn-ghost btn-sm"><Eye size={16} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
