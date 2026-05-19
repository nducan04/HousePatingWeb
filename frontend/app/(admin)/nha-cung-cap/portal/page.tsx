'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  DollarSign,
  Package,
  Plus,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import ProtectedRoute from '@/lib/components/ProtectedRoute';

interface NhaCungCap {
  _id: string;
  MaNCC: string;
  TenNCC: string;
  MaSoThue?: string;
  NguoiLienHe?: string;
  DiaChi?: string;
  SDT: string;
  Email?: string;
  PhanLoai?: string;
  CongNo?: number;
}

interface NguyenVatLieu {
  _id: string;
  MaNVL: string;
  TenNguyenVatLieu: string;
  PhanLoai: 'Bột màu' | 'Dung môi' | 'Nhựa' | 'Phụ gia' | 'Phân dải' | 'Khác';
  TonKho: number;
  DonViTinh: string;
  DonGia: number;
  GiaNhapDinhMuc: number;
  GhiChu?: string;
}

export default function SupplierPortalPage() {
  const [profile, setProfile] = useState<NhaCungCap | null>(null);
  const [materials, setMaterials] = useState<NguyenVatLieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add material state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    MaNVL: '',
    TenNguyenVatLieu: '',
    PhanLoai: 'Khác' as NguyenVatLieu['PhanLoai'],
    DonViTinh: 'Kg',
    DonGia: 0,
    GiaNhapDinhMuc: 0,
    GhiChu: ''
  });

  // Edit/Quote state
  const [editingMaterial, setEditingMaterial] = useState<NguyenVatLieu | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    DonGia: 0,
    GiaNhapDinhMuc: 0,
    GhiChu: ''
  });

  useEffect(() => {
    fetchPortalData();
  }, []);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Load supplier profile first
      const profileRes = await api.get('/nha-cung-cap/my-profile');
      if (profileRes.data.success) {
        setProfile(profileRes.data.data);

        // Load material catalog of this supplier
        const matRes = await api.get('/nha-cung-cap/my-materials');
        if (matRes.data.success) {
          setMaterials(matRes.data.data);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Không thể tải thông tin cổng nhà cung cấp. Vui lòng kiểm tra liên kết tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.TenNguyenVatLieu) {
      setErrorMsg('Vui lòng nhập tên nguyên vật liệu');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await api.post('/nha-cung-cap/my-materials', newMaterial);
      if (res.data.success) {
        setSuccessMsg('Khai báo vật tư mới thành công!');
        setIsAddModalOpen(false);
        setNewMaterial({
          MaNVL: '',
          TenNguyenVatLieu: '',
          PhanLoai: 'Khác',
          DonViTinh: 'Kg',
          DonGia: 0,
          GiaNhapDinhMuc: 0,
          GhiChu: ''
        });
        // Reload list
        fetchPortalData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Lỗi khi thêm nguyên vật liệu mới.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditQuote = (mat: NguyenVatLieu) => {
    setEditingMaterial(mat);
    setQuoteForm({
      DonGia: mat.DonGia,
      GiaNhapDinhMuc: mat.GiaNhapDinhMuc,
      GhiChu: mat.GhiChu || ''
    });
  };

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await api.put(`/nha-cung-cap/my-materials/${editingMaterial._id}`, {
        TenNguyenVatLieu: editingMaterial.TenNguyenVatLieu,
        PhanLoai: editingMaterial.PhanLoai,
        DonViTinh: editingMaterial.DonViTinh,
        ...quoteForm
      });

      if (res.data.success) {
        setSuccessMsg(`Cập nhật báo giá cho mã ${editingMaterial.MaNVL} thành công!`);
        setEditingMaterial(null);
        fetchPortalData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Lỗi khi cập nhật báo giá.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm font-bold text-slate-400">Đang tải dữ liệu cổng nhà cung cấp...</span>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['Admin', 'NhaCungCap']}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Banner header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-blue-950/10 border border-blue-900/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_45%)]"></div>
          <div className="relative z-10 space-y-2">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              Cổng Cung Ứng & Báo Giá
            </h1>
            <p className="text-slate-400 font-bold text-sm max-w-xl">
              Hệ thống tích hợp dành riêng cho Đối tác. Khai báo danh mục vật tư cung ứng và cập nhật bảng báo giá nguyên vật liệu trực tiếp.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[13px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 transition-all active:scale-95 cursor-pointer border-none"
            >
              <Plus size={16} /> Thêm vật tư mới
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Profile Card and Debt stats */}
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-[20px] bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Building size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">{profile.TenNCC}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                    Mã đối tác: {profile.MaNCC}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                  <Phone size={16} className="text-slate-400" />
                  <span>Điện thoại: {profile.SDT}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                  <Mail size={16} className="text-slate-400" />
                  <span>Email: {profile.Email || 'Chưa có'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                  <Receipt size={16} className="text-slate-400" />
                  <span>Mã số thuế: {profile.MaSoThue || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                  <MapPin size={16} className="text-slate-400" />
                  <span>Địa chỉ: {profile.DiaChi || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>

            {/* Debt Panel */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Công nợ công ty đang nợ đối tác</span>
                <h4 className={`text-3xl font-black ${profile.CongNo && profile.CongNo > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {(profile.CongNo || 0).toLocaleString("vi-VN")} ₫
                </h4>
              </div>
              <div className="pt-4 border-t border-slate-50 mt-4 flex items-center gap-2 text-xs text-slate-400 font-bold">
                <AlertCircle size={14} className="text-amber-500" />
                <span>Số tiền này sẽ được thanh toán theo kỳ hạn hợp đồng.</span>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Table */}
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package size={18} className="text-blue-600" />
              Danh mục nguyên vật tư cung ứng
            </h3>
            <span className="text-xs font-bold text-slate-400">{materials.length} mặt hàng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-36">Mã Vật Tư</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tên nguyên vật liệu</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">Phân loại</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">Đơn vị</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-right">Đơn giá hiện tại</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 text-right">Giá báo định mức</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest w-32 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-350">
                          <Package size={24} />
                        </div>
                        <h4 className="text-sm font-black text-slate-700 mt-2">Chưa khai báo vật tư nào</h4>
                        <p className="text-xs text-slate-400 font-bold">Hãy bấm nút "Thêm vật tư mới" để khai báo các nguyên vật liệu đối tác cung ứng.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  materials.map(mat => (
                    <tr key={mat._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-blue-600 text-xs uppercase">{mat.MaNVL}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-[14.5px]">{mat.TenNguyenVatLieu}</div>
                        {mat.GhiChu && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{mat.GhiChu}</div>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {mat.PhanLoai}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-black text-slate-500">{mat.DonViTinh}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 text-[14px]">
                        {mat.DonGia.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 text-right font-black text-blue-600 text-[14px]">
                        {mat.GiaNhapDinhMuc.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => startEditQuote(mat)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-450 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                          title="Cập nhật báo giá"
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal - THÊM VẬT TƯ MỚI */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-blue-600 rounded-full"></div>
                  Khai báo nguyên vật tư mới
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold flex items-center justify-center transition-colors border-none outline-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddMaterial}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã Vật Tư (Tự động nếu để trống)</label>
                      <input
                        type="text"
                        value={newMaterial.MaNVL}
                        onChange={e => setNewMaterial({ ...newMaterial, MaNVL: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all uppercase"
                        placeholder="Ví dụ: NVL-092"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên nguyên vật liệu *</label>
                      <input
                        type="text"
                        required
                        value={newMaterial.TenNguyenVatLieu}
                        onChange={e => setNewMaterial({ ...newMaterial, TenNguyenVatLieu: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="Nhập tên vật tư..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phân loại *</label>
                      <select
                        value={newMaterial.PhanLoai}
                        onChange={e => setNewMaterial({ ...newMaterial, PhanLoai: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      >
                        {['Bột màu', 'Dung môi', 'Nhựa', 'Phụ gia', 'Phân dải', 'Khác'].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn vị tính *</label>
                      <input
                        type="text"
                        required
                        value={newMaterial.DonViTinh}
                        onChange={e => setNewMaterial({ ...newMaterial, DonViTinh: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        placeholder="Kg, Lít, Chai..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá chào bán (₫)</label>
                      <input
                        type="number"
                        min="0"
                        value={newMaterial.DonGia}
                        onChange={e => setNewMaterial({ ...newMaterial, DonGia: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-right"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá báo định mức (₫)</label>
                      <input
                        type="number"
                        min="0"
                        value={newMaterial.GiaNhapDinhMuc}
                        onChange={e => setNewMaterial({ ...newMaterial, GiaNhapDinhMuc: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-right"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú thêm</label>
                    <textarea
                      value={newMaterial.GhiChu}
                      onChange={e => setNewMaterial({ ...newMaterial, GhiChu: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-20 resize-none"
                      placeholder="Mô tả kỹ thuật, thông số chất lượng..."
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none flex items-center gap-1.5"
                  >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                    Xác nhận thêm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal - CẬP NHẬT BÁO GIÁ */}
        {editingMaterial && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-300">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-amber-500 rounded-full"></div>
                  Cập nhật báo giá vật tư
                </h2>
                <button
                  onClick={() => setEditingMaterial(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold flex items-center justify-center transition-colors border-none outline-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateQuote}>
                <div className="p-6 space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nguyên vật tư</span>
                    <strong className="text-sm text-slate-800 block">[{editingMaterial.MaNVL}] {editingMaterial.TenNguyenVatLieu}</strong>
                    <span className="text-xs text-slate-400 font-bold">Đơn vị: {editingMaterial.DonViTinh} - Phân loại: {editingMaterial.PhanLoai}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá chào bán mới (₫)</label>
                    <input
                      type="number"
                      min="0"
                      value={quoteForm.DonGia}
                      onChange={e => setQuoteForm({ ...quoteForm, DonGia: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá báo định mức mới (₫)</label>
                    <input
                      type="number"
                      min="0"
                      value={quoteForm.GiaNhapDinhMuc}
                      onChange={e => setQuoteForm({ ...quoteForm, GiaNhapDinhMuc: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú báo giá</label>
                    <textarea
                      value={quoteForm.GhiChu}
                      onChange={e => setQuoteForm({ ...quoteForm, GhiChu: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-20 resize-none"
                      placeholder="Lý do thay đổi đơn giá, kỳ hạn áp dụng..."
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingMaterial(null)}
                    className="px-5 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-xs hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all cursor-pointer border-none flex items-center gap-1.5"
                  >
                    {submitting && <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                    Lưu báo giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
