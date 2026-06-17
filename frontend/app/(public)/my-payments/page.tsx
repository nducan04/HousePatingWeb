'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Eye, CreditCard, DollarSign, Wallet, FileCheck,
  CheckCircle2, XCircle, Clock, ArrowRight, Package, ArrowLeft, Printer
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '@/lib/utils/axiosAuth';
import { toast } from '@/lib/utils/notification';

const numberToVietnameseWords = (num: number): string => {
  if (num === 0) return "Không đồng chẵn";

  const units = ["", "nghìn", "triệu", "tỷ"];
  const digits = [
    "không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín",
  ];

  const readThreeDigits = (n: number, isFirst: boolean): string => {
    let temp = n;
    const hundred = Math.floor(temp / 100);
    temp %= 100;
    const ten = Math.floor(temp / 10);
    const unit = temp % 10;

    let res = "";
    if (hundred > 0 || !isFirst) {
      res += digits[hundred] + " trăm ";
    }
    if (ten > 0) {
      if (ten === 1) res += "mười ";
      else res += digits[ten] + " mươi ";
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }
    if (unit > 0) {
      if (unit === 1 && ten > 1) res += "mốt";
      else if (unit === 5 && ten > 0) res += "lăm";
      else if (unit === 5 && ten === 0) res += "năm";
      else res += digits[unit];
    }
    return res.trim();
  };

  let result = "";
  let tempNum = num;
  const groups: number[] = [];

  while (tempNum > 0) {
    groups.push(tempNum % 1000);
    tempNum = Math.floor(tempNum / 1000);
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0 || (i === 0 && groups.length === 1)) {
      const groupText = readThreeDigits(groups[i], i === groups.length - 1);
      if (groupText) {
        result += groupText + " " + units[i] + " ";
      }
    }
  }

  result = result.trim() + " đồng chẵn";
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const API_THANH_TOAN = '/payments/my-payments';

interface FinancialRecord {
  _id: string;
  type: 'ORDER' | 'CONTRACT';
  code: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  status: string;
  date: string;
}

