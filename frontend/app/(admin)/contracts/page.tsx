'use client';

import Link from 'next/link';
import { FileSignature, ExternalLink, Clock, CheckCircle2, Edit3, Download } from 'lucide-react';
import { contracts } from '@/lib/data/contracts-data';

export default function ContractsPage() {
  return (
    <div>
      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><FileSignature size={22} /></div>
          <div className="kpi-label">Tổng HĐ</div>
          <div className="kpi-value">{contracts.length}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Đã Ký</div>
          <div className="kpi-value">{contracts.filter(c => c.status === 'signed' || c.status === 'active').length}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Clock size={22} /></div>
          <div className="kpi-label">Chờ ký</div>
          <div className="kpi-value">{contracts.filter(c => c.status === 'awaiting').length}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Edit3 size={22} /></div>
          <div className="kpi-label">Bản nháp</div>
          <div className="kpi-value">{contracts.filter(c => c.status === 'draft').length}</div>
        </div>
      </div>

      {/* Contract List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="section-title">Danh sách Hợp đồng Nguyên tắc B2B</h3>
          <p className="section-subtitle">Ký và quản lý hợp đồng trên Blockchain (Sepolia Testnet)</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã HĐ</th>
              <th>Tiêu đề</th>
              <th>Đối tác</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>TX Hash</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{c.id}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 250 }}>{c.title}</td>
                <td>{c.party}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>{c.value}</td>
                <td><span className={`badge ${c.status}`}>{c.status}</span></td>
                <td>
                  {c.txHash ? (
                    <a href={`https://sepolia.etherscan.io/tx/${c.txHash}`} target="_blank" rel="noopener noreferrer"
                       style={{ fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.txHash.substring(0, 10)}...
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>—</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
                    <Link href={`/contracts/${c.id}`} className="btn btn-secondary btn-sm">
                      Chi tiết
                    </Link>
                    <a
                      href={`http://localhost:5000/api/export/contracts/${c.id}/pdf`}
                      target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-[var(--accent-purple-soft)] hover:text-[var(--accent-purple)] transition-colors"
                      title="Xuất Hợp Đồng PDF"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
