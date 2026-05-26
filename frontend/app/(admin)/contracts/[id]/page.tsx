'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Wallet, PenTool, ExternalLink, Shield, Clock,
  CheckCircle2, FileText, Upload, Loader2, Package, AlertTriangle
} from 'lucide-react';
import { useContractStore } from '@/lib/store/contractStore';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Bản nháp', created: 'Chờ ký', signed: 'Đã ký',
  delivering: 'Đang giao', completed: 'Hoàn tất', disputed: 'Tranh chấp', cancelled: 'Đã hủy'
};

// ABI for signDocument — called directly from browser via MetaMask
const SIGN_DOCUMENT_ABI = [
  "function signDocument(string memory _id, string memory _documentHash, string memory _ipfsCid) external"
];

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { currentContract: contract, loading, fetchContractById, generatePreview, deployOnChain, signContract } = useContractStore();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
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
          <Link href="/contracts" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs" style={{ marginTop: '1.125rem' }}>
            Quay lại
          </Link>
        )}
      </div>
    );
  }

  const connectWallet = async () => {
    setIsConnecting(true);
    setActionError('');
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } else {
        setActionError('Vui lòng cài đặt MetaMask extension để tiếp tục.');
      }
    } catch (err: any) {
      setActionError('Không thể kết nối MetaMask: ' + (err.message || ''));
    }
    setIsConnecting(false);
  };

  // Step 1: Generate PDF → Hash → IPFS
  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setActionError('');
    try {
      const result = await generatePreview(contract._id);
      if (result) {
        setPdfUrl(result.pdfUrl);
      } else {
        setActionError('Lỗi khi sinh PDF preview.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi sinh PDF');
    }
    setIsGenerating(false);
  };

  // Step 2: Deploy on-chain (VTSC Admin)
  const handleDeploy = async () => {
    setIsDeploying(true);
    setActionError('');
    try {
      const result = await deployOnChain(contract._id);
      if (!result) {
        setActionError('Lỗi ghi Blockchain.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Lỗi deploy');
    }
    setIsDeploying(false);
  };

  // Step 3: Client signs on-chain via MetaMask signDocument()
  const handleSignDocument = async () => {
    if (!walletAddress) return;
    setIsSigning(true);
    setActionError('');
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const { BrowserProvider, Contract } = await import('ethers');
        const provider = new BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const contractAddress = contract.smartContractAddress || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error('Chưa có địa chỉ Smart Contract. Vui lòng deploy trước.');
        }

        // Call signDocument() on-chain — 0 ETH value, gas only
        const onChainContract = new Contract(contractAddress, SIGN_DOCUMENT_ABI, signer);
        const tx = await onChainContract.signDocument(
          contract.contractId,
          contract.documentHash || '',
          contract.ipfsCid || ''
        );

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        const txHash = receipt.hash;
        setSignTxHash(txHash);

        // Send txHash back to backend to update status → 'signed'
        await signContract(contract._id, 'client', walletAddress, txHash);

        // Refresh contract data
        await fetchContractById(id);
      } else {
        setActionError('MetaMask không khả dụng.');
      }
    } catch (err: any) {
      console.error('Sign error:', err);
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setActionError('Người dùng đã từ chối giao dịch.');
      } else {
        setActionError('Ký thất bại: ' + (err.reason || err.message || ''));
      }
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
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Link href="/contracts" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ marginBottom: '1.75rem' }}>
        <ArrowLeft size={16} /> Quay lại
      </Link>

      {/* Contract Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '2.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>{contract.title}</h2>
            <p style={{ color: '#475569' }}>
              Mã HĐ: <strong style={{ color: '#2563eb' }}>{contract.contractId}</strong> —
              Ngày tạo: {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <span className={`badge ${contract.status === 'signed' ? 'signed' : contract.status === 'created' ? 'pending' : contract.status === 'completed' ? 'approved' : 'draft'}`}
            style={{ fontSize: '1rem' }}>
            {STATUS_LABELS[contract.status] || contract.status}
          </span>
        </div>

        {/* Status Flow */}
        <div className="tracking-timeline" style={{ margin: '1.75rem 0 0', padding: '1.75rem 0' }}>
          {statusSteps.map((step, i) => (
            <div key={i} className={`tracking-step ${step.done ? 'completed' : i === statusSteps.findIndex(s => !s.done) ? 'current' : ''}`}>
              <div className="step-dot">
                {step.done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
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
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} style={{ color: '#7c3aed' }} /> Chi tiết Sản phẩm
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Mã màu</th>
                    <th>Khối lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.chiTietHopDong.map((item: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</td>
                      <td>{item.colorCode || '—'}</td>
                      <td>{item.quantity?.toLocaleString('vi-VN')} Kg</td>
                      <td>{item.unitPrice?.toLocaleString('vi-VN')}</td>
                      <td style={{ fontWeight: 600, color: '#d97706' }}>
                        {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Web3 Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Step 1: Generate PDF + IPFS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} style={{ color: '#d97706' }} /> 1. Sinh PDF & Upload IPFS
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
                  <ExternalLink size={14} /> Xem PDF trên IPFS
                </a>
                {/* PDF Preview iframe */}
                {(pdfUrl || contract.ipfsCid) && (
                  <div style={{ marginTop: '1.125rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <iframe
                      src={pdfUrl || `https://gateway.pinata.cloud/ipfs/${contract.ipfsCid}`}
                      style={{ width: '100%', height: 300, border: 'none', background: '#fff' }}
                      title="Contract PDF Preview"
                    />
                  </div>
                )}
              </div>
            ) : (
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ width: '100%' }} onClick={handleGeneratePDF} disabled={isGenerating}>
                {isGenerating ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang sinh PDF...</> : <><Upload size={16} /> Sinh PDF → Hash → IPFS</>}
              </button>
            )}
          </div>

          {/* Step 2: Deploy On-Chain */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} style={{ color: '#2563eb' }} /> 2. Ghi lên Blockchain
            </h3>

            {['created', 'signed', 'delivering', 'completed'].includes(contract.status) ? (
              <div>
                <div style={{
                  padding: '0.625rem 1.125rem', background: 'rgba(5, 150, 105, 0.08)',
                  borderRadius: '10px', color: '#059669',
                  fontSize: '1rem', fontWeight: 600, marginBottom: '1.125rem'
                }}>
                  ✅ Đã ghi lên Sepolia Testnet
                </div>
                {effectiveTxHash && (
                  <a href={`https://sepolia.etherscan.io/tx/${effectiveTxHash}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                    TX: {effectiveTxHash.substring(0, 20)}...
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : (
              <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ width: '100%' }} onClick={handleDeploy}
                disabled={isDeploying || !contract.ipfsCid}>
                {isDeploying
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang ghi Blockchain...</>
                  : <><Shield size={16} /> Deploy On-Chain (Sepolia)</>}
              </button>
            )}
          </div>

          {/* Step 3: MetaMask Signing */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wallet size={18} style={{ color: '#7c3aed' }} /> 3. Ký số MetaMask
            </h3>

            {contract.status === 'signed' || signTxHash ? (
              <div style={{ animation: 'slideUp 300ms ease' }}>
                <div style={{
                  padding: '1.125rem', background: 'rgba(5, 150, 105, 0.08)',
                  borderRadius: '10px', color: '#059669',
                  fontSize: '1rem', fontWeight: 700, textAlign: 'center', marginBottom: '1.125rem'
                }}>
                  ✅ Hợp đồng đã được ký thành công!
                </div>
                {(signTxHash || contract.txHash) && (
                  <div style={{ padding: '1.125rem', background: '#f1f5f9', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: 4 }}>
                      <strong>TX Hash (Bằng chứng pháp lý):</strong>
                    </div>
                    <a href={`https://sepolia.etherscan.io/tx/${signTxHash || contract.txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                      {(signTxHash || contract.txHash || '').substring(0, 30)}...
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Wallet Connection */}
                <div style={{ marginBottom: '1.125rem' }}>
                  {walletAddress ? (
                    <div className="wallet-badge">
                      <span className="wallet-dot" />
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                    </div>
                  ) : (
                    <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-slate-100 text-slate-700 hover:bg-slate-200" style={{ width: '100%' }} onClick={connectWallet} disabled={isConnecting}>
                      <Wallet size={16} />
                      {isConnecting ? 'Đang kết nối...' : 'Kết nối MetaMask'}
                    </button>
                  )}
                </div>

                {/* Sign Button */}
                {walletAddress && contract.status === 'created' && (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.125rem' }}>
                      Ký xác nhận hợp đồng bằng giao dịch on-chain. Gas fee sẽ được tính, Value = 0 ETH.
                      TX Hash sinh ra là bằng chứng pháp lý bất biến trên Sepolia.
                    </p>
                    <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-emerald-600 text-white hover:bg-emerald-700" style={{ width: '100%' }} onClick={handleSignDocument} disabled={isSigning}>
                      <PenTool size={16} />
                      {isSigning ? 'Đang ký on-chain...' : 'Ký Hợp đồng (signDocument)'}
                    </button>
                  </div>
                )}

                {contract.status === 'draft' && (
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                    Hoàn tất Bước 1 & 2 trước khi ký.
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
