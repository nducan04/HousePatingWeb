'use client';

import React, { useState, useEffect } from 'react';
import {
  CircleDollarSign,
  Layers,
  TrendingDown,
  Briefcase,
  ShoppingCart,
  Search,
  Plus,
  Edit,
  X
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

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
      toast.success('Cập nhật giá thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Lỗi cập nhật giá');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50 font-sans text-slate-900">

      {/* 1. Page Header */}
      <header className="flex items-center gap-3 mb-8">
        <CircleDollarSign strokeWidth={1.5} className="w-8 h-8 text-blue-600" />
        <h1 className="text-xl font-bold text-slate-900">Quản lý Giá thành & Lợi nhuận</h1>
      </header>

      {/* 2. Stats Overview - Grid 4 cột */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Bảng Giá Cốt Lõi</p>
            <p className="text-2xl font-bold text-slate-900">{STATS.total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Layers strokeWidth={1.5} className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">TB Giá Vốn (Gốc)</p>
            <p className="text-2xl font-bold text-slate-900">{(STATS.avgBase / 1000).toFixed(0)}k/kg</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <TrendingDown strokeWidth={1.5} className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">TB Giá B2B (+20%)</p>
            <p className="text-2xl font-bold text-slate-900">{(STATS.avgB2B / 1000).toFixed(0)}k/kg</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Briefcase strokeWidth={1.5} className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex justify-between items-start">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">TB Giá B2C (+30%)</p>
            <p className="text-2xl font-bold text-slate-900">{(STATS.avgB2C / 1000).toFixed(0)}k/kg</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ShoppingCart strokeWidth={1.5} className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-[320px]">
          <Search
            strokeWidth={1.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Tìm mã SP, tên sơn..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <button
          onClick={() => window.location.href = '/san-pham'}
          title="Chuyển sang trang Quản lý Sản Phẩm để tạo mới dòng sơn và thiết lập giá"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-full sm:w-auto"
        >
          <Plus strokeWidth={1.5} className="w-4 h-4" />
          Thiết lập Dòng Sơn Mới
        </button>
      </div>

      {/* 4. Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider">Tham chiếu (Mã SP)</th>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider">Tên Dòng Sơn</th>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider text-right">Giá Vốn Cơ Sở</th>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider text-right">Giá Đại Lý B2B (+20%)</th>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider text-right">Giá Phân Phối B2C (+30%)</th>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider text-center">% Lợi Nhuận B2C</th>
                <th className="px-6 py-4 text-xs uppercase text-slate-500 font-semibold tracking-wider text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map(item => {
                  const giaGoc = item.DonGiaCoSo || 0;
                  const b2b = giaGoc * 1.2;
                  const b2c = giaGoc * 1.3;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-blue-600">{item.MaSanPham}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.TenDongSon}</td>
                      <td className="px-6 py-4 font-bold text-slate-400 text-right">
                        {formatCurrency(giaGoc)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600 text-right">
                        {formatCurrency(b2b)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-purple-600 text-right">
                        {formatCurrency(b2c)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                          ~30%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Cập nhật Giá Vốn"
                          className="p-1.5 text-slate-400 opacity-60 hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all inline-flex items-center justify-center"
                        >
                          <Edit strokeWidth={1.5} className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Đổi Giá */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative">

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Hiệu Chỉnh Giá Vốn</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg"
              >
                <X strokeWidth={2} className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5">Sản phẩm</label>
                <input
                  type="text"
                  value={`${selectedProduct.MaSanPham} - ${selectedProduct.TenDongSon}`}
                  readOnly
                  disabled
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-sm font-medium outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-1.5">Giá Vốn Đề Xuất Mới (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={e => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border-2 border-blue-500 rounded-lg text-base font-bold text-blue-700 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-slate-500">
                    Giá B2B (+20%): <span className="text-emerald-600">{formatCurrency(newPrice * 1.2)}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Giá B2C (+30%): <span className="text-purple-600">{formatCurrency(newPrice * 1.3)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={submitPriceUpdate}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
              >
                Áp Dụng Giá
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}