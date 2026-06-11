'use client';

import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Sparkles, Clock, Package, RotateCcw,
  Warehouse, ShieldAlert, Wrench, MessageSquareWarning,
  PackageCheck, PackageMinus, User, Loader2, AlertTriangle, XCircle
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TicketType = 'Bảo hành' | 'Khiếu nại' | 'Đổi trả';
export type TicketStatus = 'Chờ tiếp nhận' | 'Đang xử lý' | 'Đã hoàn tất' | 'Đã hủy yêu cầu';

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
  contractId?: string; // ID of the Contract to query RD Tracking
  rawId: string; // The MongoDB _id used for API updates
  images?: string[]; // Array of IPFS hashes for uploaded images
}

interface TicketProcessingDrawerProps {
  isOpen: boolean;
  ticket: Ticket | null;
  staffList: any[];
  onClose: () => void;
  onUpdate: (updatedData: Partial<Ticket>) => void;
}

const STEPS: { key: TicketStatus; label: string }[] = [
  { key: 'Chờ tiếp nhận', label: 'Tiếp nhận' },
  { key: 'Đang xử lý', label: 'Đang xử lý' },
  { key: 'Đã hoàn tất', label: 'Hoàn tất' },
];

const stepIndex = (status: TicketStatus) => STEPS.findIndex(s => s.key === status);

