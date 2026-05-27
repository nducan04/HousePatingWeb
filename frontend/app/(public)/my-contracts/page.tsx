'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle2, Clock, XCircle, Search, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from '@/lib/utils/notification';

export default function MyContractsPage() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await api.get('/contracts');
        if (res.data.success) {
          setContracts(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách hợp đồng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const handlePayContractMomo = async (contract: any) => {
    const remaining = contract.value - (contract.daThanhToan || 0);
    if (remaining <= 0) {
      toast.warning('Hợp đồng đã được thanh toán đầy đủ');
      return;
    }

    try {
      const res = await api.post('/thanh-toan/momo/create', {
        type: 'CONTRACT',
        id: contract._id,
        amount: remaining,
      });
      if (res.data.success && res.data.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        toast.error('Lỗi tạo link thanh toán MoMo: ' + (res.data.message || 'Không xác định'));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán MoMo');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
      case 'draft':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><Clock size={14} /> Chờ xác nhận</span>;
      case 'signed':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><CheckCircle2 size={14} /> Đã ký kết</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><CheckCircle2 size={14} /> Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><XCircle size={14} /> Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><Clock size={14} /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 relative">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Button (Top Left) */}
      <Link href="/" className="absolute top-8 left-4 lg:left-8 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all z-10 shadow-sm cursor-pointer no-underline">
        <ArrowLeft size={16} /> Quay lại
      </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                <FileText size={20} />
              </div>
              Quản lý Hợp đồng của tôi
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Xem và theo dõi tiến độ các hợp đồng nguyên tắc bạn đã gửi yêu cầu.
            </p>
          </div>
          <Link href="/my-contracts/create" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-md shadow-blue-200 no-underline">
            + Tạo Hợp đồng mới
          </Link>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Mã Hợp đồng</th>
                  <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Tiêu đề</th>
                  <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Ngày gửi</th>
                  <th className="py-4 px-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Tổng giá trị</th>
                  <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">Đang tải dữ liệu...</td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">Bạn chưa tạo hợp đồng nào.</td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr key={contract._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">{contract.contractId}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-800">{contract.title}</div>
                        <div className="text-[11px] font-bold text-slate-400 mt-1">{contract.chiTietHopDong?.length || 0} sản phẩm</div>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-600">
                        {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-4 text-right text-sm">
                        <div className="font-black text-blue-600">
                          {contract.value.toLocaleString('vi-VN')} đ
                        </div>
                        {contract.daThanhToan > 0 && (
                          <div className="text-[11px] font-bold text-emerald-600 mt-1">
                            Đã trả: {contract.daThanhToan.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                        {(contract.value - (contract.daThanhToan || 0)) > 0 && (
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Còn lại: {(contract.value - (contract.daThanhToan || 0)).toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center flex justify-center">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-xl" onClick={() => toast.info('Chi tiết hợp đồng (Tính năng đang cập nhật)')}>
                            <Eye size={14} /> Xem
                          </button>
                          {['signed', 'delivering'].includes(contract.status) && (contract.value - (contract.daThanhToan || 0)) > 0 && (
                            <button
                              onClick={() => handlePayContractMomo(contract)}
                              className="inline-flex items-center gap-1 text-xs font-black bg-[#A50064] text-white hover:bg-[#850050] transition-colors cursor-pointer px-3 py-2 rounded-xl border-none shadow-sm shadow-[#A50064]/10"
                            >
                              <div className="w-3.5 h-3.5 rounded bg-white flex items-center justify-center text-[7px] font-black text-[#A50064]">M</div>
                              Thanh toán
                            </button>
                          )}
                        </div>
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
