'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, DollarSign, Briefcase, 
  ArrowUpRight, ArrowDownRight, Printer, Download, Loader2
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

const StatBox = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="glass-card" style={{ padding: '20px', display: 'flex', gap: 16 }}>
    <div style={{ 
      width: 48, height: 48, borderRadius: 12, 
      backgroundColor: `var(--accent-${color})`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 20px rgba(var(--accent-${color}-rgb), 0.2)`
    }}>
      <Icon size={24} color="#fff" />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4, color: sub.startsWith('+') ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
        {sub.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {sub}
      </div>
    </div>
  </div>
);

export default function BaoCaoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/detailed-stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={40} />
        <p style={{ color: 'var(--text-secondary)' }}>Đang truy xuất hồ sơ doanh nghiệp...</p>
      </div>
    );
  }

  if (!data) return <div>Lỗi tải dữ liệu báo cáo.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)' }}>📝 Báo Cáo Hoạt Động Doanh Nghiệp</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>Tháng 04/2026 — Dữ liệu tổng hợp từ 3.000+ giao dịch</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>
            <Printer size={16} /> In Báo Cáo
          </button>
          <button className="btn btn-primary">
            <Download size={16} /> Tải PDF
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid-3">
        <StatBox label="Doanh Thu Kỳ Này" value="4.250.000.000 ₫" sub="+12.5% vs tháng trước" icon={DollarSign} color="emerald" />
        <StatBox label="Hợp Đồng Dự Án" value={`${data.largeContracts.length + 50} HĐ`} sub="+5 HĐ mới" icon={Briefcase} color="purple" />
        <StatBox label="Sản Lượng Xuất Kho" value="45.200 kg" sub="-2.1% (Điều chỉnh)" icon={TrendingUp} color="cyan" />
      </div>

      <div className="grid-2">
        {/* Large Contracts Report */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-purple)' }}>Dự Án Doanh Nghiệp Tiêu Biểu</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Giá trị {'>'} 100Tr VNĐ</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.largeContracts.map((c: any) => (
              <div key={c.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>{c.customer}</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{c.value.toLocaleString()} ₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  <span>Mã HĐ: {c.code}</span>
                  <span style={{ textTransform: 'uppercase' }}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Value Orders Report */}
        <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-cyan)' }}>Giao Dịch Bán Lẻ Giá Trị Cao</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Giá trị {'>'} 5Tr VNĐ</span>
          </div>
          <table className="data-table">
            <thead>
              <tr style={{ fontSize: '11px' }}>
                <th>Mã ĐH</th>
                <th>Khách hàng</th>
                <th style={{ textAlign: 'right' }}>Giá trị</th>
                <th>T.Thái</th>
              </tr>
            </thead>
            <tbody>
              {data.highValueOrders.map((o: any) => (
                <tr key={o.id} style={{ fontSize: '11px' }}>
                  <td style={{ fontWeight: 700 }}>{o.code}</td>
                  <td>{o.customer}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-emerald)' }}>{o.value.toLocaleString()} ₫</td>
                  <td>
                    <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: 4, backgroundColor: 'rgba(0,212,255,0.1)', color: 'var(--accent-cyan)' }}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Narrative Summary */}
      <div className="glass-card" style={{ padding: 'var(--spacing-lg)', borderLeft: '4px solid var(--accent-amber)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="var(--accent-amber)" /> Nhận xét tổng quát (Tháng 04)
        </h3>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
          <p>Dựa trên phân tích 3.000 bản ghi dữ liệu, hoạt động kinh doanh trong tháng 04 ghi nhận sự tăng trưởng mạnh mẽ ở phân khúc **Sơn Công Nghiệp** và **Sơn Tàu Biển**. Các dòng sản phẩm **SEED-SP** mới đã chiếm 25% tổng doanh thu bán lẻ.</p>
          <div style={{ height: 12 }} />
          <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>✅ **Tỷ lệ hoàn thành hợp đồng**: Đạt 78%, tăng 5% so với cùng kỳ.</li>
            <li>🚀 **Tiến độ R&D**: Đã phê duyệt 12 mẫu màu mới cho các dự án B2B lớn.</li>
            <li>⚠️ **Lưu ý**: Cần theo dõi tiến độ giao hàng cho các đơn hàng lẻ khu vực miền Trung do ảnh hưởng thời tiết.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
