'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Percent, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

const API_PATH = '/san-pham-son';

interface PhanLoai {
  Sơn_tĩnh_điện: string;
  Sơn_tàu_biển: string;
  Sơn_công_nghiệp: string;
}

interface GiaThanh {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  DonGiaCoSo: number;
}

export default function GiaThanhPage() {
  const [data, setData] = useState<GiaThanh[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GiaThanh | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get(API_PATH);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const STATS = {
    total: data.length,
    avgBase: data.reduce((sum, d) => sum + (d.DonGiaCoSo || 0), 0) / (data.length || 1),
    avgB2B: data.reduce((sum, d) => sum + (d.DonGiaCoSo || 0) * 1.2, 0) / (data.length || 1),
    avgB2C: data.reduce((sum, d) => sum + (d.DonGiaCoSo || 0) * 1.3, 0) / (data.length || 1),
  };

  const filteredData = data.filter(item =>
    item.TenDongSon?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.MaSanPham?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (item: GiaThanh) => {
    setSelectedProduct(item);
    setNewPrice(item.DonGiaCoSo || 0);
    setIsModalOpen(true);
  };

  const submitPriceUpdate = async () => {
    if (!selectedProduct) return;
    try {
      await api.put(`${API_PATH}/${selectedProduct._id}/price`, {
        DonGiaCoSo: newPrice
      });
      alert('Cập nhật giá thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi cập nhật giá');
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><DollarSign size={22} /></div>
          <div className="kpi-label">Số Lượng Bảng Giá Cốt Lõi</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-label">Trung Bình Giá Vốn (Gốc)</div>
          <div className="kpi-value">{(STATS.avgBase / 1000).toFixed(0)}k/kg</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-label">Trung Bình Giá B2B Dự Kiến (+20%)</div>
          <div className="kpi-value">{(STATS.avgB2B / 1000).toFixed(0)}k/kg</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Percent size={22} /></div>
          <div className="kpi-label">Trung Bình Giá B2C Dự Kiến (+30%)</div>
          <div className="kpi-value">{(STATS.avgB2C / 1000).toFixed(0)}k/kg</div>
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
                placeholder="Tìm mã SP, tên sơn..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" title="Chuyển sang trang Quản lý Sản Phẩm để tạo mới dòng sơn và thiết lập giá" onClick={() => window.location.href = '/san-pham'}>
            <Plus size={16} /> Thiết Lập Dòng Sơn Mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Tham chiếu (Mã SP)</th>
              <th>Tên Dòng Sơn</th>
              <th>Giá Vốn Cơ Sở (VNĐ)</th>
              <th>Giá Đại Lý B2B (+20%)</th>
              <th>Giá Phân Phối B2C (+30%)</th>
              <th style={{ textAlign: 'center' }}>% Lợi Nhuận B2C</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const giaGoc = item.DonGiaCoSo || 0;
              const b2b = giaGoc * 1.2;
              const b2c = giaGoc * 1.3;
              return (
                <tr key={item._id}>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaSanPham}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.TenDongSon}</div>
                  </td>
                  <td style={{ color: '#94a3b8', fontWeight: 'bold' }}>{giaGoc.toLocaleString()} ₫</td>
                  <td style={{ fontWeight: 600, color: '#059669' }}>{b2b.toLocaleString()} ₫</td>
                  <td style={{ fontWeight: 600, color: '#7c3aed' }}>{b2c.toLocaleString()} ₫</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">~30%</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => openEditModal(item)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" title="Cập nhật Giá Vốn">
                      <Edit size={16} /> Update Giá
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredData.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Đổi Giá */}
      {isModalOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '12px', padding: '30px', margin: '2rem auto', color: '#000', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Hiệu Chỉnh Giá Vốn</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', color: '#555' }}>Sản phẩm</label>
                <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', background: '#e9ecef' }} value={`${selectedProduct.MaSanPham} - ${selectedProduct.TenDongSon}`} readOnly disabled />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Giá Vốn Đề Xuất Mới (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  style={{ width: '100%', padding: '12px', border: '2px solid #2563eb', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold' }}
                  value={newPrice}
                  onChange={e => setNewPrice(Number(e.target.value))}
                />
                <small style={{ display: 'block', marginTop: 8, color: '#666' }}>Giá B2B (+20%): {(newPrice * 1.2).toLocaleString()} ₫<br />Giá B2C (+30%): {(newPrice * 1.3).toLocaleString()} ₫</small>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: 10 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#eee', color: '#333', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>Hủy Bỏ</button>
              <button onClick={submitPriceUpdate} style={{ flex: 1, background: '#5010ffff', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Áp Dụng Giá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
