'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, Wallet, Landmark, Copy, AlertCircle } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

interface PaymentTerm {
  _id: string;
  name: string;
  percentage: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
}

interface Contract {
  _id: string;
  contractId: string;
  title: string;
  value: number;
  daThanhToan: number;
  createdAt: string;
  paymentTerms: PaymentTerm[];
}

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  
  // "FULL" or term._id
  const [selectedPaymentTerm, setSelectedPaymentTerm] = useState<string>('FULL');
  // "MOMO" or "BANK"
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'BANK'>('MOMO');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) fetchContract();
  }, [id]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/contracts/${id}`);
      if (res.data.success) {
        setContract(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      toast.error('Lỗi tải dữ liệu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const remainingTotal = contract ? contract.value - (contract.daThanhToan || 0) : 0;

  // Find the selected amount based on selection
  let selectedAmount = remainingTotal;
  let selectedTermName = 'Toàn bộ phần còn lại';
  
  if (selectedPaymentTerm !== 'FULL' && contract) {
    const term = contract.paymentTerms.find(t => t._id === selectedPaymentTerm);
    if (term) {
      selectedAmount = Math.max(0, term.amount - (term.paidAmount || 0));
      selectedTermName = term.name;
    }
  }

  const handleMomoPayment = async () => {
    if (!contract || selectedAmount <= 0) return;
    
    try {
      setIsProcessing(true);
      
      const type = selectedPaymentTerm === 'FULL' ? 'CONTRACT' : 'CONTRACT_INSTALLMENT';
      const paymentId = selectedPaymentTerm === 'FULL' ? contract._id : `${contract._id}_${selectedPaymentTerm}`;

      const res = await api.post('/thanh-toan/momo/create', {
        type,
        id: paymentId,
        amount: selectedAmount,
      });

      if (res.data.success && res.data.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        toast.error('Lỗi tạo link thanh toán MoMo');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán MoMo');
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!contract) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy hợp đồng</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Thanh toán công nợ Hợp đồng</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Lựa chọn đợt thanh toán và phương thức giao dịch an toàn.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Cột trái: Thông tin hợp đồng và Tùy chọn số tiền */}
          <div className="w-full lg:w-7/12 space-y-6">
            
            {/* Tóm tắt Hợp đồng */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">Mã Hợp Đồng</span>
                    <span className="font-bold text-slate-800">{contract.contractId}</span>
                  </div>
                  <ShieldCheck size={20} className="text-blue-600" />
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-6">{contract.title}</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng giá trị</div>
                    <div className="font-black text-slate-800 text-lg">{contract.value.toLocaleString()} ₫</div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Đã thanh toán</div>
                    <div className="font-black text-emerald-600 text-lg">{(contract.daThanhToan || 0).toLocaleString()} ₫</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lựa chọn đợt thanh toán */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 mb-1 text-lg">Bạn muốn thanh toán phần nào?</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">Chọn thanh toán toàn bộ phần còn lại hoặc trả theo từng đợt.</p>

              <div className="space-y-4">
                {/* Toàn bộ */}
                {remainingTotal > 0 && (
                  <label className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedPaymentTerm === 'FULL' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <input 
                          type="radio" 
                          name="paymentTerm" 
                          value="FULL" 
                          checked={selectedPaymentTerm === 'FULL'} 
                          onChange={() => setSelectedPaymentTerm('FULL')}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-slate-800 text-lg">Toàn bộ phần còn lại</div>
                          <div className="font-black text-blue-600 text-lg">{remainingTotal.toLocaleString()} ₫</div>
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Thanh toán dứt điểm công nợ hiện tại của hợp đồng.</div>
                      </div>
                    </div>
                  </label>
                )}

                {/* Các đợt */}
                {contract.paymentTerms?.map((term, idx) => {
                  const termRemaining = Math.max(0, term.amount - (term.paidAmount || 0));
                  if (termRemaining <= 0) return null; // Đã thanh toán xong đợt này

                  const isSelected = selectedPaymentTerm === term._id;

                  return (
                    <label key={term._id || idx} className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          <input 
                            type="radio" 
                            name="paymentTerm" 
                            value={term._id} 
                            checked={isSelected} 
                            onChange={() => setSelectedPaymentTerm(term._id)}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-slate-800 text-lg">{term.name} <span className="text-slate-400 font-medium text-sm ml-1">({term.percentage}%)</span></div>
                            <div className="font-black text-blue-600 text-lg">{termRemaining.toLocaleString()} ₫</div>
                          </div>
                          <div className="flex items-center gap-4 text-sm font-medium mt-2">
                            <div className="text-slate-500">Hạn chót: <span className="font-bold text-slate-700">{new Date(term.dueDate).toLocaleDateString('vi-VN')}</span></div>
                            <div className="text-slate-500">Tổng đợt: {term.amount.toLocaleString()} ₫</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}

                {remainingTotal <= 0 && (
                  <div className="p-6 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
                    <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                    <h4 className="font-black text-emerald-700 text-lg">Đã thanh toán đủ</h4>
                    <p className="text-emerald-600 font-medium mt-1">Hợp đồng này không còn công nợ.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Phương thức thanh toán */}
          <div className="w-full lg:w-5/12 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-10">
              <h3 className="font-black text-slate-800 mb-6 text-lg">Phương thức thanh toán</h3>

              {remainingTotal > 0 ? (
                <>
                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl mb-6">
                    <button 
                      onClick={() => setPaymentMethod('MOMO')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'MOMO' ? 'bg-white text-[#A50064] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Wallet size={16} /> Qua Ví MoMo
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('BANK')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'BANK' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Landmark size={16} /> Chuyển khoản
                    </button>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl mb-6">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Tổng tiền cần thanh toán</div>
                    <div className="text-3xl font-black text-blue-600 text-center">{selectedAmount.toLocaleString()} ₫</div>
                    <div className="text-sm font-medium text-slate-500 text-center mt-2">Cho: {selectedTermName}</div>
                  </div>

                  {paymentMethod === 'MOMO' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 mb-6 flex gap-3">
                        <AlertCircle size={20} className="text-rose-500 shrink-0" />
                        <div className="text-sm text-rose-700 font-medium">Hệ thống sẽ tự động gạch nợ ngay lập tức khi giao dịch MoMo thành công.</div>
                      </div>

                      <button 
                        disabled={isProcessing}
                        onClick={handleMomoPayment}
                        className="w-full py-4 rounded-2xl bg-[#A50064] hover:bg-[#850050] text-white font-black text-lg transition-all shadow-lg shadow-[#A50064]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-black text-[#A50064]">M</div>
                        )}
                        Thanh toán bằng MoMo
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'BANK' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngân hàng hưởng thụ</div>
                          <div className="font-bold text-slate-800 text-lg">Ngân hàng TMCP Quân Đội (MB Bank)</div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số tài khoản</div>
                          <div className="flex items-center gap-2">
                            <div className="font-black text-blue-600 text-2xl tracking-wider">1234 5678 9999</div>
                            <button onClick={() => copyToClipboard('123456789999', 'Số tài khoản')} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors">
                              <Copy size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chủ tài khoản</div>
                          <div className="font-bold text-slate-800">CÔNG TY CP TM & DV VOSCO</div>
                        </div>

                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mt-2">
                          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Nội dung chuyển khoản (Bắt buộc)</div>
                          <div className="flex items-start gap-2">
                            <div className="font-black text-amber-800 flex-1 break-all bg-white px-3 py-2 rounded-lg border border-amber-200">
                              HD {contract.contractId} TT {selectedPaymentTerm === 'FULL' ? 'TOAN BO' : 'DOT'}
                            </div>
                            <button 
                              onClick={() => copyToClipboard(`HD ${contract.contractId} TT ${selectedPaymentTerm === 'FULL' ? 'TOAN BO' : 'DOT'}`, 'Nội dung CK')} 
                              className="p-2.5 text-amber-600 hover:text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors shrink-0"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-amber-700 font-medium mt-3">Lưu ý: Quý khách vui lòng nhập chính xác nội dung chuyển khoản để Kế toán VTSC đối soát. Quá trình duyệt có thể mất từ 1-2 ngày làm việc.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">Không có hóa đơn chờ</h3>
                  <p className="text-slate-500 font-medium text-sm mt-1">Cảm ơn bạn đã đồng hành cùng VTSC.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
