'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, FileText, CheckCircle2,
  Package, ClipboardList, Eye
} from 'lucide-react';
import { useContractStore, ContractDetail } from '@/lib/store/contractStore';
import api from '@/lib/utils/axiosAuth';

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
    }).catch(() => {});
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

  const canProceedStep1 = contractId && title && customerId;
  const canProceedStep2 = details.length > 0 && details.every(d => d.productName && d.quantity > 0 && d.unitPrice > 0);

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
      chiTietHopDong: details
    };

    const result = await createContract(data);
    if (result) {
      setSubmitSuccess(true);
      setTimeout(() => router.push(`/contracts/${result._id}`), 1500);
    } else {
      setSubmitError(useContractStore.getState().error || 'Lỗi không xác định');
    }
  };

  const selectedCustomer = customers.find((c: any) => c._id === customerId);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link href="/contracts" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      {/* Progress Steps */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-2xl)' }}>
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
                width: 36, height: 36, borderRadius: 'var(--radius-full)',
                background: step === num
                  ? 'linear-gradient(135deg, var(--accent-cyan), #0099cc)'
                  : step > num ? 'var(--accent-emerald)' : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 'var(--font-sm)', color: '#fff',
                transition: 'all var(--transition-base)'
              }}>
                {step > num ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bước {num}
                </div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} style={{ color: 'var(--accent-cyan)' }} />
            Thông tin Hợp đồng Nguyên tắc
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <div className="form-group">
              <label className="form-label">Mã Hợp đồng *</label>
              <input className="form-input" value={contractId} onChange={e => setContractId(e.target.value)} placeholder="CTR-2024-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Tiêu đề *</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Hợp đồng Phân phối Sơn Interpon..." />
            </div>
            <div className="form-group">
              <label className="form-label">Khách hàng B2B *</label>
              <select className="form-select form-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">— Chọn khách hàng —</option>
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
              <input className="form-input" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="0x..." />
            </div>
            <div className="form-group">
              <label className="form-label">Hạn SLA giao hàng</label>
              <input className="form-input" type="date" value={slaDeadline} onChange={e => setSlaDeadline(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Thời hạn hợp đồng</label>
              <input className="form-input" value={termsDuration} onChange={e => setTermsDuration(e.target.value)} placeholder="12 tháng (01/2024 — 12/2024)" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-lg)' }}>
            <div className="form-group">
              <label className="form-label">Điều khoản SLA</label>
              <textarea className="form-textarea" value={termsSla} onChange={e => setTermsSla(e.target.value)} placeholder="Giao hàng trong 7 ngày làm việc..." style={{ minHeight: 70 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Phạt vi phạm</label>
              <textarea className="form-textarea" value={termsPenalty} onChange={e => setTermsPenalty(e.target.value)} placeholder="Phạt 2% giá trị đơn hàng/ngày trễ..." style={{ minHeight: 70 }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
            <button className="btn btn-primary" disabled={!canProceedStep1} onClick={() => setStep(2)}>
              Tiếp theo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Product Details */}
      {step === 2 && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={20} style={{ color: 'var(--accent-purple)' }} />
              Chi tiết Sản phẩm Hợp đồng
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={addDetailRow}>
              <Plus size={14} /> Thêm dòng
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên sản phẩm *</th>
                  <th>Mã màu</th>
                  <th>Khối lượng (Kg) *</th>
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
                      <input className="form-input" style={{ minWidth: 160, padding: '6px 10px', fontSize: 'var(--font-xs)' }}
                        value={d.productName} onChange={e => updateDetail(i, 'productName', e.target.value)}
                        placeholder="Interpon D1000" />
                    </td>
                    <td>
                      <input className="form-input" style={{ width: 100, padding: '6px 10px', fontSize: 'var(--font-xs)' }}
                        value={d.colorCode} onChange={e => updateDetail(i, 'colorCode', e.target.value)}
                        placeholder="RAL 9016" />
                    </td>
                    <td>
                      <input className="form-input" type="number" style={{ width: 100, padding: '6px 10px', fontSize: 'var(--font-xs)' }}
                        value={d.quantity || ''} onChange={e => updateDetail(i, 'quantity', Number(e.target.value))}
                        min={0} />
                    </td>
                    <td>
                      <input className="form-input" type="number" style={{ width: 120, padding: '6px 10px', fontSize: 'var(--font-xs)' }}
                        value={d.unitPrice || ''} onChange={e => updateDetail(i, 'unitPrice', Number(e.target.value))}
                        min={0} />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-amber)', whiteSpace: 'nowrap' }}>
                      {(d.quantity * d.unitPrice).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <input className="form-input" style={{ minWidth: 120, padding: '6px 10px', fontSize: 'var(--font-xs)' }}
                        value={d.technicalReqs} onChange={e => updateDetail(i, 'technicalReqs', e.target.value)}
                        placeholder="Bóng 80%" />
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeDetailRow(i)}
                        disabled={details.length <= 1} style={{ color: 'var(--accent-rose)', padding: 4 }}>
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
            marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md) var(--spacing-lg)',
            background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--spacing-md)'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG GIÁ TRỊ HỢP ĐỒNG:</span>
            <span style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {totalValue.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button className="btn btn-primary" disabled={!canProceedStep2} onClick={() => setStep(3)}>
              Tiếp theo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={20} style={{ color: 'var(--accent-emerald)' }} />
            Xem trước & Xác nhận
          </h3>

          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã HĐ</div>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{contractId}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiêu đề</div>
              <div style={{ fontWeight: 600 }}>{title}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Khách hàng</div>
              <div style={{ fontWeight: 600 }}>{selectedCustomer ? `${selectedCustomer.code} — ${selectedCustomer.name}` : 'N/A'}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng giá trị</div>
              <div style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: 'var(--font-lg)' }}>{totalValue.toLocaleString('vi-VN')} VNĐ</div>
            </div>
          </div>

          {/* Detail Table Preview */}
          <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Chi tiết sản phẩm ({details.length} mục)
            </div>
            {details.map((d, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                borderBottom: i < details.length - 1 ? '1px solid var(--border-color)' : 'none',
                fontSize: 'var(--font-sm)'
              }}>
                <span>{d.productName} {d.colorCode ? `(${d.colorCode})` : ''}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {d.quantity.toLocaleString('vi-VN')} Kg × {d.unitPrice.toLocaleString('vi-VN')} = <strong style={{ color: 'var(--accent-amber)' }}>{(d.quantity * d.unitPrice).toLocaleString('vi-VN')}</strong>
                </span>
              </div>
            ))}
          </div>

          {/* Terms Preview */}
          {(termsSla || termsPenalty || termsDuration) && (
            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Điều khoản</div>
              {termsSla && <div>• SLA: {termsSla}</div>}
              {termsPenalty && <div>• Phạt: {termsPenalty}</div>}
              {termsDuration && <div>• Thời hạn: {termsDuration}</div>}
              {slaDeadline && <div>• Hạn SLA: {new Date(slaDeadline).toLocaleDateString('vi-VN')}</div>}
            </div>
          )}

          <div style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-cyan-soft)', border: '1px solid rgba(0,212,255,0.2)',
            fontSize: 'var(--font-sm)', color: 'var(--accent-cyan)', marginBottom: 'var(--spacing-lg)'
          }}>
            <strong>📋 Quy trình tiếp theo:</strong> Sau khi tạo, hệ thống sẽ sinh PDF chuẩn → Tính Hash → Upload IPFS → Ghi Blockchain → Khách hàng ký MetaMask.
          </div>

          {submitError && (
            <div style={{
              padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-rose-soft)', color: 'var(--accent-rose)',
              marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-sm)'
            }}>
              ❌ {submitError}
            </div>
          )}

          {submitSuccess && (
            <div style={{
              padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)',
              marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-sm)', fontWeight: 600
            }}>
              ✅ Tạo hợp đồng thành công! Đang chuyển hướng...
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
            <button className="btn btn-success" onClick={handleSubmit} disabled={loading || submitSuccess}>
              <FileText size={16} />
              {loading ? 'Đang tạo...' : 'Tạo Hợp đồng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
