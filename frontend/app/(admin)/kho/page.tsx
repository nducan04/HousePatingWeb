'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, ArrowDownToLine, ArrowUpToLine, AlertTriangle, FileCheck, ClipboardList, TrendingDown, Eye, Printer, Beaker, ArrowRightLeft, Download } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import * as XLSX from 'xlsx';

const API_KHO = '/kho';

interface KhoItem {
  _id: string;
  MaSanPham: string;
  TenDongSon: string;
  PhanLoai: string;
  TonKho: number;
  DonGiaCoSo: number;
  SoLuong: number;
}

interface PhieuKiemKe {
  _id: string;
  MaPhieu: string;
  TrangThai: string;
  TongChenhLech: number;
  NguoiKiem?: { MaNV: string, HoTen: string };
  createdAt: string;
  ChiTiet: Array<{
    Sanpham: { MaSanPham: string, TenDongSon: string, DonGiaCoSo: number },
    TonKhoHT: number,
    TonThucTe: number,
    ChenhLech: number,
    DonGia: number,
    ThanhTienChenhLech: number,
    SoLuong: number
  }>;
}

interface NguyenVatLieu {
  _id: string;
  MaNVL: string;
  TenNguyenVatLieu: string;
  PhanLoai: string;
  TonKho: number;
  DonViTinh: string;
  DonGia: number;
  NhaCungCap?: { _id: string; MaNCC: string; TenNCC: string } | null;
  GiaNhapDinhMuc?: number;
  SoLuong: number;
}

interface NhaCungCapItem {
  _id: string;
  MaNCC: string;
  TenNCC: string;
}

interface PhieuNhapXuat {
  _id: string;
  MaPhieu: string;
  LoaiPhieu: string;
  LoaiHang: string;
  TongTien: number;
  MaNhanVienPhuTrach: string;
  MoTa?: string;
  createdAt: string;
  SoLuong: number;
}

