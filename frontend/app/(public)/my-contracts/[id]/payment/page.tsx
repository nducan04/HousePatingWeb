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
                      onClick={() => setPaymentMethod('CARD')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${paymentMethod === 'CARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <CreditCard size={16} /> Thẻ Tín Dụng
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mã khuyến mãi</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Nhập mã giảm giá..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-all"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl mb-6 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                      <span>Cần thanh toán:</span>
                      <span className="text-slate-700">{selectedAmount.toLocaleString()} ₫</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                        <span>Giảm giá (Voucher):</span>
                        <span>- {discountAmount.toLocaleString()} ₫</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Tổng tiền thanh toán cuối</div>
                      <div className="text-3xl font-black text-blue-600 text-center">{finalAmount.toLocaleString()} ₫</div>
                      <div className="text-sm font-medium text-slate-500 text-center mt-2">Cho: {selectedTermName}</div>
                    </div>
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

                  {paymentMethod === 'CARD' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      
                      {/* Thẻ ảo UI */}
                      <div className="w-full h-48 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-slate-800 p-6 shadow-xl mb-6 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className="text-white/60 font-medium tracking-widest text-xs uppercase">Thẻ thanh toán</div>
                          <div className="flex gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-rose-500/80"></div>
                            <div className="w-6 h-6 rounded-full bg-amber-500/80 -ml-3"></div>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <div className="text-white font-mono text-xl tracking-[0.2em] mb-2 shadow-sm">
                            {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '**** **** **** ****'}
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Tên chủ thẻ</div>
                              <div className="text-white font-bold uppercase tracking-wide text-sm truncate max-w-[150px]">
                                {cardName || 'NGUYEN VAN A'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white/50 text-[10px] uppercase font-bold tracking-wider mb-0.5">Hết hạn</div>
                              <div className="text-white font-mono text-sm">
                                {cardExpiry || 'MM/YY'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form nhập */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số thẻ</label>
                          <input 
                            type="text" 
                            maxLength={16}
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nhập 16 số trên thẻ"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên in trên thẻ</label>
                          <input 
                            type="text" 
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            placeholder="VD: NGUYEN VAN A"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 uppercase"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày hết hạn</label>
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
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CVC/CVV</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              value={cardCVC}
                              onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))}
                              placeholder="123"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        disabled={isProcessing}
                        onClick={handleCardPayment}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <CreditCard size={20} />
                        )}
                        Thanh toán ngay
                      </button>
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
