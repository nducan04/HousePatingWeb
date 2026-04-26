'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Building2, Ribbon, Handshake, Download } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import * as XLSX from 'xlsx';

const API_URL = '/khach-hang';

interface DoiTac {
  _id?: string;
  MaKH: string;
  TenKhachHang: string;
  PhanLoai: 'B2B' | 'B2C' | 'Đại lý';
  NgaySinh?: string;
  SDT: string;
  DiaChi?: string;
  Email: string;
  WalletAddress?: string;
  MaSoThueCaNhan?: string;
  SoDonHang?: number;
}

export default function DoiTacPage() {
  const [data, setData] = useState<DoiTac[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<DoiTac>({
    MaKH: '',
    TenKhachHang: '',
    PhanLoai: 'B2C',
    NgaySinh: '',
    SDT: '',
    DiaChi: '',
    Email: '',
    WalletAddress: '',
    MaSoThueCaNhan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách khách hàng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const STATS = {
    total: data.length,
    b2b: data.filter(d => d.PhanLoai === 'B2B').length,
    daily: data.filter(d => d.PhanLoai === 'Đại lý').length,
    b2c: data.filter(d => d.PhanLoai === 'B2C').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.TenKhachHang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.MaKH?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || item.PhanLoai === filter;
    return matchSearch && matchFilter;
  });

  const openForm = (dt?: DoiTac) => {
    if (dt) {
      setFormData({
        ...dt,
        NgaySinh: dt.NgaySinh ? new Date(dt.NgaySinh).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        MaKH: '',
        TenKhachHang: '',
        PhanLoai: 'B2C',
        NgaySinh: '',
        SDT: '',
        DiaChi: '',
        Email: '',
        WalletAddress: '',
        MaSoThueCaNhan: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (formData._id) {
        await api.put(`${API_URL}/${formData._id}`, formData);
      } else {
        await api.post(API_URL, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Lỗi lưu đối tác:', error);
      alert(error.response?.data?.error || 'Lỗi lưu đối tác');
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredData.map(item => ({
      'Mã KH': item.MaKH,
      'Phân loại': item.PhanLoai,
      'Tên KH': item.TenKhachHang,
      'Email': item.Email || '',
      'SĐT': item.SDT || '',
      'Địa chỉ': item.DiaChi || '',
      'Ví Web3': item.WalletAddress || '',
      'Số đơn đã đặt': item.SoDonHang || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khach-Hang");
    XLSX.writeFile(workbook, `VTSC_Danh_Sach_Khach_Hang_${new Date().toLocaleDateString().replace(/\//g, '_')}.xlsx`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Chắc chắn muốn xóa khách hàng này?')) {
      try {
        await api.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        alert('Lỗi xóa khách hàng');
      }
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={exportToExcel} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ border: '1px solid #e2e8f0', color: '#059669' }}>
              <Download size={16} /> Xuất Excel
            </button>
            <button onClick={() => openForm()} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
              <Plus size={16} /> Thêm Đối Tác
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Mã KH</th>
              <th>Tên Khách Hàng / Đối tác</th>
              <th>Nhóm Khách</th>
              <th>Số đơn đã đặt</th>
              <th>Điện thoại</th>
              <th>Email</th>
              <th>Địa Chỉ</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy khách hàng.</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaKH}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.TenKhachHang}</td>
                <td>
                  <span className={`badge ${item.PhanLoai === 'B2B' ? 'approved' : item.PhanLoai === 'Đại lý' ? 'testing' : 'pending'}`}>
                    {item.PhanLoai}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#059669' }}>{item.SoDonHang || 0} Đơn</td>
                <td>{item.SDT}</td>
                <td style={{ color: '#475569' }}>{item.Email}</td>
                <td style={{ color: '#475569' }}>{item.DiaChi}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openForm(item)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id!)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Trash2 size={16} color="#e11d48" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cập nhật - Chuẩn thông tin nhân sự */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '8px', padding: '24px', margin: '2rem auto', color: '#000', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{formData._id ? 'Cập nhật Đối tác' : 'Thông tin khách hàng'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Họ và tên</label>
                <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} placeholder="VD: Nguyễn Văn A" value={formData.TenKhachHang} onChange={e => setFormData({ ...formData, TenKhachHang: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Ngày sinh</label>
                  <input type="date" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} value={formData.NgaySinh} onChange={e => setFormData({ ...formData, NgaySinh: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Giới tính</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff' }}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Số điện thoại</label>
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} value={formData.SDT} onChange={e => setFormData({ ...formData, SDT: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Chức vụ (Nhóm khách)</label>
                  <select style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff' }} value={formData.PhanLoai} onChange={e => setFormData({ ...formData, PhanLoai: e.target.value as 'B2B' | 'B2C' | 'Đại lý' })}>
                    <option value="B2C">Khách Lẻ (B2C)</option>
                    <option value="B2B">Khách Doanh Nghiệp (B2B)</option>
                    <option value="Đại lý">Đại lý Trung Gian</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Cơ quan / Đơn vị (Email / Mã KH)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <input type="email" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} placeholder="Email" value={formData.Email} onChange={e => setFormData({ ...formData, Email: e.target.value })} />
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#f5f5f5', color: '#666' }} placeholder="Sẽ tự động tạo VTSC-KH-xxx" value={formData.MaKH} readOnly disabled />
                </div>
              </div>

              {formData.PhanLoai === 'B2B' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Địa chỉ ví Metamask (Blockchain Identity)</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                    placeholder="0x..."
                    value={formData.WalletAddress || ''}
                    onChange={e => setFormData({ ...formData, WalletAddress: e.target.value })}
                  />
                </div>
              )}

              {formData.PhanLoai === 'Đại lý' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Mã số thuế cá nhân</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                    placeholder="MST"
                    value={formData.MaSoThueCaNhan || ''}
                    onChange={e => setFormData({ ...formData, MaSoThueCaNhan: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Địa chỉ</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' }} value={formData.DiaChi} onChange={e => setFormData({ ...formData, DiaChi: e.target.value })}></textarea>
              </div>

            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={handleSubmit}
                style={{ width: '100%', background: '#1000f0ff', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
