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
    <div style={{ padding: '1.75rem' }}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ marginBottom: '2.25rem' }}>
        <div className="kpi-card emerald" style={{ border: '1px solid #059669' }}>
          <div className="kpi-icon" style={{ background: '#059669' }}><DollarSign size={22} color="#fff" /></div>
          <div className="kpi-label">Tổng Doanh Thu (HĐ + ĐH)</div>
          <div className="kpi-value" style={{ color: '#059669' }}>{STATS.totalExpected.toLocaleString()} ₫</div>
        </div>
        <div className="kpi-card cyan">
          <div className="kpi-icon" style={{ background: '#2563eb' }}><Wallet size={22} color="#fff" /></div>
          <div className="kpi-label">Đã Thu Hồi</div>
          <div className="kpi-value" style={{ color: '#2563eb' }}>{STATS.totalPaid.toLocaleString()} ₫</div>
        </div>
        <div className="kpi-card rose" style={{ border: '1px solid #e11d48' }}>
          <div className="kpi-icon" style={{ background: '#e11d48' }}><CreditCard size={22} color="#fff" /></div>
          <div className="kpi-label">Công Nợ Phải Thu</div>
          <div className="kpi-value" style={{ color: '#e11d48' }}>{STATS.totalDebt.toLocaleString()} ₫</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon" style={{ background: '#d97706' }}><Clock size={22} color="#fff" /></div>
          <div className="kpi-label">Đơn/HĐ Còn Lại</div>
          <div className="kpi-value" style={{ color: '#d97706' }}>{STATS.pendingCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={fetchRecords}><FileCheck size={16} style={{ marginRight: 8 }} /> Làm mới dữ liệu</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Loại / Mã tham chiếu</th>
              <th>Khách Hàng</th>
              <th>Tổng Giá Trị</th>
              <th>Đã Thanh Toán</th>
              <th style={{ color: '#e11d48' }}>Công Nợ</th>
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
              <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.type === 'ORDER' ? <Package size={14} color="#2563eb" /> : <FileCheck size={14} color="#d97706" />}
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{item.type === 'ORDER' ? 'ĐƠN HÀNG' : 'HỢP ĐỒNG'}</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.code}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.customer?.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{item.customer?.code}</div>
                </td>
                <td style={{ fontWeight: 600 }}>{item.totalAmount.toLocaleString()} ₫</td>
                <td style={{ color: '#2563eb', fontWeight: 600 }}>{item.paidAmount.toLocaleString()} ₫</td>
                <td style={{ fontWeight: 700, color: item.debtAmount > 0 ? '#e11d48' : '#059669' }}>
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
                <td style={{ color: '#94a3b8', fontSize: 13 }}>{new Date(item.date).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleTogglePayment(item)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
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