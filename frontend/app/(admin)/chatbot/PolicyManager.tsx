import { useState, useEffect } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2, FileText, Settings } from "lucide-react";
import api from "@/lib/utils/axiosAuth";

const POLICY_TYPES = [
  { id: "DOI_TRA", label: "Chính sách đổi trả" },
  { id: "BAO_HANH", label: "Chính sách bảo hành" },
  { id: "VAN_CHUYEN", label: "Chính sách vận chuyển" },
  { id: "HAU_MAI", label: "Chính sách hậu mãi" },
];

export default function PolicyManager() {
  const [activePolicy, setActivePolicy] = useState("DOI_TRA");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch all policies on mount
  const fetchPolicy = async (type: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await api.get("/chinh-sach");
      if (res.data.success) {
        const policy = res.data.data.find((p: any) => p.LoaiChinhSach === type);
        setContent(policy ? policy.NoiDung : "");
      }
    } catch (error) {
      console.error("Lỗi khi tải chính sách:", error);
      setMessage({ type: "error", text: "Không thể tải chính sách từ máy chủ." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy(activePolicy);
  }, [activePolicy]);

  const handleSave = async () => {
    if (!content.trim()) {
      setMessage({ type: "error", text: "Nội dung chính sách không được để trống." });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      const res = await api.post("/chinh-sach", {
        LoaiChinhSach: activePolicy,
        NoiDung: content,
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Đã lưu chính sách thành công!" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Lỗi khi lưu chính sách:", error);
      setMessage({ type: "error", text: "Không thể lưu chính sách. Vui lòng thử lại." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm flex overflow-hidden min-h-[600px] animate-in fade-in duration-500">
      {/* Sidebar Navigation */}
      <div className="w-[280px] bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Quản lý</h2>
            <p className="text-xs text-slate-500 font-medium">Quy định & Chính sách</p>
          </div>
        </div>

        <div className="space-y-2">
          {POLICY_TYPES.map((policy) => (
            <button
              key={policy.id}
              onClick={() => setActivePolicy(policy.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer ${
                activePolicy === policy.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-transparent text-slate-600 hover:bg-slate-200/50"
              }`}
            >
              <FileText size={18} className={activePolicy === policy.id ? "text-blue-100" : "text-slate-400"} />
              {policy.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" />
            Nội dung {POLICY_TYPES.find((p) => p.id === activePolicy)?.label}
          </h3>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div className="flex-1 relative bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <span className="text-sm font-bold text-slate-500">Đang tải nội dung...</span>
              </div>
            </div>
          ) : null}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading || isSaving}
            className="w-full h-full min-h-[400px] p-6 bg-transparent resize-none border-none outline-none text-slate-700 text-[15px] leading-relaxed font-sans placeholder:text-slate-400"
            placeholder="Nhập nội dung chính sách tại đây. Hỗ trợ định dạng văn bản (có thể sử dụng markdown nếu muốn)..."
          />
        </div>
        <p className="text-xs text-slate-400 mt-4 text-center font-medium">
          Lưu ý: Nội dung chính sách sẽ được áp dụng trực tiếp lên hệ thống và Chatbot AI sẽ sử dụng thông tin này để tư vấn khách hàng.
        </p>
      </div>
    </div>
  );
}
