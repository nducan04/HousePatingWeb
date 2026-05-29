'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Eye, CreditCard, DollarSign, Wallet, FileCheck,
  CheckCircle2, XCircle, Clock, ArrowRight, Package
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

const API_THANH_TOAN = '/payments/my-payments';

interface FinancialRecord {
  _id: string;
  type: 'ORDER' | 'CONTRACT';
  code: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  date: string;
}

export default function MyPaymentsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

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

  const handlePayNow = async (record: FinancialRecord) => {
    if (record.debtAmount <= 0) return;
    
    // Call MoMo API
    try {
      const momoRes = await api.post('/payments/momo/create', {
        type: record.type,
        id: record._id,
        amount: record.debtAmount
      });

      if (momoRes.data.success && momoRes.data.payUrl) {
        window.location.href = momoRes.data.payUrl;
      } else {
        toast.error('Lỗi khởi tạo thanh toán MoMo.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối cổng thanh toán.');
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
    const matchSearch = item.code.toLowerCase().includes(q);
    const matchFilter = filter === 'all' ||
      (filter === 'order' && item.type === 'ORDER') ||
      (filter === 'contract' && item.type === 'CONTRACT') ||
      (filter === 'debt' && item.debtAmount > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1c3c77] tracking-tight">Lịch sử Giao dịch & Thanh toán</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Theo dõi chi tiết thanh toán các đơn hàng và hợp đồng của bạn.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Tổng Doanh Thu / Mua Hàng */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-emerald-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tổng giá trị (HĐ + ĐH)
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.totalExpected.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shadow-sm">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Đã Thanh Toán */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-blue-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Đã Thanh Toán
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.totalPaid.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Công Nợ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-rose-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Số Tiền Chưa Thanh Toán
              </p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight">
                {STATS.totalDebt.toLocaleString()} <span className="text-xs font-bold text-rose-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 shadow-sm">
              <CreditCard size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1c3c77] transition-all font-medium"
                placeholder="Tra cứu mã HĐ, đơn..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'order', label: 'Đơn hàng lẻ' },
                { id: 'contract', label: 'Hợp đồng dự án' },
                { id: 'debt', label: 'Còn công nợ' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    filter === f.id
                      ? "bg-[#1c3c77] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
            onClick={fetchRecords}
          >
            <FileCheck size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Loại / Mã tham chiếu</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Tổng Giá Trị</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Đã Thanh Toán</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest text-rose-500">Còn Lại</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Trạng Thái</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Ngày Lập</th>
                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-[#1c3c77] font-bold">
                    Đang tải dữ liệu tài chính...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-400 font-medium italic">
                    Không tìm thấy dữ liệu giao dịch nào.
                  </td>
                </tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${
                        item.type === 'ORDER' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
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
                  <td className="px-6 py-4 font-bold text-slate-900 text-[14px]">
                    {item.totalAmount.toLocaleString()} ₫
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 text-[14px]">
                    {item.paidAmount.toLocaleString()} ₫
                  </td>
                  <td className={`px-6 py-4 font-black text-[14px] ${
                    item.debtAmount > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {item.debtAmount === 0 ? '—' : `${item.debtAmount.toLocaleString()} ₫`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        item.debtAmount === 0 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : item.paidAmount > 0 
                            ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}
                    >
                      {item.debtAmount === 0 ? 'Đã Thanh Toán' : item.paidAmount > 0 ? 'Đang Thanh Toán' : 'Chưa Thanh Toán'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.debtAmount > 0 ? (
                      <button
                        onClick={() => handlePayNow(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 font-bold text-xs transition-colors cursor-pointer border border-pink-100"
                      >
                        <CreditCard size={14} /> Thanh toán
                      </button>
                    ) : (
                      <span className="text-emerald-500 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100"><CheckCircle2 size={14}/> Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
