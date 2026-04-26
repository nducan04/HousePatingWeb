'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Printer, Package, CheckCircle2, User, 
  Calendar, FileText, Scale, Database, ShieldCheck
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import Link from 'next/link';

export default function PackagingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/packaging/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch packaging detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>Đang tải phiếu đóng gói...</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: 100 }}>Không tìm thấy phiếu đóng gói.</div>;

  return (
    <div className="admin-container" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
       <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <Link href="/packaging" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs">
          <ArrowLeft size={16} /> Quay lại danh sách
        </Link>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs" onClick={handlePrint}>
          <Printer size={16} /> In Phiếu (Packing List)
        </button>
      </div>

      {/* Industrial Document Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden print-area" style={{ padding: 40, background: '#ffffff', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: 25, marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1, color: '#2563eb' }}>VTSC PAINTPRO</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase' }}>Hệ thống quản lý chuỗi cung ứng sơn AkzoNobel</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>PHIẾU ĐÓNG GÓI & THÀNH PHẨM</div>
            <div style={{ fontSize: 11, color: '#475569' }}>Mã số: <span style={{ color: '#2563eb', fontWeight: 700 }}>{data.MaPhieuDongGoi}</span></div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 15, borderLeft: '3px solid #d97706', paddingLeft: 10 }}>THÔNG TIN TRUY XUẤT R&D</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Log R&D gốc:</span>
                <span style={{ fontWeight: 700 }}>{data.RDLogID?.MaNhatKy}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Mã màu yêu cầu:</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>{data.RDLogID?.MaMauYeuCau}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Hợp đồng/Đơn hàng:</span>
                <span style={{ fontWeight: 700 }}>{data.ContractID?.MaHopDong || data.OrderID?.MaDonHang || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 15, borderLeft: '3px solid #059669', paddingLeft: 10 }}>QUY TRÌNH & ĐỐI SOÁT</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Nhân viên đóng gói:</span>
                <span style={{ fontWeight: 700 }}>{data.CreatedBy}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Ngày thực hiện:</span>
                <span style={{ fontWeight: 700 }}>{new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Trạng thái kho:</span>
                <span className="badge success" style={{ fontSize: 10 }}>ĐÃ NHẬP KHO THÀNH PHẨM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Table */}
        <h3 style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', marginBottom: 15 }}>DANH MỤC QUY CÁCH ĐÓNG GÓI</h3>
        <table className="admin-table" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
          <thead>
            <tr>
              <th>Loại Bao Bì</th>
              <th style={{ textAlign: 'center' }}>Số Lượng</th>
              <th style={{ textAlign: 'center' }}>Khối Lượng Tịnh (Kg/ĐV)</th>
              <th style={{ textAlign: 'right' }}>Thành Tiền (Kg)</th>
            </tr>
          </thead>
          <tbody>
            {data.PackagingSpecs?.map((spec: any, idx: number) => (
              <tr key={idx}>
                <td style={{ fontWeight: 700 }}>{spec.containerType}</td>
                <td style={{ textAlign: 'center' }}>{spec.quantity}</td>
                <td style={{ textAlign: 'center' }}>{spec.unitWeight}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>{spec.totalWeight}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(0,212,255,0.05)' }}>
              <td colSpan={3} style={{ fontWeight: 800, textAlign: 'right', color: '#475569' }}>TỔNG KHỐI LƯỢNG TỊNH (NET WEIGHT):</td>
              <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 18, color: '#059669' }}>{data.NetWeightTotal} Kg</td>
            </tr>
          </tfoot>
        </table>

        {/* Notes & Signs */}
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
           <div>
             <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 10 }}>ĐIỀU KHOẢN BÀN GIAO:</div>
             <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                1. Hàng hóa được đóng gói theo quy chuẩn của AkzoNobel Interpon.<br />
                2. Bên nhận cần kiểm tra niêm phong thùng trước khi ký nhận.<br />
                3. Khiếu nại về khối lượng tịnh cần thực hiện trong vòng 24h.
             </p>
             <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginTop: 20, marginBottom: 10 }}>GHI CHÚ CHUNG:</div>
             <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{data.Notes || 'Không có ghi chú thêm.'}</p>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 60, color: '#059669' }}>XÁC NHẬN KCS (STAMP)</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{data.RDLogID?.signedBy || '(Chữ ký điện tử)'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 60, color: '#2563eb' }}>BỐ PHẬN ĐÓNG GÓI</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>{data.CreatedBy}</div>
              </div>
           </div>
        </div>

        {/* Integrity Badge */}
        <div style={{ marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'center', gap: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94a3b8' }}>
            <ShieldCheck size={14} className="text-[#059669]" /> DỮ LIỆU ĐÃ ĐƯỢC XÁC THỰC HỆ THỐNG
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#94a3b8' }}>
            <Database size={14} className="text-[#2563eb]" /> TỒN KHO ĐÃ ĐƯỢC ĐỒNG BỘ
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { border: none !important; box-shadow: none !important; padding: 0 !important; background: white !important; color: black !important; }
          body { background: white !important; }
          .glass-card { background: white !important; color: black !important; border: 1px solid #eee !important; }
          * { color: black !important; }
          .text-\[var\(--accent-emerald\)\] { color: #10B981 !important; }
          .text-\[var\(--accent-cyan\)\] { color: #00D4FF !important; }
        }
      `}</style>
    </div>
  );
}