export default function QuanLyKhoPage() {
  const [activeTab, setActiveTab] = useState<'kho' | 'nvl' | 'kiemke' | 'nhapxuat'>('kho');
  const [data, setData] = useState<KhoItem[]>([]);
  const [phieuData, setPhieuData] = useState<PhieuKiemKe[]>([]);
  const [nvlData, setNvlData] = useState<NguyenVatLieu[]>([]);
  const [phieuNXData, setPhieuNXData] = useState<PhieuNhapXuat[]>([]);
  const [nccList, setNccList] = useState<NhaCungCapItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isKiemKhoModal, setIsKiemKhoModal] = useState(false);
  const [kiemKhoItems, setKiemKhoItems] = useState([{ Sanpham: '', TonThucTe: 0 }]);
  const [selectedPhieu, setSelectedPhieu] = useState<PhieuKiemKe | null>(null);
  const [maNVKiemKe, setMaNVKiemKe] = useState(''); // Kept for state but will be hidden

  const [isNVLModal, setIsNVLModal] = useState(false);
  const [editingNVLId, setEditingNVLId] = useState<string | null>(null);
  const [nvlForm, setNvlForm] = useState({ MaNVL: '', TenNguyenVatLieu: '', PhanLoai: 'Bột màu', DonViTinh: 'Kg', DonGia: 0, TonKho: 0, NhaCungCap: '' });

  const [isNXModal, setIsNXModal] = useState(false);
  const [editingNXId, setEditingNXId] = useState<string | null>(null);
  const [nxForm, setNxForm] = useState({ MaPhieu: '', LoaiPhieu: 'NHAP', LoaiHang: 'SAN_PHAM', MoTa: '', GhiChu: '', NhaCungCapID: '' });
  const [nxItems, setNxItems] = useState([{ ItemId: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]);

  useEffect(() => {
    fetchTonKho();
    fetchPhieuKiemKho();
    fetchNguyenVatLieu();
    fetchPhieuNhapXuat();
    fetchNhaCungCap();
  }, []);

  const fetchTonKho = async () => {
    try {
      const res = await api.get(API_KHO);
      if (res.data.success) setData(res.data.data);
    } catch (error) { console.error(error); }
  };

  const fetchPhieuKiemKho = async () => {
    try {
      const res = await api.get(`${API_KHO}/kiem-kho`);
      if (res.data.success) setPhieuData(res.data.data);
    } catch (error) { console.error(error); }
  };

  const fetchNguyenVatLieu = async () => {
    try {
      const res = await api.get(`${API_KHO}/nguyen-vat-lieu`);
      if (res.data.success) setNvlData(res.data.data);
    } catch (error) { console.error(error); }
  };

  const fetchPhieuNhapXuat = async () => {
    try {
      const res = await api.get(`${API_KHO}/nhap-xuat`);
      if (res.data.success) setPhieuNXData(res.data.data);
    } catch (error) { console.error(error); }
  };

  const fetchNhaCungCap = async () => {
    try {
      const res = await api.get('/nha-cung-cap');
      if (res.data.success) setNccList(res.data.data);
    } catch (error) { console.error(error); }
  };

  // KPI
  const STATS = {
    total: data.length,
    tonTotal: data.reduce((sum, d) => sum + (d.TonKho || 0), 0),
    warning: data.filter(d => (d.TonKho || 0) < 100).length,
  };

  // ----- KIỂM KHO LOGIC -----
  const handleAddKiemKhoItem = () => {
    setKiemKhoItems([...kiemKhoItems, { Sanpham: '', TonThucTe: 0 }]);
  };

  const handleSubmitKiemKho = async () => {
    try {
      const validItems = kiemKhoItems.filter(i => i.Sanpham !== '');
      if (validItems.length === 0) return alert('Vui lòng nhập sản phẩm cần kiểm kê');

      await api.post(`${API_KHO}/kiem-kho`, {
        ChiTiet: validItems,
        MaPhieu: 'PKK' + Date.now().toString().slice(-4),
      });
      alert('Kiểm kê thành công! Vui lòng vào Danh sách Phiếu để xem và chốt số lượng.');
      setIsKiemKhoModal(false);
      setKiemKhoItems([{ Sanpham: '', TonThucTe: 0 }]);
      setMaNVKiemKe('');
      fetchPhieuKiemKho();
    } catch (error: any) { alert(error.response?.data?.message || 'Lỗi tạo phiếu kiểm kê'); }
  };

  const hoanThanhPhiếu = async (maPhieu: string) => {
    if (!confirm('Xác nhận Cân bằng Kho theo biên bản này? Thao tác này sẽ áp số lượng thực tế trực tiếp lên tồn kho hiện hành.')) return;
    try {
      await api.post(`${API_KHO}/kiem-kho/${maPhieu}/hoan-thanh`);
      alert('Đã cập nhật tồn kho thành công!');
      fetchTonKho();
      fetchPhieuKiemKho();
    } catch (err: any) { alert(err.response?.data?.message || 'Lỗi chốt phiếu'); }
  }

  // ----- NGUYÊN VẬT LIÊU LOGIC -----
  const openCreateNVL = () => {
    setEditingNVLId(null);
    setNvlForm({ MaNVL: '', TenNguyenVatLieu: '', PhanLoai: 'Bột màu', DonViTinh: 'Kg', DonGia: 0, TonKho: 0, NhaCungCap: '' });
    setIsNVLModal(true);
  };

  const openEditNVL = (item: NguyenVatLieu) => {
    setEditingNVLId(item._id);
    setNvlForm({
      MaNVL: item.MaNVL,
      TenNguyenVatLieu: item.TenNguyenVatLieu,
      PhanLoai: item.PhanLoai,
      DonViTinh: item.DonViTinh,
      DonGia: item.DonGia,
      TonKho: item.TonKho || 0,
      NhaCungCap: item.NhaCungCap?._id || ''
    });
    setIsNVLModal(true);
  };

  const handleDeleteNVL = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa nguyên vật liệu này?')) return;
    try {
      await api.delete(`${API_KHO}/nguyen-vat-lieu/${id}`);
      alert('Đã xóa nguyên vật liệu!');
      fetchNguyenVatLieu();
    } catch (error: any) { alert(error.response?.data?.message || 'Lỗi xóa NVL'); }
  };

  const handleSubmitNVL = async () => {
    try {
      if (!nvlForm.MaNVL || !nvlForm.TenNguyenVatLieu) return alert('Vui lòng nhập mã và tên nguyên vật liệu');
      if (editingNVLId) {
        await api.put(`${API_KHO}/nguyen-vat-lieu/${editingNVLId}`, nvlForm);
        alert('Cập nhật nguyên vật liệu thành công!');
      } else {
        await api.post(`${API_KHO}/nguyen-vat-lieu`, nvlForm);
        alert('Thêm nguyên vật liệu thành công!');
      }
      setIsNVLModal(false);
      setEditingNVLId(null);
      setNvlForm({ MaNVL: '', TenNguyenVatLieu: '', PhanLoai: 'Bột màu', DonViTinh: 'Kg', DonGia: 0, TonKho: 0, NhaCungCap: '' });
      fetchNguyenVatLieu();
    } catch (error: any) { alert(error.response?.data?.message || 'Lỗi lưu NVL'); }
  };

  // ----- PHIẾU NHẬP XUẤT LOGIC -----
  const openCreateNXModal = () => {
    setEditingNXId(null);
    setNxForm({ MaPhieu: '', LoaiPhieu: 'NHAP', LoaiHang: 'SAN_PHAM', MoTa: '', GhiChu: '', NhaCungCapID: '' });
    setNxItems([{ ItemId: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]);
    setIsNXModal(true);
  };

  const openEditNXModal = (item: any) => {
    setEditingNXId(item._id);
    setNxForm({
      MaPhieu: item.MaPhieu,
      LoaiPhieu: item.LoaiPhieu,
      LoaiHang: item.LoaiHang,
      MoTa: item.MoTa || '',
      GhiChu: item.GhiChu || '',
      NhaCungCapID: item.NhaCungCapID || ''
    });
    setNxItems(item.ChiTiet || []);
    setIsNXModal(true);
  };

  const handleDeleteNX = async (id: string) => {
    if (!confirm('XÁC NHẬN: Xóa phiếu này sẽ HOÀN LẠI số lượng tồn kho tương ứng. Bạn có chắc chắn muốn thực hiện?')) return;
    try {
      await api.delete(`${API_KHO}/nhap-xuat/${id}`);
      alert('Đã xóa phiếu và hoàn tồn kho thành công!');
      fetchPhieuNhapXuat();
      fetchTonKho();
      fetchNguyenVatLieu();
    } catch (error: any) { alert(error.response?.data?.message || 'Lỗi xóa phiếu'); }
  };

  const handleAddNXItem = () => {
    setNxItems([...nxItems, { ItemId: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]);
  };

  const handleNXItemChange = (idx: number, field: string, val: any) => {
    const newItems = [...nxItems];
    // @ts-ignore
    newItems[idx][field] = val;
    // Auto calc don gia
    if (field === 'ItemId') {
      const itemObj = nxForm.LoaiHang === 'SAN_PHAM'
        ? data.find(d => d._id === val)
        : nvlData.find(d => d._id === val);
      if (itemObj) newItems[idx].DonGia = nxForm.LoaiHang === 'SAN_PHAM' ? (itemObj as KhoItem).DonGiaCoSo : (itemObj as NguyenVatLieu).DonGia;
    }
    newItems[idx].ThanhTien = newItems[idx].SoLuong * newItems[idx].DonGia;
    setNxItems(newItems);
  };

  const handleSubmitPhieuNX = async () => {
    try {
      const validItems = nxItems.filter(i => i.ItemId !== '');
      if (validItems.length === 0) return alert('Vui lòng chọn ít nhất 1 hàng hóa');

      const tongTien = nxItems.reduce((acc, curr) => acc + curr.ThanhTien, 0);

      if (editingNXId) {
        await api.put(`${API_KHO}/nhap-xuat/${editingNXId}`, {
          ...nxForm,
          TongTien: tongTien,
          ChiTiet: validItems
        });
        alert('Đã cập nhật phiếu và điều chỉnh tồn kho!');
      } else {
        await api.post(`${API_KHO}/nhap-xuat`, {
          ...nxForm,
          TongTien: tongTien,
          ChiTiet: validItems
        });
        alert(`Đã lập Phiếu ${nxForm.LoaiPhieu} thành công! Số lượng kho đã được cập nhật.`);
      }
      setIsNXModal(false);
      setEditingNXId(null);
      setNxItems([{ ItemId: '', SoLuong: 1, DonGia: 0, ThanhTien: 0 }]);
      fetchPhieuNhapXuat();
      fetchTonKho();
      fetchNguyenVatLieu();
    } catch (error: any) { alert(error.response?.data?.message || 'Lỗi lưu phiếu'); }
  };

  const exportToExcel = () => {
    let dataToExport: any[] = [];
    let fileName = "";
    
    if (activeTab === 'kho') {
      dataToExport = data.map(item => ({
        'Mã SP': item.MaSanPham,
        'Tên Dòng Sơn': item.TenDongSon,
        'Phân Loại': item.PhanLoai,
        'Tồn Kho': item.TonKho || 0,
        'Đơn Giá': item.DonGiaCoSo,
        'Đơn Vị Tính': 'Thùng'
      }));
      fileName = "Danh_Sach_Ton_Kho_Son";
    } else if (activeTab === 'nvl') {
      dataToExport = nvlData.map(item => ({
        'Mã NVL': item.MaNVL,
        'Tên NVL': item.TenNguyenVatLieu,
        'Phân Loại': item.PhanLoai,
        'Nhà Cung Cấp': item.NhaCungCap?.TenNCC || '---',
        'Tồn Kho': item.TonKho || 0,
        'Đơn Vị Tính': item.DonViTinh,
        'Đơn Giá': item.DonGia
      }));
      fileName = "Danh_Sach_Nguyen_Vat_Lieu";
    } else if (activeTab === 'nhapxuat') {
      dataToExport = phieuNXData.map(item => ({
        'Mã Phiếu': item.MaPhieu,
        'Loại Phiếu': item.LoaiPhieu,
        'Loại Hàng': item.LoaiHang === 'SAN_PHAM' ? 'Thành Phẩm' : 'Nguyên Vật Liệu',
        'Phụ Trách': item.MaNhanVienPhuTrach,
        'Mô Tả': item.MoTa,
        'Tổng Tiền': item.TongTien,
        'Ngày Lập': new Date(item.createdAt).toLocaleString()
      }));
      fileName = "Lich_Su_Nhap_Xuat_Kho";
    }

    if (dataToExport.length === 0) return alert('Không có dữ liệu để xuất!');

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `VTSC_${fileName}_${new Date().toLocaleDateString().replace(/\//g, '_')}.xlsx`);
  };


  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><Package size={22} /></div>
          <div className="kpi-label">Tổng Mặt Hàng Sơn</div>
          <div className="kpi-value">{STATS.total}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><ArrowDownToLine size={22} /></div>
          <div className="kpi-label">Số Lượng Tồn Kho Sơn (Đv)</div>
          <div className="kpi-value">{STATS.tonTotal}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Beaker size={22} /></div>
          <div className="kpi-label">Mặt Hàng Nguyên Vật Liệu</div>
          <div className="kpi-value">{nvlData.length}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><AlertTriangle size={22} /></div>
          <div className="kpi-label">Cảnh Báo Thiếu Hàng Sơn (&lt;100đv)</div>
          <div className="kpi-value">{STATS.warning}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'kho' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('kho')}>
          <Package size={18} style={{ marginRight: 8 }} /> Danh Mục Thành Phẩm
        </button>
        <button className={`btn ${activeTab === 'nvl' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('nvl')}>
          <Beaker size={18} style={{ marginRight: 8 }} /> Nguyên Vật Liệu Pha Chế
        </button>
        <button className={`btn ${activeTab === 'nhapxuat' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('nhapxuat')}>
          <ArrowRightLeft size={18} style={{ marginRight: 8 }} /> Lịch Sử Nhập / Xuất
        </button>
        <button className={`btn ${activeTab === 'kiemke' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('kiemke')}>
          <ClipboardList size={18} style={{ marginRight: 8 }} /> Phiếu Kiểm Kê
        </button>
      </div>

      {activeTab === 'kho' && (
        <>
          <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input type="text" className="form-input" placeholder="Tìm mã SP, tên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={exportToExcel} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)', color: 'var(--accent-emerald)' }}>
              <Download size={16} /> Xuất Excel
            </button>
          </div>
          <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr><th>Mã SP</th><th>Tên Dòng Sơn</th><th>Phân loại</th><th>Tồn Kho Trực Tiếp</th><th>Đơn giá HH</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {data.filter(item => item.TenDongSon.toLowerCase().includes(searchTerm.toLowerCase()) || item.MaSanPham.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaSanPham}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.TenDongSon}</td>
                    <td>{item.PhanLoai}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{item.TonKho || 0} Đv</td>
                    <td>{item.DonGiaCoSo.toLocaleString()} ₫</td>
                    <td><span className={`badge ${(item.TonKho || 0) > 100 ? 'approved' : (item.TonKho || 1) > 0 ? 'warning' : 'rejected'}`}>{(item.TonKho || 1) > 100 ? 'Đầy đủ' : (item.TonKho || 1) > 0 ? 'Hết hàng' : 'Hết hàng'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'nvl' && (
        <>
          <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input type="text" className="form-input" placeholder="Tìm mã NVL, tên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={exportToExcel} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)', color: 'var(--accent-emerald)' }}>
                <Download size={16} /> Xuất Excel
              </button>
              <button onClick={openCreateNVL} className="btn btn-primary"><Plus size={16} style={{ marginRight: 8 }} /> Khai Báo NVL Mới</button>
            </div>
          </div>
          <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>Mã NVL</th><th>Tên Nguyên Vật Liệu</th><th>Nhà Cung Cấp</th><th>Nhóm Chất</th><th>Tồn Kho</th><th>ĐVT</th><th>Đơn Giá</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
              <tbody>
                {nvlData.filter(item => item.TenNguyenVatLieu.toLowerCase().includes(searchTerm.toLowerCase()) || item.MaNVL.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaNVL}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.TenNguyenVatLieu}</td>
                    <td>{item.NhaCungCap ? <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{item.NhaCungCap.TenNCC}</span> : <span style={{ color: 'var(--text-secondary)' }}>---</span>}</td>
                    <td><span className="badge testing">{item.PhanLoai}</span></td>
                    <td style={{ fontWeight: 600, color: (item.TonKho || 0) > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{item.TonKho || 0} {item.DonViTinh}</td>
                    <td>{item.DonViTinh}</td>
                    <td>{item.DonGia.toLocaleString()} ₫</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openEditNVL(item)} className="btn btn-ghost btn-sm" title="Sửa"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteNVL(item._id)} className="btn btn-ghost btn-sm" title="Xóa" style={{ marginLeft: 4 }}><Trash2 size={16} color="var(--accent-rose)" /></button>
                    </td>
                  </tr>
                ))}
                {nvlData.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Chưa có mặt hàng nguyên vật liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

        {activeTab === 'nhapxuat' && (
        <>
          <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={exportToExcel} className="btn btn-ghost" style={{ border: '1px solid var(--border-color)', color: 'var(--accent-emerald)' }}>
              <Download size={16} /> Xuất Excel
            </button>
            <button onClick={openCreateNXModal} className="btn btn-primary" style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}><ArrowRightLeft size={16} style={{ marginRight: 8 }} /> Lập Lệnh Nhập / Xuất</button>
          </div>
          <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>Mã Lệnh</th><th>Loại Kho</th><th>Loại Lệnh</th><th>Người Phụ Trách</th><th>Mô Tả</th><th>Tổng Giá Trị</th><th>Thời Gian</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
              <tbody>
                {phieuNXData.map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.MaPhieu}</td>
                    <td>{item.LoaiHang === 'SAN_PHAM' ? 'Thành Phẩm' : 'Nguyên Vật Liệu'}</td>
                    <td><span className={`badge ${item.LoaiPhieu === 'NHAP' ? 'approved' : 'rejected'}`}>{item.LoaiPhieu}</span></td>
                    <td>{item.MaNhanVienPhuTrach}</td>
                    <td>{item.MoTa}</td>
                    <td style={{ fontWeight: 600 }}>{item.TongTien.toLocaleString()} ₫</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => openEditNXModal(item)} className="btn btn-ghost btn-sm" title="Sửa"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteNX(item._id)} className="btn btn-ghost btn-sm" title="Xóa" style={{ marginLeft: 4 }}><Trash2 size={16} color="var(--accent-rose)" /></button>
                    </td>
                  </tr>
                ))}
                {phieuNXData.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>Chưa có lịch sử lệnh kho</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'kiemke' && (
        <>
          <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIsKiemKhoModal(true)} className="btn btn-ghost" style={{ border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)' }}><FileCheck size={16} style={{ marginRight: 6 }} /> Tạo Phiếu Kiểm Kê Thực Tế</button>
          </div>
          <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Mã Phiếu Kiểm</th><th>Người Lập Phiếu</th><th>Tổng Lệch (Giá Trị)</th><th>Trạng thái</th><th>Ngày Lập</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr>
              </thead>
              <tbody>
                {phieuData.map(item => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{item.MaPhieu}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.NguoiKiem ? `${item.NguoiKiem.MaNV} - ${item.NguoiKiem.HoTen}` : 'Hệ Thống'}</td>
                    <td style={{ fontWeight: 800, color: item.TongChenhLech < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{item.TongChenhLech.toLocaleString()} ₫</td>
                    <td><span className={`badge ${item.TrangThai === 'HOAN_THANH' ? 'approved' : 'pending'}`}>{item.TrangThai}</span></td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => setSelectedPhieu(item)} className="btn btn-ghost btn-sm" title="Xem chi tiết & In"><Eye size={16} /></button>
                      {item.TrangThai !== 'HOAN_THANH' && (
                        <button onClick={() => hoanThanhPhiếu(item.MaPhieu)} className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>Chốt Số</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* --- MODALS --- */}

      {/* Modal Lập / Sửa Phiếu NVL */}
      {isNVLModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', margin: '2rem auto', color: 'var(--text-primary)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>{editingNVLId ? 'Cập Nhật Nguyên Vật Liệu' : 'Khai Báo Nguyên Vật Liệu Mới'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label>Mã NVL</label><input type="text" className="form-input" value={nvlForm.MaNVL} onChange={e => setNvlForm({ ...nvlForm, MaNVL: e.target.value })} disabled={!!editingNVLId} style={editingNVLId ? { opacity: 0.6 } : {}} /></div>
              <div><label>Tên Nguyên Liệu</label><input type="text" className="form-input" value={nvlForm.TenNguyenVatLieu} onChange={e => setNvlForm({ ...nvlForm, TenNguyenVatLieu: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}><label>Bộ phân loại</label><select className="form-input" value={nvlForm.PhanLoai} onChange={e => setNvlForm({ ...nvlForm, PhanLoai: e.target.value })}><option>Bột màu</option><option>Dung môi</option><option>Nhựa</option><option>Phụ gia</option></select></div>
                <div style={{ flex: 1 }}><label>Đơn Vị Tính</label><input type="text" className="form-input" value={nvlForm.DonViTinh} onChange={e => setNvlForm({ ...nvlForm, DonViTinh: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}><label>Số lượng tồn kho</label><input type="number" className="form-input" min={0} value={nvlForm.TonKho} onChange={e => setNvlForm({ ...nvlForm, TonKho: Number(e.target.value) })} /></div>
                <div style={{ flex: 1 }}><label>Giá Thành Base (₫)</label><input type="number" className="form-input" value={nvlForm.DonGia} onChange={e => setNvlForm({ ...nvlForm, DonGia: Number(e.target.value) })} /></div>
              </div>
              <div>
                <label>Nhà Cung Cấp</label>
                <select className="form-input" value={nvlForm.NhaCungCap} onChange={e => setNvlForm({ ...nvlForm, NhaCungCap: e.target.value })}>
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {nccList.map(ncc => <option key={ncc._id} value={ncc._id}>{ncc.MaNCC} - {ncc.TenNCC}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: 10 }}>
              <button onClick={() => { setIsNVLModal(false); setEditingNVLId(null); }} className="btn btn-ghost" style={{ flex: 1 }}>Đóng</button>
              <button onClick={handleSubmitNVL} className="btn btn-primary" style={{ flex: 1 }}>{editingNVLId ? 'Cập Nhật' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lập Phiếu Nhập Xuất */}
      {isNXModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '800px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', margin: '2rem auto', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>{editingNXId ? `Chỉnh sửa Phiếu ${nxForm.MaPhieu}` : 'Lập Phiếu Lệnh Kho'}</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}><label>Mục Đích Lệnh</label><select className="form-input" value={nxForm.LoaiPhieu} onChange={e => setNxForm({ ...nxForm, LoaiPhieu: e.target.value })} disabled={!!editingNXId}><option value="NHAP">Biên Bản Nhập Kho</option><option value="XUAT">Biên Bản Xuất Tồn</option></select></div>
              <div style={{ flex: 1 }}><label>Đối Tượng Lệnh</label><select className="form-input" value={nxForm.LoaiHang} onChange={e => setNxForm({ ...nxForm, LoaiHang: e.target.value })} disabled={!!editingNXId}><option value="SAN_PHAM">Tác Động Lên Thành Phẩm Sơn</option><option value="NGUYEN_VAT_LIEU">Tác Động Lên NVL Pha Chế</option></select></div>
            </div>
            <div style={{ marginBottom: 16 }}><label>Mô tả Nhập / Xuất Kho</label><input type="text" className="form-input" value={nxForm.MoTa} onChange={e => setNxForm({ ...nxForm, MoTa: e.target.value })} /></div>

            {/* Items List */}
            <h4 style={{ marginTop: 24, marginBottom: 16 }}>Hàng Hóa Chỉ Định:</h4>
            {nxItems.map((k: any, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                <div style={{ flex: 2 }}>
                  <label>Mã Sản Phẩm {nxForm.LoaiHang === 'SAN_PHAM' ? 'Sơn' : 'NVL'}</label>
                  <select className="form-input" value={k.ItemId} onChange={e => handleNXItemChange(idx, 'ItemId', e.target.value)} disabled={!!editingNXId}>
                    <option value="">-- Tra Mã Nhanh --</option>
                    {nxForm.LoaiHang === 'SAN_PHAM' ?
                      data.map(d => <option key={d._id} value={d._id}>{d.MaSanPham} - {d.TenDongSon} (Tồn HT: {d.TonKho || 0})</option>) :
                      nvlData.map(d => <option key={d._id} value={d._id}>{d.MaNVL} - {d.TenNguyenVatLieu} (Tồn HT: {d.TonKho || 0})</option>)
                    }
                  </select>
                </div>
                <div style={{ flex: 1 }}><label>Số lượng</label><input type="number" min={1} className="form-input" value={k.SoLuong} onChange={e => handleNXItemChange(idx, 'SoLuong', Number(e.target.value))} /></div>
                <div style={{ flex: 1 }}><label>Đơn Giá (Nháp)</label><input type="number" min={0} className="form-input" value={k.DonGia} onChange={e => handleNXItemChange(idx, 'DonGia', Number(e.target.value))} /></div>
                <div style={{ flex: 1 }}><label>Tạm Tính</label><input type="number" className="form-input" value={k.ThanhTien} disabled style={{ opacity: 0.7 }} /></div>
              </div>
            ))}
            {!editingNXId && (
              <button onClick={handleAddNXItem} className="btn btn-ghost" style={{ border: '1px dashed var(--border-color)', width: '100%', marginBottom: 24 }}>+ Chọn thêm Danh mục xuống lệnh</button>
            )}

            <div style={{ marginTop: '24px', display: 'flex', gap: 10 }}>
              <button onClick={() => { setIsNXModal(false); setEditingNXId(null); }} className="btn btn-ghost" style={{ flex: 1 }}>Hủy Bỏ</button>
              <button onClick={handleSubmitPhieuNX} className="btn btn-primary" style={{ flex: 1, background: nxForm.LoaiPhieu === 'NHAP' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {editingNXId ? 'Cập Nhật Phiếu & Điều Chỉnh Tồn' : 'Khởi Tạo Biên Bản & Cập Nhật Số Tồn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lập Phiếu Kiem Ke (Giữ nguyên cấu trúc đã có) */}
      {isKiemKhoModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '700px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', margin: '2rem auto', color: 'var(--text-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Ghi Nhận Thực Tế Lô Kiểm Kê</h3>
              <button onClick={() => setIsKiemKhoModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>×</button>
            </div>



            <div style={{ marginBottom: 16 }}>
              {kiemKhoItems.map((k, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Mã Sản Phẩm Trích Xuất</label>
                    <select style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-card)' }} value={k.Sanpham} onChange={e => {
                      const newArr = [...kiemKhoItems];
                      newArr[idx].Sanpham = e.target.value;
                      setKiemKhoItems(newArr);
                    }}>
                      <option value="">-- Định danh đối chiếu (Load trực tiếp từ SP) --</option>
                      {data.map(d => <option key={d._id} value={d._id}>{d.MaSanPham} - {d.TenDongSon} (Tồn HT: {d.TonKho || 0})</option>)}
                    </select>
                  </div>
                  <div style={{ width: 150 }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Phát Hiện Số Tồn</label>
                    <input type="number" style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-card)' }} value={k.TonThucTe} onChange={e => {
                      const newArr = [...kiemKhoItems];
                      newArr[idx].TonThucTe = Number(e.target.value);
                      setKiemKhoItems(newArr);
                    }} />
                  </div>
                </div>
              ))}
              <button onClick={handleAddKiemKhoItem} className="btn btn-ghost" style={{ border: '1px dashed var(--border-color)', width: '100%' }}>+ Thêm dòng sản phẩm sai lệch</button>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button onClick={handleSubmitKiemKho} style={{ width: '100%', background: '#28a745', color: '#fff', border: 'none', padding: '12px', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Phiếu & Tính Chênh Lệch</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Phiếu -> In Phiếu */}
      {selectedPhieu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="print-area" style={{ width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '8px', padding: '30px', margin: '2rem auto', color: '#000', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="no-print">
              <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Chi tiết Phiếu {selectedPhieu.MaPhieu}</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => window.print()} className="btn btn-primary"><Printer size={16} /> In Phiếu</button>
                <button onClick={() => setSelectedPhieu(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>×</button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2>BIÊN BẢN KIỂM KÊ KHO</h2>
              <p>Mã phiếu: {selectedPhieu.MaPhieu}</p>
              <p>Ngày lập: {new Date(selectedPhieu.createdAt).toLocaleString()} | Trạng thái: {selectedPhieu.TrangThai}</p>
              <p>Nhân viên kiểm kê: {selectedPhieu.NguoiKiem ? `${selectedPhieu.NguoiKiem.MaNV} - ${selectedPhieu.NguoiKiem.HoTen}` : 'ADMIN'}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: 8 }}>Sản phẩm</th>
                  <th style={{ border: '1px solid #000', padding: 8 }}>Tồn HT</th>
                  <th style={{ border: '1px solid #000', padding: 8, background: '#f5f5f5' }}>Tồn Thực Tế</th>
                  <th style={{ border: '1px solid #000', padding: 8, color: 'red' }}>Lệch Số Lượng</th>
                  <th style={{ border: '1px solid #000', padding: 8 }}>Đơn giá Lệch (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {selectedPhieu.ChiTiet.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #000', padding: 8 }}>{row.Sanpham ? row.Sanpham.TenDongSon : 'N/A'}</td>
                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center' }}>{row.TonKhoHT}</td>
                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>{row.TonThucTe}</td>
                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'center', color: row.ChenhLech < 0 ? 'red' : 'green' }}>{row.ChenhLech}</td>
                    <td style={{ border: '1px solid #000', padding: 8, textAlign: 'right' }}>{row.ThanhTienChenhLech.toLocaleString()}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #000', padding: 8, textAlign: 'right', fontWeight: 'bold' }}>TỔNG CHÊNH LỆCH BẰNG TIỀN (Ghi Nhận Lỗ/Lãi):</td>
                  <td style={{ border: '1px solid #000', padding: 8, textAlign: 'right', fontWeight: 'bold', color: selectedPhieu.TongChenhLech < 0 ? 'red' : 'green' }}>
                    {selectedPhieu.TongChenhLech.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 50, textAlign: 'center' }}>
              <div><strong>Người lập phiếu</strong><p>(Ký, ghi rõ họ tên)</p></div>
              <div><strong>Trưởng bộ phận kho / logistic</strong><p>(Ký, ghi rõ họ tên)</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
