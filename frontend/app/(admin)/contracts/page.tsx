'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FileSignature, ExternalLink, Clock, CheckCircle2, Edit3, Plus, Loader2 } from 'lucide-react';
import { useContractStore } from '@/lib/store/contractStore';

const statusLabels: Record<string, string> = {
  draft: 'Bản nháp',
  created: 'Chờ ký',
  signed: 'Đã ký',
  delivering: 'Đang giao',
  completed: 'Hoàn tất',
  disputed: 'Tranh chấp',
  cancelled: 'Đã hủy'
};

const statusBadgeClass: Record<string, string> = {
  draft: 'draft',
  created: 'pending',
  signed: 'signed',
  delivering: 'testing',
  completed: 'approved',
  disputed: 'rejected',
  cancelled: 'rejected'
};

export default function ContractsPage() {
  const { contracts, loading, fetchContracts } = useContractStore();

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const countByStatus = (statuses: string[]) =>
    contracts.filter(c => statuses.includes(c.status)).length;

  return (
    <div>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>Quản lý Hợp đồng B2B</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>Ký và quản lý hợp đồng trên Blockchain (Sepolia Testnet)</p>
        </div>
        <Link href="/contracts/create" className="btn btn-primary">
          <Plus size={16} /> Tạo Hợp đồng mới
        </Link>
      </div>

      {/* Summary KPIs */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><FileSignature size={22} /></div>
          <div className="kpi-label">Tổng HĐ</div>
          <div className="kpi-value">{contracts.length}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="kpi-label">Đã Ký</div>
          <div className="kpi-value">{countByStatus(['signed', 'delivering', 'completed'])}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><Clock size={22} /></div>
          <div className="kpi-label">Chờ ký</div>
          <div className="kpi-value">{countByStatus(['created'])}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Edit3 size={22} /></div>
          <div className="kpi-label">Bản nháp</div>
          <div className="kpi-value">{countByStatus(['draft'])}</div>
        </div>
      </div>

      {/* Contract List */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="section-title">Danh sách Hợp đồng Nguyên tắc B2B</h3>
        </div>

        {loading ? (
          <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <FileSignature size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>Chưa có hợp đồng nào.</div>
            <Link href="/contracts/create" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--spacing-md)' }}>
              <Plus size={14} /> Tạo hợp đồng đầu tiên
            </Link>
          </div>
        ) : (
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
                <tr key={c._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{c.contractId}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 250 }}>{c.title}</td>
                  <td>{c.customer?.name || 'N/A'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-amber)', whiteSpace: 'nowrap' }}>
                    {c.value?.toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass[c.status] || 'draft'}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                  <td>
                    {c.txHash && c.txHash !== '' ? (
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
                    <Link href={`/contracts/${c._id}`} className="btn btn-secondary btn-sm">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
