'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Layers, Droplet, Box } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

interface MaMau {
  _id: string;
  MaMau: string;
  TenMau: string;
  HexCode: string;
  TrangThai: boolean;
}

interface SanPham {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  ThuongHieu: string;
  PhanLoai: string;
  DonGiaCoSo: number;
  MaMau: string;
  DanhSachMaMau?: MaMau[];
  MoTa?: string;
}

export default function SanPhamPage() {
  const [sanPhams, setSanPhams] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    MaSanPham: '',
    TenDongSon: '',
    MaMau: '',
    ThuongHieu: 'AkzoNobel',
    PhanLoai: 'Sơn tĩnh điện',
    DonGiaCoSo: 0,
    MoTa: '',
  });

  const fetchSanPhams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('phanLoai', filterType);

      const res = await api.get(`/san-pham-son?${params.toString()}`);
      if (res.data.success) {
        setSanPhams(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching san pham:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSanPhams();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await api.put(`/san-pham-son/${formData._id}`, formData);
      } else {
        const { _id, ...dataToCreate } = formData;
        await api.post('/san-pham-son', dataToCreate);
      }
      setIsModalOpen(false);
      fetchSanPhams();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa dòng sơn này?')) return;
    try {
      await api.delete(`/san-pham-son/${id}`);
      fetchSanPhams();
    } catch (error) {
      alert('Không thể xóa sản phẩm!');
    }
  };

  const openForm = (item?: SanPham) => {
    if (item) {
      setFormData({
        _id: item._id,
        MaSanPham: item.MaSanPham,
        TenDongSon: item.TenDongSon,
        MaMau: item.MaMau || '',
        ThuongHieu: item.ThuongHieu,
        PhanLoai: item.PhanLoai,
        DonGiaCoSo: item.DonGiaCoSo,
        MoTa: item.MoTa || '',
      });
    } else {
      setFormData({
        _id: '',
        MaSanPham: '',
        TenDongSon: '',
        MaMau: '',
        ThuongHieu: 'AkzoNobel',
        PhanLoai: 'Sơn tĩnh điện',
        DonGiaCoSo: 0,
        MoTa: '',
      });
    }
    setIsModalOpen(true);
  };

  const STATS = {
    total: sanPhams.length,
    tinhDien: sanPhams.filter(t => t.PhanLoai === 'Sơn tĩnh điện').length,
    tauBien: sanPhams.filter(t => t.PhanLoai === 'Sơn tàu biển').length,
    congNghiep: sanPhams.filter(t => t.PhanLoai === 'Sơn công nghiệp').length,
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Package size={22} /></div>
          <div className="kpi-label">Tổng Sản Phẩm</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><Layers size={22} /></div>
          <div className="kpi-label">Sơn Tĩnh Điện</div>
          <div className="kpi-value">{STATS.tinhDien}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Droplet size={22} /></div>
          <div className="kpi-label">Sơn Tàu Biển</div>
          <div className="kpi-value">{STATS.tauBien}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Box size={22} /></div>
          <div className="kpi-label">Sơn Công Nghiệp</div>
          <div className="kpi-value">{STATS.congNghiep}</div>
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
                placeholder="Tìm mã, loại..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'Sơn tĩnh điện', label: 'Sơn tĩnh điện' },
                { id: 'Sơn tàu biển', label: 'Sơn tàu biển' },
                { id: 'Sơn công nghiệp', label: 'Sơn CN' },
                { id: 'Sơn nội thất', label: 'Sơn nội thất' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`btn btn-sm ${filterType === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilterType(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => openForm()} className="btn btn-primary">
            <Plus size={16} /> Thêm Dòng Sơn
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên Dòng Sơn</th>
              <th>Thương hiệu</th>
              <th>Phân loại</th>
              <th>Đơn giá (đ/kg)</th>
              <th>Số Mã Màu</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Đang tải...</td>
              </tr>
            ) : sanPhams.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Không tìm thấy sản phẩm.</td>
              </tr>
            ) : (
              sanPhams.map(sp => (
                <tr key={sp._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{sp.MaSanPham}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sp.TenDongSon}</td>
                  <td>{sp.ThuongHieu}</td>
                  <td>{sp.PhanLoai}</td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{sp.DonGiaCoSo.toLocaleString()} ₫</td>
                  <td>
                    <span className="badge testing">
                      {sp.DanhSachMaMau?.length || 0} Màu
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => openForm(sp)} className="btn btn-ghost btn-sm">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(sp._id)} className="btn btn-ghost btn-sm">
                        <Trash2 size={16} color="var(--accent-rose)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: 0 }}>
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{formData._id ? 'Chỉnh sửa' : 'Thêm Sản Phẩm'}</h3>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '70vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Mã Sản Phẩm *</label>
                  <input type="text" required className="form-input" value={formData.MaSanPham} onChange={(e) => setFormData({...formData, MaSanPham: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Thương hiệu</label>
                  <input type="text" className="form-input" value={formData.ThuongHieu} onChange={(e) => setFormData({...formData, ThuongHieu: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Tên Dòng Sơn *</label>
                <input type="text" required className="form-input" value={formData.TenDongSon} onChange={(e) => setFormData({...formData, TenDongSon: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Phân loại</label>
                  <select className="form-input" value={formData.PhanLoai} onChange={(e) => setFormData({...formData, PhanLoai: e.target.value})}>
                    <option value="Sơn tĩnh điện">Sơn tĩnh điện</option>
                    <option value="Sơn tàu biển">Sơn tàu biển</option>
                    <option value="Sơn công nghiệp">Sơn công nghiệp</option>
                    <option value="Sơn nội thất">Sơn nội thất</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Đơn giá (VNĐ)</label>
                  <input type="number" className="form-input" value={formData.DonGiaCoSo} onChange={(e) => setFormData({...formData, DonGiaCoSo: Number(e.target.value)})} />
                </div>
              </div>

            </div>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Đóng</button>
              <button onClick={handleSubmit} className="btn btn-primary">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}