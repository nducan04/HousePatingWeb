'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Landmark, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';
import { useAuthStore } from '@/lib/store/authStore';

interface PaymentTerm {
  _id: string;
  name: string;
  percentage: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
}

interface ContractData {
  _id: string;
  contractId: string;
  customer?: { name: string; code: string };
  partyBRepresentative?: string;
  employee?: { name: string };
  value: number;
  daThanhToan: number;
  createdAt: string;
  status: string;
  paymentTerms?: PaymentTerm[];
}

interface FlattenedTerm {
  contractId: string;
  contractMongoId: string;
  customerName: string;
  termId: string;
  termName: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'Đã Nhận' | 'Chưa Thanh Toán' | 'Quá Hạn';
}

export default function ThanhToanHDPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DA_QUYET_TOAN' | 'CHO_THU' | 'KHACH_CHAM_TRA'>('ALL');

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contracts');
      if (res.data.success) {
        setContracts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Lỗi khi lấy danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // 1. Flatten the data: One row per Payment Term
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const flattenedTerms: FlattenedTerm[] = [];
  contracts.forEach(contract => {
    if (contract.paymentTerms && contract.paymentTerms.length > 0) {
      contract.paymentTerms.forEach(term => {
        let status: FlattenedTerm['status'] = 'Chưa Thanh Toán';
        const isPaid = (term.paidAmount || 0) >= term.amount;
        
        if (isPaid) {
          status = 'Đã Nhận';
        } else {
          const dueDate = new Date(term.dueDate);
          if (dueDate < today) {
            status = 'Quá Hạn';
          } else {
            status = 'Chưa Thanh Toán';
          }
        }

        flattenedTerms.push({
          contractId: contract.contractId,
          contractMongoId: contract._id,
          customerName: contract.customer?.name || contract.partyBRepresentative || 'Không rõ',
          termId: term._id,
          termName: term.name,
          amount: term.amount,
          paidAmount: term.paidAmount || 0,
          dueDate: term.dueDate,
          status: status
        });
      });
    } else {
      // If a contract has no payment terms yet, we might want to still show it as a pending full amount,
      // but to match the image precisely, we rely on the backend auto-generating terms.
    }
  });

  // 2. Compute stats
  const totalReceived = contracts.reduce((sum, c) => sum + (c.daThanhToan || 0), 0);
  const totalExpected = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
  const pendingTermsCount = flattenedTerms.filter(t => t.status !== 'Đã Nhận').length;
  const overdueDebt = flattenedTerms
    .filter(t => t.status === 'Quá Hạn')
    .reduce((sum, t) => sum + (t.amount - t.paidAmount), 0);

  // Format to Tỷ for display if needed (but we can just use format number)
  const formatTy = (amount: number) => {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(2) + ' Tỷ';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(2) + ' Triệu';
    }
    return amount.toLocaleString() + ' đ';
  };

  // 3. Filter data
  const filteredData = flattenedTerms.filter(item => {
    const matchesSearch = item.contractId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'DA_QUYET_TOAN') return item.status === 'Đã Nhận';
    if (activeTab === 'CHO_THU') return item.status === 'Chưa Thanh Toán';
    if (activeTab === 'KHACH_CHAM_TRA') return item.status === 'Quá Hạn';
    return true; // ALL
  });

  const getStatusBadge = (status: FlattenedTerm['status']) => {
    switch (status) {
      case 'Đã Nhận':
        return <span className="px-2 py-0.5 border border-emerald-500 text-emerald-600 text-xs font-semibold rounded bg-emerald-50 whitespace-nowrap">Đã Nhận</span>;
      case 'Chưa Thanh Toán':
        return <span className="px-2 py-0.5 border border-amber-500 text-amber-600 text-xs font-semibold rounded bg-amber-50 whitespace-nowrap">Chưa Thanh Toán</span>;
      case 'Quá Hạn':
        return <span className="px-2 py-0.5 border border-rose-500 text-rose-600 text-xs font-semibold rounded bg-rose-50 whitespace-nowrap">Quá Hạn</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      
      {/* 1. Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4">
          <Landmark className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Tổng Dòng Tiền Đã Nhập Quỹ</div>
          <div className="text-2xl font-semibold text-slate-800">{formatTy(totalReceived)}</div>
        </div>
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4 pl-0 sm:pl-4">
          <DollarSign className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Dự Kiến Thu Về Hợp Đồng</div>
          <div className="text-2xl font-semibold text-slate-800">{formatTy(totalExpected)}</div>
        </div>
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4 pl-0 lg:pl-4">
          <FileText className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Số Đợt Chờ Thu</div>
          <div className="text-2xl font-semibold text-slate-800">{pendingTermsCount} Lần</div>
        </div>
        <div className="flex flex-col gap-2 pl-0 sm:pl-4 lg:pl-4">
          <AlertTriangle className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Giá Vốn Bị Kẹt Quá Hạn</div>
          <div className="text-2xl font-semibold text-slate-800">{formatTy(overdueDebt)}</div>
        </div>
      </div>

      {/* 2. Toolbar & Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Truy vấn số Hợp Đồng, Tên..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button 
                onClick={() => setActiveTab('ALL')}
                className={`whitespace-nowrap text-sm font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'ALL' ? 'text-slate-800 border-slate-800' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
              >
                Tất cả
              </button>
              <button 
                onClick={() => setActiveTab('DA_QUYET_TOAN')}
                className={`whitespace-nowrap text-sm font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'DA_QUYET_TOAN' ? 'text-slate-800 border-slate-800' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
              >
                Đã Quyết Toán
              </button>
              <button 
                onClick={() => setActiveTab('CHO_THU')}
                className={`whitespace-nowrap text-sm font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'CHO_THU' ? 'text-slate-800 border-slate-800' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
              >
                Chờ Thu
              </button>
              <button 
                onClick={() => setActiveTab('KHACH_CHAM_TRA')}
                className={`whitespace-nowrap text-sm font-semibold pb-1 border-b-2 transition-colors ${activeTab === 'KHACH_CHAM_TRA' ? 'text-slate-800 border-slate-800' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
              >
                Khách Chậm Trả
              </button>
            </div>
          </div>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm shrink-0">
            <Plus size={16} /> Lập Phiếu Nhắc Nợ
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-max whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID GIAO DỊCH</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MÃ HỢP ĐỒNG</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">THƯƠNG HIỆU ĐỐI TÁC</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">HẠNG MỤC CẦN THU</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SỐ TIỀN ĐỢT NÀY</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">HẠN THANH TOÁN</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy khoản thu nào
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  // Fake a long ID like in the picture just for UI matching, or use termId
                  const transactionId = `${item.contractId.replace('VTSC-', '')}-${item.termId.slice(0, 10)}...`;
                  
                  return (
                    <tr 
                      key={`${item.contractId}_${item.termId}`} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/thanh-toan-hd/${item.contractMongoId}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600 text-sm">{transactionId}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                        {item.contractId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.termName}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 text-sm">
                        {item.amount.toLocaleString()} ₫
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
