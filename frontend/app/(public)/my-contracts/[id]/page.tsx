'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Wallet, PenTool, ExternalLink, Shield, Clock,
  CheckCircle2, FileText, Loader2, Package, AlertTriangle, ShieldCheck, Copy
} from 'lucide-react';
import { useContractStore } from '@/lib/store/contractStore';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp', created: 'Chờ ký', signed: 'Đã ký',
  delivering: 'Đang giao', completed: 'Hoàn tất', disputed: 'Tranh chấp', cancelled: 'Đã hủy'
};

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { currentContract: contract, loading, fetchContractById, signContractByServer } = useContractStore();

  const [isSigning, setIsSigning] = useState(false);
  const [signTxHash, setSignTxHash] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchContractById(id);
  }, [id, fetchContractById]);

  if (loading || !contract) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div>{loading ? 'Đang tải hợp đồng...' : 'Không tìm thấy hợp đồng'}</div>
        {!loading && (
          <Link href="/my-contracts" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs" style={{ marginTop: '1.125rem' }}>
            Quay lại
          </Link>
        )}
      </div>
    );
  }

  // Client signs on-chain via Server-side signing (Backend System Wallet)
  const handleSignDocument = async () => {
    setIsSigning(true);
    setActionError('');
    try {
      const result = await signContractByServer(contract._id);

      if (result && result.txHash) {
        setSignTxHash(result.txHash);
      }

      // Refresh contract data
      await fetchContractById(id);
    } catch (err: any) {
      console.error('Sign error:', err);
      setActionError('Ký thất bại: ' + (err.reason || err.message || err.toString() || ''));
    }
    setIsSigning(false);
  };

  const statusSteps = [
    { label: 'Bản nháp', done: true },
    { label: 'IPFS + Hash', done: !!contract.ipfsCid },
    { label: 'On-Chain', done: ['created', 'signed', 'delivering', 'completed'].includes(contract.status) },
    { label: 'Đã ký', done: ['signed', 'delivering', 'completed'].includes(contract.status) },
  ];

  const effectiveTxHash = signTxHash || contract.txHash;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: '2rem' }}>
      <Link href="/my-contracts" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ marginBottom: '1.75rem' }}>
        <ArrowLeft size={16} /> Quay lại
      </Link>

      {/* Contract Header */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>{contract.title}</h2>
            <p style={{ color: '#475569' }}>
              Mã HĐ: <strong style={{ color: '#2563eb' }}>{contract.contractId}</strong> —
              Ngày tạo: {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <span className={`badge ${contract.status === 'signed' ? 'signed' : contract.status === 'created' ? 'pending' : contract.status === 'completed' ? 'approved' : 'draft'}`}
            style={{ fontSize: '1rem', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold' }}>
            {STATUS_LABELS[contract.status] || contract.status}
          </span>
        </div>

        {/* Status Flow */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full mt-8 pt-8 border-t border-slate-100 relative">
          {/* Background line for md+ */}
          <div className="hidden md:block absolute top-[23px] left-[12%] right-[12%] h-[2px] bg-slate-200 -z-0"></div>
          
          {statusSteps.map((step, i) => {
            const isCompleted = step.done;
            const isCurrent = i === statusSteps.findIndex(s => !s.done);
            const isFirst = i === 0;

            return (
              <div key={i} className="flex flex-col items-center relative z-10 mb-6 md:mb-0" style={{ width: '100%', maxWidth: '25%' }}>
                {/* Active connecting line */}
                {!isFirst && (
                  <div className={`hidden md:block absolute top-[15px] left-[-50%] w-full h-[2px] -z-10 transition-colors duration-300 ${isCompleted || isCurrent ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                )}
                
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 bg-white transition-all duration-300 ${isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : isCurrent ? 'border-blue-500 text-blue-600 ring-4 ring-blue-50' : 'border-slate-200 text-slate-300'}`}>
                  {isCompleted ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <Clock size={16} strokeWidth={isCurrent ? 2.5 : 2} />}
                </div>
                <span className={`text-sm font-semibold transition-colors duration-300 text-center ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {actionError && (
        <div style={{
          padding: '1.125rem', borderRadius: '10px', marginBottom: '1.75rem',
          background: 'rgba(225, 29, 72, 0.08)', color: '#e11d48',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem'
        }}>
          <AlertTriangle size={16} /> {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Contract Details & ChiTietHopDong */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Contract Terms */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} style={{ color: '#2563eb' }} /> Điều khoản Hợp đồng
            </h3>
            <div className="bg-slate-50 rounded-xl p-5">
              <div className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0">
                <span className="text-sm text-slate-500 font-medium">Đối tác</span>
                <span className="text-sm text-slate-800 font-semibold">{contract.customer?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0">
                <span className="text-sm text-slate-500 font-medium">Giá trị</span>
                <span className="text-sm text-slate-800 font-semibold" style={{ color: '#d97706' }}>{contract.value?.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              {contract.terms?.sla && (
                <div className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0">
                  <span className="text-sm text-slate-500 font-medium">SLA Giao hàng</span>
                  <span className="text-sm text-slate-800 font-semibold">{contract.terms.sla}</span>
                </div>
              )}
              {contract.terms?.penalty && (
                <div className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0">
                  <span className="text-sm text-slate-500 font-medium">Phạt vi phạm</span>
                  <span className="text-sm text-slate-800 font-semibold" style={{ color: '#e11d48' }}>{contract.terms.penalty}</span>
                </div>
              )}
              {contract.terms?.duration && (
                <div className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0">
                  <span className="text-sm text-slate-500 font-medium">Thời hạn</span>
                  <span className="text-sm text-slate-800 font-semibold">{contract.terms.duration}</span>
                </div>
              )}
              {contract.slaDeadline && (
                <div className="flex justify-between py-2.5 border-b border-slate-200 last:border-b-0">
                  <span className="text-sm text-slate-500 font-medium">Hạn SLA</span>
                  <span className="text-sm text-slate-800 font-semibold">{new Date(contract.slaDeadline).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Chi tiết sản phẩm */}
          {contract.chiTietHopDong && contract.chiTietHopDong.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} style={{ color: '#7c3aed' }} /> Chi tiết Sản phẩm
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 px-2 text-slate-500">Sản phẩm</th>
                      <th className="pb-3 px-2 text-slate-500">Mã màu</th>
                      <th className="pb-3 px-2 text-slate-500">Khối lượng</th>
                      <th className="pb-3 px-2 text-slate-500">Đơn giá</th>
                      <th className="pb-3 px-2 text-slate-500">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.chiTietHopDong.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td style={{ fontWeight: 600, color: '#0f172a' }} className="py-3 px-2">{item.productName}</td>
                        <td className="py-3 px-2">{item.colorCode || '—'}</td>
                        <td className="py-3 px-2">{item.quantity?.toLocaleString('vi-VN')} thùng</td>
                        <td className="py-3 px-2">{item.unitPrice?.toLocaleString('vi-VN')}</td>
                        <td style={{ fontWeight: 600, color: '#d97706' }} className="py-3 px-2">
                          {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Web3 Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Contract PDF Info (IPFS) */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} style={{ color: '#d97706' }} /> Thông tin tài liệu
            </h3>

            {contract.ipfsCid ? (
              <div>
                <div style={{
                  padding: '0.625rem 1.125rem', background: 'rgba(5, 150, 105, 0.08)',
                  borderRadius: '10px', color: '#059669',
                  fontSize: '1rem', fontWeight: 600, marginBottom: '1.125rem'
                }}>
                  ✅ PDF đã upload lên IPFS
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', wordBreak: 'break-all', marginBottom: 8 }}>
                  <strong>CID:</strong> {contract.ipfsCid}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', wordBreak: 'break-all', marginBottom: '1.125rem' }}>
                  <strong>Hash:</strong> {contract.documentHash}
                </div>
                <a href={`https://gateway.pinata.cloud/ipfs/${contract.ipfsCid}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs" style={{ width: '100%', justifyContent: 'center' }}>
                  <ExternalLink size={14} /> Xem PDF bản cứng (IPFS)
                </a>
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl text-center">
                Tài liệu đang chờ VTSC khởi tạo và cấp mã Hash.
              </div>
            )}
          </div>

          {/* Server-side Signing */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet size={18} style={{ color: '#7c3aed' }} /> Ký Hợp đồng nguyên tắc
            </h3>

            {['signed', 'delivering', 'completed'].includes(contract.status) || effectiveTxHash ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {effectiveTxHash && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <ShieldCheck size={100} />
                    </div>
                    <div className="flex gap-4 relative z-10">
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-white text-green-600 rounded-full flex items-center justify-center shadow-sm border border-green-100">
                          <ShieldCheck size={24} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[17px] font-black text-green-800 tracking-tight">Xác thực Pháp lý trên Blockchain thành công</h4>
                        <p className="text-sm text-gray-600 font-medium mt-1 mb-5 leading-relaxed">Văn bản hợp đồng đã được băm SHA-256 và đóng dấu bất biến lên mạng lưới Ethereum Sepolia Testnet.</p>

                        <div className="bg-white/80 border border-green-100 rounded-lg p-3 mb-5 shadow-sm">
                          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Mã giao dịch (TxHash):</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-sm font-bold text-gray-800 truncate" title={effectiveTxHash || ''}>
                              {(effectiveTxHash || '').substring(0, 10)}...{(effectiveTxHash || '').substring((effectiveTxHash || '').length - 8)}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(effectiveTxHash || '');
                                alert('Đã copy mã TxHash!');
                              }}
                              className="w-8 h-8 rounded-md bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center transition-all shadow-sm"
                              title="Copy TxHash"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>

                        <a
                          href={`https://sepolia.etherscan.io/tx/${effectiveTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30"
                        >
                          Kiểm tra sổ cái Etherscan <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Sign Button */}
                {contract.status === 'created' && contract.ipfsCid ? (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.125rem' }}>
                      Xác nhận ký kết hợp đồng. Hệ thống sẽ tự động dùng ví quản trị để ghi nhận giao dịch lên Blockchain Sepolia mà không yêu cầu khách hàng thao tác trên MetaMask.
                    </p>
                    <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700" style={{ width: '100%' }} onClick={handleSignDocument} disabled={isSigning}>
                      <PenTool size={16} />
                      {isSigning ? 'Hệ thống đang xử lý ký ngầm...' : 'Ký Hợp đồng nguyên tắc'}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                    Vui lòng chờ VTSC duyệt và ghi hợp đồng lên Blockchain trước khi ký kết.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
