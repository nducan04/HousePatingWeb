"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  Tag,
  User,
  Box,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore, getGuestSessionId } from "@/lib/store/cartStore";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/utils/imageUrl";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    cartItems,
    initializeCart,
    clearCart,
    updateQuantity,
    removeFromCart,
  } = useCartStore();

  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [discountCode, setDiscountCode] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' or 'MOMO'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const sessionId = useMemo(() => user?.id || getGuestSessionId(), [user]);

  const handleUpdateQuantity = (
    productId: string,
    currentQty: number,
    change: number,
    maMau?: string,
  ) => {
    if (existingOrderId) return; // Không cho phép sửa nếu là đơn hàng cũ
    const newQty = currentQty + change;

    const targetMaMau = maMau || "";

    if (newQty < 1) {
      // Remove item if quantity becomes 0
      setSelectedItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.SanPham?._id === productId &&
              (item.MaMau || "") === targetMaMau
            ),
        ),
      );
      if (removeFromCart) {
        removeFromCart(sessionId, productId, maMau);
      }
      return;
    }

    // Update local state
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (
          item.SanPham?._id === productId &&
          (item.MaMau || "") === targetMaMau
        ) {
          return { ...item, SoLuong: newQty };
        }
        return item;
      }),
    );

    // Update global store
    if (updateQuantity) {
      updateQuantity(sessionId, productId, newQty, maMau);
    }
  };

  useEffect(() => {
    // Load checkout data
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("orderId");

      if (orderId) {
        setExistingOrderId(orderId);
        api
          .get(`/orders/${orderId}`)
          .then((res) => {
            if (res.data.success) {
              const order = res.data.data;
              setFullName(
                order.TenNguoiNhan ||
                  user?.profile?.TenKhachHang ||
                  order.KhachHang?.TenKhachHang ||
                  "",
              );
              setPhone(
                order.SDTNguoiNhan ||
                  user?.profile?.SDT ||
                  order.KhachHang?.SDT ||
                  "",
              );
              setAddress(
                order.DiaChiGiaoHang === "Địa chỉ mặc định"
                  ? user?.profile?.DiaChi || ""
                  : order.DiaChiGiaoHang || user?.profile?.DiaChi || "",
              );
              setPaymentMethod(
                order.PhuongThucThanhToan === "MOMO" ? "MOMO" : "COD",
              );

              setSelectedItems(
                order.Items.map((i: any) => ({
                  _id: i._id || Math.random().toString(),
                  SoLuong: i.SoLuong,
                  SanPham: {
                    _id: i.SanPham || i.sanPhamId,
                    TenDongSon: i.TenSanPham || "Sản phẩm sơn",
                    MaSanPham: i.MaMau || "",
                    DonGiaCoSo: i.DonGia,
                    HinhAnh: null,
                  },
                })),
              );

              if (order.KhuyenMai) {
                setDiscountInfo(order.KhuyenMai);
              }
            }
          })
          .catch((err) => {
            console.error(err);
            router.push("/my-orders");
          });
        return;
      }

      const storedItems = sessionStorage.getItem("checkoutItems");
      const storedDiscount = sessionStorage.getItem("checkoutDiscount");

      if (storedItems) {
        const itemIds = JSON.parse(storedItems);
        // Wait for cartItems to be loaded if not yet
        if (cartItems.length > 0) {
          const itemsToCheckout = cartItems.filter((item: any) => {
            const key = `${item.SanPham?._id}_${item.MaMau || ""}`;
            return itemIds.includes(key);
          });
          setSelectedItems(itemsToCheckout);
          if (itemsToCheckout.length === 0) {
            router.push("/cart"); // Redirect back if empty
          }
        }
      } else {
        router.push("/cart");
      }

      if (storedDiscount) {
        setDiscountInfo(JSON.parse(storedDiscount));
      }

      if (user?.profile) {
        setFullName(user.profile.TenKhachHang || user.profile.HoTen || "");
        setPhone(user.profile.SDT || "");
        setAddress(user.profile.DiaChi || "");
      }
    }
  }, [cartItems, user, router]);

  useEffect(() => {
    if (user) {
      initializeCart(user.id);
    }
  }, [user]);

  const getImageUrl = (path: any) => resolveImageUrl(path);

  const subTotal = selectedItems.reduce(
    (acc, item) => acc + (item.SanPham?.DonGiaCoSo || 0) * item.SoLuong,
    0,
  );
  const shippingFee = 0; // Free shipping
  const discountAmount = discountInfo?.DiscountAmount || 0;
  const finalTotal = Math.max(0, subTotal + shippingFee - discountAmount);

  const handleApplyVoucher = async () => {
    if (!discountCode) return;
    try {
      const res = await api.post("/promotions/validate", {
        code: discountCode,
        cartTotal: subTotal,
      });
      if (res.data.success) {
        setDiscountInfo(res.data.data);
        alert("Áp dụng mã giảm giá thành công!");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi áp dụng voucher");
      setDiscountInfo(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (!fullName || !phone || !address) {
      return alert("Vui lòng điền đầy đủ thông tin người nhận!");
    }

    setIsSubmitting(true);
    try {
      if (existingOrderId) {
        // If it's an existing order
        if (paymentMethod === "MOMO") {
          // Update order info to MOMO just in case it was COD before
          await api
            .patch(`/orders/${existingOrderId}/info`, {
              PhuongThucThanhToan: "MOMO",
            })
            .catch(console.error);

          try {
            const momoRes = await api.post("/thanh-toan/momo/create", {
              type: "ORDER",
              id: existingOrderId,
              amount: finalTotal,
            });
            if (momoRes.data.success && momoRes.data.payUrl) {
              window.location.href = momoRes.data.payUrl;
            } else {
              alert(momoRes.data.message || "Lỗi khởi tạo thanh toán MoMo.");
            }
          } catch (momoErr: any) {
            console.error("MoMo error", momoErr);
            alert(
              `Thanh toán MoMo thất bại: ${momoErr.response?.data?.message || momoErr.message || "Lỗi kết nối cổng thanh toán"}.`,
            );
          }
        } else {
          // COD
          await api.patch(`/orders/${existingOrderId}/info`, {
            PhuongThucThanhToan: "TIEN_MAT",
          });
          alert("Thanh toán khi nhận hàng (COD) đã được ghi nhận. Cảm ơn bạn!");
          router.push("/my-orders");
        }
        setIsSubmitting(false);
        return;
      }

      // Create the new order
      const res = await api.post("/orders/checkout", {
        sessionId: sessionId,
        khachHangId: user?.profile?._id || null, // Will be guest if not logged in
        diaChiGiaoHang: `${fullName} - ${phone} - ${address}`,
        discountCode: discountInfo?.MaVoucher,
        ghiChu:
          note || `Đơn hàng từ hệ thống web - Phương thức: ${paymentMethod}`,
        selectedItemKeys: selectedItems.map(
          (item: any) => `${item.SanPham?._id}_${item.MaMau || ""}`,
        ),
      });

      if (res.data.success) {
        const orderData = res.data.data;

        // If COD, just show success and redirect
        if (paymentMethod === "COD") {
          alert(`Đặt hàng thành công! Mã đơn hàng: ${orderData.MaDonHang}`);
          sessionStorage.removeItem("checkoutItems");
          sessionStorage.removeItem("checkoutDiscount");
          router.push(
            user?.role === "Admin" || user?.role === "NhanVien"
              ? "/don-hang"
              : "/my-orders",
          );
          return;
        }

        // If MoMo, call MoMo API
        if (paymentMethod === "MOMO") {
          try {
            const momoRes = await api.post("/thanh-toan/momo/create", {
              type: "ORDER",
              id: orderData._id,
              amount: finalTotal,
            });

            if (momoRes.data.success && momoRes.data.payUrl) {
              sessionStorage.removeItem("checkoutItems");
              sessionStorage.removeItem("checkoutDiscount");
              window.location.href = momoRes.data.payUrl;
            } else {
              alert(
                momoRes.data.message ||
                  "Lỗi khởi tạo thanh toán MoMo. Vui lòng thanh toán sau trong phần Quản lý đơn hàng.",
              );
              sessionStorage.removeItem("checkoutItems");
              sessionStorage.removeItem("checkoutDiscount");
              router.push("/my-orders");
            }
          } catch (momoErr: any) {
            console.error("MoMo error", momoErr);
            const detailMsg =
              momoErr.response?.data?.message || momoErr.message || "";
            alert(
              `Thanh toán MoMo thất bại: ${detailMsg}. Đơn hàng của bạn đã được ghi nhận thành công. Bạn có thể tiến hành thanh toán lại trong trang "Đơn hàng của tôi".`,
            );
            sessionStorage.removeItem("checkoutItems");
            sessionStorage.removeItem("checkoutDiscount");
            router.push("/my-orders");
          }
        }
      }
    } catch (error: any) {
      alert(
        error.response?.data?.message || "Lỗi khi đặt hàng. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedItems.length === 0) return null; // Will redirect in useEffect

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans pb-20">
      {/* HEADER */}
      <header className="bg-white px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50 border-b border-slate-200">
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <div className="w-[150px] h-[40px] flex items-center justify-center overflow-hidden">
            <img
              src="/vtsc.png"
              alt="VTSC Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-black text-[#1c3c77] tracking-tight leading-none uppercase">
              VTSC PaintPro
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              Hệ Thống Sơn Tĩnh Điện
            </p>
          </div>
        </Link>
        <Link
          href="/cart"
          className="text-sm font-bold text-slate-600 hover:text-[#1c3c77] transition-colors flex items-center gap-2 no-underline px-4 py-2 hover:bg-slate-50 rounded-lg"
        >
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </Link>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 mt-8">
        {/* PROGRESS BAR */}
        <div className="flex items-center gap-4 text-sm font-bold text-slate-400 mb-8 ml-2">
          <span
            className="flex items-center gap-2 cursor-pointer hover:text-[#1c3c77]"
            onClick={() => router.push("/cart")}
          >
            <span className="w-6 h-6 rounded-full bg-[#1c3c77] text-white flex items-center justify-center text-xs">
              1
            </span>
            <span className="text-[#1c3c77]">Giỏ hàng</span>
          </span>
          <span className="h-[2px] w-8 bg-slate-200"></span>
          <span className="flex items-center gap-2 text-[#1c3c77]">
            <span className="w-6 h-6 rounded-full bg-[#1c3c77] text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Thanh toán</span>
          </span>
          <span className="h-[2px] w-8 bg-slate-200"></span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">
              3
            </span>
            <span>Xác nhận</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-8 space-y-6">
            {/* THÔNG TIN NGƯỜI NHẬN */}
            <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-[#1c3c77] uppercase tracking-wider mb-6 flex items-center gap-2">
                <User size={18} /> THÔNG TIN NGƯỜI NHẬN
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Họ tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1c3c77]"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1c3c77]"
                    placeholder="0987654321"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Địa chỉ giao hàng (Số nhà, Tên đường, Phường/Xã, Quận/Huyện,
                    Tỉnh/TP) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#1c3c77]"
                    placeholder="VD: 123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. HCM"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-[#1c3c77] min-h-[80px]"
                    placeholder="Ghi chú thêm về đơn hàng hoặc thời gian giao hàng..."
                  />
                </div>
              </div>
            </div>

            {/* PHƯƠNG THỨC GIAO HÀNG */}
            <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-[#1c3c77] uppercase tracking-wider mb-6 flex items-center gap-2">
                <Truck size={18} /> PHƯƠNG THỨC GIAO HÀNG
              </h2>
              <div className="border-2 border-blue-100 bg-blue-50/50 rounded-xl p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1c3c77]"></div>
                <div className="w-5 h-5 rounded-full border-4 border-[#1c3c77] bg-white flex-shrink-0"></div>
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm text-amber-600 border border-slate-100">
                  <Box size={24} />
                </div>
                <div>
                  <div className="font-bold text-slate-800">
                    Giao hàng tiêu chuẩn
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Toàn quốc (2-5 ngày)
                  </div>
                </div>
                <div className="ml-auto font-black text-[#1c3c77]">
                  Miễn phí
                </div>
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-100">
              <h2 className="text-sm font-black text-[#1c3c77] uppercase tracking-wider mb-6 flex items-center gap-2">
                <CreditCard size={18} /> PHƯƠNG THỨC THANH TOÁN
              </h2>
              <div className="space-y-3">
                {/* COD */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={`border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "border-[#1c3c77] bg-blue-50/30 shadow-sm"
                      : "border-slate-100 hover:border-blue-200 bg-white"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                      paymentMethod === "COD"
                        ? "border-4 border-[#1c3c77] bg-white"
                        : "border-slate-300"
                    }`}
                  ></div>
                  <div className="w-10 h-10 bg-[#e2f5ec] text-[#00a651] rounded-lg flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      Thanh toán khi nhận hàng (COD)
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Trả tiền mặt khi nhận được hàng
                    </div>
                  </div>
                </div>

                {/* MoMo */}
                <div
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`border-2 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    paymentMethod === "MOMO"
                      ? "border-[#a50064] bg-[#fdf2f8] shadow-sm"
                      : "border-slate-100 hover:border-pink-200 bg-white"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                      paymentMethod === "MOMO"
                        ? "border-4 border-[#a50064] bg-white"
                        : "border-slate-300"
                    }`}
                  ></div>

                  <div>
                    <div className="font-bold text-slate-800">Ví MoMo</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Thanh toán qua ví MoMo, chuyển hướng tới cổng thanh toán
                    </div>
                  </div>
                  {paymentMethod === "MOMO" && (
                    <div className="ml-auto">
                      <span className="text-[10px] font-bold bg-[#a50064]/10 text-[#a50064] px-2 py-1 rounded-md">
                        Trực tuyến
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MÃ VOUCHER */}
            {!existingOrderId && (
              <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-100">
                <h2 className="text-sm font-black text-[#1c3c77] uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Tag size={18} /> MÃ VOUCHER
                </h2>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pl-11 text-sm uppercase font-bold text-slate-800 outline-none focus:border-[#1c3c77]"
                      placeholder="NHẬP MÃ VOUCHER..."
                      value={discountCode}
                      onChange={(e) =>
                        setDiscountCode(e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <button
                    onClick={handleApplyVoucher}
                    className="px-8 bg-white border border-[#1c3c77] text-[#1c3c77] font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Áp dụng
                  </button>
                </div>
                {discountInfo && (
                  <div className="mt-3 flex items-center justify-between bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} /> Áp dụng thành công mã:{" "}
                      {discountInfo.MaVoucher}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BIG SUBMIT BUTTON */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-[#1c3c77]/20 ${
                isSubmitting
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-[#1c3c77] text-white hover:bg-blue-900 hover:-translate-y-1 cursor-pointer"
              }`}
            >
              {isSubmitting
                ? "ĐANG XỬ LÝ..."
                : existingOrderId
                  ? `TIẾN HÀNH THANH TOÁN • ${finalTotal.toLocaleString()} đ`
                  : `ĐẶT HÀNG • ${finalTotal.toLocaleString()} đ`}
            </button>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 sticky top-[100px]">
              <h3 className="text-base font-black text-[#1c3c77] mb-6 flex items-center gap-2">
                <Box size={18} /> Đơn hàng ({selectedItems.length} sản phẩm)
              </h3>

              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedItems.map((item: any) => (
                  <div
                    key={item._id}
                    className="flex gap-3 items-start border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 relative">
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1c3c77] text-white rounded-full flex items-center justify-center text-[10px] font-black z-10 border border-white">
                        {item.SoLuong}
                      </div>
                      {getImageUrl(item.SanPham?.HinhAnh) ? (
                        <img
                          src={getImageUrl(item.SanPham.HinhAnh)}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Box size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="font-bold text-slate-800 text-[13px] leading-snug line-clamp-2 mb-1">
                        {item.SanPham?.TenDongSon}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mb-1">
                        Mã SP: {item.SanPham?.MaSanPham}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="font-black text-[#1c3c77] text-sm">
                          {(
                            (item.SanPham?.DonGiaCoSo || 0) * item.SoLuong
                          ).toLocaleString()}{" "}
                          ₫
                        </div>

                        {!existingOrderId && (
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.SanPham?._id,
                                  item.SoLuong,
                                  -1,
                                  item.MaMau,
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#1c3c77] transition-colors font-bold"
                            >
                              -
                            </button>
                            <div className="w-8 h-7 flex items-center justify-center text-xs font-bold text-slate-800 border-x border-slate-200">
                              {item.SoLuong}
                            </div>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.SanPham?._id,
                                  item.SoLuong,
                                  1,
                                  item.MaMau,
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#1c3c77] transition-colors font-bold"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Tạm tính</span>
                  <span className="font-bold text-slate-800">
                    {subTotal.toLocaleString()} ₫
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm text-emerald-600">
                    <span>Giảm giá</span>
                    <span className="font-bold">
                      -{discountAmount.toLocaleString()} ₫
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Phí vận chuyển</span>
                  <span className="font-bold text-slate-800">
                    {shippingFee.toLocaleString()} ₫
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-3">
                  <span className="text-sm font-black text-slate-800">
                    Tổng cộng
                  </span>
                  <span className="text-xl font-black text-rose-600">
                    {finalTotal.toLocaleString()} ₫
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 text-right italic">
                  (Đã bao gồm VAT nếu có)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
