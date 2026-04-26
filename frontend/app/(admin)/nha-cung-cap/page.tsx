'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building, DollarSign, Briefcase, FileSignature, User, Mail, Phone, MapPin, Receipt, ShoppingCart, X, Download } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import * as XLSX from 'xlsx';

const API_URL = '/nha-cung-cap';

interface NhaCungCap {
  _id?: string;
  MaNCC: string;
  TenNCC: string;
  MaSoThue?: string;
  NguoiLienHe?: string;
  DiaChi?: string;
  SDT: string;
  Email?: string;
  PhanLoai?: 'Đối Tác Chính' | 'Đối Tác Phụ';
  CongNo?: number;
}

interface PhieuDatHang {
  _id: string;
  MaPhieu: string;
  NgayDat: string;
  TongTien: number;
  TrangThai: string;
  NguoiLap?: string;
  ChiTiet?: Array<{
    MaItem: string;
    TenItem: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
  }>;
}

interface PhieuNhapXuat {
  _id: string;
  MaPhieu: string;
  createdAt: string;
  TongTien: number;
  LoaiPhieu: string;
}

export default function NhaCungCapPage() {
  const [data, setData] = useState<NhaCungCap[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [poList, setPoList] = useState<PhieuDatHang[]>([]);
  const [receiptList, setReceiptList] = useState<PhieuNhapXuat[]>([]);
  const [selectedNCC, setSelectedNCC] = useState<NhaCungCap | null>(null);
  const [selectedPO, setSelectedPO] = useState<PhieuDatHang | null>(null);

  // PO Form states
  const [isPOFormOpen, setIsPOFormOpen] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]); // New list for staff reference
  const [newPOData, setNewPOData] = useState({
    MaPhieu: '',
    NgayDat: new Date().toISOString().split('T')[0],
    NguoiLap: '', // Still holds the MaNV code
    GhiChu: '',
    ChiTiet: [{ MaItem: '', TenItem: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]
  });
  const [formData, setFormData] = useState<NhaCungCap>({
    MaNCC: '', TenNCC: '', SDT: '', PhanLoai: 'Đối Tác Chính', CongNo: 0,
    MaSoThue: '', Email: '', DiaChi: '', NguoiLienHe: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(API_URL);
      if (res.data.success) setData(res.data.data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const openForm = (ncc?: NhaCungCap) => {
    if (ncc) setFormData({
      ...ncc,
      MaSoThue: ncc.MaSoThue || '',
      Email: ncc.Email || '',
      DiaChi: ncc.DiaChi || '',
      NguoiLienHe: ncc.NguoiLienHe || ''
    });
    else setFormData({ MaNCC: 'NCC' + Date.now().toString().slice(-4), TenNCC: '', SDT: '', PhanLoai: 'Đối Tác Chính', CongNo: 0, MaSoThue: '', Email: '', DiaChi: '', NguoiLienHe: '' });
    setIsModalOpen(true);
  };

  const openDetail = (ncc: NhaCungCap) => {
    setSelectedNCC(ncc);
    setIsDetailModalOpen(true);
    setSelectedPO(null); // Reset PO selection when switching NCC
    if (ncc._id) fetchHistory(ncc._id);
  };

  const fetchHistory = async (id: string) => {
    try {
      setIsHistoryLoading(true);
      const [poRes, receiptRes] = await Promise.all([
        api.get(`${API_URL}/${id}/vouchers/po`),
        api.get(`${API_URL}/${id}/vouchers/receipts`)
      ]);
      if (poRes.data.success) setPoList(poRes.data.data);
      if (receiptRes.data.success) setReceiptList(receiptRes.data.data);
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const openPOForm = async () => {
    setIsPOFormOpen(true);
    setNewPOData({
      MaPhieu: 'PDH' + Date.now().toString().slice(-4),
      NgayDat: new Date().toISOString().split('T')[0],
      NguoiLap: '',
      GhiChu: '',
      ChiTiet: [{ MaItem: '', TenItem: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]
    });
    try {
      const [matRes, empRes] = await Promise.all([
        api.get('/kho/nguyen-vat-lieu'),
        api.get('/nhan-vien')
      ]);

      if (matRes.data.success) {
        // Lọc NVL theo nhà cung cấp hiện tại, kèm theo NVL chưa gán NCC
        const filtered = matRes.data.data.filter((m: any) =>
          !m.NhaCungCap || m.NhaCungCap._id === selectedNCC?._id
        );
        setMaterials(filtered);
      }

      if (empRes.data.success) {
        setEmployees(empRes.data.data);
      }
    } catch (error) { console.error('Lỗi tải dữ liệu tham chiếu:', error); }
  };

  const handlePOItemChange = (index: number, field: string, value: any) => {
    const newChiTiet = [...newPOData.ChiTiet];
    const item = { ...newChiTiet[index], [field]: value };

    if (field === 'MaItem') {
      const mat = materials.find(m => m.MaNVL === value);
      if (mat) {
        item.TenItem = mat.TenNguyenVatLieu || mat.TenNVL;
        item.DonGia = mat.GiaNhapDinhMuc || mat.DonGia || 0;
      }
    }

    item.ThanhTien = item.SoLuong * item.DonGia;
    newChiTiet[index] = item;
    setNewPOData({ ...newPOData, ChiTiet: newChiTiet });
  };

  const addPOItem = () => {
    setNewPOData({
      ...newPOData,
      ChiTiet: [...newPOData.ChiTiet, { MaItem: '', TenItem: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]
    });
  };

  const submitPO = async () => {
    if (!selectedNCC?._id) return;
    try {
      const total = newPOData.ChiTiet.reduce((sum, i) => sum + i.ThanhTien, 0);
      const res = await api.post(`${API_URL}/${selectedNCC._id}/vouchers/po`, { ...newPOData, TongTien: total });
      if (res.data.success) {
        setIsPOFormOpen(false);
        fetchHistory(selectedNCC._id);
      }
    } catch (error: any) { alert(error.response?.data?.error || 'Lỗi lưu phiếu đặt'); }
  };

  const handleSubmit = async () => {
    try {
      if (formData._id) await api.put(`${API_URL}/${formData._id}`, formData);
      else await api.post(API_URL, formData);
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) { alert(error.response?.data?.error || 'Lỗi lưu NCC'); }
  };

  const STATS = {
    total: data.length,
    chinh: data.filter(d => d.PhanLoai === 'Đối Tác Chính').length,
    noTotal: data.reduce((sum, d) => sum + (d.CongNo || 0), 0),
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.TenNCC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.MaNCC.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || item.PhanLoai === filter;
    return matchSearch && matchFilter;
  });

  const exportToExcel = () => {
    const dataToExport = filteredData.map(item => ({
      'Mã NCC': item.MaNCC,
      'Tên Nhà Cung Cấp': item.TenNCC,
      'Mã Số Thuế': item.MaSoThue || '',
      'Người Liên Hệ': item.NguoiLienHe || '',
      'SĐT': item.SDT || '',
      'Email': item.Email || '',
      'Phân Loại': item.PhanLoai || 'Đối Tác Chính',
      'Công Nợ': item.CongNo || 0,
      'Địa Chỉ': item.DiaChi || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nha-Cung-Cap");
    XLSX.writeFile(workbook, `VTSC_Danh_Sach_Nha_Cung_Cap_${new Date().toLocaleDateString().replace(/\//g, '_')}.xlsx`);
  };

  return (
    <div>
      {/* Background Mesh */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: '400px', height: '400px', background: 'rgba(37, 99, 235, 0.08)', filter: 'blur(160px)', zIndex: -1, pointerEvents: 'none', opacity: 0.3 }}></div>
      <div style={{ position: 'fixed', bottom: '15%', right: '15%', width: '350px', height: '350px', background: 'rgba(124, 58, 237, 0.08)', filter: 'blur(140px)', zIndex: -1, pointerEvents: 'none', opacity: 0.3 }}></div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, background: 'white', color: 'black', margin: 0 }}>
          Đối Tác Cung Ứng
        </h1>
        <p style={{ color: '#475569', fontSize: '1.1rem', marginTop: '0.25rem' }}>Quản lý chuỗi cung ứng và công nợ đối tác chiến lược</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Building size={22} /></div>
          <div className="kpi-label">Tổng Nhà Cung Cấp</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><FileSignature size={22} /></div>
          <div className="kpi-label">Đội Tác Chính Chiến Lược</div>
          <div className="kpi-value">{STATS.chinh}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Briefcase size={22} /></div>
          <div className="kpi-label">Đối Tác Dự Phòng</div>
          <div className="kpi-value">{STATS.total - STATS.chinh}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><DollarSign size={22} /></div>
          <div className="kpi-label">Tổng Nợ Còn Đọng</div>
          <div className="kpi-value">{(STATS.noTotal / 1000000).toLocaleString()} Tr</div>
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
                placeholder="Tìm mã NCC, tên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'Đối Tác Chính', label: 'Đối Tác Chính' },
                { id: 'Đối Tác Phụ', label: 'Đối Tác Phụ' }
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
              <Plus size={16} /> Thêm NCC
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Mã NCC</th>
              <th>Tên Nhà Cung Cấp</th>
              <th>Mã Số Thuế</th>
              <th>Người liên hệ đại diện</th>
              <th>Điện thoại</th>
              <th>Phân loại</th>
              <th>Công nợ hiện tại</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy nhà cung cấp.</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaNCC}</td>
                <td
                  style={{ fontWeight: 600, color: '#0f172a', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => openDetail(item)}
                >
                  {item.TenNCC}
                </td>
                <td style={{ fontWeight: 700, color: '#2563eb' }}>{item.MaSoThue}</td>
                <td>{item.NguoiLienHe || '---'}</td>
                <td>{item.SDT}</td>
                <td>
                  <span className={`badge ${item.PhanLoai === 'Đối Tác Chính' || !item.PhanLoai ? 'approved' : item.PhanLoai === 'Đối Tác Phụ' ? 'warning' : 'rejected'}`}>
                    {item.PhanLoai || 'Đối Tác Chính'}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: (item.CongNo || 0) > 0 ? '#d97706' : '#059669' }}>
                  {(item.CongNo || 0).toLocaleString()} ₫
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => openForm(item)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Edit size={16} /></button>
                  <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"><Trash2 size={16} color="#e11d48" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Cập nhật - Chuẩn thông tin nhân sự */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', padding: 20 }}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '100%', maxWidth: '600px', padding: '2.25rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, background: 'linear-gradient(to right, #fff, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formData._id ? 'Cập Nhật Đối Tác' : 'Thiết Lập Đối Tác Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ padding: 4 }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Tên nhà cung cấp</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} placeholder="VD: Hóa chất Vinachem" value={formData.TenNCC} onChange={e => setFormData({ ...formData, TenNCC: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Mã nhà cung cấp</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.MaNCC} onChange={e => setFormData({ ...formData, MaNCC: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Mã số thuế</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.MaSoThue} onChange={e => setFormData({ ...formData, MaSoThue: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Phân loại</label>
                  <select className="form-select" style={{ width: '100%' }} value={formData.PhanLoai} onChange={e => setFormData({ ...formData, PhanLoai: e.target.value as 'Đối Tác Chính' | 'Đối Tác Phụ' })}>
                    <option value="Đối Tác Chính">Đối tác chính</option>
                    <option value="Đối Tác Phụ">Đối tác phụ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Số điện thoại</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} value={formData.SDT} onChange={e => setFormData({ ...formData, SDT: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Email liên hệ</label>
                  <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} placeholder="example@gmail.com" value={formData.Email || ''} onChange={e => setFormData({ ...formData, Email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="form-label">Người liên hệ đại diện</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: '100%' }} placeholder="VD: Ông Nguyễn Văn A" value={formData.NguoiLienHe || ''} onChange={e => setFormData({ ...formData, NguoiLienHe: e.target.value })} />
              </div>

              <div>
                <label className="form-label">Địa chỉ trụ sở</label>
                <textarea className="form-textarea" style={{ width: '100%' }} value={formData.DiaChi || ''} onChange={e => setFormData({ ...formData, DiaChi: e.target.value })}></textarea>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                style={{ width: '100%', fontSize: '16px' }}
              >
                Lưu hồ sơ đối tác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedNCC && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '900px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', margin: '2rem auto', color: '#0f172a', position: 'relative' }}>
            <button onClick={() => setIsDetailModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={24} /></button>

            <div style={{ display: 'flex', gap: 32, marginBottom: 32, borderBottom: '1px solid #e2e8f0', paddingBottom: 24 }}>
              <div style={{ width: 120, height: 120, borderRadius: '12px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                <Building size={64} color="#2563eb" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{selectedNCC.TenNCC}</h2>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}><User size={16} /> {selectedNCC.NguoiLienHe || 'Chưa cập nhật'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}><Phone size={16} /> {selectedNCC.SDT}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}><Mail size={16} /> {selectedNCC.Email || 'Chưa cập nhật'}</div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#475569' }}><MapPin size={16} /> {selectedNCC.DiaChi || 'Chưa cập nhật địa chỉ trụ sở'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20, gridColumn: selectedPO ? 'span 2' : 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}><ShoppingCart size={18} /> Phiếu Đặt Hàng</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedPO && <button onClick={() => setSelectedPO(null)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: 12 }}>← Quay lại danh sách</button>}
                    <button onClick={openPOForm} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: 12 }}>+ Tạo mới</button>
                  </div>
                </div>

                {isHistoryLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#475569' }}>Đang tải...</div>
                ) : poList.length === 0 ? (
                  <div style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', borderRadius: 8, color: '#475569', fontSize: 13 }}>
                    Chưa có phiếu đặt hàng nào
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 20 }}>
                    {/* Sidebar List (Visible mainly when selectedPO is true, or full width if not) */}
                    <div style={{ flex: selectedPO ? '0 0 240px' : '1', maxHeight: 300, overflowY: 'auto', borderRight: selectedPO ? '1px solid #e2e8f0' : 'none', paddingRight: selectedPO ? 16 : 0 }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#ffffff', zIndex: 1 }}>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '8px 4px' }}>Mã Phiếu</th>
                            {!selectedPO && <th>Ngày Đặt</th>}
                            {!selectedPO && <th style={{ textAlign: 'right' }}>Tổng Tiền</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {poList.map(p => (
                            <tr
                              key={p._id}
                              onClick={() => setSelectedPO(p)}
                              style={{
                                borderBottom: '1px dotted #e2e8f0',
                                cursor: 'pointer',
                                background: selectedPO?._id === p._id ? 'var(--bg-color)' : 'transparent'
                              }}
                            >
                              <td style={{ padding: '8px 4px', color: '#2563eb', fontWeight: 600 }}>{p.MaPhieu}</td>
                              {!selectedPO && <td>{new Date(p.NgayDat).toLocaleDateString()}</td>}
                              {!selectedPO && <td style={{ textAlign: 'right' }}>{p.TongTien.toLocaleString()}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Detail Panel (Visible only when selectedPO is true) */}
                    {selectedPO && (
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '12px', borderRadius: 8, background: 'var(--bg-color)', border: '1px solid #e2e8f0' }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase' }}>Ngày đặt hàng</div>
                            <div style={{ fontWeight: 600 }}>{new Date(selectedPO.NgayDat).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase' }}>NV Phụ trách</div>
                            <div style={{ fontWeight: 600, color: '#2563eb' }}>{selectedPO.NguoiLap || 'ADMIN_SYS'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase' }}>Trạng thái</div>
                            <span className="badge approved">{selectedPO.TrangThai}</span>
                          </div>
                        </div>

                        <table style={{ width: '100%', fontSize: 12 }}>
                          <thead style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <tr style={{ textAlign: 'left', color: '#475569' }}>
                              <th style={{ padding: '8px 0' }}>Mã NVL</th>
                              <th>Số lượng</th>
                              <th style={{ textAlign: 'right' }}>Đơn giá</th>
                              <th style={{ textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPO.ChiTiet?.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '8px 0', fontWeight: 500 }}>{item.MaItem}</td>
                                <td>{item.SoLuong}</td>
                                <td style={{ textAlign: 'right' }}>{item.DonGia.toLocaleString()}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.ThanhTien.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'right', padding: '12px 0', fontWeight: 700 }}>TỔNG CỘNG:</td>
                              <td style={{ textAlign: 'right', color: '#059669', fontWeight: 700, fontSize: 14 }}>
                                {selectedPO.TongTien.toLocaleString()} ₫
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>

            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setIsDetailModalOpen(false); openForm(selectedNCC); }} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700">Chỉnh sửa hồ sơ</button>
              <button onClick={() => setIsDetailModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Đóng hồ sơ</button>
            </div>
          </div>
        </div>
      )}

      {/* New PO Form Modal */}
      {isPOFormOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#2563eb' }}>Lập Phiếu Đặt Hàng Mới</h3>
              <button onClick={() => setIsPOFormOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Mã Phiếu</label>
                <input disabled value={newPOData.MaPhieu} style={{ width: '100%', background: '#1e293b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: 6, color: '#0f172a' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Ngày Đặt</label>
                <input type="date" value={newPOData.NgayDat} onChange={e => setNewPOData({ ...newPOData, NgayDat: e.target.value })} style={{ width: '100%', background: '#1e293b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: 6, color: '#0f172a' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>NV Phụ trách đặt hàng</label>
                <select
                  value={newPOData.NguoiLap}
                  onChange={e => setNewPOData({ ...newPOData, NguoiLap: e.target.value })}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: 6, color: '#0f172a', outline: 'none' }}
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp.MaNV}>[{emp.MaNV}] {emp.HoTen}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Danh sách vật tư đặt hàng</span>
                <button onClick={addPOItem} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: 12, color: '#2563eb' }}>+ Thêm dòng</button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Vật tư</th>
                      <th>Số lượng</th>
                      <th>Đơn giá dự kiến</th>
                      <th style={{ textAlign: 'right', paddingRight: '10px' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newPOData.ChiTiet.map((item, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}>
                          <select
                            value={item.MaItem}
                            onChange={e => handlePOItemChange(idx, 'MaItem', e.target.value)}
                            style={{ width: '100%', background: '#1e293b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: 6, color: '#0f172a', outline: 'none' }}
                          >
                            <option value="">Chọn vật tư...</option>
                            {materials.map(m => <option key={m._id} value={m.MaNVL}>[{m.MaNVL}] {m.TenNguyenVatLieu || m.TenNVL} ({m.DonViTinh || m.DonVi})</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={item.SoLuong}
                            onChange={e => handlePOItemChange(idx, 'SoLuong', parseInt(e.target.value))}
                            style={{ width: '80px', background: 'transparent', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 4, color: '#0f172a' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.DonGia}
                            onChange={e => handlePOItemChange(idx, 'DonGia', parseInt(e.target.value))}
                            style={{ width: '120px', background: 'transparent', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 4, color: '#0f172a' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '10px', fontWeight: 600 }}>
                          {item.ThanhTien.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
              <div style={{ color: '#475569' }}>
                Tổng cộng: <span style={{ color: '#059669', fontSize: 18, fontWeight: 700, marginLeft: 8 }}>{newPOData.ChiTiet.reduce((sum, i) => sum + i.ThanhTien, 0).toLocaleString()} ₫</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setIsPOFormOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700">Hủy</button>
                <button onClick={submitPO} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Xác nhận đặt hàng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
