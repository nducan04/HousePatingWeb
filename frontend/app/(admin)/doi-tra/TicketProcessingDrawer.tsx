'use client';

import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Sparkles, Clock, Package, RotateCcw,
  Warehouse, ShieldAlert, Wrench, MessageSquareWarning,
  PackageCheck, PackageMinus, User, Loader2, AlertTriangle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TicketType = 'Bảo hành' | 'Khiếu nại' | 'Đổi trả';
export type TicketStatus = 'Chờ tiếp nhận' | 'Đang xử lý' | 'Đã hoàn tất';

export interface Ticket {
  id: string;
  type: TicketType;
  customer: string;
  phoneOrContract: string;
  description: string;
  status: TicketStatus;
  assignee?: string;
  resolution?: string;
  deadline?: string;
  createdAt: string;
}

interface TicketProcessingDrawerProps {
  isOpen: boolean;
  ticket: Ticket | null;
  staffList: any[];
  onClose: () => void;
  onUpdate: (updatedData: Partial<Ticket>) => void;
}

// ─── Status Stepper ───────────────────────────────────────────────────────────
const STEPS: { key: TicketStatus; label: string }[] = [
  { key: 'Chờ tiếp nhận', label: 'Tiếp nhận' },
  { key: 'Đang xử lý', label: 'Đang xử lý' },
  { key: 'Đã hoàn tất', label: 'Hoàn tất' },
];

const stepIndex = (status: TicketStatus) => STEPS.findIndex(s => s.key === status);

