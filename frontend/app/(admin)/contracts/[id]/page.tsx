'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, PenTool, ExternalLink, Shield, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { contracts } from '@/lib/data/contracts-data';

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const contract = contracts.find(c => c.id === id);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(contract?.txHash || null);

  if (!contract) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
        <h2>Không tìm thấy hợp đồng "{id}"</h2>
        <Link href="/contracts" className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } else {
        // Simulate wallet connection for demo
        await new Promise(r => setTimeout(r, 1500));
        setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38');
      }
    } catch (err) {
      alert('Không thể kết nối MetaMask. Vui lòng cài đặt MetaMask extension.');
    }
    setIsConnecting(false);
  };

  const signContract = async () => {
    if (!walletAddress) return;
    setIsSigning(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const { BrowserProvider } = await import('ethers');
        const provider = new BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const message = `VTSC Contract Signing\nContract: ${contract.id}\nDocument Hash: ${contract.documentHash}\nTimestamp: ${new Date().toISOString()}`;
        const sig = await signer.signMessage(message);
        setSignature(sig);
        setTxHash('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      } else {
        // Simulate signing for demo
        await new Promise(r => setTimeout(r, 2000));
        setSignature('0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
        setTxHash('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      }
    } catch (err) {
      alert('Ký thất bại. Người dùng có thể đã từ chối giao dịch.');
    }
    setIsSigning(false);
  };

  const statusSteps = [
    { label: 'Bản nháp', completed: true },
    { label: 'Chờ ký', completed: contract.status !== 'draft' },
    { label: 'Đã ký', completed: contract.status === 'signed' || contract.status === 'active' || !!signature },
    { label: 'On-Chain', completed: !!txHash },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link href="/contracts" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <ArrowLeft size={16} /> Quay lại
      </Link>

      {/* Contract Header */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, marginBottom: 8 }}>{contract.title}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Mã HĐ: <strong style={{ color: 'var(--accent-cyan)' }}>{contract.id}</strong> — 
              Ngày tạo: {contract.createdAt}
            </p>
          </div>
          <span className={`badge ${signature ? 'signed' : contract.status}`} style={{ fontSize: 'var(--font-sm)' }}>
            {signature ? 'SIGNED' : contract.status.toUpperCase()}
          </span>
        </div>

        {/* Status Flow */}
        <div className="tracking-timeline" style={{ margin: 'var(--spacing-lg) 0 0', padding: 'var(--spacing-lg) 0' }}>
          {statusSteps.map((step, i) => (
            <div key={i} className={`tracking-step ${step.completed ? 'completed' : i === statusSteps.findIndex(s => !s.completed) ? 'current' : ''}`}>
              <div className="step-dot">
                {step.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Contract Terms */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--accent-cyan)' }} /> Điều khoản Hợp đồng
          </h3>
          <div className="contract-terms">
            <div className="term-row">
              <span className="term-label">Đối tác</span>
              <span className="term-value">{contract.party}</span>
            </div>
            <div className="term-row">
              <span className="term-label">Giá trị</span>
              <span className="term-value" style={{ color: 'var(--accent-amber)' }}>{contract.value}</span>
            </div>
            <div className="term-row">
              <span className="term-label">SLA Giao hàng</span>
              <span className="term-value">{contract.terms.sla}</span>
            </div>
            <div className="term-row">
              <span className="term-label">Phạt vi phạm</span>
              <span className="term-value" style={{ color: 'var(--accent-rose)' }}>{contract.terms.penalty}</span>
            </div>
            <div className="term-row">
              <span className="term-label">Ký quỹ (Escrow)</span>
              <span className="term-value">{contract.terms.escrow}</span>
            </div>
            <div className="term-row">
              <span className="term-label">Thời hạn</span>
              <span className="term-value">{contract.terms.duration}</span>
            </div>
          </div>

          {contract.documentHash && (
            <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', 
              background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', 
              fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
              <strong>Document Hash:</strong><br/>{contract.documentHash}
            </div>
          )}
        </div>

        {/* Wallet & Signing */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={18} style={{ color: 'var(--accent-purple)' }} /> MetaMask & Ký Hợp đồng
          </h3>

          {/* Wallet Connection */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            {walletAddress ? (
              <div className="wallet-badge">
                <span className="wallet-dot" />
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </div>
            ) : (
              <button className="btn btn-primary w-full" onClick={connectWallet} disabled={isConnecting}>
                <Wallet size={16} />
                {isConnecting ? 'Đang kết nối...' : 'Kết nối MetaMask'}
              </button>
            )}
          </div>

          {/* Signing */}
          {walletAddress && !signature && (
            <div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Ký xác nhận hợp đồng bằng chữ ký số MetaMask. Dữ liệu sẽ được ghi lên Sepolia Testnet.
              </p>
              <button className="btn btn-success w-full" onClick={signContract} disabled={isSigning}>
                <PenTool size={16} />
                {isSigning ? 'Đang ký...' : 'Ký Hợp đồng On-Chain'}
              </button>
            </div>
          )}

          {/* Signature Result */}
          {signature && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <div className="signature-stamp" style={{ marginBottom: 'var(--spacing-md)', width: '100%', justifyContent: 'center' }}>
                ✅ Hợp đồng đã được ký thành công!
              </div>
              <div style={{ 
                padding: 'var(--spacing-md)', background: 'var(--bg-input)', 
                borderRadius: 'var(--radius-md)', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' 
              }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>Signature:</strong>
                  <div style={{ wordBreak: 'break-all', marginTop: 2 }}>{signature.substring(0, 40)}...</div>
                </div>
                {txHash && (
                  <div>
                    <strong>TX Hash:</strong>
                    <div style={{ marginTop: 2 }}>
                      <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                         style={{ display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                        {txHash.substring(0, 30)}...
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addresses */}
          <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              <strong>Ví VTSC:</strong><br/>
              <span style={{ wordBreak: 'break-all' }}>{contract.vtscAddress}</span>
            </div>
            {contract.partyAddress && (
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                <strong>Ví Đối tác:</strong><br/>
                <span style={{ wordBreak: 'break-all' }}>{contract.partyAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
