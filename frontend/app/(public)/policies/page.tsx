"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import api from "@/lib/utils/axiosAuth";

const POLICY_TYPES = [
  { id: "MUA_HANG", label: "Hướng dẫn mua hàng", icon: <ShoppingCart size={18} />, dbType: "MUA_HANG" },
  { id: "THANH_TOAN", label: "Chính sách thanh toán", icon: <CreditCard size={18} />, dbType: "THANH_TOAN" },
  { id: "shipping", label: "Chính sách giao hàng", icon: <Truck size={18} />, dbType: "VAN_CHUYEN" },
  { id: "return", label: "Chính sách đổi trả", icon: <ArrowRight size={18} />, dbType: "DOI_TRA" },
  { id: "warranty", label: "Chính sách bảo hành", icon: <ShieldCheck size={18} />, dbType: "BAO_HANH" },
  { id: "aftersale", label: "Chính sách hậu mãi", icon: <HeartHandshake size={18} />, dbType: "HAU_MAI" },
];

function PoliciesContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "warranty";
  
  const [activeTab, setActiveTab] = useState(initialType);
  const [policiesData, setPoliciesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // If URL query changes, update active tab
    const typeFromUrl = searchParams.get("type");
    if (typeFromUrl && POLICY_TYPES.some(p => p.id === typeFromUrl)) {
      setActiveTab(typeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get('/chinh-sach');
        if (res.data.success) {
          setPoliciesData(res.data.data);
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu chính sách.");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const activePolicyConfig = POLICY_TYPES.find(p => p.id === activeTab) || POLICY_TYPES[0];
  const activePolicyData = policiesData.find(p => p.LoaiChinhSach === activePolicyConfig.dbType);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ═══════ TOP BANNER ═══════ */}
      <div className="bg-blue-600 text-white pt-24 pb-16 px-4">
        <div className="max-w-[1200px] mx-auto text-center md:text-left">
          <p className="uppercase tracking-widest text-sm text-blue-200 font-bold mb-3">Hỗ trợ khách hàng</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trung tâm hỗ trợ VTSC</h1>
          <p className="text-blue-100 text-lg">Tất cả thông tin chính sách và hướng dẫn mua hàng tại VTSC</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 -mt-8 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* ═══════ SIDEBAR ═══════ */}
          <div className="w-full md:w-[320px] flex-shrink-0">
            <div className="bg-white rounded-t-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Danh mục hỗ trợ</h3>
              </div>
              <ul className="flex flex-col">
                {POLICY_TYPES.map((policy) => {
                  const isActive = activeTab === policy.id;
                  return (
                    <li key={policy.id}>
                      <button
                        onClick={() => setActiveTab(policy.id)}
                        className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors border-l-4 font-medium ${
                          isActive 
                            ? "border-blue-600 bg-blue-50/50 text-blue-600 font-bold" 
                            : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span className={`${isActive ? "text-blue-600" : "text-slate-400"}`}>
                          {policy.icon}
                        </span>
                        {policy.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Support Contact Box */}
            <div className="bg-blue-600 text-white rounded-b-2xl p-6 shadow-md border-t-0 border border-blue-600">
              <h4 className="font-bold mb-4">Cần hỗ trợ trực tiếp?</h4>
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-blue-300" />
                  <span>+84 (028) 3888 9999</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-blue-300" />
                  <span>contact@vtscpaint.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle size={18} className="text-blue-300" />
                  <span>Chat Zalo</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ MAIN CONTENT ═══════ */}
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium mt-4 md:mt-0 px-2">
              <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
              <ChevronRight size={14} />
              <span>Hỗ trợ</span>
              <ChevronRight size={14} />
              <span className="text-blue-600 font-bold">{activePolicyConfig.label}</span>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-blue-600 text-white p-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                  {activePolicyConfig.icon}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Chính sách & Hướng dẫn</div>
                  <h2 className="text-3xl font-bold">{activePolicyConfig.label}</h2>
                </div>
              </div>
              <div className="p-8 md:p-12">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">{activePolicyConfig.label}</h3>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
                    <p>Đang tải nội dung...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 text-red-500">
                    <AlertCircle size={40} className="mb-4" />
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activePolicyData?.NoiDung || "Nội dung đang được cập nhật..."}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <>
      {/* Header Placeholder (If you have a global navbar, this ensures it's spaced out correctly if needed. The layout handles it via pt-24 in the banner) */}
      <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
        <PoliciesContent />
      </Suspense>
    </>
  );
}
