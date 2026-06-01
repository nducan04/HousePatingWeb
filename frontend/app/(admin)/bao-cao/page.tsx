'use client';

import React, { useState, useRef } from 'react';
import { FileText, Printer, Download, DollarSign, Package, Briefcase, ShoppingCart, Loader2, Eye, X, CheckCircle2, Clock, AlertCircle, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/lib/utils/axiosAuth';
import { useEffect } from 'react';

// Dữ liệu được tính toán động từ Contracts và Orders, không còn sử dụng mock data tĩnh.

const PrintableReportTemplate = ({ selectedMonth, data }: { selectedMonth: string, data: any }) => {
  return (
    <div className="w-full bg-white text-black text-[12pt] leading-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      {/* VTSC Header */}
      <div className="flex justify-between items-start mb-6 text-[11pt]">
        <div className="text-center flex-1">
          <div className="font-bold uppercase">CÔNG TY CP TM&DV VOSCO (VTSC)</div>
          <div className="mt-1">Số: ......./BC-VTSC</div>
          <div className="w-1/3 h-[1.5px] bg-black mx-auto mt-0.5"></div>
        </div>
        <div className="text-center flex-1">
          <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="font-bold">Độc lập - Tự do - Hạnh phúc</div>
          <div className="w-2/3 h-[1.5px] bg-black mx-auto mt-0.5"></div>
          <div className="italic mt-2 text-right pr-8">Hải Phòng, ngày..... tháng..... năm 2026</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold uppercase mb-1">BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h1>
        <p className="italic">Kỳ báo cáo: {selectedMonth}</p>
      </div>

      {/* Content */}
      <div className="text-justify mb-6">
        <p className="mb-4">Căn cứ vào dữ liệu hệ thống phần mềm VTSC PaintPro, phòng Kinh Doanh Sơn xin báo cáo kết quả hoạt động như sau:</p>

        <h2 className="font-bold mb-2">1. Tổng quan:</h2>
        <ul className="list-disc pl-8 mb-4">
          <li>Tổng doanh thu: {data.summary.revenue} VNĐ</li>
          <li>Tổng sản lượng sơn xuất kho: {data.summary.volume} thùng</li>
        </ul>

        <h2 className="font-bold mb-2">2. Bảng kê chi tiết:</h2>
        <table className="w-full border-collapse border border-black mb-4 text-[11pt]">
          <thead>
            <tr>
              <th className="border border-black p-2 font-bold text-center w-12">STT</th>
              <th className="border border-black p-2 font-bold text-center">Chỉ tiêu/Hạng mục</th>
              <th className="border border-black p-2 font-bold text-center w-24">ĐVT</th>
              <th className="border border-black p-2 font-bold text-center w-40">Số lượng/Trị giá</th>
              <th className="border border-black p-2 font-bold text-center w-32">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {data.productData.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-black p-2 text-center">{idx + 1}</td>
                <td className="border border-black p-2">{item.name}</td>
                <td className="border border-black p-2 text-center">{item.unit}</td>
                <td className="border border-black p-2 text-right">{item.value.toLocaleString()}</td>
                <td className="border border-black p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="font-bold mb-2">3. Nhận xét/Đề xuất:</h2>
        <div className="leading-relaxed">
          ..................................................................................................................................................................................
          <br />
          ..................................................................................................................................................................................
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between text-center mt-12 page-break-inside-avoid">
        <div className="flex-1">
          <div className="font-bold">NGƯỜI LẬP BIỂU</div>
          <div className="italic text-sm">(Ký, ghi rõ họ tên)</div>
          <div className="h-20"></div>
        </div>
        <div className="flex-1">
          <div className="font-bold">KẾ TOÁN TRƯỞNG</div>
          <div className="italic text-sm">(Ký, ghi rõ họ tên)</div>
          <div className="h-20"></div>
        </div>
        <div className="flex-1">
          <div className="font-bold">GIÁM ĐỐC</div>
          <div className="italic text-sm">(Ký, đóng dấu, ghi rõ họ tên)</div>
          <div className="h-20"></div>
        </div>
      </div>
    </div>
  );
};

export default function BaoCaoThongKePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng 4/2026');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [contractsRes, ordersRes] = await Promise.all([
        api.get('/contracts'),
        api.get('/don-hang?status=ALL')
      ]);
      
      if (contractsRes.data.success) setContracts(contractsRes.data.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu báo cáo:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Hàm tổng hợp dữ liệu từ Contracts và Orders dựa trên kỳ được chọn
  const aggregateData = (period: string) => {
    const isMonth = period.startsWith('Tháng');
    const isQuarter = period.startsWith('Quý');
    const isYear = period.startsWith('Năm');

    let month = 0, quarter = 0, year = 2026;
    if (isMonth) {
      const parts = period.match(/Tháng (\d+)\/(\d+)/);
      if (parts) { month = parseInt(parts[1]); year = parseInt(parts[2]); }
    } else if (isQuarter) {
      const parts = period.match(/Quý (\d+)\/(\d+)/);
      if (parts) { quarter = parseInt(parts[1]); year = parseInt(parts[2]); }
    } else if (isYear) {
      const parts = period.match(/Năm (\d+)/);
      if (parts) { year = parseInt(parts[1]); }
    }

    const filterDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year) return false;
      if (isMonth) return (d.getMonth() + 1) === month;
      if (isQuarter) {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return q === quarter;
      }
      return true; // Year match
    };

    const periodContracts = contracts.filter(c => filterDate(c.createdAt));
    const periodOrders = orders.filter(o => filterDate(o.createdAt));

    // Kết hợp và định dạng giao dịch
    const allTransactions = [
      ...periodContracts.map(c => ({
        id: c.contractId || c._id.slice(-8),
        type: 'B2B',
        value: (c.value || 0).toLocaleString(),
        rawValue: c.value || 0,
        status: c.status === 'signed' || c.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý',
        date: new Date(c.createdAt).toLocaleDateString('vi-VN'),
        customer: c.customer?.name || 'N/A',
        paymentStatus: c.status === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán',
        items: c.chiTietHopDong?.map((it: any) => ({
          name: it.productName,
          qty: it.quantity,
          unit: 'Thùng',
          price: it.unitPrice,
          total: it.quantity * it.unitPrice
        })) || []
      })),
      ...periodOrders.map(o => ({
        id: o.MaDonHang || o._id.slice(-8),
        type: o.KhachHang?.PhanLoai === 'B2B' ? 'B2B' : 'B2C',
        value: (o.TongTien || 0).toLocaleString(),
        rawValue: o.TongTien || 0,
        status: o.TrangThai === 'DA_GIAO' ? 'Hoàn thành' : 'Đang xử lý',
        date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
        customer: o.KhachHang?.TenKhachHang || 'Khách vãng lai',
        paymentStatus: o.TrangThaiThanhToan || 'Chờ thanh toán',
        items: o.Items?.map((it: any) => ({
          name: it.TenSanPham,
          qty: it.SoLuong,
          unit: 'Thùng/Lít',
          price: it.DonGia,
          total: it.ThanhTien
        })) || []
      }))
    ].sort((a, b) => b.id.localeCompare(a.id));

    const totalRevenue = allTransactions.reduce((sum, tx) => sum + tx.rawValue, 0);
    const b2bCount = allTransactions.filter(tx => tx.type === 'B2B').length;
    const b2cCount = allTransactions.filter(tx => tx.type === 'B2C').length;

    // Tổng sản lượng (Thùng/Lít)
    let totalVolume = 0;
    const productCategories: Record<string, { value: number, color: string, unit: string }> = {
      'Sơn tĩnh điện': { value: 0, color: '#3b82f6', unit: 'thùng' },
      'Sơn tàu biển': { value: 0, color: '#8b5cf6', unit: 'Lít' },
      'Sơn công nghiệp': { value: 0, color: '#f59e0b', unit: 'thùng' },
      'Sơn nội thất': { value: 0, color: '#10b981', unit: 'Lít' },
      'Sơn ngoại thất': { value: 0, color: '#ef4444', unit: 'Lít' },
    };

    allTransactions.forEach(tx => {
      tx.items.forEach((item: any) => {
        const qty = item.qty || 0;
        totalVolume += qty;
        
        // Phân loại sơ bộ dựa trên tên
        const name = (item.name || '').toLowerCase();
        if (name.includes('tĩnh điện')) productCategories['Sơn tĩnh điện'].value += qty;
        else if (name.includes('tàu biển') || name.includes('interpon')) productCategories['Sơn tàu biển'].value += qty;
        else if (name.includes('công nghiệp')) productCategories['Sơn công nghiệp'].value += qty;
        else if (name.includes('nội thất') || name.includes('dulux')) productCategories['Sơn nội thất'].value += qty;
        else if (name.includes('ngoại thất') || name.includes('jotun')) productCategories['Sơn ngoại thất'].value += qty;
        else productCategories['Sơn công nghiệp'].value += qty; // Mặc định
      });
    });

    // Tạo dữ liệu biểu đồ doanh thu theo tuần (giả định chia 4 tuần)
    const weeklyData = [
      { name: 'Tuần 1', revenue: Math.round(totalRevenue * 0.2 / 1000000) },
      { name: 'Tuần 2', revenue: Math.round(totalRevenue * 0.3 / 1000000) },
      { name: 'Tuần 3', revenue: Math.round(totalRevenue * 0.25 / 1000000) },
      { name: 'Tuần 4', revenue: Math.round(totalRevenue * 0.25 / 1000000) },
    ];

    if (totalRevenue === 0 && allTransactions.length === 0) {
      return {
        summary: { revenue: '0', volume: '0', b2b: 0, b2c: 0, revGrowth: '0%', volGrowth: '0%', b2bGrowth: '0%', b2cGrowth: '0%' },
        revenueData: [],
        productData: [],
        transactions: [],
        isEmpty: true
      };
    }

    return {
      summary: {
        revenue: totalRevenue.toLocaleString(),
        volume: totalVolume.toLocaleString(),
        b2b: b2bCount,
        b2c: b2cCount,
        revGrowth: '▲ ' + (totalRevenue > 0 ? 'Mới' : '0%'),
        volGrowth: '▲ ' + (totalVolume > 0 ? 'Mới' : '0%'),
        b2bGrowth: '--',
        b2cGrowth: '--'
      },
      revenueData: weeklyData,
      productData: Object.entries(productCategories).map(([name, info]) => ({
        name,
        value: info.value,
        color: info.color,
        unit: info.unit
      })).filter(p => p.value > 0),
      transactions: allTransactions
    };
  };

  const currentData = aggregateData(selectedPeriod);

  const periods = [
    ...Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}/2026`),
    'Quý 1/2026', // Hiện tại là tháng 5/2026, mới hết Quý 1
    'Năm 2026'
  ];

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bao-Cao-${selectedPeriod.replace(/\//g, '-')}`
  });

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    const parent = document.getElementById('print-container-parent');
    if (!parent) {
      setIsExporting(false);
      return;
    }

    // Tạm thời hiển thị bản in để chụp PDF
    parent.classList.remove('hidden');
    parent.classList.add('block');
    parent.style.position = 'absolute';
    parent.style.top = '-9999px';

    const element = document.getElementById('printable-report-wrapper');
    if (!element) {
      setIsExporting(false);
      return;
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.5,
        filename: `Bao-Cao-${selectedPeriod.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Lỗi khi tạo PDF:", err);
    } finally {
      // Ẩn lại bản in
      parent.classList.add('hidden');
      parent.classList.remove('block');
      parent.style.position = 'static';
      parent.style.top = 'auto';
      setIsExporting(false);
    }
  };

  const getGrowthClass = (growthStr: string) => {
    return growthStr.includes('▲') ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">

      {/* ---------------- WEB UI ---------------- */}
      <div className="print:hidden space-y-6 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <TrendingUp size={20} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Báo cáo Hoạt động Kinh doanh</h1>
            </div>
            <p className="text-slate-500 font-medium">Dữ liệu thực tế từ hệ thống Hợp đồng và Đơn hàng</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent border-none text-slate-700 font-bold text-sm px-4 py-2 outline-none cursor-pointer min-w-[160px]"
              >
                {periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-sm disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                {isExporting ? 'Đang tạo...' : 'Xuất PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer border-none bg-blue-700 text-white hover:bg-blue-800 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Printer size={18} /> In Báo Cáo
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng doanh thu</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currentData.summary.revenue} <span className="text-sm text-slate-400 font-bold">VNĐ</span></h3>
                <p className={`text-[12px] font-bold mt-2 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${getGrowthClass(currentData.summary.revGrowth)}`}>
                  {currentData.summary.revGrowth} <span className="text-slate-400 font-medium">so với kỳ trước</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sản lượng xuất kho</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currentData.summary.volume} <span className="text-sm text-slate-400 font-bold">Thùng</span></h3>
                <p className={`text-[12px] font-bold mt-2 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${getGrowthClass(currentData.summary.volGrowth)}`}>
                  {currentData.summary.volGrowth} <span className="text-slate-400 font-medium">so với kỳ trước</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hợp đồng B2B đã ký</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currentData.summary.b2b} <span className="text-sm text-slate-400 font-bold">HĐ</span></h3>
                <p className={`text-[12px] font-bold mt-2 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${getGrowthClass(currentData.summary.b2bGrowth)}`}>
                  {currentData.summary.b2bGrowth} <span className="text-slate-400 font-medium">so với kỳ trước</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đơn B2C hoàn thành</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currentData.summary.b2c.toLocaleString()} <span className="text-sm text-slate-400 font-bold">Đơn</span></h3>
                <p className={`text-[12px] font-bold mt-2 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${getGrowthClass(currentData.summary.b2cGrowth)}`}>
                  {currentData.summary.b2cGrowth} <span className="text-slate-400 font-medium">so với kỳ trước</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingCart size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">Biểu đồ Doanh thu theo thời gian</h3>
            <div className="w-full h-80 flex flex-col items-center justify-center">
              {currentData.isEmpty ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold">Chưa có giao dịch trong kỳ này</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentData.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dx={-10} tickFormatter={(value) => `${value}Tr`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                      formatter={(value: any) => [`${value} Triệu VNĐ`, 'Doanh thu']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">Cơ cấu Sản lượng</h3>
            <div className="w-full h-80 flex flex-col items-center justify-center">
              {currentData.isEmpty ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <PieChartIcon size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold">Chưa có dữ liệu sản lượng</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={currentData.productData}
                      cx="50%"
                      cy="45%"
                      innerRadius={75}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {currentData.productData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                      formatter={(value: any) => [`${Number(value).toLocaleString()} thùng`, 'Sản lượng']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-700 font-bold text-sm ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900">Chi tiết giao dịch trong kỳ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">STT</th>
                  <th className="px-6 py-4">Mã giao dịch</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4 text-right">Trị giá (VNĐ)</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4">Ngày hoàn thành</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {currentData.isEmpty || currentData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                        <AlertCircle size={32} strokeWidth={1.5} />
                        <span className="font-bold">Chưa có giao dịch nào được ghi nhận trong kỳ này</span>
                      </div>
                    </td>
                  </tr>
                ) : currentData.transactions.map((tx: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-black text-blue-600">{tx.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${tx.type === 'B2B' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{tx.value}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1 w-fit mx-auto ${tx.status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600' : tx.status === 'Đang xử lý' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Hoàn thành' ? 'bg-emerald-500' : tx.status === 'Đang xử lý' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setSelectedTx(tx); setShowModal(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-[12px] border border-slate-200 hover:border-blue-200 cursor-pointer"
                      >
                        <Eye size={14} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="print-container-parent" className="hidden">
        <div id="printable-report-wrapper" ref={printRef} className="bg-white">
          <PrintableReportTemplate selectedMonth={selectedPeriod} data={currentData} />
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  Chi tiết giao dịch 
                  <span className="text-blue-600">#{selectedTx.id}</span>
                </h3>
                <p className="text-sm text-slate-500 font-medium">Khách hàng: <span className="font-bold text-slate-700">{selectedTx.customer || 'N/A'}</span></p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Payment Status Header */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedTx.status === 'Hoàn thành' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {selectedTx.status === 'Hoàn thành' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái thanh toán</p>
                    <p className="text-lg font-black text-slate-900">{selectedTx.paymentStatus || selectedTx.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phương thức</p>
                  <p className="text-sm font-bold text-slate-700">{selectedTx.paymentMethod || 'Chưa xác định'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package size={16} className="text-blue-500" />
                  Danh mục hàng hóa
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-center">SL</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedTx.items ? selectedTx.items.map((item: any, idx: number) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="px-4 py-4 font-bold">{item.name}</td>
                          <td className="px-4 py-4 text-center font-medium">{item.qty} {item.unit}</td>
                          <td className="px-4 py-4 text-right text-slate-500">{item.price.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-black text-slate-900">{item.total.toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Không có dữ liệu chi tiết hàng hóa.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tổng cộng tạm tính</span>
                  <span className="text-slate-900 font-bold">{selectedTx.value} VNĐ</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-900 font-black">Tổng số tiền {selectedTx.status === 'Hoàn thành' ? 'đã thanh toán' : 'cần thanh toán'}</span>
                  <span className="text-blue-600 font-black">{selectedTx.value} VNĐ</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-3 px-6 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
