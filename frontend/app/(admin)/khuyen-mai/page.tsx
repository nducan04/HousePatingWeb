'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Calendar, Users, Activity, Plus } from 'lucide-react';

export default function KhuyenMaiPage() {
  const [listKhuyenMai, setListKhuyenMai] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    MaKhuyenMai: '',
    TenChuongTrinh: '',
    PhanTramGiam: 0,
    NgayBatDau: '',
    NgayKetThuc: ''
  });

  useEffect(() => {
    fetchKhuyenMai();
  }, []);

  const fetchKhuyenMai = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/khuyen-mai');
      if (response.data.success) {
        setListKhuyenMai(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách khuyến mãi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/khuyen-mai', formData);
      if (response.data.success) {
        alert('Thêm khuyến mãi thành công!');
        fetchKhuyenMai(); 
        setFormData({
          MaKhuyenMai: '', TenChuongTrinh: '', PhanTramGiam: 0, NgayBatDau: '', NgayKetThuc: ''
        });
      }
    } catch (error: any) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản Lý Khuyến Mãi</h1>
          <p className="text-slate-500 font-medium mt-1">
            Thiết lập và theo dõi các chương trình ưu đãi, hậu mãi cho khách hàng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-50">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Plus size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Tạo Chiến Dịch Mới</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Mã Khuyến Mãi</label>
              <input 
                type="text" name="MaKhuyenMai" 
                value={formData.MaKhuyenMai} onChange={handleInputChange} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-800"
                placeholder="VD: SUMMER2026" required 
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tên Chương Trình</label>
              <input 
                type="text" name="TenChuongTrinh" 
                value={formData.TenChuongTrinh} onChange={handleInputChange} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium text-slate-800"
                placeholder="VD: Khuyến mãi mùa hè" required 
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Mức Giảm Giá (%)</label>
              <div className="relative">
                <input 
                  type="number" name="PhanTramGiam" min="0" max="100" 
                  value={formData.PhanTramGiam} onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all font-bold text-rose-600"
                  required 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Bắt Đầu</label>
                <input 
                  type="date" name="NgayBatDau" 
                  value={formData.NgayBatDau} onChange={handleInputChange} 
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-[13px] font-medium text-slate-800"
                  required 
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Kết Thúc</label>
                <input 
                  type="date" name="NgayKetThuc" 
                  value={formData.NgayKetThuc} onChange={handleInputChange} 
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 transition-all text-[13px] font-medium text-slate-800"
                  required 
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 mt-6 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]">
              Tạo Khuyến Mãi
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center gap-2">
            <Tag size={18} className="text-slate-400" />
            <h2 className="text-lg font-bold text-slate-800">Danh Sách Chiến Dịch</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Chương Trình</th>
                  <th className="px-6 py-4 text-center">Mức Giảm</th>
                  <th className="px-6 py-4">Thời Gian</th>
                  <th className="px-6 py-4 text-center">Lượt Dùng</th>
                  <th className="px-6 py-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Đang tải dữ liệu...</td></tr>
                ) : listKhuyenMai.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Chưa có dữ liệu khuyến mãi.</td></tr>
                ) : (
                  listKhuyenMai.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-[14px]">{item.TenChuongTrinh}</div>
                        <div className="text-[12px] text-blue-600 font-medium mt-0.5">{item.MaKhuyenMai}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600 font-black text-[14px]">
                          {item.PhanTramGiam}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                          <Calendar size={12} /> {new Date(item.NgayBatDau).toLocaleDateString('vi-VN')} 
                          <span className="text-slate-300">-</span> 
                          {new Date(item.NgayKetThuc).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold text-[13px]">
                          <Users size={14} /> {item.DanhSachApDung?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.TrangThai === 'Đang diễn ra' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {item.TrangThai === 'Đang diễn ra' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                          {item.TrangThai}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