function StatusStepper({ status }: { status: TicketStatus }) {
  if (status === 'Đã hủy yêu cầu') {
    return (
      <div className="flex items-center gap-2 px-6 py-4 bg-rose-50 border-b border-rose-100 text-rose-600 font-semibold text-sm">
        <AlertTriangle size={18} /> Yêu cầu đã bị hủy
      </div>
    );
  }

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
  const supportStaff = staffList.filter(s => {
    const d = (s.BoPhan || '').toLowerCase();
    return d.includes('cskh') || d.includes('bảo hành') || d.includes('bao hanh') || d.includes('kinh doanh');
  });

  return (
    <div className="space-y-5">
      {/* Nhân viên hỗ trợ */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <User size={13} /> Nhân viên CSKH / Bảo hành phụ trách
        </label>
        <select
          value={assignee}
          onChange={e => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn nhân viên --</option>
          {supportStaff.map((s: any) => (
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
  const rdStaff = staffList.filter(s => {
    const d = (s.BoPhan || '').toLowerCase();
    return d.includes('kho') || d.includes('pha chế ');
  });

  return (
    <div className="space-y-5">
      {/* Nhân viên R&D / kỹ thuật máy */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <Wrench size={13} /> Nhân viên Kho / Pha chế phụ trách
        </label>
        <select
          value={assignee}
          onChange={e => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn nhân viên --</option>
          {rdStaff.map((s: any) => (
            <option key={s._id} value={s.HoTen}>{s.HoTen} · {s.BoPhan}</option>
          ))}
        </select>
      </div>

      {/* Kết quả kiểm tra */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          <ShieldAlert size={13} /> Kết luận nguyên nhân lỗi
        </label>
        <div className="flex flex-col gap-3">
          {[
            { value: 'nsx', label: 'Lỗi do sản xuất (Bồi thường: Thu hồi & đổi mới)', icon: <Package size={16} /> },
            { value: 'van_chuyen', label: 'Lỗi do vận chuyển (Bồi thường: Thu hồi & đổi mới)', icon: <RotateCcw size={16} /> },
            { value: 'khach_hang', label: 'Lỗi do khách hàng sai HDS (Từ chối yêu cầu)', icon: <XCircle size={16} /> }
          ].map(opt => (
            <label key={opt.value}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${kcsResult === opt.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}>
              <input type="radio" name="kcs" value={opt.value}
                checked={kcsResult === opt.value}
                onChange={() => {
                  setKcsResult(opt.value);
                  if (opt.value === 'khach_hang') {
                    setResolution('Từ chối yêu cầu đổi trả do khách hàng không làm đúng theo yêu cầu kỹ thuật.');
                  } else {
                    setResolution('Thu hồi hàng lỗi và xuất kho đổi sản phẩm mới cho khách hàng.');
                  }
                }}
                className="hidden" />
              {opt.icon}
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ghi chú */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <MessageSquareWarning size={13} /> Ghi chú giải quyết
        </label>
        <textarea
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          rows={3}
          placeholder="Ghi chú chi tiết phương án giải quyết..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none transition-all"
        />
      </div>

      {/* Action Buttons */}
      {(kcsResult === 'nsx' || kcsResult === 'van_chuyen') && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 block">Thao tác kho (Bồi thường)</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onAction('import')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-orange-200 active:scale-95"
            >
              <PackageMinus size={16} /> Thu hồi hàng
            </button>
            <button
              onClick={() => onAction('export')}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-200 active:scale-95"
            >
              <PackageCheck size={16} /> Xuất đổi trả
            </button>
          </div>
        </div>
      )}
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
  resolution: string,
  setResolution: (v: string) => void,
  onAssigneeChange: (v: string) => void
) {
  const supportStaff = staffList.filter(s => {
    const d = (s.BoPhan || '').toLowerCase();
    return d.includes('kho') || d.includes('pha chế');
  });

  return (
    <div className="space-y-5">
      {/* Nhân viên CSKH/Bảo hành */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <User size={13} /> Nhân viên Kho / Pha chế phụ trách
        </label>
        <select
          value={assignee}
          onChange={e => onAssigneeChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
        >
          <option value="">-- Chọn nhân viên --</option>
          {supportStaff.map((s: any) => (
            <option key={s._id} value={s.HoTen}>{s.HoTen} · {s.BoPhan}</option>
          ))}
        </select>
      </div>

      {/* Phương án giải quyết (Combobox) */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
          <Sparkles size={13} /> Phương án giải quyết
        </label>
        <select
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        >
          <option value="">-- Chọn phương án giải quyết --</option>
          <option value="Tặng voucher khi quay lại mua hàng">Tặng voucher khi quay lại mua hàng</option>
          <option value="Đền bù hàng">Đền bù hàng mới</option>
          <option value="Hoàn tiền">Hoàn tiền cho khách hàng</option>
          <option value="Từ chối bảo hành">Từ chối yêu cầu (Lỗi do khách hàng)</option>
        </select>
      </div>

      {/* Ghi chú chi tiết nếu cần */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
          <MessageSquareWarning size={13} /> Chi tiết phương án
        </label>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          rows={3}
          placeholder="Ghi chú thêm về phương án giải quyết này..."
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none transition-all"
        />
      </div>
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [rdLogs, setRdLogs] = useState<any[]>([]);
  const [isLoadingRd, setIsLoadingRd] = useState(false);
  const [contractData, setContractData] = useState<any>(null);

  // Đồng bộ state khi ticket thay đổi
  useEffect(() => {
    if (ticket) {
      setAssignee(ticket.assignee || '');
      setResolution(ticket.resolution || '');
      setKcsResult('');
      setWarrantyRoot('');
      setRejectReason('');
      setCompensationAmount('');

      if (ticket.contractId) {
        fetchRdLogs(ticket.contractId);
        fetchContractData(ticket.contractId);
      } else {
        setRdLogs([]);
        setContractData(null);
      }
    }
  }, [ticket]);

  const fetchRdLogs = async (contractId: string) => {
    setIsLoadingRd(true);
    try {
      const res = await api.get(`/rd-tracking?contractId=${contractId}`);
      if (res.data.success) {
        setRdLogs(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu R&D:', error);
    } finally {
      setIsLoadingRd(false);
    }
  };

  const fetchContractData = async (contractId: string) => {
    try {
      // Try fetching as contract first
      let res = await api.get(`/contracts/${contractId}`).catch(() => null);
      if (res?.data?.success) {
        setContractData({ type: 'contract', ...res.data.data });
        return;
      }
      // If fails, try fetching as order
      res = await api.get(`/orders/${contractId}`).catch(() => null);
      if (res?.data?.success) {
        setContractData({ type: 'order', ...res.data.data });
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu đơn hàng/hợp đồng:', error);
    }
  };

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

  const handleKCSAction = async (action: string) => {
    if (!contractData) {
      triggerToast('❌ Không thể thực hiện: Không tìm thấy dữ liệu hóa đơn/hợp đồng gốc.');
      return;
    }

    const isOrder = contractData.type === 'order';
    const itemsList = isOrder ? contractData.Items : contractData.chiTietHopDong;

    if (!itemsList || itemsList.length === 0) {
      triggerToast('❌ Không thể thực hiện: Đơn hàng/Hợp đồng gốc không có chi tiết sản phẩm.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Fetch Danh mục Sản phẩm để tìm ItemId theo Tên/Mã nếu cần
      const productsRes = await api.get('/san-pham-son');
      const allProducts = productsRes.data.success ? productsRes.data.data : [];

      const chiTietPhieu = itemsList.map((ct: any) => {
        if (isOrder) {
          // Xử lý mapping cho Đơn hàng
          return {
            ItemId: ct.SanPham?._id || ct.SanPham || null, // Có thể API trả về Object hoặc String ID
            MaItem: ct.SanPham?.MaSanPham || '',
            TenItem: ct.TenSanPham || ct.SanPham?.TenDongSon || 'Sơn VTSC',
            MaMau: ct.MaMau || 'MAC_DINH',
            TenMau: ct.TenMau || (ct.MaMau ? `Màu ${ct.MaMau}` : 'Mặc định'),
            SoLuong: ct.SoLuong || 1,
            DonGia: ct.DonGia || 0
          };
        } else {
          // Xử lý mapping cho Hợp đồng (như cũ)
          const matchedProduct = allProducts.find((p: any) => p.TenDongSon === ct.productName);
          return {
            ItemId: matchedProduct ? matchedProduct._id : null,
            MaItem: matchedProduct ? matchedProduct.MaSanPham : '',
            TenItem: ct.productName,
            MaMau: ct.colorCode || 'MAC_DINH',
            TenMau: ct.colorCode ? `Màu ${ct.colorCode}` : 'Mặc định',
            SoLuong: ct.quantity,
            DonGia: ct.unitPrice
          };
        }
      });

      // Filter out items without ItemId to prevent backend crash during duyetPhieu
      const validChiTiet = chiTietPhieu.filter((ct: any) => ct.ItemId);
      if (validChiTiet.length === 0) {
        triggerToast('❌ Không thể thực hiện: Không tìm thấy ID sản phẩm trong kho.');
        setIsSaving(false);
        return;
      }

      const payload = {
        LoaiPhieu: action === 'import' ? 'NHAP' : 'XUAT',
        LoaiHang: 'SAN_PHAM',
        MoTa: action === 'import' ? `Thu hồi hàng lỗi (Ticket: ${ticket?.id})` : `Xuất kho đền bù (Ticket: ${ticket?.id})`,
        GhiChu: resolution || 'Xử lý tự động từ phân hệ CSKH',
        ChiTiet: validChiTiet
      };

      const res = await api.post('/inventory/nhap-xuat', payload);
      if (res.data.success) {
        triggerToast(action === 'import'
          ? `📦 Đã tạo Phiếu Nhập Kho (${res.data.data.MaPhieu}) — Thu hồi hàng lỗi (Chờ duyệt)`
          : `🚚 Đã tạo Phiếu Xuất Kho (${res.data.data.MaPhieu}) — Xuất đền bù cho khách (Chờ duyệt)`);
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo phiếu kho:', err);
      triggerToast(`❌ Lỗi: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSaving(false);
    }
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-0.5">Khách hàng</p>
                <p className="font-semibold text-slate-900">{ticket.customer}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-0.5">Mã đơn / Liên hệ</p>
                <p className="font-semibold text-slate-900">{ticket.phoneOrContract}</p>
              </div>
              {contractData && contractData.createdAt && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-0.5">Thời gian mua hàng</p>
                  <p className="font-semibold text-slate-900">{new Date(contractData.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              )}
              {ticket.deadline && (
                <div className="col-span-2 md:col-span-3 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                  <Clock size={16} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-600 font-medium">Hạn xử lý (SLA)</p>
                    <p className="font-bold text-amber-700">{new Date(ticket.deadline).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Chi tiết yêu cầu</p>
              <p className="text-sm text-slate-800 leading-relaxed">{ticket.description || 'Không có chi tiết.'}</p>
              {ticket.images && ticket.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Hình ảnh đính kèm:</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.images.map((img, idx) => {
                      const finalUrl = img.includes('ipfs://') ? img.replace('ipfs://', 'https://ipfs.io/ipfs/') : (img.startsWith('Qm') || img.startsWith('bafy')) ? `https://ipfs.io/ipfs/${img}` : img;
                      return (
                        <a key={idx} href={finalUrl} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-white hover:opacity-90 transition-opacity">
                          <img src={finalUrl} alt={`Minh chứng ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Removed contractData and rdLogs as requested */}
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
              compensationAmount, setCompensationAmount,
              resolution, setResolution, setAssignee
            )}
          </div>
        </div>

        {/* ── Footer (cố định) ── */}
        <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4 bg-white space-y-3">
          {/* Nút chuyển trạng thái */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Đóng
            </button>
            {ticket.status !== 'Đã hủy yêu cầu' && ticket.status !== 'Đã hoàn tất' && (
              <button
                onClick={() => onUpdate({ status: 'Đã hủy yêu cầu', resolution, assignee })}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <X size={16} /> Hủy yêu cầu
              </button>
            )}
            {canAdvance && ticket.status !== 'Đã hủy yêu cầu' && (
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
                  <><CheckCircle2 size={16} /> Xử lý hoàn tất</>
                )}
              </button>
            )}
            {isCompleted && (
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold">
                <CheckCircle2 size={16} /> Xử lý hoàn tất
              </div>
            )}
            {ticket.status === 'Đã hủy yêu cầu' && (
              <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold">
                <X size={16} /> Đã hủy yêu cầu
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


    </>
  );
}
