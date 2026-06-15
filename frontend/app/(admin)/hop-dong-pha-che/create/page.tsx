'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, FileText, CheckCircle2,
  Package, ClipboardList, Eye, ChevronDown, Loader2
} from 'lucide-react';
import { useContractStore, ContractDetail } from '@/lib/store/contractStore';
import api from '@/lib/utils/axiosAuth';
import { paintColors } from '@/lib/data/colors-data';

const EMPTY_DETAIL: ContractDetail = {
  productName: '',
  colorCode: '',
  quantity: 0,
  unitPrice: 0,
  technicalReqs: ''
};

export default function CreateContractPage() {
  const router = useRouter();
  const { createContract, loading, error } = useContractStore();
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Step 1: Thông tin chung
  const [contractId, setContractId] = useState('');
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [slaDeadline, setSlaDeadline] = useState('');
  const [termsSla, setTermsSla] = useState('');
  const [termsPenalty, setTermsPenalty] = useState('');
  const [termsDuration, setTermsDuration] = useState('');

  // Step 2: Chi tiết sản phẩm
  const [details, setDetails] = useState<ContractDetail[]>([{ ...EMPTY_DETAIL }]);

  // Color Selection
  const [targetColorCode, setTargetColorCode] = useState('');
  const [targetColorName, setTargetColorName] = useState('');
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const [customHex, setCustomHex] = useState<string>('');
  const [isResolvingColor, setIsResolvingColor] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setIsColorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // AI Color resolution effect
  useEffect(() => {
    const colorInput = targetColorCode;
    if (!colorInput) {
      setCustomHex('');
      return;
    }

    // Check if it's already in the standard palette
    const existing = paintColors.find(c => c.code.toLowerCase() === colorInput.toLowerCase() || c.name.toLowerCase() === colorInput.toLowerCase());
    if (existing) {
      setCustomHex(existing.hex);
      return;
    }

    // Check if it's already a valid HEX color (e.g. #FF0000)
    if (/^#[0-9A-F]{6}$/i.test(colorInput)) {
      setCustomHex(colorInput);
      return;
    }

    // Debounce API call for custom color names
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsResolvingColor(true);
        const res = await api.post('/chatbot/resolve-color', { colorName: colorInput });
        if (res.data.success && res.data.hexCode) {
          setCustomHex(res.data.hexCode);
        } else {
          setCustomHex('');
        }
      } catch (err) {
        console.error("Failed to resolve color:", err);
      } finally {
        setIsResolvingColor(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [targetColorCode]);

  // Auto-gen contractId
  useEffect(() => {
    const year = new Date().getFullYear();
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    setContractId(`CTR-${year}-${rand}`);
  }, []);

  // Fetch customers
  useEffect(() => {
    api.get('/customers').then(res => {
      if (res.data.success) setCustomers(res.data.data);
    }).catch(() => { });
  }, []);

  // Auto-fill clientAddress when customer selected
  useEffect(() => {
    const cust = customers.find((c: any) => c._id === customerId);
    if (cust?.walletAddress) setClientAddress(cust.walletAddress);
  }, [customerId, customers]);

  const totalValue = details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);

  const addDetailRow = () => setDetails([...details, { ...EMPTY_DETAIL }]);
  const removeDetailRow = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };
  const updateDetail = (index: number, field: keyof ContractDetail, value: any) => {
    const updated = [...details];
    (updated[index] as any)[field] = value;
    setDetails(updated);
  };

  const canProceedStep1 = contractId && title && customerId && targetColorCode;
  const canProceedStep2 = details.length > 0 && details.every(d => d.productName && d.quantity > 0 && d.unitPrice > 0);

  const goToStep2 = () => {
    if (targetColorCode && details.length === 1 && details[0].colorCode === '') {
      const updated = [...details];
      updated[0].colorCode = targetColorCode;
      if (!updated[0].productName && targetColorName) {
        updated[0].productName = targetColorName;
      }
      setDetails(updated);
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitError('');
    const data = {
      contractId,
      title,
      customer: customerId,
      clientAddress,
      slaDeadline: slaDeadline || undefined,
      terms: {
        sla: termsSla,
        penalty: termsPenalty,
        duration: termsDuration
      },
      chiTietHopDong: details,
      contractType: 'pha-che'
    };

    const result = await createContract(data);
    if (result) {
      setSubmitSuccess(true);
      setTimeout(() => router.push(`/hop-dong-pha-che/${result._id}`), 1500);
    } else {
      setSubmitError(useContractStore.getState().error || 'Lỗi không xác định');
    }
  };

  const selectedCustomer = customers.find((c: any) => c._id === customerId);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link href="/contracts" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ marginBottom: '1.75rem' }}>
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      {/* Progress Steps */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3.5rem' }}>
          {[
            { num: 1, label: 'Thông tin chung', icon: ClipboardList },
            { num: 2, label: 'Chi tiết sản phẩm', icon: Package },
            { num: 3, label: 'Xem trước & Gửi', icon: Eye }
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} style={{
              display: 'flex', alignItems: 'center', gap: 10, opacity: step >= num ? 1 : 0.4,
              cursor: step > num ? 'pointer' : 'default'
            }} onClick={() => step > num && setStep(num)}>
              <div style={{
                width: 36, height: 36, borderRadius: '9999px',
                background: step === num
                  ? 'linear-gradient(135deg, #2563eb, #0099cc)'
                  : step > num ? '#059669' : '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem', color: '#fff',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {step > num ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bước {num}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} style={{ color: '#2563eb' }} />
            Thông tin Hợp đồng Nguyên tắc Mua bán
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
            <div className="form-group">
              <label className="form-label">Mã Hợp đồng *</label>
              <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={contractId} onChange={e => setContractId(e.target.value)} placeholder="CTR-2024-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Tiêu đề *</label>
              <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="Hợp đồng Phân phối Sơn Interpon..." />
            </div>
            <div className="form-group">
              <label className="form-label">Khách hàng B2B *</label>
              <select className="form-select w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">— Chọn khách hàng —</option>
                <option value="internal-vtsc">VTSC (Nội bộ)</option>
                <option disabled>— Khách hàng B2B —</option>
                {customers.filter((c: any) => c.segment?.includes('B2B')).map((c: any) => (
                  <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
                ))}
                {customers.filter((c: any) => !c.segment?.includes('B2B')).map((c: any) => (
                  <option key={c._id} value={c._id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Địa chỉ ví MetaMask (Khách hàng)</label>
              <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="0x..." />
            </div>
            <div className="form-group">
              <label className="form-label">Hạn SLA giao hàng</label>
              <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" type="date" value={slaDeadline} onChange={e => setSlaDeadline(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Thời hạn hợp đồng</label>
              <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={termsDuration} onChange={e => setTermsDuration(e.target.value)} placeholder="12 tháng (01/2024 — 12/2024)" />
            </div>

            {/* Color Selection */}
            <div className="form-group col-span-1 md:col-span-2">
              <label className="form-label">Tạo hợp đồng pha chế sơn theo mẫu *</label>
              <div className="relative" ref={colorDropdownRef}>
                <div className="relative flex items-center">
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-10 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    type="text"
                    placeholder="Tìm mã màu hoặc nhập màu tùy chỉnh..."
                    required
                    value={targetColorCode}
                    onChange={(e) => {
                      setTargetColorCode(e.target.value);
                      setIsColorDropdownOpen(true);
                    }}
                    onClick={() => setIsColorDropdownOpen(true)}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {isResolvingColor ? (
                      <Loader2 size={18} className="text-blue-500 animate-spin" />
                    ) : (
                      <div className="relative overflow-hidden w-6 h-6 rounded-full border border-slate-200 shadow-sm shrink-0 cursor-pointer hover:scale-110 transition-transform">
                        <input
                          type="color"
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 cursor-pointer opacity-0"
                          value={paintColors.find(c => c.code === targetColorCode)?.hex || customHex || '#e2e8f0'}
                          onChange={(e) => {
                            const hex = e.target.value;
                            setCustomHex(hex);
                            setTargetColorCode(hex);
                            setTargetColorName(hex);
                            setIsColorDropdownOpen(false);
                          }}
                          title="Chọn màu bằng bảng màu"
                        />
                        <div
                          className="w-full h-full pointer-events-none"
                          style={{ background: paintColors.find(c => c.code === targetColorCode)?.hex || customHex || '#e2e8f0' }}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                    onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                  >
                    <ChevronDown size={16} />
                  </div>
                </div>

                {isColorDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {paintColors
                      .filter(c => c.code.toLowerCase().includes(targetColorCode.toLowerCase()) || c.name.toLowerCase().includes(targetColorCode.toLowerCase()))
                      .map(color => (
                        <div
                          key={color.code}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                          onClick={() => {
                            setTargetColorCode(color.code);
                            setTargetColorName(color.name);
                            setIsColorDropdownOpen(false);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm shrink-0" style={{ background: color.hex }} />
                          <div>
                            <div className="text-sm font-bold text-slate-800">{color.code}</div>
                            <div className="text-xs text-slate-500">{color.name}</div>
                          </div>
                        </div>
                      ))}
                    {targetColorCode.length > 0 && !paintColors.some(c => c.code.toLowerCase() === targetColorCode.toLowerCase()) && (
                      <div
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-t border-slate-100"
                        onClick={() => {
                          setTargetColorName(targetColorCode); // use code as name initially
                          setIsColorDropdownOpen(false);
                        }}
                      >
                        <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                          <Plus size={12} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-blue-600">Sử dụng màu tùy chỉnh mới</div>
                          <div className="text-xs text-slate-500">Mã màu: {targetColorCode}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginTop: '1.75rem' }}>
            <div className="form-group">
              <label className="form-label">Điều khoản SLA</label>
              <textarea className="form-textarea" value={termsSla} onChange={e => setTermsSla(e.target.value)} placeholder="Giao hàng trong 7 ngày làm việc..." style={{ minHeight: 70 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Phạt vi phạm</label>
              <textarea className="form-textarea" value={termsPenalty} onChange={e => setTermsPenalty(e.target.value)} placeholder="Phạt 2% giá trị đơn hàng/ngày trễ..." style={{ minHeight: 70 }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.25rem' }}>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" disabled={!canProceedStep1} onClick={goToStep2}>
              Tiếp theo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Product Details */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={20} style={{ color: '#7c3aed' }} />
              Chi tiết Sản phẩm Hợp đồng
            </h3>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs" onClick={addDetailRow}>
              <Plus size={14} /> Thêm dòng
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên sản phẩm *</th>
                  <th>Mã màu</th>
                  <th>Khối lượng (Thùng) *</th>
                  <th>Đơn giá (VNĐ) *</th>
                  <th>Thành tiền</th>
                  <th>Yêu cầu KT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {details.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ minWidth: 160, padding: '6px 10px', fontSize: '0.875rem' }}
                        value={d.productName} onChange={e => updateDetail(i, 'productName', e.target.value)}
                        placeholder="Interpon D1000" />
                    </td>
                    <td>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ width: 100, padding: '6px 10px', fontSize: '0.875rem' }}
                        value={d.colorCode} onChange={e => updateDetail(i, 'colorCode', e.target.value)}
                        placeholder="RAL 9016" />
                    </td>
                    <td>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" type="number" style={{ width: 100, padding: '6px 10px', fontSize: '0.875rem' }}
                        value={d.quantity || ''} onChange={e => updateDetail(i, 'quantity', Number(e.target.value))}
                        min={0} />
                    </td>
                    <td>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" type="number" style={{ width: 120, padding: '6px 10px', fontSize: '0.875rem' }}
                        value={d.unitPrice || ''} onChange={e => updateDetail(i, 'unitPrice', Number(e.target.value))}
                        min={0} />
                    </td>
                    <td style={{ fontWeight: 600, color: '#d97706', whiteSpace: 'nowrap' }}>
                      {(d.quantity * d.unitPrice).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <input className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" style={{ minWidth: 120, padding: '6px 10px', fontSize: '0.875rem' }}
                        value={d.technicalReqs} onChange={e => updateDetail(i, 'technicalReqs', e.target.value)}
                        placeholder="Bóng 80%" />
                    </td>
                    <td>
                      <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" onClick={() => removeDetailRow(i)}
                        disabled={details.length <= 1} style={{ color: '#e11d48', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div style={{
            marginTop: '1.75rem', padding: '1.125rem 1.75rem',
            background: '#f1f5f9', borderRadius: '10px',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.125rem'
          }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>TỔNG GIÁ TRỊ HỢP ĐỒNG:</span>
            <span style={{ fontSize: '1.625rem', fontWeight: 800, color: '#2563eb' }}>
              {totalValue.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.25rem' }}>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" disabled={!canProceedStep2} onClick={() => setStep(3)}>
              Tiếp theo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={20} style={{ color: '#059669' }} />
            Xem trước & Xác nhận
          </h3>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '1.125rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã HĐ</div>
              <div style={{ fontWeight: 700, color: '#2563eb' }}>{contractId}</div>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '1.125rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiêu đề</div>
              <div style={{ fontWeight: 600 }}>{title}</div>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '1.125rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Khách hàng</div>
              <div style={{ fontWeight: 600 }}>{selectedCustomer ? `${selectedCustomer.code} — ${selectedCustomer.name}` : 'N/A'}</div>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '1.125rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng giá trị</div>
              <div style={{ fontWeight: 800, color: '#d97706', fontSize: '1.375rem' }}>{totalValue.toLocaleString('vi-VN')} VNĐ</div>
            </div>
          </div>

          {/* Detail Table Preview */}
          <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '1.125rem', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chi tiết sản phẩm ({details.length} mục)
            </div>
            {details.map((d, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: i < details.length - 1 ? '1px solid #e2e8f0' : 'none',
                fontSize: '1rem'
              }}>
                <span>{d.productName} {d.colorCode ? `(${d.colorCode})` : ''}</span>
                <span style={{ color: '#475569' }}>
                  {d.quantity.toLocaleString('vi-VN')} thùng × {d.unitPrice.toLocaleString('vi-VN')} = <strong style={{ color: '#d97706' }}>{(d.quantity * d.unitPrice).toLocaleString('vi-VN')}</strong>
                </span>
              </div>
            ))}
          </div>

          {/* Terms Preview */}
          {(termsSla || termsPenalty || termsDuration) && (
            <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '1.125rem', marginBottom: '1.75rem', fontSize: '1rem', color: '#475569' }}>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Điều khoản</div>
              {termsSla && <div>• SLA: {termsSla}</div>}
              {termsPenalty && <div>• Phạt: {termsPenalty}</div>}
              {termsDuration && <div>• Thời hạn: {termsDuration}</div>}
              {slaDeadline && <div>• Hạn SLA: {new Date(slaDeadline).toLocaleDateString('vi-VN')}</div>}
            </div>
          )}

          <div style={{
            padding: '1.125rem', borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(0,212,255,0.2)',
            fontSize: '1rem', color: '#2563eb', marginBottom: '1.75rem'
          }}>
            <strong>📋 Quy trình tiếp theo:</strong> Sau khi tạo, hệ thống sẽ sinh PDF chuẩn → Tính Hash → Upload IPFS → Ghi Blockchain → Khách hàng ký MetaMask.
          </div>

          {submitError && (
            <div style={{
              padding: '1.125rem', borderRadius: '10px',
              background: 'rgba(225, 29, 72, 0.08)', color: '#e11d48',
              marginBottom: '1.125rem', fontSize: '1rem'
            }}>
              ❌ {submitError}
            </div>
          )}

          {submitSuccess && (
            <div style={{
              padding: '1.125rem', borderRadius: '10px',
              background: 'rgba(5, 150, 105, 0.08)', color: '#059669',
              marginBottom: '1.125rem', fontSize: '1rem', fontWeight: 600
            }}>
              ✅ Tạo hợp đồng thành công! Đang chuyển hướng...
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.25rem' }}>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSubmit} disabled={loading || submitSuccess}>
              <FileText size={16} />
              {loading ? 'Đang tạo...' : 'Tạo Hợp đồng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
