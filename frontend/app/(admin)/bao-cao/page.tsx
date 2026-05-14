'use client';

import React, { useState, useRef } from 'react';
import { FileText, Printer, Download, DollarSign, Package, Briefcase, ShoppingCart, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const mockDataByPeriod: Record<string, any> = {
  'Tháng 1/2026': {
    summary: { revenue: '3.100.000.000', volume: '38.500', b2b: 95, b2c: 1200, revGrowth: '▲ 5.2%', volGrowth: '▲ 2.1%', b2bGrowth: '▲ 3%', b2cGrowth: '▼ 1.5%' },
    revenueData: [
      { name: 'Tuần 1', revenue: 800 }, { name: 'Tuần 2', revenue: 900 }, { name: 'Tuần 3', revenue: 700 }, { name: 'Tuần 4', revenue: 700 },
    ],
    productData: [
      { name: 'Sơn tĩnh điện', value: 15000, color: '#3b82f6', unit: 'kg' },
      { name: 'Sơn tàu biển', value: 12000, color: '#8b5cf6', unit: 'Lít' },
      { name: 'Sơn công nghiệp', value: 6500, color: '#f59e0b', unit: 'kg' },
      { name: 'Sơn nội thất', value: 3000, color: '#10b981', unit: 'Lít' },
      { name: 'Sơn ngoại thất', value: 2000, color: '#ef4444', unit: 'Lít' },
    ],
    transactions: [
      { id: 'GD-20260101', type: 'B2B', value: '110,000,000', status: 'Hoàn thành', date: '10/01/2026' },
      { id: 'GD-20260102', type: 'B2C', value: '1,500,000', status: 'Hoàn thành', date: '12/01/2026' },
    ]
  },
  'Tháng 2/2026': {
    summary: { revenue: '2.800.000.000', volume: '32.100', b2b: 80, b2c: 950, revGrowth: '▼ 9.6%', volGrowth: '▼ 16.6%', b2bGrowth: '▼ 15%', b2cGrowth: '▼ 20%' },
    revenueData: [
      { name: 'Tuần 1', revenue: 500 }, { name: 'Tuần 2', revenue: 400 }, { name: 'Tuần 3', revenue: 900 }, { name: 'Tuần 4', revenue: 1000 },
    ],
    productData: [
      { name: 'Sơn tĩnh điện', value: 12000, color: '#3b82f6', unit: 'kg' },
      { name: 'Sơn tàu biển', value: 10000, color: '#8b5cf6', unit: 'Lít' },
      { name: 'Sơn công nghiệp', value: 4100, color: '#f59e0b', unit: 'kg' },
      { name: 'Sơn nội thất', value: 4000, color: '#10b981', unit: 'Lít' },
      { name: 'Sơn ngoại thất', value: 2000, color: '#ef4444', unit: 'Lít' },
    ],
    transactions: [
      { id: 'GD-20260201', type: 'B2B', value: '85,000,000', status: 'Hoàn thành', date: '15/02/2026' },
      { id: 'GD-20260202', type: 'B2C', value: '3,200,000', status: 'Đang xử lý', date: '--/--/----' },
    ]
  },
  'Tháng 3/2026': {
    summary: { revenue: '3.750.000.000', volume: '43.000', b2b: 110, b2c: 1350, revGrowth: '▲ 33.9%', volGrowth: '▲ 33.9%', b2bGrowth: '▲ 37%', b2cGrowth: '▲ 42%' },
    revenueData: [
      { name: 'Tuần 1', revenue: 1000 }, { name: 'Tuần 2', revenue: 1100 }, { name: 'Tuần 3', revenue: 950 }, { name: 'Tuần 4', revenue: 700 },
    ],
    productData: [
      { name: 'Sơn tĩnh điện', value: 18000, color: '#3b82f6', unit: 'kg' },
      { name: 'Sơn tàu biển', value: 16000, color: '#8b5cf6', unit: 'Lít' },
      { name: 'Sơn công nghiệp', value: 5000, color: '#f59e0b', unit: 'kg' },
      { name: 'Sơn nội thất', value: 3000, color: '#10b981', unit: 'Lít' },
      { name: 'Sơn ngoại thất', value: 1000, color: '#ef4444', unit: 'Lít' },
    ],
    transactions: [
      { id: 'GD-20260301', type: 'B2B', value: '250,000,000', status: 'Hoàn thành', date: '05/03/2026' },
      { id: 'GD-20260302', type: 'B2B', value: '180,000,000', status: 'Hoàn thành', date: '12/03/2026' },
      { id: 'GD-20260303', type: 'B2C', value: '500,000', status: 'Hoàn thành', date: '20/03/2026' },
    ]
  },
  'Tháng 4/2026': {
    summary: { revenue: '4.250.000.000', volume: '45.200', b2b: 128, b2c: 1450, revGrowth: '▲ 12.5%', volGrowth: '▲ 5.2%', b2bGrowth: '▲ 15%', b2cGrowth: '▲ 8.4%' },
    revenueData: [
      { name: 'Tuần 1', revenue: 1200 }, { name: 'Tuần 2', revenue: 2100 }, { name: 'Tuần 3', revenue: 1800 }, { name: 'Tuần 4', revenue: 3200 },
    ],
    productData: [
      { name: 'Sơn tĩnh điện', value: 20000, color: '#3b82f6', unit: 'kg' },
      { name: 'Sơn tàu biển', value: 12000, color: '#8b5cf6', unit: 'Lít' },
      { name: 'Sơn công nghiệp', value: 5000, color: '#f59e0b', unit: 'kg' },
      { name: 'Sơn nội thất', value: 5200, color: '#10b981', unit: 'Lít' },
      { name: 'Sơn ngoại thất', value: 3000, color: '#ef4444', unit: 'Lít' },
    ],
    transactions: [
      { id: 'GD-20260401', type: 'B2B', value: '125,000,000', status: 'Hoàn thành', date: '01/04/2026' },
      { id: 'GD-20260402', type: 'B2C', value: '2,500,000', status: 'Hoàn thành', date: '02/04/2026' },
      { id: 'GD-20260403', type: 'B2B', value: '450,000,000', status: 'Hoàn thành', date: '05/04/2026' },
      { id: 'GD-20260404', type: 'B2C', value: '1,200,000', status: 'Đang xử lý', date: '--/--/----' },
    ]
  },
  'Quý 1/2026': {
    summary: { revenue: '9.650.000.000', volume: '113.600', b2b: 285, b2c: 3500, revGrowth: '▲ 10.2%', volGrowth: '▲ 8.5%', b2bGrowth: '▲ 12%', b2cGrowth: '▲ 5%' },
    revenueData: [
      { name: 'Tháng 1', revenue: 3100 }, { name: 'Tháng 2', revenue: 2800 }, { name: 'Tháng 3', revenue: 3750 },
    ],
    productData: [
      { name: 'Sơn tĩnh điện', value: 45000, color: '#3b82f6', unit: 'kg' },
      { name: 'Sơn tàu biển', value: 38000, color: '#8b5cf6', unit: 'Lít' },
      { name: 'Sơn công nghiệp', value: 15600, color: '#f59e0b', unit: 'kg' },
      { name: 'Sơn nội thất', value: 10000, color: '#10b981', unit: 'Lít' },
      { name: 'Sơn ngoại thất', value: 5000, color: '#ef4444', unit: 'Lít' },
    ],
    transactions: [
      { id: 'GD-2026Q1-01', type: 'B2B', value: '800,000,000', status: 'Hoàn thành', date: '28/03/2026' },
      { id: 'GD-2026Q1-02', type: 'B2B', value: '550,000,000', status: 'Hoàn thành', date: '15/02/2026' },
      { id: 'GD-2026Q1-03', type: 'B2C', value: '15,000,000', status: 'Hoàn thành', date: '10/01/2026' },
      { id: 'GD-2026Q1-04', type: 'B2B', value: '320,000,000', status: 'Hoàn thành', date: '05/03/2026' },
      { id: 'GD-2026Q1-05', type: 'B2C', value: '4,500,000', status: 'Đang xử lý', date: '--/--/----' },
    ]
  },
  'Năm 2026': {
    summary: { revenue: '13.900.000.000', volume: '158.800', b2b: 413, b2c: 4950, revGrowth: '▲ 15.0%', volGrowth: '▲ 12.0%', b2bGrowth: '▲ 18%', b2cGrowth: '▲ 10%' },
    revenueData: [
      { name: 'Quý 1', revenue: 9650 }, { name: 'Quý 2 (Tạm tính)', revenue: 4250 },
    ],
    productData: [
      { name: 'Sơn tĩnh điện', value: 65000, color: '#3b82f6', unit: 'kg' },
      { name: 'Sơn tàu biển', value: 50200, color: '#8b5cf6', unit: 'Lít' },
      { name: 'Sơn công nghiệp', value: 20600, color: '#f59e0b', unit: 'kg' },
      { name: 'Sơn nội thất', value: 15200, color: '#10b981', unit: 'Lít' },
      { name: 'Sơn ngoại thất', value: 8000, color: '#ef4444', unit: 'Lít' },
    ],
    transactions: [
      { id: 'GD-2026Y-01', type: 'B2B', value: '1,500,000,000', status: 'Hoàn thành', date: '30/03/2026' },
      { id: 'GD-2026Y-02', type: 'B2B', value: '950,000,000', status: 'Hoàn thành', date: '25/04/2026' },
      { id: 'GD-2026Y-03', type: 'B2B', value: '720,000,000', status: 'Hoàn thành', date: '15/02/2026' },
    ]
  }
};

const PrintableReportTemplate = ({ selectedMonth, data }: { selectedMonth: string, data: any }) => {
  return (
    <div className="w-full bg-white text-black text-[14pt] leading-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      {/* VTSC Header */}
      <div className="flex justify-between items-start mb-8 text-[13pt]">
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
        <h1 className="text-2xl font-bold uppercase mb-2">BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h1>
        <p className="italic">Kỳ báo cáo: {selectedMonth}</p>
      </div>

      {/* Content */}
      <div className="text-justify mb-6">
        <p className="mb-4">Căn cứ vào dữ liệu hệ thống phần mềm VTSC PaintPro, phòng Kinh doanh xin báo cáo kết quả hoạt động như sau:</p>

        <h2 className="font-bold mb-2">1. Tổng quan:</h2>
        <ul className="list-disc pl-8 mb-4">
          <li>Tổng doanh thu: {data.summary.revenue} VNĐ</li>
          <li>Tổng sản lượng sơn xuất kho: {data.summary.volume} kg</li>
        </ul>

        <h2 className="font-bold mb-2">2. Bảng kê chi tiết:</h2>
        <table className="w-full border-collapse border border-black mb-4 text-[13pt]">
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
        <div className="leading-loose">
          ..................................................................................................................................................................................
          <br />
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
          <div className="h-32"></div>
        </div>
        <div className="flex-1">
          <div className="font-bold">KẾ TOÁN TRƯỞNG</div>
          <div className="italic text-sm">(Ký, ghi rõ họ tên)</div>
          <div className="h-32"></div>
        </div>
        <div className="flex-1">
          <div className="font-bold">GIÁM ĐỐC</div>
          <div className="italic text-sm">(Ký, đóng dấu, ghi rõ họ tên)</div>
          <div className="h-32"></div>
        </div>
      </div>
    </div>
  );
};

export default function BaoCaoThongKePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('Tháng 4/2026');
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const periods = [
    'Tháng 1/2026', 'Tháng 2/2026', 'Tháng 3/2026', 'Tháng 4/2026',
    'Quý 1/2026', 'Năm 2026'
  ];

  const currentData = mockDataByPeriod[selectedPeriod] || mockDataByPeriod['Tháng 4/2026'];

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

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Báo cáo hoạt động kinh doanh</h1>
            <div className="mt-3">
              <select
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-600 focus:border-blue-600 block w-full md:w-64 p-3 outline-none transition-all font-bold cursor-pointer hover:border-blue-300"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
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
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{currentData.summary.volume} <span className="text-sm text-slate-400 font-bold">Kg</span></h3>
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
            <div className="w-full h-80">
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
            </div>
          </div>
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">Cơ cấu Sản lượng</h3>
            <div className="w-full h-80">
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
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} Kg`, 'Sản lượng']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-700 font-bold text-sm ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {currentData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Không có dữ liệu trong kỳ này.</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ---------------- PRINT UI ---------------- */}
      <div id="print-container-parent" className="hidden">
        <div id="printable-report-wrapper" ref={printRef} className="p-8 bg-white">
          <PrintableReportTemplate selectedMonth={selectedPeriod} data={currentData} />
        </div>
      </div>

    </div>
  );
}
