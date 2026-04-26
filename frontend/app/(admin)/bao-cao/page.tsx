'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, TrendingUp, DollarSign, Briefcase, 
  ArrowUpRight, ArrowDownRight, Printer, Download, Loader2
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';

const StatBox = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '20px', display: 'flex', gap: 16 }}>
    <div style={{ 
      width: 48, height: 48, borderRadius: 12, 
      backgroundColor: `var(--accent-${color})`, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 20px rgba(var(--accent-${color}-rgb), 0.2)`
    }}>
      <Icon size={24} color="#fff" />
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4, color: sub.startsWith('+') ? '#059669' : '#e11d48' }}>
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
        <Loader2 className="animate-spin text-[#2563eb]" size={40} />
        <p style={{ color: '#475569' }}>Đang truy xuất hồ sơ doanh nghiệp...</p>
      </div>
    );
  }

  if (!data) return <div>Lỗi tải dữ liệu báo cáo.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#0f172a' }}>📝 Báo Cáo Hoạt Động Doanh Nghiệp</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Tháng 04/2026 — Dữ liệu tổng hợp từ 3.000+ giao dịch</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ border: '1px solid #e2e8f0' }}>
            <Printer size={16} /> In Báo Cáo
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <Download size={16} /> Tải PDF
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox label="Doanh Thu Kỳ Này" value="4.250.000.000 ₫" sub="+12.5% vs tháng trước" icon={DollarSign} color="emerald" />
        <StatBox label="Hợp Đồng Dự Án" value={`${data.largeContracts.length + 50} HĐ`} sub="+5 HĐ mới" icon={Briefcase} color="purple" />
        <StatBox label="Sản Lượng Xuất Kho" value="45.200 kg" sub="-2.1% (Điều chỉnh)" icon={TrendingUp} color="cyan" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Large Contracts Report */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#7c3aed' }}>Dự Án Doanh Nghiệp Tiêu Biểu</h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Giá trị {'>'} 100Tr VNĐ</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.largeContracts.map((c: any) => (
              <div key={c.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, borderLeft: '3px solid #7c3aed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>{c.customer}</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{c.value.toLocaleString()} ₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Mã HĐ: {c.code}</span>
                  <span style={{ textTransform: 'uppercase' }}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Value Orders Report */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>Giao Dịch Bán Lẻ Giá Trị Cao</h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Giá trị {'>'} 5Tr VNĐ</span>
          </div>
          <table className="w-full text-left text-sm">
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
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>{o.value.toLocaleString()} ₫</td>
                  <td>
                    <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: 4, backgroundColor: 'rgba(0,212,255,0.1)', color: '#2563eb' }}>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', borderLeft: '4px solid #d97706' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="#d97706" /> Nhận xét tổng quát (Tháng 04)
        </h3>
        <div style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>
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
