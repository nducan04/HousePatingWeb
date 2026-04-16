'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, FlaskConical, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { rdRequests } from '@/lib/data/rd-data';

export default function RDTrackingPage() {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRequests = rdRequests.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.colorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: rdRequests.length,
    approved: rdRequests.filter(r => r.status === 'approved').length,
    testing: rdRequests.filter(r => r.status === 'testing').length,
    totalTests: rdRequests.reduce((sum, r) => sum + r.versions.length, 0),
    passRate: (() => {
      const allVersions = rdRequests.flatMap(r => r.versions);
      const passed = allVersions.filter(v => v.result === 'pass').length;
      return allVersions.length ? Math.round((passed / allVersions.length) * 100) : 0;
    })(),
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><FlaskConical size={22} /></div>
          <div className="kpi-label">Tổng Yêu cầu</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Đã Duyệt</div>
          <div className="kpi-value">{stats.approved}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Clock size={22} /></div>
          <div className="kpi-label">Đang Test</div>
          <div className="kpi-value">{stats.testing}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Tỷ lệ Pass</div>
          <div className="kpi-value">{stats.passRate}%</div>
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
                placeholder="Tìm theo mã, khách hàng..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'pending', 'testing', 'approved', 'rejected'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ' : f === 'testing' ? 'Đang test' : f === 'approved' ? 'Đạt' : 'Từ chối'}
                </button>
              ))}
            </div>
          </div>
          <Link href="/rd-tracking/new" className="btn btn-primary">
            <Plus size={16} /> Tạo Yêu cầu R&D
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã YC</th>
              <th>Khách hàng</th>
              <th>Mã Màu</th>
              <th>Tên Màu</th>
              <th>Bề mặt</th>
              <th>Versions</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(r => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/rd-tracking/${r.id}`}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{r.id}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.customer}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: r.colorHex, border: '1px solid var(--border-color)' }} />
                    {r.colorCode}
                  </div>
                </td>
                <td>{r.colorName}</td>
                <td>{r.surface}</td>
                <td style={{ fontWeight: 600 }}>{r.versions.length}</td>
                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                <td>{r.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
