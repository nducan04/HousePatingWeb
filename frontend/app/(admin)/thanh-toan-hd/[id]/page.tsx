'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, Download, Receipt } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

interface PaymentTerm {
  _id?: string;
  name: string;
  percentage: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate?: string;
}

interface ContractDetail {
  _id: string;
  contractId: string;
  title: string;
  customer?: { _id: string; name: string; code: string };
  employee?: { _id: string; name: string; code: string };
  partyBRepresentative?: string;
  value: number;
  daThanhToan: number;
  status: string;
  createdAt: string;
  slaDeadline?: string;
  paymentTerms: PaymentTerm[];
}

export default function ContractPaymentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id]);

  const fetchContractDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/contracts/${id}`);
      if (res.data.success) {
        const c = res.data.data;
        setContract(c);
        if (c.paymentTerms && c.paymentTerms.length > 0) {
          setTerms(c.paymentTerms.map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
            paidDate: t.paidDate ? new Date(t.paidDate).toISOString().split('T')[0] : ''
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching contract detail:', error);
      toast.error('Lỗi khi tải dữ liệu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setTerms([...terms, {
      name: `Đợt ${terms.length + 1}`,
      percentage: 0,
      amount: 0,
      dueDate: new Date().toISOString().split('T')[0],
      paidAmount: 0
    }]);
  };

  const handleRemoveRow = (index: number) => {
    const newTerms = [...terms];
    newTerms.splice(index, 1);
    setTerms(newTerms);
  };

  const handleClearAll = () => {
    if (confirm('Bạn có chắc muốn xóa tất cả các đợt thanh toán?')) {
      setTerms([]);
    }
  };

  const handleTermChange = (index: number, field: keyof PaymentTerm, value: string | number) => {
    const newTerms = [...terms];
    const totalValue = contract?.value || 0;

    if (field === 'percentage') {
      const pct = Number(value);
      newTerms[index].percentage = pct;
      newTerms[index].amount = (pct / 100) * totalValue;
    } else if (field === 'amount') {
      const amt = Number(value);
      newTerms[index].amount = amt;
      newTerms[index].percentage = totalValue > 0 ? Number(((amt / totalValue) * 100).toFixed(2)) : 0;
    } else {
      (newTerms[index] as any)[field] = value;
    }

    setTerms(newTerms);
  };

  const handleSaveTerms = async () => {
    try {
      setIsSaving(true);
      // Validate total percentage
      const totalPct = terms.reduce((sum, t) => sum + Number(t.percentage), 0);
      if (terms.length > 0 && Math.abs(totalPct - 100) > 0.1) {
        toast.error(`Tổng tỷ lệ thanh toán phải là 100% (Hiện tại: ${totalPct}%)`);
        setIsSaving(false);
        return;
      }

      const res = await api.put(`/contracts/${id}/payment-terms`, { paymentTerms: terms });
      if (res.data.success) {
        toast.success('Lưu điều khoản thanh toán thành công');
        fetchContractDetail(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving terms:', error);
      toast.error('Lỗi khi lưu điều khoản thanh toán');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    toast.success('Đã tải xuống Biên bản đối chiếu công nợ (PDF)');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!contract) return <div>Không tìm thấy dữ liệu.</div>;

  const totalValue = contract.value || 0;
  const totalPaid = terms.reduce((sum, t) => sum + Number(t.paidAmount), 0);
  const totalPct = terms.reduce((sum, t) => sum + Number(t.percentage), 0);
  const totalAmount = terms.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 bg-blue-500/10 pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">HỢP ĐỒNG</span>
              <h2 className="text-xl font-bold text-slate-800">{contract.contractId}</h2>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
            <Download size={16} /> Đối chiếu công nợ
          </button>
          <button 
            onClick={handleSaveTerms} 
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-md font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <span className="animate-spin text-white">⭮</span> : <Save size={16} />} 
            Lưu Cập Nhật
          </button>
        </div>
      </div>

      {/* Contract General Info */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-wrap lg:flex-nowrap justify-between items-start gap-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-6 flex-grow">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số hợp đồng</div>
              <div className="font-medium text-slate-800">{contract.contractId}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày ký</div>
              <div className="font-medium text-slate-800">{new Date(contract.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Khách hàng</div>
              <div className="font-medium text-slate-800">{contract.customer?.name || contract.partyBRepresentative || 'Không rõ'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tình trạng Hợp đồng</div>
              <div className="font-medium text-slate-800">{contract.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hạn giao hàng / SLA</div>
              <div className="font-medium text-slate-800">{contract.slaDeadline ? new Date(contract.slaDeadline).toLocaleDateString('vi-VN') : '—'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Loại tiền</div>
              <div className="font-medium text-slate-800">VND</div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-right min-w-[250px]">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Giá trị hợp đồng</div>
            <div className="text-3xl font-bold text-slate-800">{totalValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Điều khoản thanh toán Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <Receipt size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Điều khoản thanh toán</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase w-10 text-center">#</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase w-48">Đợt thanh toán</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase text-right w-24">Tỷ lệ (%)</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase text-right w-40">Giá trị thanh toán</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase text-center w-36">Hạn thanh toán</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase text-center w-36">Ngày thanh toán</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-emerald-600 uppercase text-right w-40">Số đã thu</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-amber-600 uppercase text-right w-40">Còn phải thu</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-600 uppercase text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms.map((term, idx) => {
                const conPhaiThu = Math.max(0, Number(term.amount) - Number(term.paidAmount));
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <input 
                        type="text" 
                        value={term.name} 
                        onChange={(e) => handleTermChange(idx, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm font-medium text-slate-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        value={term.percentage} 
                        onChange={(e) => handleTermChange(idx, 'percentage', e.target.value)}
                        className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm font-semibold text-slate-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        value={term.amount} 
                        onChange={(e) => handleTermChange(idx, 'amount', e.target.value)}
                        className="w-full text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm font-semibold text-slate-800"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="date" 
                        value={term.dueDate} 
                        onChange={(e) => handleTermChange(idx, 'dueDate', e.target.value)}
                        className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm font-medium text-slate-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="date" 
                        value={term.paidDate} 
                        onChange={(e) => handleTermChange(idx, 'paidDate', e.target.value)}
                        className="w-full text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors text-sm font-medium text-slate-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" 
                        value={term.paidAmount} 
                        onChange={(e) => handleTermChange(idx, 'paidAmount', e.target.value)}
                        className="w-full text-right bg-emerald-50 rounded-md px-2 py-1 border border-emerald-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm font-semibold text-emerald-700"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600 text-sm">
                      {conPhaiThu.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Xóa dòng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {/* TỔNG ROW */}
              <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                <td className="px-4 py-4 text-center"></td>
                <td className="px-4 py-4 uppercase text-sm">Tổng</td>
                <td className={`px-4 py-4 text-right text-sm ${Math.abs(totalPct - 100) > 0.1 ? 'text-rose-500' : ''}`}>{totalPct.toFixed(2)}</td>
                <td className="px-4 py-4 text-right text-sm">{totalAmount.toLocaleString()}</td>
                <td colSpan={2}></td>
                <td className="px-4 py-4 text-right text-sm text-emerald-600">{totalPaid.toLocaleString()}</td>
                <td className="px-4 py-4 text-right text-sm text-amber-600">{Math.max(0, totalAmount - totalPaid).toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <button 
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Plus size={16} /> Thêm dòng
          </button>
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-white border border-slate-200 rounded-md hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            Xóa hết dòng
          </button>
        </div>
      </div>
      
      {/* Help Note */}
      <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm text-blue-800 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p>
          Bạn có thể thay đổi tỷ lệ % hoặc nhập trực tiếp Giá trị thanh toán, hệ thống sẽ tự tính toán giá trị còn lại. 
          Nhớ nhập <strong>Số đã thu</strong> cho từng đợt để cập nhật tổng Đã Thanh Toán của Hợp đồng. Bấm <strong>Lưu Cập Nhật</strong> khi hoàn tất.
        </p>
      </div>

    </div>
  );
}
