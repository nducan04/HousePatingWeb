'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

function CardPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'ORDER'; // 'ORDER' or 'CONTRACT'
  const amountStr = searchParams.get('amount');
  const code = searchParams.get('code');
  
  const [amount, setAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (amountStr) {
      setAmount(Number(amountStr));
    }
  }, [amountStr]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const processCardPayment = async () => {
    if (!id || amount <= 0) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/thanh-toan/card-payment', {
        id: id,
        type: type,
        amount: amount
      });
      if (res.data.success) {
        alert(`Thanh toán thẻ thành công! ${amount.toLocaleString()} ₫ đã được ghi nhận.`);
        // Redirect logic based on type
        if (type === 'CONTRACT') {
          router.push('/my-payments');
        } else {
          router.push('/my-orders');
        }
      } else {
        alert(res.data.message || 'Thanh toán thất bại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (type === 'CONTRACT') {
      router.push('/my-payments');
    } else {
      router.push('/my-orders');
    }
  };

  if (!id || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Đang tải dữ liệu thanh toán...</p>
        </div>
      </div>
    );
  }

  // Derived display values for the card graphic
  const displayCardNumber = cardNumber.padEnd(19, '•').replace(/•/g, '*'); 
  // Wait, padEnd logic with spaces is tricky. Let's just use a simple approach:
  const getDisplayCardNumber = () => {
    if (!cardNumber) return '****  ****  ****  ****';
    const cleanNum = cardNumber.replace(/\s/g, '');
    let display = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) display += '  ';
      if (i < cleanNum.length) {
        display += cleanNum[i];
      } else {
        display += '*';
      }
    }
    return display;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-10 px-4 font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
        {/* Back Button */}
        <button 
          onClick={handleCancel}
          className="absolute -top-12 left-0 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        {/* Title */}
        <h1 className="text-[22px] font-black text-[#1e293b] mb-6">Phương thức thanh toán</h1>

        {/* Tabs */}
        <div className="bg-slate-50 p-1.5 rounded-[16px] flex items-center mb-6">
          <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors rounded-xl">
            <Wallet size={16} /> Qua Ví MoMo
          </button>
          <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[13px] font-bold text-[#4f46e5] bg-white shadow-sm rounded-xl border border-slate-100 transition-colors">
            <CreditCard size={16} /> Thẻ Tín Dụng
          </button>
        </div>

        {/* Amount Box */}
        <div className="bg-[#f8fafc] rounded-2xl py-6 px-4 flex flex-col items-center justify-center mb-8 border border-slate-100/50">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tổng tiền cần thanh toán</div>
          <div className="text-4xl font-black text-[#2563eb] tracking-tight">
            {amount.toLocaleString()} <span className="text-[28px] underline decoration-4 underline-offset-4 decoration-[#2563eb]/20">đ</span>
          </div>
          <div className="text-sm text-slate-500 font-medium mt-2">Cho: Hóa đơn {code || id.slice(-6).toUpperCase()}</div>
        </div>

        {/* Credit Card Graphic */}
        <div className="w-full h-[200px] rounded-2xl bg-gradient-to-br from-[#2e2b7a] via-[#312e81] to-[#1e1b4b] p-6 relative overflow-hidden shadow-xl shadow-indigo-900/20 mb-8 border border-indigo-500/20">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="text-[10px] font-black tracking-widest text-indigo-200/60 uppercase">Thẻ Thanh Toán</div>
            <div className="flex relative">
              <div className="w-8 h-8 rounded-full bg-rose-500/90 z-10 mix-blend-multiply"></div>
              <div className="w-8 h-8 rounded-full bg-amber-400/90 absolute -left-4 mix-blend-multiply"></div>
            </div>
          </div>

          <div className="relative z-10 mt-8 mb-6">
            <div className="text-[22px] font-mono tracking-widest text-white/90 font-medium drop-shadow-sm">
              {getDisplayCardNumber()}
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div>
              <div className="text-[9px] font-black tracking-widest text-indigo-200/60 uppercase mb-1">Tên Chủ Thẻ</div>
              <div className="text-[13px] font-black text-white tracking-widest uppercase">
                {cardName || 'NGUYEN VAN A'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black tracking-widest text-indigo-200/60 uppercase mb-1">Hết Hạn</div>
              <div className="text-[13px] font-black text-white tracking-widest">
                {expiry || 'MM/YY'}
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">Số thẻ</label>
            <input 
              type="text" 
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="Nhập 16 số trên thẻ"
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-semibold outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all placeholder:text-slate-400 placeholder:font-medium text-[15px]" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">Tên in trên thẻ</label>
            <input 
              type="text" 
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              placeholder="VD: NGUYEN VAN A"
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-semibold outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all placeholder:text-slate-400 placeholder:font-medium text-[15px] uppercase" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">Ngày hết hạn</label>
              <input 
                type="text" 
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full bg-[#eef2f6] border border-[#e2e8f0] rounded-xl px-4 py-3.5 text-slate-800 font-semibold outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all placeholder:text-slate-400 placeholder:font-medium text-[15px]" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">CVC/CVV</label>
              <input 
                type="password" 
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="•••"
                className="w-full bg-[#eef2f6] border border-[#e2e8f0] rounded-xl px-4 py-3.5 text-slate-800 font-semibold outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all placeholder:text-slate-400 placeholder:font-medium text-[20px] tracking-widest" 
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={processCardPayment}
          disabled={isProcessing}
          className={`w-full mt-8 py-4 rounded-[14px] text-white font-bold text-[17px] transition-all flex justify-center items-center gap-2 shadow-lg ${
            isProcessing 
            ? 'bg-slate-400 shadow-none cursor-not-allowed' 
            : 'bg-[#563bfa] hover:bg-[#462ee0] shadow-[#563bfa]/30 hover:-translate-y-0.5'
          }`}
        >
          {isProcessing ? (
            <><Loader2 size={20} className="animate-spin" /> Đang xử lý...</>
          ) : (
            <><CreditCard size={20} /> Thanh toán ngay</>
          )}
        </button>

      </div>
    </div>
  );
}

export default function CardPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <CardPaymentContent />
    </Suspense>
  );
}
