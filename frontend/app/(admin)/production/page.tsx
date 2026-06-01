'use client';

import { useState, useEffect } from 'react';
import { 
  Factory, Search, Clock, CheckCircle2, AlertCircle, 
  ArrowRight, Plus, Printer, Eye, Settings, Play, Pause,
  Users, Layers, BarChart3
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import Link from 'next/link';

export default function ProductionDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/production');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch production orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.MaLenhSanXuat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.ContractID?.MaHopDong.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'in_progress': return { color: '#2563eb', bg: 'rgba(0, 212, 255, 0.1)', text: 'Đang sản xuất' };
      case 'completed': return { color: '#059669', bg: 'rgba(16, 185, 129, 0.1)', text: 'Hoàn thành' };
      case 'cancelled': return { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', text: 'Đã hủy' };
      default: return { color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)', text: 'Nháp' };
    }
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-bold text-slate-800">HỆ THỐNG LỆNH SẢN XUẤT (MES)</h1>
          <p className="page-subtitle">Quản lý lệnh sản xuất, phân bổ Line và theo dõi vật tư MRP</p>
        </div>
        <Link href="/production/new" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
          <Plus size={18} /> PHÁT SINH LỆNH MỚI
        </Link>
      </div>

      {/* Production Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 30 }}>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20, borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>ĐANG CHẠY</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 5 }}>{orders.filter(o => o.TrangThai === 'in_progress').length}</div>
            </div>
            <div style={{ padding: 8, background: 'rgba(0, 212, 255, 0.1)', borderRadius: 8, color: '#2563eb' }}>
              <Play size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20, borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>HOÀN TẤT (THÁNG)</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 5 }}>24</div>
            </div>
            <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20, borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>NĂNG SUẤT B/Q</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 5 }}>94.2%</div>
            </div>
            <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, color: '#d97706' }}>
              <BarChart3 size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>LINE HOẠT ĐỘNG</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 5 }}>4/4</div>
            </div>
            <div style={{ padding: 8, background: 'rgba(168, 85, 247, 0.1)', borderRadius: 8, color: '#7c3aed' }}>
              <Layers size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
             <h3 style={{ fontSize: 18, fontWeight: 800 }}>DANH SÁCH LỆNH SẢN XUẤT</h3>
             <div className="badge info">{orders.length} Lệnh</div>
          </div>
          <div className="relative" style={{ maxWidth: 300 }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Tìm theo mã lệnh, hợp đồng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã Lệnh</th>
              <th>Hợp Đồng</th>
              <th>Công Thức / Màu</th>
              <th>Sản Lượng (Thùng)</th>
              <th>Line</th>
              <th>Phụ Trách</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const status = getStatusStyle(order.TrangThai);
              return (
                <tr key={order._id}>
                  <td style={{ fontWeight: 800, color: '#2563eb' }}>{order.MaLenhSanXuat}</td>
                  <td style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{order.ContractID?.MaHopDong}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{order.ContractID?.title}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.CongThucID?.TenCongThuc}</div>
                    <div style={{ fontSize: 11, color: '#d97706' }}>{order.CongThucID?.MaCongThuc}</div>
                  </td>
                  <td style={{ fontWeight: 800 }}>{order.TargetWeight} thùng</td>
                  <td>
                    <div className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#475569' }}>
                      {order.ProductionLine}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                        {order.Assignee?.HoTen.charAt(0)}
                      </div>
                      <div style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 700 }}>{order.Assignee?.HoTen}</div>
                        <div style={{ color: '#94a3b8', fontSize: 10 }}>{order.Assignee?.MaNV}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ 
                      display: 'inline-flex', padding: '4px 12px', borderRadius: 20, 
                      fontSize: 11, fontWeight: 700, color: status.color, background: status.bg 
                    }}>
                      {status.text}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-2 py-1 rounded-md text-xs"><Eye size={14} /></button>
                      <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-2 py-1 rounded-md text-xs"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
            <Factory size={48} style={{ margin: '0 auto 15px', color: '#94a3b8' }} />
            <p>Không tìm thấy lệnh sản xuất nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
