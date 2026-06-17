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

  const displayCardNumber = getDisplayCardNumber();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 border border-white relative z-10">
        {/* Back Button */}
        <button 
          onClick={handleCancel}
          className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Title */}
        <div className="text-center mt-2 mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thanh toán thẻ</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Đơn hàng: <span className="font-bold text-slate-700">{code || id.slice(-6).toUpperCase()}</span></p>
        </div>

        {/* Amount Box */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Số tiền thanh toán</div>
          <div className="text-4xl font-black text-slate-900 tracking-tight flex items-start gap-1">
            {amount.toLocaleString()} 
            <span className="text-xl text-slate-400 mt-1">VND</span>
          </div>
        </div>

        {/* Credit Card Graphic */}
        <div className="w-full h-[220px] rounded-2xl bg-gradient-to-tr from-slate-900 via-[#1a1c29] to-slate-800 p-6 relative overflow-hidden shadow-2xl shadow-slate-900/30 mb-8 border border-white/10 group">
          {/* Shine effect */}
          <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-[100%] group-hover:translate-x-[50%] transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex justify-between items-center mb-6">
            {/* EMV Chip */}
            <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#e6c27a] via-[#ffe5a3] to-[#d4af37] flex items-center justify-center overflow-hidden border border-[#b8860b]/50 shadow-inner">
              <div className="w-full h-full border-[0.5px] border-[#b8860b]/30 flex flex-col justify-between p-1">
                <div className="w-full h-[1px] bg-[#b8860b]/30"></div>
                <div className="w-full h-[1px] bg-[#b8860b]/30"></div>
              </div>
            </div>
            
            {/* Contactless Icon */}
            <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 21.3c-2.1-2.9-3.5-6.6-3.5-10.6 0-4 1.4-7.7 3.5-10.6"/>
              <path d="M12 18.6c-1.4-1.9-2.2-4.2-2.2-6.6 0-2.4.8-4.7 2.2-6.6"/>
              <path d="M15.5 15.9c-.7-1-1.1-2.2-1.1-3.4 0-1.2.4-2.4 1.1-3.4"/>
              <path d="M19 13.2c-.2-.4-.3-.8-.3-1.2 0-.4.1-.8.3-1.2"/>
            </svg>
          </div>

          <div className="relative z-10 mt-2 mb-6">
            <div className="text-[22px] font-mono tracking-[0.15em] text-white/90 drop-shadow-md">
              {displayCardNumber}
            </div>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div>
              <div className="text-[8px] font-bold tracking-widest text-white/50 uppercase mb-1">Tên Chủ Thẻ</div>
              <div className="text-[13px] font-mono text-white/90 tracking-widest uppercase truncate max-w-[180px]">
                {cardName || 'NGUYEN VAN A'}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[8px] font-bold tracking-widest text-white/50 uppercase mb-1">Hết Hạn</div>
                <div className="text-[13px] font-mono text-white/90 tracking-widest">
                  {expiry || 'MM/YY'}
                </div>
              </div>
              {/* Mastercard Logo */}
              <div className="flex relative items-center ml-2">
                <div className="w-8 h-8 rounded-full bg-[#eb001b] mix-blend-screen opacity-90 relative z-20"></div>
                <div className="w-8 h-8 rounded-full bg-[#f79e1b] mix-blend-screen opacity-90 absolute -left-3 z-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-5">
          <div className="relative group">
            <label className="absolute left-4 -top-2.5 bg-white px-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Số thẻ</label>
            <div className="relative">
              <input 
                type="text" 
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="0000 0000 0000 0000"
                className="w-full bg-transparent border-2 border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px]" 
              />
              <CreditCard size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="relative group">
            <label className="absolute left-4 -top-2.5 bg-white px-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Tên in trên thẻ</label>
            <input 
              type="text" 
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              className="w-full bg-transparent border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px] uppercase" 
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="relative group">
              <label className="absolute left-4 -top-2.5 bg-white px-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">Hết hạn</label>
              <input 
                type="text" 
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                className="w-full bg-transparent border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[15px]" 
              />
            </div>
            <div className="relative group">
              <label className="absolute left-4 -top-2.5 bg-white px-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest z-10 transition-colors group-focus-within:text-indigo-600">CVC/CVV</label>
              <input 
                type="password" 
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="•••"
                className="w-full bg-transparent border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 placeholder:font-medium text-[20px] tracking-widest" 
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={processCardPayment}
          disabled={isProcessing}
          className={`w-full mt-8 py-4 rounded-xl text-white font-black text-[16px] uppercase tracking-wider transition-all flex justify-center items-center gap-2 overflow-hidden relative group ${
            isProcessing 
            ? 'bg-slate-300 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5'
          }`}
        >
          {!isProcessing && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
          )}
          {isProcessing ? (
            <><Loader2 size={20} className="animate-spin" /> Đang xử lý...</>
          ) : (
            <>Xác nhận thanh toán</>
          )}
        </button>

        {/* Security Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Bảo mật 256-bit SSL
          </div>
        </div>

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
