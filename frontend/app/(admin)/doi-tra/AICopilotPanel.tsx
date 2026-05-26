'use client';
import { Bot, Sparkles, AlertTriangle, RefreshCcw, ShieldCheck, CheckCircle2, XCircle, Send, Image, Star } from 'lucide-react';

export interface MockTicket {
  id: string; type: 'Đổi trả' | 'Bảo hành' | 'Khiếu nại';
  customer: string; contract: string; description: string;
  status: 'Chờ tiếp nhận' | 'Đang xử lý' | 'Đã hoàn tất';
  aiTag: string[]; sentiment: 'negative' | 'neutral' | 'positive';
  aiAnalysis: string; aiDraft: string; hasImage: boolean; isVIP: boolean; highRisk: boolean;
  createdAt: string; assignee?: string;
}

const TAG_STYLE: Record<string, string> = {
  'Rủi ro cao': 'bg-rose-100 text-rose-700 border border-rose-200',
  'Khách VIP': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Có ảnh': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Ưu tiên': 'bg-purple-100 text-purple-700 border border-purple-200',
};

export default function AICopilotPanel({ ticket, onClose }: { ticket: MockTicket | null; onClose: () => void }) {
  if (!ticket) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
      <Bot size={48} className="text-slate-200" />
      <p className="text-sm font-medium">Chọn một ticket để xem AI Copilot</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{ticket.id}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ticket.type === 'Đổi trả' ? 'bg-orange-100 text-orange-700' : ticket.type === 'Bảo hành' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{ticket.type}</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{ticket.customer}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{ticket.contract}</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
          <XCircle size={18} />
        </button>
      </div>

      {/* Customer Request */}
      <div className="p-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Yêu cầu khách hàng</p>
        <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
        {ticket.hasImage && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Image size={16} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Hình ảnh đính kèm: san_pham_loi_001.jpg</span>
            <span className="ml-auto text-xs text-blue-600 font-semibold cursor-pointer hover:underline">Xem ảnh</span>
          </div>
        )}
        {ticket.hasImage && (
          <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-50 to-rose-50 flex items-center justify-center h-32">
            <div className="text-center text-slate-400">
              <div className="text-3xl mb-1">🪣</div>
              <p className="text-xs">Thùng sơn RAL 3020 bị móp/sai màu</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Copilot Zone */}
      <div className="p-5 border-b border-indigo-100 bg-indigo-50/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-indigo-800">AI Copilot Phân Tích</span>
          <span className="ml-auto text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full uppercase tracking-wider">AI Generated</span>
        </div>

        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm">
          <div className="flex items-start gap-2.5">
            <Bot size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-700 mb-1.5">Kết quả phân tích</p>
              <p className="text-sm text-slate-700 leading-relaxed">{ticket.aiAnalysis}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">Cảm xúc:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ticket.sentiment === 'negative' ? 'bg-rose-100 text-rose-600' : ticket.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {ticket.sentiment === 'negative' ? '😠 Thất vọng / Tức giận' : ticket.sentiment === 'positive' ? '😊 Hài lòng' : '😐 Bình thường'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Action Buttons */}
        <p className="text-xs font-bold text-indigo-700 mt-4 mb-2">⚡ AI Đề xuất hành động nhanh</p>
        <div className="flex flex-col gap-2">
          {ticket.type === 'Đổi trả' && (
            <>
              <button className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md">
                <CheckCircle2 size={15} /> Đồng ý Đổi trả &amp; Sinh Phiếu Nhập Kho
              </button>
              <button className="flex items-center gap-2.5 px-4 py-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all">
                <XCircle size={15} /> Từ chối – Yêu cầu gửi mẫu test lại
              </button>
            </>
          )}
          {ticket.type === 'Bảo hành' && (
            <>
              <button className="flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                <ShieldCheck size={15} /> Xác nhận Bảo hành &amp; Cử KTV Kiểm Tra
              </button>
              <button className="flex items-center gap-2.5 px-4 py-3 bg-white hover:bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold rounded-xl transition-all">
                <RefreshCcw size={15} /> Yêu cầu thêm thông tin / Hình ảnh thực tế
              </button>
            </>
          )}
          {ticket.type === 'Khiếu nại' && (
            <>
              <button className="flex items-center gap-2.5 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                <AlertTriangle size={15} /> Tiếp nhận &amp; Chuyển Quản lý Cấp Cao
              </button>
              <button className="flex items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold rounded-xl transition-all">
                <CheckCircle2 size={15} /> Giải quyết &amp; Đền bù theo Chính sách
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Draft Message */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-violet-500" />
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Soạn sẵn phản hồi</p>
          <button className="ml-auto flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold">
            <RefreshCcw size={12} /> Viết lại
          </button>
        </div>
        <textarea
          defaultValue={ticket.aiDraft}
          rows={7}
          className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
        />
        <button className="mt-3 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg">
          <Send size={15} /> Gửi Phản Hồi Khách Hàng
        </button>
      </div>
    </div>
  );
}
