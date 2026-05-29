'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Eye, CreditCard, DollarSign, Wallet, FileCheck,
  CheckCircle2, XCircle, Clock, ArrowRight, User, Package
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast, confirm, prompt } from '@/lib/utils/notification';
import { useRouter } from 'next/navigation';

const API_THANH_TOAN = '/payments/all';
const API_ORDER = '/orders';
const API_CONTRACT = '/payments/contract';

interface FinancialRecord {
  _id: string;
  type: 'ORDER' | 'CONTRACT';
  code: string;
  customer: {
    name: string;
    code: string;
    segment: string;
  } | null;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  orderStatus?: string;
  contractStatus?: string;
  date: string;
}

export default function ThanhToanPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_THANH_TOAN);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching financial records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async (record: FinancialRecord) => {
    if (record.type === 'ORDER') {
      router.push(`/quan-ly-thanh-toan/checkout/${record._id}`);
    } else {
      const amount = await prompt(`Nhập số tiền đã thanh toán cho hợp đồng ${record.code} (Tổng: ${record.totalAmount.toLocaleString()} đ):`, record.paidAmount.toString());
      if (amount === null) return;
      const cleanAmount = amount.replace(/[,.]/g, '');
      const val = parseInt(cleanAmount);
      if (isNaN(val)) {
        toast.error('Số tiền không hợp lệ');
        return;
      }
      try {
        await api.patch(`${API_CONTRACT}/${record._id}`, { paidAmount: val });
        fetchRecords();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Lỗi cập nhật công nợ');
      }
    }
  };

  const STATS = {
    totalExpected: records.reduce((sum, r) => sum + r.totalAmount, 0),
    totalPaid: records.reduce((sum, r) => sum + r.paidAmount, 0),
    totalDebt: records.reduce((sum, r) => sum + r.debtAmount, 0),
    pendingCount: records.filter(r => r.debtAmount > 0).length,
  };

  const filteredData = records.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (item.customer?.name || '').toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.customer?.code || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' ||
      (filter === 'order' && item.type === 'ORDER') ||
      (filter === 'contract' && item.type === 'CONTRACT') ||
      (filter === 'debt' && item.debtAmount > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Công nợ & Thanh toán</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Theo dõi dòng tiền, các khoản thanh toán đơn hàng lẻ và tiến độ thu hồi công nợ hợp đồng.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Doanh Thu */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-emerald-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tổng Doanh Thu (HĐ + ĐH)
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.totalExpected.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-100">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Đã Thu Hồi */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-blue-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Đã Thu Hồi
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.totalPaid.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Công Nợ Phải Thu */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-rose-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Công Nợ Phải Thu
              </p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight">
                {STATS.totalDebt.toLocaleString()} <span className="text-xs font-bold text-rose-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-rose-100">
              <CreditCard size={22} />
            </div>
          </div>
        </div>

        {/* Card 4: Đơn/HĐ Còn Lại */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-amber-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Đơn/HĐ Còn Lại
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.pendingCount} <span className="text-xs font-bold text-slate-400 ml-0.5">mục</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-amber-100">
              <Clock size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                placeholder="Tra cứu mã HĐ, đơn, khách..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'order', label: 'Đơn hàng lẻ' },
                { id: 'contract', label: 'Hợp đồng dự án' },
                { id: 'debt', label: 'Còn công nợ' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    filter === f.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100 cursor-pointer"
            onClick={fetchRecords}
          >
            <FileCheck size={18} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Loại / Mã tham chiếu</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Khách Hàng</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Tổng Giá Trị</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Đã Thanh Toán</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Công Nợ</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng Thái</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Ngày Lập</th>
                <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-blue-600 font-bold">
                    Đang tải dữ liệu tài chính...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-400 font-medium italic">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                </tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        item.type === 'ORDER' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.type === 'ORDER' ? <Package size={18} /> : <FileCheck size={18} />}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {item.type === 'ORDER' ? 'ĐƠN HÀNG' : 'HỢP ĐỒNG'}
                        </div>
                        <div className="font-bold text-slate-900 text-[14px]">
                          {item.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-[14px]">
                      {item.customer?.name || 'Vãng lai'}
                    </div>
                    <div className="text-[12px] text-slate-400 font-medium mt-0.5">
                      {item.customer?.code || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-[14px]">
                    {item.totalAmount.toLocaleString()} ₫
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600 text-[14px]">
                    {item.paidAmount.toLocaleString()} ₫
                  </td>
                  <td className={`px-6 py-4 font-black text-[14px] ${
                    item.debtAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {item.debtAmount === 0 ? '—' : `${item.debtAmount.toLocaleString()} ₫`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      onClick={() => handleTogglePayment(item)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                        item.debtAmount === 0 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                          : item.paidAmount > 0 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100'
                      }`}
                    >
                      {item.debtAmount === 0 ? 'Đã quyết toán' : item.paidAmount > 0 ? 'Đang thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-400 font-medium">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedTransaction(item)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 transition-all cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleTogglePayment(item)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
                        title={item.type === 'ORDER' ? 'Thay đổi trạng thái' : 'Cập nhật số tiền'}
                      >
                        {item.type === 'ORDER' ? <ArrowRight size={16} /> : <CreditCard size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[90%] max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <FileCheck size={18} className="text-blue-600"/> Chi Tiết Giao Dịch
              </h3>
              <button onClick={() => setSelectedTransaction(null)} className="text-slate-400 hover:text-rose-600 transition-colors p-1"><XCircle size={22}/></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shadow-sm border ${selectedTransaction.type === 'ORDER' ? 'text-blue-600 border-blue-100 bg-blue-50' : 'text-amber-600 border-amber-100 bg-amber-50'}`}>
                   {selectedTransaction.type === 'ORDER' ? <Package size={20} /> : <FileCheck size={20} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedTransaction.type === 'ORDER' ? 'Đơn hàng' : 'Hợp đồng'}</div>
                  <div className="text-lg font-black text-slate-800">{selectedTransaction.code}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Khách Hàng</div>
                  <div className="font-bold text-slate-800 text-sm line-clamp-1">{selectedTransaction.customer?.name || 'Vãng lai'}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{selectedTransaction.customer?.code || 'N/A'}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày Lập</div>
                  <div className="font-bold text-slate-800 text-sm">{new Date(selectedTransaction.date).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-2 bg-white border border-slate-200 shadow-sm rounded-lg p-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Tổng Giá Trị</span>
                  <span className="font-black text-slate-800">{selectedTransaction.totalAmount.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-3">
                  <span className="text-slate-500 font-medium">Đã Thanh Toán</span>
                  <span className="font-black text-emerald-600">{selectedTransaction.paidAmount.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-3">
                  <span className="text-slate-500 font-medium">Công Nợ Còn Lại</span>
                  <span className="font-black text-rose-600">{selectedTransaction.debtAmount.toLocaleString()} ₫</span>
                </div>
              </div>

              <div className="flex justify-between items-center px-1 pt-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái:</div>
                <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                  selectedTransaction.debtAmount === 0 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : selectedTransaction.paidAmount > 0 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {selectedTransaction.debtAmount === 0 ? 'Đã quyết toán' : selectedTransaction.paidAmount > 0 ? 'Đang thanh toán' : 'Chưa thanh toán'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};