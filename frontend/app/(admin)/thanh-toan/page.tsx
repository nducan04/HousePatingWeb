'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Eye, CreditCard, DollarSign, Wallet, FileCheck,
  CheckCircle2, XCircle, Clock, ArrowRight, User, Package
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

const API_THANH_TOAN = '/thanh-toan/all';
const API_ORDER = '/don-hang';
const API_CONTRACT = '/thanh-toan/contract';

interface FinancialRecord {
  _id: string;
  type: 'ORDER' | 'CONTRACT';
  code: string;
  customer: {
    name: string;
    code: string;
    segment: string;
  } | null;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  orderStatus?: string;
  contractStatus?: string;
  date: string;
}

export default function ThanhToanPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_THANH_TOAN);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching financial records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async (record: FinancialRecord) => {
    if (record.type === 'ORDER') {
      const newStatus = record.status === 'DA_THANH_TOAN' ? 'CHUA_THANH_TOAN' : 'DA_THANH_TOAN';
      const statusText = newStatus === 'DA_THANH_TOAN' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN';
      if (!confirm(`Xác nhận chuyển đơn hàng #${record.code} sang: ${statusText}?`)) return;
      try {
        await api.patch(`${API_ORDER}/${record._id}/payment`, { paymentStatus: newStatus });
        fetchRecords();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Lỗi cập nhật thanh toán');
      }
    } else {
      const amount = prompt(`Nhập số tiền đã thanh toán cho hợp đồng ${record.code} (Tổng: ${record.totalAmount.toLocaleString()} đ):`, record.paidAmount.toString());
      if (amount === null) return;
      const val = parseInt(amount);
      if (isNaN(val)) return alert('Số tiền không hợp lệ');
      try {
        await api.patch(`${API_CONTRACT}/${record._id}`, { paidAmount: val });
        fetchRecords();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Lỗi cập nhật công nợ');
      }
    }
  };

  const STATS = {
    totalExpected: records.reduce((sum, r) => sum + r.totalAmount, 0),
    totalPaid: records.reduce((sum, r) => sum + r.paidAmount, 0),
    totalDebt: records.reduce((sum, r) => sum + r.debtAmount, 0),
    pendingCount: records.filter(r => r.debtAmount > 0).length,
  };

  const filteredData = records.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (item.customer?.name || '').toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.customer?.code || '').toLowerCase().includes(q);
    const matchFilter = filter === 'all' ||
      (filter === 'order' && item.type === 'ORDER') ||
      (filter === 'contract' && item.type === 'CONTRACT') ||
      (filter === 'debt' && item.debtAmount > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card emerald" style={{ border: '1px solid var(--accent-emerald)' }}>
          <div className="kpi-icon" style={{ background: 'var(--accent-emerald)' }}><DollarSign size={22} color="#fff" /></div>
          <div className="kpi-label">Tổng Doanh Thu (HĐ + ĐH)</div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>{STATS.totalExpected.toLocaleString()} ₫</div>
        </div>
        <div className="kpi-card cyan">
          <div className="kpi-icon" style={{ background: 'var(--accent-cyan)' }}><Wallet size={22} color="#fff" /></div>
          <div className="kpi-label">Đã Thu Hồi</div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>{STATS.totalPaid.toLocaleString()} ₫</div>
        </div>
        <div className="kpi-card rose" style={{ border: '1px solid var(--accent-rose)' }}>
          <div className="kpi-icon" style={{ background: 'var(--accent-rose)' }}><CreditCard size={22} color="#fff" /></div>
          <div className="kpi-label">Công Nợ Phải Thu</div>
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>{STATS.totalDebt.toLocaleString()} ₫</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon" style={{ background: 'var(--accent-amber)' }}><Clock size={22} color="#fff" /></div>
          <div className="kpi-label">Đơn/HĐ Còn Lại</div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>{STATS.pendingCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Tra cứu mã HĐ, mã đơn, khách hàng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'order', label: 'Đơn hàng lẻ' },
                { id: 'contract', label: 'Hợp đồng dự án' },
                { id: 'debt', label: 'Còn công nợ' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={fetchRecords}><FileCheck size={16} style={{ marginRight: 8 }} /> Làm mới dữ liệu</button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Loại / Mã tham chiếu</th>
              <th>Khách Hàng</th>
              <th>Tổng Giá Trị</th>
              <th>Đã Thanh Toán</th>
              <th style={{ color: 'var(--accent-rose)' }}>Công Nợ</th>
              <th>Trạng Thái</th>
              <th>Ngày Lập</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Đang tải dữ liệu tài chính...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Không tìm thấy dữ liệu phù hợp.</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.type === 'ORDER' ? <Package size={14} color="var(--accent-cyan)" /> : <FileCheck size={14} color="var(--accent-amber)" />}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>{item.type === 'ORDER' ? 'ĐƠN HÀNG' : 'HỢP ĐỒNG'}</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.code}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.customer?.name}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{item.customer?.code}</div>
                </td>
                <td style={{ fontWeight: 600 }}>{item.totalAmount.toLocaleString()} ₫</td>
                <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{item.paidAmount.toLocaleString()} ₫</td>
                <td style={{ fontWeight: 700, color: item.debtAmount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  {item.debtAmount === 0 ? '—' : `${item.debtAmount.toLocaleString()} ₫`}
                </td>
                <td>
                  <span
                    onClick={() => handleTogglePayment(item)}
                    style={{ cursor: 'pointer' }}
                    className={`badge ${item.debtAmount === 0 ? 'approved' : item.paidAmount > 0 ? 'testing' : 'pending'}`}
                  >
                    {item.debtAmount === 0 ? 'Đã quyết toán' : item.paidAmount > 0 ? 'Đang thanh toán' : 'Chưa thanh toán'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{new Date(item.date).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleTogglePayment(item)}
                    className="btn btn-ghost btn-sm"
                    title={item.type === 'ORDER' ? 'Thay đổi trạng thái' : 'Cập nhật số tiền'}
                  >
                    {item.type === 'ORDER' ? <ArrowRight size={16} /> : <CreditCard size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
};