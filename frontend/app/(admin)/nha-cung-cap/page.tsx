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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Building size={22} />
            </div>
            Đối Tác Cung Ứng
          </h1>
          <p className="text-slate-400 font-medium mt-1">Quản lý chuỗi cung ứng và công nợ đối tác chiến lược</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Nhà Cung Cấp</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.total} <span className="text-sm font-bold text-slate-400">Đối tác</span></h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Building size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đối Tác Chính</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.chinh} <span className="text-sm font-bold text-slate-400">Chiến lược</span></h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSignature size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đối Tác Dự Phòng</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{STATS.total - STATS.chinh} <span className="text-sm font-bold text-slate-400">Đơn vị</span></h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase size={24} />
            </div>
          </div>
        </div>

        <div className="kpi-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng Nợ Đọng</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{(STATS.noTotal / 1000000).toLocaleString()} <span className="text-sm font-bold text-slate-400">Tr.VNĐ</span></h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                placeholder="Tìm mã NCC, tên..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'Đối Tác Chính', label: 'Đối Tác Chính' },
                { id: 'Đối Tác Phụ', label: 'Đối Tác Phụ' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${filter === f.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
            >
              <Download size={18} /> Xuất Excel
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              onClick={() => openForm()}
            >
              <Plus size={18} /> Thêm NCC
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Mã NCC</th>
                <th>Thông tin đối tác</th>
                <th>Thông tin liên hệ</th>
                <th className="text-center">Phân loại</th>
                <th className="text-right">Công nợ hiện tại</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-20 text-blue-600 font-bold">Đang tải dữ liệu...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-medium italic">Không tìm thấy nhà cung cấp.</td></tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className="hover:bg-blue-50/30 group">
                  <td>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[13px]">{item.MaNCC}</span>
                  </td>
                  <td className="min-w-[200px]">
                    <div className="font-bold text-slate-900 text-[15px] cursor-pointer hover:text-blue-600 transition-colors" onClick={() => openDetail(item)}>
                      {item.TenNCC}
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">MST: {item.MaSoThue || 'N/A'}</div>
                  </td>
                  <td>
                    <div className="text-[14px] font-medium text-slate-900">{item.NguoiLienHe || '---'}</div>
                    <div className="text-[13px] font-bold text-slate-400 mt-0.5">{item.SDT}</div>
                  </td>
                  <td className="text-center">
                    <span className={`status-badge ${item.PhanLoai === 'Đối Tác Chính' || !item.PhanLoai ? 'status-active' :
                      item.PhanLoai === 'Đối Tác Phụ' ? 'status-warning' : 'status-error'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.PhanLoai === 'Đối Tác Chính' || !item.PhanLoai ? 'bg-emerald-500' :
                        item.PhanLoai === 'Đối Tác Phụ' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}></div>
                      {item.PhanLoai || 'Đối Tác Chính'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className={`font-black text-[16px] ${(item.CongNo || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {(item.CongNo || 0).toLocaleString()} ₫
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openForm(item)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                        <Edit size={18} />
                      </button>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cập nhật - Chuẩn thông tin nhân sự */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900">{formData._id ? 'Cập Nhật Đối Tác' : 'Thiết Lập Đối Tác Mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Tên nhà cung cấp</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" placeholder="VD: Hóa chất Vinachem" value={formData.TenNCC} onChange={e => setFormData({ ...formData, TenNCC: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mã nhà cung cấp</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.MaNCC} onChange={e => setFormData({ ...formData, MaNCC: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mã số thuế</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.MaSoThue} onChange={e => setFormData({ ...formData, MaSoThue: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Phân loại</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.PhanLoai} onChange={e => setFormData({ ...formData, PhanLoai: e.target.value as 'Đối Tác Chính' | 'Đối Tác Phụ' })}>
                    <option value="Đối Tác Chính">Đối tác chính</option>
                    <option value="Đối Tác Phụ">Đối tác phụ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Số điện thoại</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" value={formData.SDT} onChange={e => setFormData({ ...formData, SDT: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Email liên hệ</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" placeholder="example@gmail.com" value={formData.Email || ''} onChange={e => setFormData({ ...formData, Email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Người liên hệ đại diện</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10" placeholder="VD: Ông Nguyễn Văn A" value={formData.NguoiLienHe || ''} onChange={e => setFormData({ ...formData, NguoiLienHe: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Địa chỉ trụ sở</label>
                <textarea rows={3} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 resize-none" value={formData.DiaChi || ''} onChange={e => setFormData({ ...formData, DiaChi: e.target.value })}></textarea>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all cursor-pointer">Hủy</button>
              <button onClick={handleSubmit} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">Lưu hồ sơ đối tác</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedNCC && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900">Chi Tiết Đối Tác Cung Ứng</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-slate-100">
                <div className="w-32 h-32 rounded-[24px] bg-blue-50 flex items-center justify-center border-4 border-white shadow-lg">
                  <Building size={48} className="text-blue-600" />
                </div>
                <div className="flex-1 space-y-4">
                  <h2 className="text-3xl font-black text-slate-900">{selectedNCC.TenNCC}</h2>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600"><User size={18} className="text-slate-400" /> {selectedNCC.NguoiLienHe || 'Chưa cập nhật'}</div>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600"><Phone size={18} className="text-slate-400" /> {selectedNCC.SDT}</div>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600"><Mail size={18} className="text-slate-400" /> {selectedNCC.Email || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="flex items-center gap-2 text-[14px] font-bold text-slate-600"><MapPin size={18} className="text-slate-400" /> {selectedNCC.DiaChi || 'Chưa cập nhật địa chỉ trụ sở'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`bg-white border border-slate-100 rounded-[24px] shadow-sm p-6 ${selectedPO ? 'col-span-2' : ''}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><ShoppingCart size={20} className="text-blue-600" /> Phiếu Đặt Hàng</h4>
                    <div className="flex items-center gap-2">
                      {selectedPO && <button onClick={() => setSelectedPO(null)} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl font-bold text-[13px] hover:bg-slate-100 transition-colors">← Quay lại danh sách</button>}
                      <button onClick={openPOForm} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-[13px] hover:bg-blue-100 transition-colors">+ Tạo mới</button>
                    </div>
                  </div>

                  {isHistoryLoading ? (
                    <div className="text-center py-10 text-blue-600 font-bold">Đang tải...</div>
                  ) : poList.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium italic border-2 border-dashed border-slate-100 rounded-2xl">
                      Chưa có phiếu đặt hàng nào
                    </div>
                  ) : (
                    <div className={`flex flex-col ${selectedPO ? 'lg:flex-row' : ''} gap-6`}>
                      {/* Sidebar List */}
                      <div className={`flex-1 ${selectedPO ? 'lg:max-w-[280px] lg:border-r border-slate-100 lg:pr-6' : ''} max-h-[400px] overflow-y-auto`}>
                        <table className="w-full text-left">
                          <thead className="sticky top-0 bg-white">
                            <tr>
                              <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase">Mã Phiếu</th>
                              {!selectedPO && <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase">Ngày Đặt</th>}
                              {!selectedPO && <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase text-right">Tổng Tiền</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {poList.map(p => (
                              <tr
                                key={p._id}
                                onClick={() => setSelectedPO(p)}
                                className={`border-b border-slate-50 cursor-pointer transition-colors ${selectedPO?._id === p._id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                              >
                                <td className="py-3 font-bold text-blue-600">{p.MaPhieu}</td>
                                {!selectedPO && <td className="py-3 font-medium text-slate-600">{new Date(p.NgayDat).toLocaleDateString()}</td>}
                                {!selectedPO && <td className="py-3 font-black text-slate-900 text-right">{p.TongTien.toLocaleString()}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Detail Panel */}
                      {selectedPO && (
                        <div className="flex-2">
                          <div className="flex justify-between mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Ngày đặt hàng</div>
                              <div className="font-bold text-slate-900">{new Date(selectedPO.NgayDat).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">NV Phụ trách</div>
                              <div className="font-bold text-blue-600">{selectedPO.NguoiLap || 'ADMIN_SYS'}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Trạng thái</div>
                              <span className="status-badge status-active">{selectedPO.TrangThai}</span>
                            </div>
                          </div>

                          <table className="w-full text-left">
                            <thead className="border-b border-slate-100">
                              <tr>
                                <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase">Mã NVL</th>
                                <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase text-center">SL</th>
                                <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase text-right">Đơn giá</th>
                                <th className="pb-3 text-[12px] font-bold text-slate-400 uppercase text-right">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedPO.ChiTiet?.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-50">
                                  <td className="py-3 font-bold text-slate-900">{item.MaItem}</td>
                                  <td className="py-3 font-medium text-slate-600 text-center">{item.SoLuong}</td>
                                  <td className="py-3 font-medium text-slate-600 text-right">{item.DonGia.toLocaleString()}</td>
                                  <td className="py-3 font-black text-slate-900 text-right">{item.ThanhTien.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={3} className="py-4 text-right font-black text-slate-400 uppercase">Tổng cộng:</td>
                                <td className="py-4 text-right text-lg font-black text-emerald-600">
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
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => { setIsDetailModalOpen(false); openForm(selectedNCC); }} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">Chỉnh sửa hồ sơ</button>
              <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Đóng hồ sơ</button>
            </div>
          </div>
        </div>
      )}

      {/* New PO Form Modal */}
      {isPOFormOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-black text-slate-900">Lập Phiếu Đặt Hàng Mới</h3>
              <button onClick={() => setIsPOFormOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-[24px]">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Mã Phiếu</label>
                  <input disabled value={newPOData.MaPhieu} className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-600 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">Ngày Đặt</label>
                  <input type="date" value={newPOData.NgayDat} onChange={e => setNewPOData({ ...newPOData, NgayDat: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-400 uppercase ml-1">NV Phụ trách đặt hàng</label>
                  <select
                    value={newPOData.NguoiLap}
                    onChange={e => setNewPOData({ ...newPOData, NguoiLap: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp.MaNV}>[{emp.MaNV}] {emp.HoTen}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-900 text-[16px]">Danh sách vật tư đặt hàng</h4>
                  <button onClick={addPOItem} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-[13px] hover:bg-blue-100 transition-colors">+ Thêm dòng</button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-[12px] font-bold text-slate-400 uppercase">Vật tư</th>
                        <th className="p-4 text-[12px] font-bold text-slate-400 uppercase">Số lượng</th>
                        <th className="p-4 text-[12px] font-bold text-slate-400 uppercase">Đơn giá dự kiến</th>
                        <th className="p-4 text-[12px] font-bold text-slate-400 uppercase text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {newPOData.ChiTiet.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-4">
                            <select
                              value={item.MaItem}
                              onChange={e => handlePOItemChange(idx, 'MaItem', e.target.value)}
                              className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none"
                            >
                              <option value="">Chọn vật tư...</option>
                              {materials.map(m => <option key={m._id} value={m.MaNVL}>[{m.MaNVL}] {m.TenNguyenVatLieu || m.TenNVL} ({m.DonViTinh || m.DonVi})</option>)}
                            </select>
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              min="1"
                              value={item.SoLuong}
                              onChange={e => handlePOItemChange(idx, 'SoLuong', parseInt(e.target.value) || 0)}
                              className="w-24 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              value={item.DonGia}
                              onChange={e => handlePOItemChange(idx, 'DonGia', parseInt(e.target.value) || 0)}
                              className="w-32 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/10 outline-none"
                            />
                          </td>
                          <td className="p-4 text-right font-black text-slate-900 text-[15px]">
                            {item.ThanhTien.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="font-bold text-slate-500">
                Tổng cộng: <span className="text-xl font-black text-emerald-600 ml-2">{newPOData.ChiTiet.reduce((sum, i) => sum + i.ThanhTien, 0).toLocaleString()} ₫</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsPOFormOpen(false)} className="px-6 py-3 bg-white text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">Hủy</button>
                <button onClick={submitPO} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Xác nhận đặt hàng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
