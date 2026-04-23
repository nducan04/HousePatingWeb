'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Lock, Unlock, Users, UserCheck, ShieldCheck, UserX } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tai-khoan';

interface TaiKhoan {
  _id: string;
  TenDangNhap: string;
  Email: string;
  MatKhau?: string;
  VaiTro: string;
  TrangThai: boolean;
  NgayTao: string;
}

export default function QuanLyTaiKhoanPage() {
  const [taiKhoans, setTaiKhoans] = useState<TaiKhoan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<TaiKhoan>>({
    TenDangNhap: '',
    Email: '',
    VaiTro: 'NhanVien',
    TrangThai: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<any>(null);
  const [isEmployeeDetailsLoading, setIsEmployeeDetailsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_URL);
      if (res.data.success) {
        setTaiKhoans(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu tài khoản:', error);
      alert('Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  const STATS = {
    total: taiKhoans.length,
    active: taiKhoans.filter(t => t.TrangThai).length,
    admin: taiKhoans.filter(t => t.VaiTro === 'Admin').length,
    locked: taiKhoans.filter(t => !t.TrangThai).length,
  };

  const filteredData = taiKhoans.filter(tk => {
    const matchSearch = tk.TenDangNhap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tk.Email && tk.Email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = filterRole === 'all' ||
      (filterRole === 'admin' && tk.VaiTro === 'Admin') ||
      (filterRole === 'nhanvien' && tk.VaiTro === 'NhanVien') ||
      (filterRole === 'khachhang' && tk.VaiTro.includes('KhachHang'));
    return matchSearch && matchRole;
  });

  const handleToggleLock = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`${API_URL}/${id}`, { TrangThai: !currentStatus });
      fetchData(); // reload data
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      alert('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        console.error('Lỗi xóa:', error);
        alert('Không thể xóa tài khoản');
      }
    }
  };

  const openForm = (tk?: TaiKhoan) => {
    if (tk) setFormData({ ...tk, MatKhau: '' });
    else setFormData({ TenDangNhap: '', Email: '', MatKhau: '', VaiTro: 'NhanVien', TrangThai: true });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (formData._id) {
        await axios.put(`${API_URL}/${formData._id}`, formData);
      } else {
        await axios.post(API_URL, formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Lỗi lưu tài khoản:', error);
      alert(error.response?.data?.error || 'Lỗi khi lưu tài khoản');
    }
  };

  const handleViewDetails = async (accountId: string) => {
    setIsEmployeeDetailsOpen(true);
    setIsEmployeeDetailsLoading(true);
    setEmployeeDetails(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/nhan-vien/account/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEmployeeDetails(res.data.data);
      }
    } catch (error: any) {
      console.error('Lỗi lấy thông tin nhân viên:', error);
      if (error.response?.status === 404) {
        setEmployeeDetails({ notFound: true });
      }
    } finally {
      setIsEmployeeDetailsLoading(false);
    }
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
              <th>Ngày Tạo</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Không tìm thấy tài khoản.</td>
              </tr>
            ) : (
              filteredData.map(tk => (
                <tr key={tk._id}>
                  <td
                    style={{ fontWeight: 700, color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => handleViewDetails(tk._id)}
                    title="Xem chi tiết hồ sơ nhân sự"
                  >
                    {tk.TenDangNhap}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tk.Email}</td>
                  <td>{tk.VaiTro === 'KhachHangB2B' ? 'Doanh nghiệp B2B' : tk.VaiTro === 'KhachHangB2C' ? 'Cá nhân B2C' : tk.VaiTro}</td>
                  <td>
                    <span className={`badge ${tk.TrangThai ? 'approved' : 'rejected'}`}>
                      {tk.TrangThai ? 'ACTIVE' : 'LOCKED'}
                    </span>
                  </td>
                  <td>{new Date(tk.NgayTao).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => handleToggleLock(tk._id, tk.TrangThai)}
                        className="btn btn-ghost btn-sm"
                        title={tk.TrangThai ? 'Khóa' : 'Mở khóa'}
                      >
                        {tk.TrangThai ? <Lock size={16} /> : <Unlock size={16} />}
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
                <input type="text" className="form-input" value={formData.TenDangNhap} onChange={(e) => setFormData({ ...formData, TenDangNhap: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" className="form-input" value={formData.Email} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Mật khẩu {formData._id ? '(Bỏ trống nếu không đổi)' : '(Mặc định: VTSC@123)'}</label>
                <input type="password" placeholder={formData._id ? "Nhập mật khẩu mới" : "VTSC@123"} className="form-input" value={formData.MatKhau || ''} onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Vai trò</label>
                <select className="form-input" value={formData.VaiTro} onChange={(e) => setFormData({ ...formData, VaiTro: e.target.value })}>
                  <option value="Admin">Admin</option>
                  <option value="NhanVien">Nhân viên</option>
                  <option value="KhachHangB2B">Khách hàng B2B</option>
                  <option value="KhachHangB2C">Khách hàng B2C</option>
                  <option value="NhaCungCap">Nhà cung cấp</option>
                </select>
              </div>
            </div>
            <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Đóng</button>
              <button onClick={handleSubmit} className="btn btn-primary">Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Employee Details */}
      {isEmployeeDetailsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', background: 'var(--surface-color)', padding: '30px', margin: '2rem auto' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 15, marginBottom: 20 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-cyan)', margin: 0 }}>HỒ SƠ NHÂN SỰ TÀI KHOẢN</h2>
            </div>

            {isEmployeeDetailsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải thông tin...</div>
            ) : employeeDetails?.notFound ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--accent-rose)' }}>Tài khoản này chưa được liên kết với hồ sơ nhân sự nào.</div>
            ) : employeeDetails ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <tbody>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', width: '40%', borderBottom: '1px solid var(--border-color)' }}>Họ và tên:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.HoTen}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Giới tính:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.GioiTinh || 'Chưa cập nhật'}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Số điện thoại:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.SDT || 'Chưa cập nhật'}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Email liên hệ:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.Email || 'Chưa cập nhật'}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Địa chỉ thường trú:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.DiaChi || 'Chưa cập nhật'}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Phòng ban - Bộ phận:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.BoPhan}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>Chức vụ:</td><td style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>{employeeDetails.ChucVu}</td></tr>
                  <tr><td style={{ padding: '12px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Mô tả công việc:</td><td style={{ padding: '12px 0' }}>{employeeDetails.MoTaCongViec || 'Chưa cập nhật'}</td></tr>
                </tbody>
              </table>
            ) : null}

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button onClick={() => setIsEmployeeDetailsOpen(false)} className="btn btn-primary" style={{ padding: '10px 30px' }}>Đóng hồ sơ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