function StatusStepper({ status }: { status: TicketStatus }) {
  const current = stepIndex(status);
  return (
    <div className="flex items-center gap-0 px-6 py-4 bg-slate-50 border-b border-slate-100">
      {STEPS.map((step, idx) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${idx < current ? 'bg-emerald-500 text-white' :
                idx === current ? 'bg-slate-900 text-white ring-4 ring-slate-900/10' :
                  'bg-slate-200 text-slate-400'}`}>
              {idx < current ? <CheckCircle2 size={16} /> : idx + 1}
            </div>
            <span className={`text-[11px] font-semibold whitespace-nowrap
              ${idx === current ? 'text-slate-900' : idx < current ? 'text-emerald-600' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all
              ${idx < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Helper: Complaint Flow ────────────────────────────────────────────────────
function renderComplaintFlow(
  assignee: string,
  staffList: any[],
  resolution: string,
  setResolution: (v: string) => void,
  onAssigneeChange: (v: string) => void
) {
  const salesStaff = staffList.filter(s => {
    const d = (s.BoPhan || '').toLowerCase();
    return d.includes('kinh doanh') || d.includes('cskh') || d.includes('sale');
  });

  return (
    <div className="space-y-5">
      {/* Nhân viên kinh doanh */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <User size={13} /> Nhân viên Kinh doanh phụ trách
        </label>
        <select
          value={assignee}
          onChange={e => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn nhân viên --</option>
          {salesStaff.map((s: any) => (
            <option key={s._id} value={s.HoTen}>{s.HoTen} · {s.BoPhan}</option>
          ))}
        </select>
      </div>

      {/* Phương án giải quyết */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <MessageSquareWarning size={13} /> Phương án giải quyết & Thỏa thuận với khách
        </label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          rows={6}
          placeholder="Ví dụ: Tặng voucher giảm giá 5%, xin lỗi khách hàng và cam kết đổi sản phẩm mới trong 3 ngày làm việc..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none transition-all"
        />
      </div>
    </div>
  );
}

// ─── Helper: Return Flow ───────────────────────────────────────────────────────
function renderReturnFlow(
  assignee: string,
  staffList: any[],
  kcsResult: string,
  setKcsResult: (v: string) => void,
  resolution: string,
  setResolution: (v: string) => void,
  onAssigneeChange: (v: string) => void,
  onAction: (action: string) => void
) {
  const warehouseStaff = staffList.filter(s => {
    const d = (s.BoPhan || '').toLowerCase();
    return d.includes('kho') || d.includes('kỹ thuật') || d.includes('logistics');
  });

  return (
    <div className="space-y-5">
      {/* Nhân viên kho/kỹ thuật */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <Warehouse size={13} /> Nhân viên Kho / Kỹ thuật phụ trách
        </label>
        <select
          value={assignee}
          onChange={e => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn nhân viên --</option>
          {warehouseStaff.map((s: any) => (
            <option key={s._id} value={s.HoTen}>{s.HoTen} · {s.BoPhan}</option>
          ))}
        </select>
      </div>

      {/* Kiểm định KCS */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          <ShieldAlert size={13} /> Kết quả kiểm định KCS
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'nsx', label: 'Lỗi do Nhà sản xuất (NSX)', icon: <Package size={16} /> },
            { value: 'van_chuyen', label: 'Lỗi do Vận chuyển', icon: <RotateCcw size={16} /> },
          ].map(opt => (
            <label key={opt.value}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${kcsResult === opt.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
              <input type="radio" name="kcs" value={opt.value}
                checked={kcsResult === opt.value}
                onChange={() => setKcsResult(opt.value)}
                className="hidden" />
              {opt.icon}
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ghi chú nghiệp vụ */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <MessageSquareWarning size={13} /> Ghi chú xử lý
        </label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          rows={3}
          placeholder="Mô tả tình trạng hàng trả về, thỏa thuận đền bù..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 block">Thao tác kho</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAction('import')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-orange-200 active:scale-95"
          >
            <PackageMinus size={16} />
            Nhập kho (Thu hồi)
          </button>
          <button
            onClick={() => onAction('export')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95"
          >
            <PackageCheck size={16} />
            Xuất kho (Đền bù)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: Warranty Flow ────────────────────────────────────────────────────
function renderWarrantyFlow(
  assignee: string,
  staffList: any[],
  warrantyRoot: string,
  setWarrantyRoot: (v: string) => void,
  rejectReason: string,
  setRejectReason: (v: string) => void,
  compensationAmount: string,
  setCompensationAmount: (v: string) => void,
  onAssigneeChange: (v: string) => void
) {
  const techStaff = staffList.filter(s => {
    const d = (s.BoPhan || '').toLowerCase();
    return d.includes('kỹ thuật') || d.includes('bảo hành') || d.includes('r&d');
  });

  return (
    <div className="space-y-5">
      {/* Kỹ thuật viên */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <Wrench size={13} /> Kỹ thuật viên hiện trường
        </label>
        <select
          value={assignee}
          onChange={e => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn kỹ thuật viên --</option>
          {techStaff.map((s: any) => (
            <option key={s._id} value={s.HoTen}>{s.HoTen} · {s.BoPhan}</option>
          ))}
        </select>
      </div>

      {/* Nguyên nhân thực địa */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <ShieldAlert size={13} /> Đánh giá nguyên nhân thực địa
        </label>
        <select
          value={warrantyRoot}
          onChange={e => setWarrantyRoot(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn nguyên nhân --</option>
          <option value="khach_hang">Lỗi do quy trình sấy / thi công của khách hàng</option>
          <option value="vtsc">Lỗi do chất lượng sơn VTSC</option>
        </select>
      </div>

      {/* Conditional: Từ chối bảo hành */}
      {warrantyRoot === 'khach_hang' && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-600 mb-2">
            <AlertTriangle size={13} /> Lý do từ chối bảo hành
          </label>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Ví dụ: Khách hàng không tuân thủ thời gian sấy 24h theo quy định kỹ thuật VTSC, bề mặt thi công bị ẩm dẫn đến bong tróc..."
            className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-slate-800 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none transition-all"
          />
        </div>
      )}

      {/* Conditional: Chi phí đền bù */}
      {warrantyRoot === 'vtsc' && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-2">
            <Package size={13} /> Chi phí hỗ trợ đền bù (VNĐ)
          </label>
          <div className="relative">
            <input
              type="number"
              value={compensationAmount}
              onChange={e => setCompensationAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 pr-16 bg-blue-50 border border-blue-200 rounded-xl text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 text-sm font-bold">VNĐ</span>
          </div>
          {compensationAmount && (
            <p className="mt-1.5 text-xs text-blue-600 font-medium">
              ≈ {parseInt(compensationAmount).toLocaleString('vi-VN')} đồng
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TicketProcessingDrawer({
  isOpen, ticket, staffList, onClose, onUpdate
}: TicketProcessingDrawerProps) {
  const [assignee, setAssignee] = useState('');
  const [resolution, setResolution] = useState('');
  const [kcsResult, setKcsResult] = useState('');
  const [warrantyRoot, setWarrantyRoot] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Đồng bộ state khi ticket thay đổi
  useEffect(() => {
    if (ticket) {
      setAssignee(ticket.assignee || '');
      setResolution(ticket.resolution || '');
      setKcsResult('');
      setWarrantyRoot('');
      setRejectReason('');
      setCompensationAmount('');
    }
  }, [ticket]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleStatusAdvance = async () => {
    if (!ticket) return;
    const nextStatus: TicketStatus =
      ticket.status === 'Chờ tiếp nhận' ? 'Đang xử lý' : 'Đã hoàn tất';

    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    onUpdate({ status: nextStatus, assignee, resolution });
    setIsSaving(false);
    triggerToast(nextStatus === 'Đang xử lý' ? 'Đã bắt đầu xử lý ticket!' : 'Ticket đã được đánh dấu hoàn tất!');
  };

  const handleSyncAI = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsSyncing(false);
    triggerToast('✅ Đã đưa dữ liệu giải quyết vào hệ thống Machine Learning');
  };

  const handleKCSAction = (action: string) => {
    triggerToast(action === 'import'
      ? '📦 Đã tạo Phiếu Nhập Kho — Thu hồi hàng lỗi'
      : '🚚 Đã tạo Phiếu Xuất Kho — Xuất hàng đền bù cho khách');
  };

  if (!isOpen || !ticket) return null;

  const isCompleted = ticket.status === 'Đã hoàn tất';
  const canAdvance = ticket.status !== 'Đã hoàn tất';

  const typeColor: Record<TicketType, string> = {
    'Bảo hành': 'bg-blue-100 text-blue-700',
    'Khiếu nại': 'bg-rose-100 text-rose-700',
    'Đổi trả': 'bg-orange-100 text-orange-700',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[680px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold text-slate-900 tracking-tight">{ticket.id}</span>
              <span className="text-xs text-slate-400">{ticket.customer} · {ticket.createdAt}</span>
            </div>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColor[ticket.type]}`}>
              {ticket.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Stepper ── */}
        <StatusStepper status={ticket.status} />

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Thông tin cơ bản */}
          <div className="px-6 py-5 border-b border-slate-100 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Thông tin yêu cầu</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-0.5">Khách hàng</p>
                <p className="font-semibold text-slate-900">{ticket.customer}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-0.5">Mã đơn / Liên hệ</p>
                <p className="font-semibold text-slate-900">{ticket.phoneOrContract}</p>
              </div>
              {ticket.deadline && (
                <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                  <Clock size={16} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-600 font-medium">Hạn xử lý (SLA)</p>
                    <p className="font-bold text-amber-700">{new Date(ticket.deadline).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Mô tả vấn đề của khách</p>
              <p className="text-sm text-slate-800 leading-relaxed">{ticket.description || 'Không có mô tả.'}</p>
            </div>
          </div>

          {/* ── Khu vực nghiệp vụ động ── */}
          <div className="px-6 py-5 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Khu vực xử lý nghiệp vụ</h3>

            {ticket.type === 'Khiếu nại' && renderComplaintFlow(
              assignee, staffList, resolution, setResolution, setAssignee
            )}

            {ticket.type === 'Đổi trả' && renderReturnFlow(
              assignee, staffList, kcsResult, setKcsResult,
              resolution, setResolution, setAssignee, handleKCSAction
            )}

            {ticket.type === 'Bảo hành' && renderWarrantyFlow(
              assignee, staffList, warrantyRoot, setWarrantyRoot,
              rejectReason, setRejectReason,
              compensationAmount, setCompensationAmount, setAssignee
            )}
          </div>
        </div>

        {/* ── Footer (cố định) ── */}
        <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4 bg-white space-y-3">
          {/* Nút Đồng bộ AI — chỉ hiện khi Hoàn tất */}
          {isCompleted && (
            <button
              onClick={handleSyncAI}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600
                hover:from-violet-700 hover:to-indigo-700
                shadow-lg shadow-purple-500/25
                ring-2 ring-purple-400/30
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all active:scale-[0.98]"
              style={{
                backgroundSize: '200% 100%',
                animation: isSyncing ? 'none' : 'shimmer 2s infinite linear',
              }}
            >
              {isSyncing ? (
                <><Loader2 size={18} className="animate-spin" /> Đang đồng bộ dữ liệu...</>
              ) : (
                <><Sparkles size={18} /> Đồng bộ dữ liệu sang AI Tracker</>
              )}
            </button>
          )}

          {/* Nút chuyển trạng thái */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Đóng
            </button>
            {canAdvance && (
              <button
                onClick={handleStatusAdvance}
                disabled={isSaving}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]
                  ${ticket.status === 'Chờ tiếp nhận'
                    ? 'bg-slate-900 hover:bg-slate-800 shadow-sm'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                  } disabled:opacity-60`}
              >
                {isSaving ? (
                  <><Loader2 size={16} className="animate-spin" /> Đang lưu...</>
                ) : ticket.status === 'Chờ tiếp nhận' ? (
                  <>Bắt đầu xử lý →</>
                ) : (
                  <><CheckCircle2 size={16} /> Đánh dấu Hoàn tất</>
                )}
              </button>
            )}
            {isCompleted && (
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">
                <CheckCircle2 size={16} /> Đã hoàn tất
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white text-sm font-medium px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            {toastMessage}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </>
  );
}
