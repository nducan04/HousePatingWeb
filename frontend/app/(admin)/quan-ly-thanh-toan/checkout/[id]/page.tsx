'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, CreditCard, DollarSign, Wallet,
  Smartphone, Package, Receipt, AlertCircle, Loader2, User
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

export default function AdminCheckoutPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${params.id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        toast.error('Không tìm thấy đơn hàng');
        router.push('/quan-ly-thanh-toan');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    setProcessing(true);

    try {
      if (paymentMethod === 'MOMO') {
        const debt = order.TongTien - (order.DaCoc || 0);
        if (debt <= 0) {
          toast.error('Đơn hàng đã được thanh toán đủ');
          setProcessing(false);
          return;
        }

        const momoRes = await api.post('/thanh-toan/momo/create', {
          type: 'ORDER',
          id: order._id,
          amount: debt
        });

        if (momoRes.data.success && momoRes.data.payUrl) {
          window.location.href = momoRes.data.payUrl;
        } else {
          toast.error(momoRes.data.message || 'Lỗi khởi tạo MoMo.');
          setProcessing(false);
        }
      } else {
        // Cash or Bank Transfer -> Direct status update
        await api.patch(`/orders/${order._id}/payment`, { paymentStatus: 'DA_THANH_TOAN' });
        toast.success('Xác nhận thanh toán thành công!');
        router.push('/quan-ly-thanh-toan');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Lỗi xử lý thanh toán');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) return null;

  const isB2B = order.KhachHang?.PhanLoai === 'B2B';
  const debt = Math.max(0, order.TongTien - (order.DaCoc || 0));
  const isPaid = order.TrangThaiThanhToan === 'DA_THANH_TOAN' || debt === 0;

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Thanh Toán Đơn Hàng <span className="text-blue-600">#{order.MaDonHang}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Kiểm tra thông tin và xác nhận thu tiền khách hàng</p>
        </div>
      </div>

      {isB2B ? (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-amber-800">Đơn hàng thuộc Hợp đồng B2B</h4>
            <p className="text-amber-700 text-sm mt-1">
              Đơn hàng này được tạo ra từ hợp đồng R&D. Thanh toán sẽ được thực hiện trực tiếp dựa trên các điều khoản và đợt thanh toán của Hợp đồng, không áp dụng thanh toán lẻ từng đơn.
            </p>
          </div>
        </div>
      ) : isPaid ? (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-emerald-800">Đơn hàng đã hoàn tất thanh toán</h4>
            <p className="text-emerald-600 text-sm mt-1">Không có khoản công nợ nào cần thu thêm cho đơn hàng này.</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order details & Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Thông tin Đơn hàng & Người nhận */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600"/> Thông tin Khách hàng & Giao hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Người nhận</p>
                <p className="font-bold text-slate-800 text-sm">{order.TenNguoiNhan || order.KhachHang?.TenKhachHang || 'N/A'}</p>
                <p className="text-sm text-slate-600 mt-1">{order.SDTNguoiNhan || order.KhachHang?.SDT || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Địa chỉ giao hàng</p>
                <p className="text-sm text-slate-800 font-medium line-clamp-2">{order.DiaChiGiaoHang || 'Nhận tại cửa hàng'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày đặt hàng</p>
                <p className="text-sm text-slate-800 font-medium">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi chú</p>
                <p className="text-sm text-slate-800 font-medium italic">{order.GhiChu || 'Không có ghi chú'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Package size={18} className="text-blue-600"/> Chi tiết sản phẩm
            </h3>
            
            <div className="space-y-4">
              {order.Items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center border border-slate-200">
                      <Package className="text-slate-400" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.TenSanPham}</h4>
                      <p className="text-xs text-slate-500 mt-1">Màu: {item.MaMau} • Số lượng: {item.SoLuong}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{(item.ThanhTien || (item.DonGia * item.SoLuong)).toLocaleString()} ₫</p>
                    <p className="text-xs text-slate-400 mt-1">{(item.DonGia || 0).toLocaleString()} ₫/sp</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Tổng tiền hàng:</span>
                <span className="text-slate-800">{(order.TongTien + (order.GiamGia || 0) - (order.TienThue || 0)).toLocaleString()} ₫</span>
              </div>
              {(order.GiamGia || 0) > 0 && (
                <div className="flex justify-between text-sm text-rose-500 font-medium">
                  <span>Giảm giá:</span>
                  <span>-{(order.GiamGia || 0).toLocaleString()} ₫</span>
                </div>
              )}
              {(order.TienThue || 0) > 0 && (
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Thuế VAT:</span>
                  <span className="text-slate-800">{(order.TienThue || 0).toLocaleString()} ₫</span>
                </div>
              )}
              <div className="flex justify-between items-center text-base font-black text-slate-900 pt-3 border-t border-slate-100">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{order.TongTien.toLocaleString()} ₫</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Receipt size={18} className="text-amber-600"/> Lịch sử thanh toán & Công nợ
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Đã cọc / Thanh toán</p>
                <p className="text-xl font-black text-emerald-700">{(order.DaCoc || 0).toLocaleString()} ₫</p>
              </div>
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-100">
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Công nợ cần thu</p>
                <p className="text-xl font-black text-rose-700">{debt.toLocaleString()} ₫</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Process */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-indigo-600"/> Phương thức thanh toán
            </h3>

            {isB2B ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h4 className="text-base font-black text-slate-800">Thanh toán qua Hợp đồng</h4>
                <p className="text-slate-500 mt-2 text-xs font-medium leading-relaxed">
                  Đơn hàng B2B được quản lý công nợ và thanh toán theo từng đợt của Hợp đồng tương ứng.
                </p>
                <button
                  onClick={() => router.push('/quan-ly-thanh-toan')}
                  className="mt-6 px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors cursor-pointer border-none"
                >
                  Đến trang Hợp đồng
                </button>
              </div>
            ) : !isPaid ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  {[
                    { id: 'TIEN_MAT', label: 'Tiền mặt', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'CHUYEN_KHOAN', label: 'Chuyển khoản NH', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'MOMO', label: 'Ví MoMo', icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-50' }
                  ].map((method) => (
                    <label 
                      key={method.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.bg} ${method.color}`}>
                          <method.icon size={20} />
                        </div>
                        <span className="font-bold text-slate-800">{method.label}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id ? 'border-blue-600' : 'border-slate-300'
                      }`}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value={method.id} 
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>

                {paymentMethod === 'MOMO' && (
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-100 flex items-start gap-3">
                    <AlertCircle className="text-pink-600 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-pink-700 font-medium">
                      Khi bấm xác nhận, hệ thống sẽ tạo link thanh toán MoMo và chuyển hướng.
                    </p>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-bold text-slate-500">Số tiền thu:</span>
                    <span className="text-2xl font-black text-rose-600">{debt.toLocaleString()} ₫</span>
                  </div>
                  
                  <button
                    onClick={handleConfirmPayment}
                    disabled={processing}
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-base hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <><Loader2 size={20} className="animate-spin" /> Đang xử lý...</>
                    ) : (
                      <><CheckCircle2 size={20} /> Xác nhận thanh toán</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-800">Đã thanh toán</h4>
                <p className="text-slate-500 mt-2 text-sm font-medium">Không thể thu tiền thêm cho đơn hàng này.</p>
                <button
                  onClick={() => router.push('/quan-ly-thanh-toan')}
                  className="mt-6 px-6 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
