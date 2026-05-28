"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Wallet, ShoppingBag } from "lucide-react";
import Link from "next/link";
import api from "@/lib/utils/axiosAuth";

function MomoRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed" | "loading">("loading");
  const [details, setDetails] = useState<any>({
    orderId: "",
    amount: 0,
    transId: "",
    message: "",
    type: "ORDER",
  });
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!searchParams) return;

    const resultCode = searchParams.get("resultCode");
    const amount = Number(searchParams.get("amount")) || 0;
    const orderId = searchParams.get("orderId") || "";
    const transId = searchParams.get("transId") || "";
    const message = searchParams.get("message") || "";
    const extraData = searchParams.get("extraData") || "";

    let type = "ORDER";
    try {
      if (extraData) {
        const decoded = JSON.parse(atob(extraData));
        type = decoded.type || "ORDER";
      } else if (orderId.includes("CONTRACT")) {
        type = "CONTRACT";
      }
    } catch (e) {
      console.error("Error decoding extraData", e);
      if (orderId.includes("CONTRACT")) {
        type = "CONTRACT";
      }
    }

    setDetails({
      orderId,
      amount,
      transId,
      message,
      type,
    });

    if (resultCode === "0") {
      setPaymentStatus("success");

      // Gọi backend confirm để cập nhật DB (fallback khi IPN không gọi được localhost)
      if (!confirmedRef.current && extraData) {
        confirmedRef.current = true;
        api.post("/thanh-toan/momo/confirm", {
          resultCode: 0,
          extraData,
        }).then((res) => {
          console.log("Payment confirmed via client-side:", res.data);
        }).catch((err) => {
          console.error("Error confirming payment:", err);
        });
      }
    } else {
      setPaymentStatus("failed");
    }
  }, [searchParams]);

  // Auto redirection countdown
  useEffect(() => {
    if (paymentStatus === "loading") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          const targetUrl = details.type === "CONTRACT" ? "/my-contracts" : "/my-orders";
          router.push(targetUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, details.type, router]);

  const targetPath = details.type === "CONTRACT" ? "/my-contracts" : "/my-orders";
  const targetLabel = details.type === "CONTRACT" ? "Hợp đồng của tôi" : "Đơn hàng của tôi";

  if (paymentStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-600 font-bold text-base">Đang đối soát giao dịch thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans antialiased text-slate-800">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md w-full p-8 text-center relative overflow-hidden">
        {/* Top Accent Gradient */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${paymentStatus === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {paymentStatus === "success" ? (
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 size={44} />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <XCircle size={44} />
            </div>
          )}
        </div>

        {/* Status Title */}
        <h2 className="text-2xl font-black tracking-tight mb-2">
          {paymentStatus === "success" ? "Thanh Toán Thành Công!" : "Giao Dịch Thất Bại"}
        </h2>
        <p className="text-slate-400 font-medium text-sm mb-6 leading-relaxed">
          {paymentStatus === "success"
            ? "Cảm ơn bạn. Giao dịch qua ví MoMo Sandbox đã được ghi nhận thành công."
            : `Đã xảy ra lỗi hoặc giao dịch đã bị hủy bỏ: ${details.message || "Không thể thực hiện"}`}
        </p>

        {/* Transaction Details Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 text-left space-y-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium uppercase">Mã đơn / HĐ</span>
            <span className="font-mono font-bold text-slate-700">{details.orderId.split("-")[2] || details.orderId}</span>
          </div>
          {details.transId && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium uppercase">Mã giao dịch MoMo</span>
              <span className="font-mono font-bold text-slate-700">{details.transId}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium uppercase">Phương thức</span>
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-[#A50064] flex items-center justify-center text-[10px] font-black text-white">M</div>
              Ví MoMo Sandbox
            </span>
          </div>
          <div className="h-px bg-slate-200/50" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium uppercase">Tổng tiền</span>
            <span className="text-lg font-black text-blue-600">{details.amount.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {/* Redirect Timer & Navigation */}
        <div className="space-y-4">
          <Link
            href={targetPath}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              paymentStatus === "success"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
            }`}
          >
            Đến {targetLabel} <ArrowRight size={16} />
          </Link>

          <p className="text-xs text-slate-400 font-semibold">
            Tự động chuyển hướng sau <span className="font-black text-slate-700">{countdown}s</span>...
          </p>
        </div>
      </div>

      {/* Decorative Brand Icons */}
      <div className="mt-8 flex items-center gap-6 text-slate-300">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <ShoppingBag size={16} /> VTSC PaintPro
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
          <Wallet size={16} /> Momo Open API
        </div>
      </div>
    </div>
  );
}

export default function MomoRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-600 font-bold text-base">Đang tải cấu hình redirect...</p>
      </div>
    }>
      <MomoRedirectContent />
    </Suspense>
  );
}

