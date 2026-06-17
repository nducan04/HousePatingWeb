'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ShieldCheck, Wallet, Landmark, Copy, AlertCircle, CreditCard } from 'lucide-react';
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
  // "MOMO" or "CARD"
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'CARD'>('MOMO');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  // Voucher state
  const [discountCode, setDiscountCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<any>(null);

  const handleCardPayment = async () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCVC) {
      toast.error('Vui lòng điền đầy đủ thông tin thẻ');
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await api.post('/thanh-toan/card-payment', {
        contractId: id,
        termId: selectedPaymentTerm === 'FULL' ? null : selectedPaymentTerm,
        amount: finalAmount,
        discountCode: discountInfo?.MaVoucher,
        discountAmount: discountInfo?.DiscountAmount
      });

      if (response.data.success) {
        toast.success('Thanh toán thẻ thành công!');
        router.push('/my-payments'); 
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi thanh toán');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsProcessing(false);
    }
  };

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

  // Calculate final amount after voucher
  const discountAmount = discountInfo?.DiscountAmount || 0;
  const finalAmount = Math.max(0, selectedAmount - discountAmount);

  const handleApplyVoucher = async () => {
    if (!discountCode) return;
    try {
      const res = await api.post("/promotions/validate", {
        code: discountCode,
        cartTotal: selectedAmount,
      });
      if (res.data.success) {
        setDiscountInfo(res.data.data);
        toast.success("Áp dụng mã giảm giá thành công!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Mã không hợp lệ hoặc không đủ điều kiện");
      setDiscountInfo(null);
    }
  };

  const handleMomoPayment = async () => {
    if (!contract || selectedAmount <= 0) return;
    
    try {
      setIsProcessing(true);
      
      const type = selectedPaymentTerm === 'FULL' ? 'CONTRACT' : 'CONTRACT_INSTALLMENT';
      const paymentId = selectedPaymentTerm === 'FULL' ? contract._id : `${contract._id}_${selectedPaymentTerm}`;

      const res = await api.post('/thanh-toan/momo/create', {
        type,
        id: paymentId,
        amount: finalAmount,
        discountCode: discountInfo?.MaVoucher,
        discountAmount: discountInfo?.DiscountAmount
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
    <div className="min-h-screen bg-slate-50 relative pb-20">
      {/* Premium Background Header */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-slate-900 overflow-hidden">
        {/* Abstract decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900 to-blue-900/50"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[80%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-12">
        {/* Header */}
        <div className="flex items-center gap-5 mb-12">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 rounded-[16px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 transition-all shadow-lg"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Thanh toán Hợp đồng</h1>
            <p className="text-indigo-200/90 mt-1.5 font-medium text-[15px] drop-shadow-sm">Giao dịch an toàn, bảo mật & minh bạch 100%.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Cột trái: Thông tin hợp đồng và Tùy chọn số tiền */}
          <div className="w-full lg:w-7/12 space-y-6">
            
            {/* Tóm tắt Hợp đồng */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">Mã Hợp Đồng</span>
                    <span className="font-bold text-slate-700">{contract.contractId}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                    <ShieldCheck size={24} />
                  </div>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{contract.title}</h2>

                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-slate-50/80 backdrop-blur-md rounded-[20px] p-5 border border-slate-100">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tổng giá trị</div>
                    <div className="font-black text-slate-900 text-2xl tracking-tight">{contract.value.toLocaleString()} <span className="text-base text-slate-400">₫</span></div>
                  </div>
                  <div className="bg-emerald-50/50 backdrop-blur-md rounded-[20px] p-5 border border-emerald-100/50">
                    <div className="text-[11px] font-black text-emerald-600/70 uppercase tracking-widest mb-2">Đã thanh toán</div>
                    <div className="font-black text-emerald-600 text-2xl tracking-tight">{(contract.daThanhToan || 0).toLocaleString()} <span className="text-base text-emerald-600/50">₫</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lựa chọn đợt thanh toán */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-2xl shadow-slate-200/50 relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Landmark size={20} />
                </div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Kế hoạch thanh toán</h3>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-8 ml-13">Vui lòng chọn đợt thanh toán phù hợp với tiến độ dự án.</p>

              <div className="space-y-4">
                {/* Toàn bộ */}
                {remainingTotal > 0 && (
                  <label className={`block relative p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300 ${selectedPaymentTerm === 'FULL' ? 'border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50 transform -translate-y-1' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'}`}>
                    <div className="flex items-start gap-5">
                      <div className="pt-1">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPaymentTerm === 'FULL' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {selectedPaymentTerm === 'FULL' && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-slate-900 text-lg">Thanh toán toàn bộ phần còn lại</div>
                          <div className={`font-black text-xl tracking-tight ${selectedPaymentTerm === 'FULL' ? 'text-indigo-600' : 'text-slate-900'}`}>{remainingTotal.toLocaleString()} ₫</div>
                        </div>
                        <div className="text-sm text-slate-500 font-medium mt-1">Hoàn tất 100% nghĩa vụ tài chính của hợp đồng.</div>
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
                    <label key={term._id || idx} className={`block relative p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300 ${isSelected ? 'border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100/50 transform -translate-y-1' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'}`}>
                      <div className="flex items-start gap-5">
                        <div className="pt-1">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              {term.name} 
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-black tracking-widest text-slate-600">{term.percentage}%</span>
                            </div>
                            <div className={`font-black text-xl tracking-tight ${isSelected ? 'text-indigo-600' : 'text-slate-900'}`}>{termRemaining.toLocaleString()} ₫</div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium mt-3 bg-white/60 p-3 rounded-xl border border-slate-100/50">
                            <div className="flex items-center gap-2 text-slate-600">
                              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                              Hạn chót: <span className="font-bold text-slate-800">{new Date(term.dueDate).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>
                            <div className="text-slate-600">Tổng đợt: <span className="font-bold text-slate-800">{term.amount.toLocaleString()} ₫</span></div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}

                {remainingTotal <= 0 && (
                  <div className="p-10 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-[32px] text-center border border-emerald-100/50 shadow-inner">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <h4 className="font-black text-emerald-800 text-2xl mb-2">Hoàn tất thanh toán</h4>
                    <p className="text-emerald-600 font-medium text-lg">Hợp đồng này không còn công nợ cần thanh toán.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột phải: Phương thức thanh toán */}
          <div className="w-full lg:w-5/12 space-y-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-2xl shadow-slate-200/50 sticky top-10">
              <h3 className="font-black text-slate-900 mb-6 text-xl tracking-tight">Chi tiết giao dịch</h3>

              {remainingTotal > 0 ? (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-[16px] mb-8">
                    <button 
                      onClick={() => setPaymentMethod('MOMO')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-bold transition-all ${paymentMethod === 'MOMO' ? 'bg-white text-[#A50064] shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      <Wallet size={18} /> Qua Ví MoMo
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('CARD')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-bold transition-all ${paymentMethod === 'CARD' ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    >
                      <CreditCard size={18} /> Thẻ Tín Dụng
                    </button>
                  </div>

                  {/* Voucher */}
                  <div className="relative group mb-8">
                    <label className="absolute left-4 -top-2.5 bg-white px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Mã khuyến mãi</label>
                    <div className="flex gap-2 relative">
                      <input 
                        type="text" 
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã giảm giá (nếu có)"
                        className="w-full bg-transparent border-2 border-slate-200 rounded-xl pl-4 pr-24 py-3.5 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px]" 
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>

                  {/* Bill Summary */}
                  <div className="p-6 bg-slate-50/80 backdrop-blur-sm rounded-[24px] mb-8 flex flex-col gap-4 border border-slate-100">
                    <div className="flex justify-between items-center text-[15px] font-bold text-slate-500">
                      <span>Cần thanh toán</span>
                      <span className="text-slate-800">{selectedAmount.toLocaleString()} ₫</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[15px] font-bold text-emerald-600 bg-emerald-50/50 p-2 -mx-2 rounded-lg">
                        <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> Ưu đãi giảm giá</span>
                        <span>- {discountAmount.toLocaleString()} ₫</span>
                      </div>
                    )}
                    
                    <div className="pt-4 mt-2 border-t border-slate-200/80">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng tiền thanh toán cuối</div>
                      <div className="text-4xl font-black text-indigo-600 tracking-tight">{finalAmount.toLocaleString()} <span className="text-2xl text-indigo-400">₫</span></div>
                      <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        {selectedTermName}
                      </div>
                    </div>
                  </div>

                  {/* Payment Actions */}
                  {paymentMethod === 'MOMO' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-rose-50/80 border border-rose-100 rounded-[16px] p-4 mb-6 flex gap-3 items-start">
                        <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-rose-700 font-medium leading-relaxed">Hệ thống sẽ tự động gạch nợ ngay lập tức khi giao dịch MoMo thành công.</div>
                      </div>

                      <button 
                        disabled={isProcessing}
                        onClick={handleMomoPayment}
                        className="w-full py-4 rounded-[16px] bg-[#A50064] hover:bg-[#850050] text-white font-black text-[17px] tracking-wide transition-all shadow-xl shadow-[#A50064]/30 hover:shadow-[#A50064]/40 hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[12px] font-black text-[#A50064]">M</div>
                        )}
                        Thanh toán MoMo
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'CARD' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Realistic Card UI */}
                      <div className="w-full h-[200px] rounded-[24px] bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-6 shadow-2xl shadow-slate-900/40 mb-8 relative overflow-hidden group">
                        <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-[100%] group-hover:translate-x-[50%] transition-transform duration-1000"></div>
                        
                        <div className="relative z-10 flex justify-between items-start mb-6">
                          <div className="text-[10px] font-black tracking-widest text-white/50 uppercase">Thẻ tín dụng</div>
                          <div className="flex relative items-center">
                            <div className="w-8 h-8 rounded-full bg-[#eb001b] mix-blend-screen opacity-90 relative z-20"></div>
                            <div className="w-8 h-8 rounded-full bg-[#f79e1b] mix-blend-screen opacity-90 absolute -left-4 z-10"></div>
                          </div>
                        </div>

                        <div className="relative z-10 mt-4 mb-6">
                          <div className="text-[20px] font-mono tracking-[0.15em] text-white/90 drop-shadow-md">
                            {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '**** **** **** ****'}
                          </div>
                        </div>

                        <div className="relative z-10 flex justify-between items-end">
                          <div>
                            <div className="text-[8px] font-bold tracking-widest text-white/50 uppercase mb-1">Tên chủ thẻ</div>
                            <div className="text-[13px] font-mono text-white/90 tracking-widest uppercase truncate max-w-[150px]">
                              {cardName || 'NGUYEN VAN A'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-bold tracking-widest text-white/50 uppercase mb-1">Hết hạn</div>
                            <div className="text-[13px] font-mono text-white/90 tracking-widest">
                              {cardExpiry || 'MM/YY'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Form */}
                      <div className="space-y-5 mb-8">
                        <div className="relative group">
                          <label className="absolute left-4 -top-2.5 bg-white px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Số thẻ</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              maxLength={16}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                              placeholder="0000 0000 0000 0000"
                              className="w-full bg-transparent border-2 border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px]" 
                            />
                            <CreditCard size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          </div>
                        </div>

                        <div className="relative group">
                          <label className="absolute left-4 -top-2.5 bg-white px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Tên in trên thẻ</label>
                          <input 
                            type="text" 
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            placeholder="NGUYEN VAN A"
                            className="w-full bg-transparent border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px] uppercase" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div className="relative group">
                            <label className="absolute left-4 -top-2.5 bg-white px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Ngày hết hạn</label>
                            <input 
                              type="text" 
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2);
                                setCardExpiry(val);
                              }}
                              placeholder="MM/YY"
                              className="w-full bg-transparent border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px]" 
                            />
                          </div>
                          <div className="relative group">
                            <label className="absolute left-4 -top-2.5 bg-white px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">CVC/CVV</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              value={cardCVC}
                              onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))}
                              placeholder="•••"
                              className="w-full bg-transparent border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[20px] tracking-widest" 
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        disabled={isProcessing}
                        onClick={handleCardPayment}
                        className="w-full py-4 rounded-[16px] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[17px] tracking-wide transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden relative group"
                      >
                        {!isProcessing && (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        )}
                        {isProcessing ? (
                          <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <CreditCard size={20} />
                        )}
                        Thanh toán ngay
                      </button>
                    </div>
                  )}

                  {/* Security Badges */}
                  <div className="mt-8 flex items-center justify-center gap-4 text-slate-400">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={14} />
                      Bảo mật 256-bit SSL
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Đã hoàn tất thanh toán</h3>
                  <p className="text-slate-500 font-medium text-base">Cảm ơn bạn đã đồng hành cùng VTSC.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
