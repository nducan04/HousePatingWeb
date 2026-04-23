'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Briefcase, Award, CheckCircle2, Download } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import * as XLSX from 'xlsx';

const API_URL = '/nhan-vien';

interface NhanVien {
  _id?: string;
  MaNV: string;
  HoTen: string;
  NgaySinh?: string;
  GioiTinh?: string;
  Email?: string;
  SDT?: string;
  DiaChi?: string;
  BoPhan: string;
  MoTaCongViec?: string;
  Avatar?: string;
  ChucVu?: string;
  TrangThai?: string;
  revenue?: number;
  deliveries?: number;
  tests?: number;
  orders?: number;
  customers?: number;
}

export default function NhanVienPage() {
  const [data, setData] = useState<NhanVien[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const getAvatarUrl = (path: string) => {
    if (!path || path === 'undefined' || path === 'null') return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const origin = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000';
    return `${origin}${cleanPath}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState<NhanVien>({
    MaNV: '',
    HoTen: '',
    NgaySinh: '',
    GioiTinh: 'Nam',
    Email: '',
    SDT: '',
    DiaChi: '',
    BoPhan: 'Sale / MKT',
    ChucVu: '',
    MoTaCongViec: '',
    Avatar: '',
    TrangThai: 'Đang làm'
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) {
        let staffList = res.data.data;

        // Fetch performance stats to get revenue
        try {
          const statsRes = await api.get('/hieu-suat/stats');
          if (statsRes.data.success) {
            const performanceData = statsRes.data.staff || [];
            staffList = staffList.map((nv: any) => {
              const perf = performanceData.find((p: any) => p.id === nv._id);
              return {
                ...nv,
                revenue: perf ? perf.revenue : 0,
                deliveries: perf ? perf.deliveries : 0,
                tests: perf ? perf.tests : 0,
                orders: perf ? perf.orders : 0,
                customers: perf ? perf.customers : 0
              };
            });
          }
        } catch (err) {
          console.error('Lỗi tải chỉ số hiệu suất:', err);
        }

        setData(staffList);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách nhân viên:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const STATS = {
    total: data.length,
    active: data.filter(d => d.TrangThai === 'Đang làm' || !d.TrangThai).length,
    sale: data.filter(d => d.BoPhan === 'Sale / MKT' || d.BoPhan === 'CSKH Bảo Hành').length,
    tech: data.filter(d => d.BoPhan === 'R&D Kỹ Thuật Máy' || d.BoPhan === 'Kho / Logistics').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.HoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.MaNV?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchFilter = true;
    if (filter !== 'all') {
      if (filter === 'sale_mkt') matchFilter = item.BoPhan === 'Sale / MKT';
      if (filter === 'ketoan') matchFilter = item.BoPhan === 'Kế Toán';
      if (filter === 'cskh') matchFilter = item.BoPhan === 'CSKH Bảo Hành';
      if (filter === 'logistics') matchFilter = item.BoPhan === 'Kho / Logistics';
      if (filter === 'tech_sx') matchFilter = item.BoPhan === 'R&D Kỹ Thuật Máy';
    }

    return matchSearch && matchFilter;
  });

  const exportToExcel = () => {
    const dataToExport = filteredData.map(nv => ({
      'Mã NV': nv.MaNV,
      'Họ Tên': nv.HoTen,
      'Bộ Phận': nv.BoPhan,
      'Chức Vụ': nv.ChucVu,
      'Email': nv.Email || '',
      'SĐT': nv.SDT || '',
      'Trạng Thái': nv.TrangThai || 'Đang làm',
      'Hiệu suất Công tác': 
        nv.BoPhan === 'Kho / Logistics' ? `${nv.deliveries || 0} Chuyến` : 
        (nv.BoPhan === 'R&D Kỹ Thuật Máy' ? `${nv.tests || 0} Lô hàng` : 
        (nv.BoPhan === 'CSKH Bảo Hành' ? `${nv.customers || 0} Khách hàng` : 
        `${nv.orders || 0} Đơn hàng`))
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nhan-Vien");
    XLSX.writeFile(workbook, `VTSC_Danh_Sach_Nhan_Vien_${new Date().toLocaleDateString()}.xlsx`);
  };

  const openForm = (nv?: NhanVien) => {
    if (nv) {
      setFormData({
        ...nv,
        NgaySinh: nv.NgaySinh ? new Date(nv.NgaySinh).toISOString().split('T')[0] : '',
        GioiTinh: nv.GioiTinh || 'Nam',
        MoTaCongViec: nv.MoTaCongViec || '',
        TrangThai: nv.TrangThai || 'Đang làm'
      });
    } else {
      setFormData({
        MaNV: 'NV' + Date.now().toString().slice(-4),
        HoTen: '',
        NgaySinh: '',
        GioiTinh: 'Nam',
        Email: '',
        SDT: '',
        DiaChi: '',
        BoPhan: 'Sale / MKT',
        ChucVu: '',
        MoTaCongViec: '',
        Avatar: '',
        TrangThai: 'Đang làm'
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append('image', file);

    try {
      setIsUploading(true);
      const res = await api.post('/files/upload-image', fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFormData({ ...formData, Avatar: res.data.url });
      }
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      alert('Không thể upload ảnh, vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const openView = (nv: NhanVien) => {
    setFormData({
      ...nv,
      NgaySinh: nv.NgaySinh ? new Date(nv.NgaySinh).toISOString().split('T')[0] : ''
    });
    setIsViewModalOpen(true);
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
      console.error('Lỗi lưu nhân viên:', error);
      alert(error.response?.data?.error || 'Lỗi lưu nhân viên');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Chắc chắn muốn xóa nhân viên này?')) {
      try {
        await api.delete(`${API_URL}/${id}`);
        fetchData();
      } catch (error) {
        alert('Lỗi xóa nhân viên');
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, background: 'linear-gradient(to right, #fff, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.02em' }}>
            Hệ Thống Nhân Sự
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '1.1rem' }}>Quản trị hiệu suất & thông tin nhân sự chiến lược</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Users size={22} /></div>
          <div className="kpi-label">Tổng Nhân Sự Của Hệ Thống</div>
          <div className="kpi-value">{STATS.total} Biên chế</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Đang Công Tác / Trực Ca</div>
          <div className="kpi-value">{STATS.active}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Briefcase size={22} /></div>
          <div className="kpi-label">Khối Kinh Doanh & Dịch Vụ</div>
          <div className="kpi-value">{STATS.sale} Nhân sự</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Award size={22} /></div>
          <div className="kpi-label">Khối Sản Xuất & Chuỗi Cung Ứng</div>
          <div className="kpi-value">{STATS.tech} Nhân sự</div>
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
                placeholder="Tìm mã NV, tên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Tất cả Cơ Cấu' },
                { id: 'sale_mkt', label: 'Sale / MKT' },
                { id: 'ketoan', label: 'Kế Toán' },
                { id: 'cskh', label: 'CSKH Bảo Hành' },
                { id: 'logistics', label: 'Kho / Logistics' },
                { id: 'tech_sx', label: 'R&D Kỹ Thuật Máy' },
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
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={exportToExcel} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)', color: 'var(--accent-emerald)' }}>
              <Download size={16} /> Xuất Excel
            </button>
            <button className="btn btn-primary" onClick={() => openForm()}>
              <Plus size={16} /> Cấp mới Tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem', justifyContent: 'center', textAlign: 'center' }}>
        <table className="data-table">
          <thead style={{ justifyContent: 'justify-center' }}>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Ảnh</th>
              <th>Mã NV</th>
              <th>Họ và Tên <br />Nhân Sự</th>
              <th>Phòng Ban <br /> Cốt Lõi</th>
              <th>Chức Danh Giám Sát</th>
              <th>Email</th>
              <th>SDT</th>
              <th style={{ textAlign: 'right' }}>Hiệu suất Công tác</th>
              <th>Trạng thái</th>

              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy nhân viên.</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                    {item.Avatar ? (
                      <img
                        src={getAvatarUrl(item.Avatar)}
                        alt="Ava"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span style="color: var(--text-tertiary); font-weight: 700">${item.HoTen.charAt(0)}</span>`;
                        }}
                      />
                    ) : (
                      <Users size={20} color="var(--text-secondary)" />
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaNV}</td>
                <td
                  style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => openView(item)}
                >
                  {item.HoTen}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.BoPhan}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{item.ChucVu}</td>
                <td>{item.Email}</td>
                <td>{item.SDT}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '15px' }}>
                      {item.BoPhan === 'Kho / Logistics' && `${item.deliveries || 0} Chuyến`}
                      {item.BoPhan === 'R&D Kỹ Thuật Máy' && `${item.tests || 0} Lô hàng`}
                      {item.BoPhan === 'CSKH Bảo Hành' && `${item.customers || 0} Khách hàng`}
                      {(item.BoPhan === 'Sale / MKT' || item.BoPhan === 'Kinh doanh' || !['Kho / Logistics', 'R&D Kỹ Thuật Máy', 'CSKH Bảo Hành'].includes(item.BoPhan)) && (
                        <>
                          <span style={{ display: 'block' }}>{item.orders || 0} Đơn hàng</span>
                          <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', marginTop: '2px' }}>
                            {item.revenue ? item.revenue.toLocaleString() : 0} ₫
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${item.TrangThai === 'Đang làm' || !item.TrangThai ? 'approved' : item.TrangThai === 'Đang nghỉ phép' ? 'warning' : 'rejected'}`}>
                    {item.TrangThai || 'Đang làm'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openForm(item)} className="btn btn-ghost btn-sm"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id!)} className="btn btn-ghost btn-sm"><Trash2 size={16} color="var(--accent-rose)" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal - Xem Chi Tiết Thông Tin Nhân Viên */}
      {isViewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: 20 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: 'var(--spacing-xl)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 20, marginBottom: 24 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, background: 'linear-gradient(to right, #fff, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>HỒ SƠ NHÂN SỰ</h2>
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Mã NV: {formData.MaNV}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <tbody>
                {formData.Avatar && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img src={`http://localhost:5000${formData.Avatar}`} alt={formData.HoTen} style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  </div>
                )}

                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', width: '40%', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Họ và tên:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-primary)' }}>{formData.HoTen}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Trạng thái làm việc:</td>
                  <td style={{ fontWeight: 600, padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: formData.TrangThai === 'Đang nghỉ phép' ? 'var(--accent-amber)' : formData.TrangThai === 'Đã nghỉ việc' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{formData.TrangThai || 'Đang làm'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Ngày sinh:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-primary)' }}>{formData.NgaySinh || 'Chưa cập nhật'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Giới tính:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-primary)' }}>{formData.GioiTinh || 'Chưa cập nhật'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Số điện thoại:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-primary)' }}>{formData.SDT || 'Chưa cập nhật'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Địa chỉ thường trú:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-primary)' }}>{formData.DiaChi || 'Chưa cập nhật'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-tertiary)' }}>Email</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted var(--border-color)', color: 'var(--text-primary)' }}>{formData.Email || 'Chưa cập nhật'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted #ccc' }}>Phòng ban:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted #ccc' }}>{formData.BoPhan}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', borderBottom: '1px dotted #ccc' }}>Chức vụ:</td>
                  <td style={{ padding: '12px 0', borderBottom: '1px dotted #ccc' }}>{formData.ChucVu}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Mô tả công việc hiện tại:</td>
                  <td style={{ padding: '12px 0' }}>{formData.MoTaCongViec || 'Chưa cập nhật'}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                onClick={() => setIsViewModalOpen(false)}
                style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Chuẩn thông tin nhân sự */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '600px', background: '#ffffffff', borderRadius: '8px', padding: '24px', margin: '2rem auto', color: '#000', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>{formData._id ? 'Cập nhật Thông tin nhân sự' : 'Thông tin nhân sự'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Upload Ảnh Đại Diện */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed #ccc', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
                  {formData.Avatar ? (
                    <img src={`http://localhost:5000${formData.Avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '13px', color: '#888' }}>Chưa có ảnh</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ fontSize: '13px', color: '#333' }} />
                {isUploading && <span style={{ color: '#1100f8ff', fontSize: '13px' }}>Đang tải lên...</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Họ và tên</label>
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} placeholder="VD: Nguyễn Văn A" value={formData.HoTen} onChange={e => setFormData({ ...formData, HoTen: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Trạng thái làm việc</label>
                  <select
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff' }}
                    value={formData.TrangThai || 'Đang làm'}
                    onChange={e => setFormData({ ...formData, TrangThai: e.target.value })}
                  >
                    <option value="Đang làm">Đang làm</option>
                    <option value="Đang nghỉ phép">Đang nghỉ phép</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Ngày sinh</label>
                  <input type="date" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} value={formData.NgaySinh} onChange={e => setFormData({ ...formData, NgaySinh: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Giới tính</label>
                  <select
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff' }}
                    value={formData.GioiTinh}
                    onChange={e => setFormData({ ...formData, GioiTinh: e.target.value })}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Số điện thoại</label>
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} value={formData.SDT} onChange={e => setFormData({ ...formData, SDT: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Chức vụ</label>
                  {/* <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} value={formData.ChucVu} onChange={e => setFormData({ ...formData, ChucVu: e.target.value })} /> */}
                  <select
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff' }}
                    value={formData.ChucVu}
                    onChange={e => setFormData({ ...formData, ChucVu: e.target.value })}
                  >
                    <option value="Giám đốc">Giám đốc</option>
                    <option value="Trưởng phòng kinh doanh">Trưởng phòng kinh doanh</option>
                    <option value="Trưởng bộ phận kỹ thuật">Trưởng bộ phận kỹ thuật</option>
                    <option value="Trưởng bộ phận kho / logistic">Trưởng bộ phận kho / logistic</option>
                    <option value="Nhân viên kinh doanh">Nhân viên kinh doanh</option>
                    <option value="Nhân viên kỹ thuật">Nhân viên kỹ thuật</option>
                    <option value="Nhân viên kế toán">Nhân viên kế toán</option>
                    <option value="Nhân viên marketing">Nhân viên marketing</option>
                    <option value="Nhân viên kho / logistic">Nhân viên kho / logistic</option>
                    <option value="Nhân viên CSKH Bảo Hành">Nhân viên CSKH Bảo Hành</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Địa chỉ</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' }} value={formData.DiaChi} onChange={e => setFormData({ ...formData, DiaChi: e.target.value })}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Phòng ban</label>
                  <select
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', background: '#fff' }}
                    value={formData.BoPhan}
                    onChange={e => setFormData({ ...formData, BoPhan: e.target.value })}
                  >
                    <option value="Sale / MKT">Sale / MKT</option>
                    <option value="Kế Toán">Kế Toán</option>
                    <option value="CSKH Bảo Hành">CSKH Bảo Hành</option>
                    <option value="Kho / Logistics">Kho / Logistics</option>
                    <option value="R&D Kỹ Thuật Máy">R&D Kỹ Thuật Máy</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Email</label>
                  <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none' }} value={formData.Email} onChange={e => setFormData({ ...formData, Email: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Mô tả công việc</label>
                <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' }} value={formData.MoTaCongViec} onChange={e => setFormData({ ...formData, MoTaCongViec: e.target.value })}></textarea>
              </div>

            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={handleSubmit}
                style={{ width: '100%', background: '#1100f8ff', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
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
