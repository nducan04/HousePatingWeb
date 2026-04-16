'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Lock, Unlock, Users, UserCheck, ShieldCheck, UserX } from 'lucide-react';

interface TaiKhoan {
  _id: string;
  TenDangNhap: string;
  Email: string;
  VaiTro: string;
  TrangThai: 'Hoạt động' | 'Khóa';
  LanDangNhapCuoi: string;
}

const mockData: TaiKhoan[] = [
  { _id: '1', TenDangNhap: 'admin', Email: 'admin@vtsc.vn', VaiTro: 'Admin', TrangThai: 'Hoạt động', LanDangNhapCuoi: '2026-04-16 08:30:00' },
  { _id: '2', TenDangNhap: 'nhanvien01', Email: 'nv01@vtsc.vn', VaiTro: 'NhanVien', TrangThai: 'Hoạt động', LanDangNhapCuoi: '2026-04-15 14:20:00' },
  { _id: '3', TenDangNhap: 'doitac_b2b', Email: 'contact@b2bpartner.com', VaiTro: 'KhachHangB2B', TrangThai: 'Khóa', LanDangNhapCuoi: '2026-04-10 09:15:00' },
  { _id: '4', TenDangNhap: 'khachle_099', Email: 'user099@gmail.com', VaiTro: 'KhachHangB2C', TrangThai: 'Hoạt động', LanDangNhapCuoi: '2026-04-16 10:05:00' },
];

export default function QuanLyTaiKhoanPage() {
  const [taiKhoans, setTaiKhoans] = useState<TaiKhoan[]>(mockData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TaiKhoan>>({
    TenDangNhap: '',
    Email: '',
    VaiTro: 'NhanVien',
    TrangThai: 'Hoạt động'
  });

  const STATS = {
    total: taiKhoans.length,
    active: taiKhoans.filter(t => t.TrangThai === 'Hoạt động').length,
    admin: taiKhoans.filter(t => t.VaiTro === 'Admin').length,
    locked: taiKhoans.filter(t => t.TrangThai === 'Khóa').length,
  };

  const filteredData = taiKhoans.filter(tk => {
    const matchSearch = tk.TenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) || tk.Email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || 
                      (filterRole === 'admin' && tk.VaiTro === 'Admin') ||
                      (filterRole === 'nhanvien' && tk.VaiTro === 'NhanVien') ||
                      (filterRole === 'khachhang' && tk.VaiTro.includes('KhachHang'));
    return matchSearch && matchRole;
  });

  const handleToggleLock = (id: string, currentStatus: string) => {
    setTaiKhoans(taiKhoans.map(tk =>
      tk._id === id ? { ...tk, TrangThai: currentStatus === 'Hoạt động' ? 'Khóa' : 'Hoạt động' } : tk
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setTaiKhoans(taiKhoans.filter(tk => tk._id !== id));
    }
  };

  const openForm = (tk?: TaiKhoan) => {
    if (tk) setFormData(tk);
    else setFormData({ TenDangNhap: '', Email: '', VaiTro: 'NhanVien', TrangThai: 'Hoạt động' });
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-label">Tổng Tài Khoản</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><UserCheck size={22} /></div>
          <div className="kpi-label">Hoạt Động</div>
          <div className="kpi-value">{STATS.active}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><ShieldCheck size={22} /></div>
          <div className="kpi-label">Quản trị Admin</div>
          <div className="kpi-value">{STATS.admin}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><UserX size={22} /></div>
          <div className="kpi-label">Bị Khóa</div>
          <div className="kpi-value">{STATS.locked}</div>
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
                placeholder="Tìm user, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'admin', 'nhanvien', 'khachhang'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filterRole === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilterRole(f)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {f === 'all' ? 'Tất cả' : f === 'admin' ? 'Admin' : f === 'nhanvien' ? 'Nhân viên' : 'Khách hàng'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => openForm()} className="btn btn-primary">
            <Plus size={16} /> Cấp mới Tài khoản
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên Đăng Nhập</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Đăng nhập cuối</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Không tìm thấy tài khoản.</td>
              </tr>
            ) : (
              filteredData.map(tk => (
                <tr key={tk._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{tk.TenDangNhap}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tk.Email}</td>
                  <td>{tk.VaiTro === 'KhachHangB2B' ? 'Doanh nghiệp B2B' : tk.VaiTro === 'KhachHangB2C' ? 'Cá nhân B2C' : tk.VaiTro}</td>
                  <td>
                    <span className={`badge ${tk.TrangThai === 'Hoạt động' ? 'approved' : 'rejected'}`}> {/* Using standard rd-tracking statuses for color: approved=green, rejected=red */}
                      {tk.TrangThai === 'Hoạt động' ? 'ACTIVE' : 'LOCKED'}
                    </span>
                  </td>
                  <td>{tk.LanDangNhapCuoi}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => handleToggleLock(tk._id, tk.TrangThai)}
                        className="btn btn-ghost btn-sm"
                        title={tk.TrangThai === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}
                      >
                        {tk.TrangThai === 'Hoạt động' ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button onClick={() => openForm(tk)} className="btn btn-ghost btn-sm">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(tk._id)} className="btn btn-ghost btn-sm">
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
            <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{formData._id ? 'Chỉnh sửa' : 'Cấp mới'}</h3>
            </div>
            <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Tên Đăng Nhập</label>
                <input type="text" className="form-input" value={formData.TenDangNhap} onChange={(e) => setFormData({...formData, TenDangNhap: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" className="form-input" value={formData.Email} onChange={(e) => setFormData({...formData, Email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Vai trò</label>
                <select className="form-input" value={formData.VaiTro} onChange={(e) => setFormData({...formData, VaiTro: e.target.value})}>
                  <option value="Admin">Admin</option>
                  <option value="NhanVien">Nhân viên</option>
                  <option value="KhachHangB2B">Khách hàng B2B</option>
                  <option value="KhachHangB2C">Khách hàng B2C</option>
                </select>
              </div>
            </div>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Đóng</button>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-primary">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
