'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, FlaskConical, Beaker, CheckCircle2, FlaskRound, Plus, Loader2 } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import Link from 'next/link';
import { paintColors } from '@/lib/data/colors-data';

export default function RDTrackingPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Create Log Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchContracts();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rd-tracking');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch R&D logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await api.get('/contracts');
      if (res.data.success) {
        setContracts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    }
  };

  const handleContractChange = (contractId: string) => {
    setSelectedContract(contractId);
    const contract = contracts.find(c => c._id === contractId);
    if (contract && contract.chiTietHopDong) {
      const colors = contract.chiTietHopDong.map((item: any) => item.colorCode).filter(Boolean);
      setAvailableColors(Array.from(new Set(colors)));
    } else {
      setAvailableColors([]);
    }
    setSelectedColor('');
  };

  const handleCreateLog = async () => {
    if (!selectedContract || !selectedColor) {
      alert('Vui lòng chọn hợp đồng và mã màu!');
      return;
    }
    try {
      setCreating(true);
      const res = await api.post('/rd-tracking', {
        ContractID: selectedContract,
        MaMauYeuCau: selectedColor
      });
      if (res.data.success) {
        setIsModalOpen(false);
        fetchLogs();
        alert('✅ Đã tạo Log R&D mới thành công!');
      }
    } catch (err) {
      alert('❌ Lỗi khi tạo log mới');
    } finally {
      setCreating(false);
    }
  };

  const STATS = {
    total: data.length,
    testing: data.filter(d => d.TrangThai === 'testing' || d.TrangThai === 'pending').length,
    success: data.filter(d => d.TrangThai === 'approved').length,
    fail: data.filter(d => d.TrangThai === 'rejected').length,
  };

  const filteredData = data.filter(item => {
    const colorInfo = paintColors.find(c => c.code === item.MaMauYeuCau);
    const matchSearch =
      String(item.MaMauYeuCau || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.MaNhatKy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(colorInfo?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' ||
      (filter === 'testing' && (item.TrangThai === 'testing' || item.TrangThai === 'pending')) ||
      (filter === 'success' && item.TrangThai === 'approved') ||
      (filter === 'fail' && item.TrangThai === 'rejected');
    return matchSearch && matchFilter;
  });

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>;

  return (
    <div className="space-y-6">
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><FlaskConical size={22} /></div>
          <div className="kpi-label">Tổng Số Mẫu Phân Tích</div>
          <div className="kpi-value">{STATS.total} Lô Mẫu</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Beaker size={22} /></div>
          <div className="kpi-label">Đang Test/Pha chế</div>
          <div className="kpi-value">{STATS.testing}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Đã Ký Duyệt KCS</div>
          <div className="kpi-value">{STATS.success}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><FlaskRound size={22} /></div>
          <div className="kpi-label">Lô Mẫu Thất Bại</div>
          <div className="kpi-value">{STATS.fail}</div>
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
                placeholder="Tra cứu Trace Log Code Lab Model..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'testing', label: 'Processing...' },
                { id: 'success', label: 'Approved KCS' },
                { id: 'fail', label: 'Rejected' }
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
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Tạo Log R&D Mới
          </button>
        </div>
      </div>

      {/* Create Log Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex',
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-card" style={{ width: 500, padding: 30, border: '1px solid var(--accent-cyan)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Beaker className="text-[var(--accent-cyan)]" /> KHỞI TẠO LOG TRUY XUẤT R&D
            </h3>

            <div style={{ display: 'grid', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Chọn Hợp đồng Kinh doanh/Gia công</label>
                <select
                  className="form-input"
                  value={selectedContract}
                  onChange={(e) => handleContractChange(e.target.value)}
                  style={{ background: 'var(--bg-card)' }}
                >
                  <option value="">-- Chọn hợp đồng --</option>
                  {contracts.map(c => (
                    <option key={c._id} value={c._id}>{c.contractId || c.MaHopDong} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mã màu yêu cầu pha chế</label>
                <select
                  className="form-input"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  disabled={!selectedContract}
                  style={{ background: 'var(--bg-card)' }}
                >
                  <option value="">-- Chọn mã màu --</option>
                  {availableColors.map(color => {
                    const info = paintColors.find(c => c.code === color);
                    return (
                      <option key={color} value={color}>
                        {color} {info ? `- ${info.name}` : ''}
                      </option>
                    );
                  })}
                </select>

                {selectedColor && (
                  <div style={{
                    marginTop: 12, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 6,
                      background: paintColors.find(c => c.code === selectedColor)?.hex || '#333'
                    }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {paintColors.find(c => c.code === selectedColor)?.name || 'Custom Color'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {selectedColor} | {paintColors.find(c => c.code === selectedColor)?.category || 'Mixed'}
                      </div>
                    </div>
                  </div>
                )}

                {!selectedContract && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>* Vui lòng chọn hợp đồng trước</p>}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => setIsModalOpen(false)}
                  disabled={creating}
                >
                  Hủy bỏ
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleCreateLog}
                  disabled={creating || !selectedContract || !selectedColor}
                >
                  {creating ? 'Đang tạo...' : 'Xác nhận Khởi tạo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Lab Định Biên</th>
              <th>Mã Màu Yêu Cầu</th>
              <th>Hợp Đồng</th>
              <th>Số Mẻ Test</th>
              <th>Hao Hụt % (Avg)</th>
              <th>Status</th>
              <th>Cập nhật cuối</th>
              <th style={{ textAlign: 'right' }}>Log Tracking</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const wastage = item.LichSuPhienBan?.length > 0
                ? (item.LichSuPhienBan.reduce((acc: number, cur: any) => acc + (cur.inputWeight > 0 ? (cur.inputWeight - cur.outputWeight) / cur.inputWeight * 100 : 0), 0) / item.LichSuPhienBan.length).toFixed(1)
                : '0.0';

              return (
                <tr key={item._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaNhatKy}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 3,
                        background: paintColors.find(c => c.code === item.MaMauYeuCau)?.hex || '#333'
                      }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.MaMauYeuCau}</div>
                    </div>
                    {paintColors.find(c => c.code === item.MaMauYeuCau) && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 26 }}>
                        {paintColors.find(c => c.code === item.MaMauYeuCau)?.name}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.ContractID?.MaHopDong || item.ContractID?.contractId || 'N/A'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>{item.LichSuPhienBan?.length || 0}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{wastage}%</td>
                  <td>
                    <span className={`badge ${item.TrangThai === 'approved' ? 'approved' : item.TrangThai === 'rejected' ? 'rejected' : 'testing'}`}>
                      {(item.TrangThai || 'testing').toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/rd-tracking/${item._id}`} className="btn btn-ghost btn-sm">
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>Không tìm thấy log R&D nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