export default function MyPaymentsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<FinancialRecord | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (selectedInvoice) {
      setLoadingDetails(true);
      const url = selectedInvoice.type === 'CONTRACT' ? `/contracts/${selectedInvoice._id}` : `/don-hang/${selectedInvoice._id}`;
      api.get(url).then(res => {
        setInvoiceDetails(res.data.data || res.data);
      }).catch(err => {
        console.error('Error fetching details:', err);
      }).finally(() => {
        setLoadingDetails(false);
      });
    } else {
      setInvoiceDetails(null);
    }
  }, [selectedInvoice]);

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

  const handlePayNow = (record: FinancialRecord) => {
    if (record.debtAmount <= 0) return;
    if (record.type === 'CONTRACT') {
      router.push(`/my-contracts/${record._id}/payment`);
    } else {
      router.push(`/checkout?orderId=${record._id}`);
    }
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HoaDon_${selectedInvoice.code}.pdf`);
      toast.success("Xuất hóa đơn PDF thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi xuất hóa đơn!");
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
    const matchSearch = item.code.toLowerCase().includes(q);
    const matchFilter = filter === 'all' ||
      (filter === 'order' && item.type === 'ORDER') ||
      (filter === 'contract' && item.type === 'CONTRACT') ||
      (filter === 'debt' && item.debtAmount > 0);
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/my-contracts" className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-black text-[#1c3c77] tracking-tight">Lịch sử Giao dịch & Thanh toán</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Theo dõi chi tiết thanh toán các đơn hàng và hợp đồng của bạn.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Tổng Doanh Thu / Mua Hàng */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-emerald-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tổng giá trị (HĐ + ĐH)
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.totalExpected.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 shadow-sm">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Card 2: Đã Thanh Toán */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-blue-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Đã Thanh Toán
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {STATS.totalPaid.toLocaleString()} <span className="text-xs font-bold text-slate-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        {/* Card 3: Công Nợ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150 bg-rose-500/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Số Tiền Chưa Thanh Toán
              </p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight">
                {STATS.totalDebt.toLocaleString()} <span className="text-xs font-bold text-rose-400 ml-0.5">₫</span>
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 shadow-sm">
              <CreditCard size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="relative w-full md:w-80 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1c3c77] transition-all font-medium"
                placeholder="Tra cứu mã HĐ, đơn..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'order', label: 'Đơn hàng lẻ' },
                { id: 'contract', label: 'Hợp đồng dự án' },
                { id: 'debt', label: 'Còn công nợ' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${filter === f.id
                      ? "bg-[#1c3c77] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
            onClick={fetchRecords}
          >
            <FileCheck size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Loại / Mã tham chiếu</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Tổng Giá Trị</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Đã Thanh Toán</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest text-rose-500">Còn Lại</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Trạng Thái</th>
                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-500 uppercase tracking-widest">Ngày Lập</th>
                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-[#1c3c77] font-bold">
                    Đang tải dữ liệu tài chính...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-400 font-medium italic">
                    Không tìm thấy dữ liệu giao dịch nào.
                  </td>
                </tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${item.type === 'ORDER' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        {item.type === 'ORDER' ? <Package size={18} /> : <FileCheck size={18} />}
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          {item.type === 'ORDER' ? 'ĐƠN HÀNG' : 'HỢP ĐỒNG'}
                        </div>
                        <div className="font-bold text-slate-900 text-[14px] whitespace-nowrap">
                          {item.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-[14px] whitespace-nowrap">
                    {item.totalAmount.toLocaleString()} ₫
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 text-[14px] whitespace-nowrap">
                    {item.paidAmount.toLocaleString()} ₫
                  </td>
                  <td className={`px-6 py-4 font-black text-[14px] whitespace-nowrap ${item.debtAmount > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                    {item.debtAmount === 0 ? '—' : `${item.debtAmount.toLocaleString()} ₫`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${item.debtAmount === 0
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : item.paidAmount > 0
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}
                    >
                      {item.debtAmount === 0 ? 'Đã Thanh Toán' : item.paidAmount > 0 ? 'Đang Thanh Toán' : 'Chưa Thanh Toán'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedInvoice(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer border border-blue-100"
                        title="Xem hóa đơn"
                      >
                        <Eye size={14} /> Chi tiết
                      </button>
                      {item.debtAmount > 0 ? (
                        <button
                          onClick={() => handlePayNow(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 font-bold text-xs transition-colors cursor-pointer border border-pink-100"
                        >
                          <CreditCard size={14} /> Thanh toán
                        </button>
                      ) : (
                        <span className="text-emerald-500 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100"><CheckCircle2 size={14} /> Hoàn tất</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#1c3c77] p-6 text-white relative">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  {selectedInvoice.type === 'ORDER' ? <Package size={28} className="text-white" /> : <FileCheck size={28} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-amber-400">CHI TIẾT HÓA ĐƠN</h2>
                  <p className="text-blue-100 text-sm mt-1">Mã: <span className="font-bold">{selectedInvoice.code}</span> • Lập ngày: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 flex-1 overflow-y-auto bg-slate-50">
              {loadingDetails ? (
                <div className="py-20 text-center text-slate-500 font-medium">Đang tải thông tin chi tiết...</div>
              ) : invoiceDetails ? (
                <div 
                  ref={invoiceRef}
                  style={{
                    backgroundColor: '#ffffff',
                    margin: '0 auto',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '40px',
                    color: '#000000',
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    maxWidth: '800px'
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    <div style={{ width: '55%' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO (VTSC)</div>
                      <div style={{ fontWeight: 'bold' }}>Mã số thuế: 0100100456</div>
                      <div>Địa chỉ: Số 215 Lạch Tray, Phường Gia Viên, Thành phố Hải Phòng</div>
                      <div>Điện thoại: 02226.676767 - Số tài khoản: 110000123456 tại VietinBank</div>
                    </div>
                    <div style={{ width: '45%', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#ff0000' }}>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>
                      <div>Mẫu số (Form): 1C26TAA</div>
                      <div>Ký hiệu (Serial): K26TBB</div>
                      <div style={{ fontWeight: 'bold', color: '#ff0000' }}>Số (No.): {selectedInvoice.code}</div>
                      <div style={{ fontStyle: 'italic' }}>Ngày (Date): {new Date(selectedInvoice.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' tháng ').replace(/^/, 'Ngày ').replace(/ tháng (\d{4})$/, ' năm $1')}</div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ whiteSpace: 'nowrap' }}>Họ tên người mua hàng: </div>
                      <div style={{ fontWeight: 'bold', marginLeft: '5px' }}>{selectedInvoice.type === 'ORDER' ? (invoiceDetails?.TenKhachHang || 'Khách hàng') : (invoiceDetails?.partyBRepresentative || invoiceDetails?.title || 'Khách hàng')}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ whiteSpace: 'nowrap' }}>Tên đơn vị (nếu có): </div>
                      <div style={{ marginLeft: '5px', borderBottom: '1px dotted #000', flex: 1 }}>{selectedInvoice.type === 'CONTRACT' ? (invoiceDetails?.title || '') : ''}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ whiteSpace: 'nowrap' }}>Mã số thuế (nếu có): </div>
                      <div style={{ marginLeft: '5px', borderBottom: '1px dotted #000', flex: 1 }}>{selectedInvoice.type === 'CONTRACT' ? (invoiceDetails?.partyBTaxCode || '') : ''}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ whiteSpace: 'nowrap' }}>Địa chỉ: </div>
                      <div style={{ marginLeft: '5px', borderBottom: '1px dotted #000', flex: 1 }}>{selectedInvoice.type === 'ORDER' ? (invoiceDetails?.DiaChiGiaoHang || 'Chưa cập nhật') : (invoiceDetails?.partyBAddress || 'Chưa cập nhật')}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <div style={{ whiteSpace: 'nowrap' }}>Hình thức thanh toán: </div>
                      <div style={{ marginLeft: '5px', borderBottom: '1px dotted #000', flex: 1 }}>Chuyển khoản / Tiền mặt</div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr>
                        {['STT', 'Tên hàng hóa / dịch vụ', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Thành tiền'].map((h, i) => (
                          <th key={i} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.type === 'ORDER' && invoiceDetails?.Items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{item.TenSanPham}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.SanPham?.DonViTinh || 'Thùng'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.SoLuong}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{item.DonGia?.toLocaleString('vi-VN')} đ</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{(item.DonGia * item.SoLuong).toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ))}
                      {selectedInvoice.type === 'CONTRACT' && (
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>Thanh toán theo hợp đồng số {selectedInvoice.code}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Lần</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{selectedInvoice.totalAmount?.toLocaleString('vi-VN')} đ</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{selectedInvoice.totalAmount?.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Summary */}
                  <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ fontWeight: 'bold', textAlign: 'right', flex: 1, marginRight: '20px' }}>Cộng tiền hàng (Total Net Amount):</div>
                      <div style={{ width: '150px', textAlign: 'right' }}>{((selectedInvoice.totalAmount || 0) - (selectedInvoice.type === 'ORDER' ? (invoiceDetails?.TienThue || 0) : 0)).toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ fontWeight: 'bold', textAlign: 'right', flex: 1, marginRight: '20px' }}>Thuế suất GTGT (VAT Rate): {selectedInvoice.type === 'ORDER' && invoiceDetails?.TienThue > 0 ? '8%' : '0%'}    Tiền thuế GTGT (VAT Amount):</div>
                      <div style={{ width: '150px', textAlign: 'right' }}>{(selectedInvoice.type === 'ORDER' ? (invoiceDetails?.TienThue || 0) : 0).toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ fontWeight: 'bold', textAlign: 'right', flex: 1, marginRight: '20px' }}>Tổng cộng tiền thanh toán (Total Gross Amount):</div>
                      <div style={{ width: '150px', textAlign: 'right', fontWeight: 'bold' }}>{selectedInvoice.totalAmount?.toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div style={{ fontStyle: 'italic', textAlign: 'right', marginTop: '10px' }}>
                      Số tiền viết bằng chữ: {numberToVietnameseWords(selectedInvoice.totalAmount || 0)}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                    <div style={{ textAlign: 'center', width: '50%' }}>
                      <div style={{ fontWeight: 'bold' }}>NGƯỜI MUA HÀNG</div>
                      <div style={{ fontStyle: 'italic', fontSize: '13px' }}>(Ký, ghi rõ họ tên)</div>
                    </div>
                    <div style={{ textAlign: 'center', width: '50%' }}>
                      <div style={{ fontWeight: 'bold' }}>NGƯỜI BÁN HÀNG</div>
                      <div style={{ fontStyle: 'italic', fontSize: '13px', marginBottom: '10px' }}>(Ký điện tử bởi: CÔNG TY CP TMDV VOSCO - VTSC)</div>
                      <div style={{ border: '2px solid #059669', padding: '10px', display: 'inline-block', borderRadius: '5px' }}>
                        <div style={{ fontWeight: 'bold', color: '#059669' }}>✓ Ký bởi: CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO</div>
                        <div style={{ color: '#059669' }}>Ngày ký: {new Date(selectedInvoice.date).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-rose-500 font-medium">Không thể tải chi tiết.</div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold hover:bg-emerald-100 transition-colors flex-1"
              >
                <Printer size={18} /> Tải PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 px-4 py-3 rounded-xl text-slate-600 bg-slate-50 border border-slate-200 font-bold hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
              {selectedInvoice.debtAmount > 0 && (
                <button
                  onClick={() => {
                    handlePayNow(selectedInvoice);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-bold transition-colors flex justify-center items-center gap-2 shadow-sm shadow-blue-200"
                >
                  <CreditCard size={18} /> Thanh toán
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
