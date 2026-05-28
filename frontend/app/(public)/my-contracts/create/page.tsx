'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, FileText, CheckCircle2,
  Package, ClipboardList, Eye, Building, CreditCard, Scale,
  ChevronLeft, ChevronRight, Loader2, Wallet, Printer, Download
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { paintColors } from '@/lib/data/colors-data';

interface ContractDetail {
  productName: string;
  colorCode: string;
  quantity: number;
  unitPrice: number;
  technicalReqs: string;
}

const DEFAULT_ARTICLES = {
  article1: "Bên B đồng ý mua và Bên A đồng ý bán các sản phẩm sơn Interpon theo danh mục đính kèm. Hàng hóa phải đảm bảo các tiêu chuẩn kỹ thuật của nhà sản xuất AkzoNobel.",
  article2: "Bên B đặt hàng qua hệ thống VTSC. Địa điểm giao hàng tại kho Bên B hoặc chân công trình. Thời gian giao hàng trong vòng 24-48h kể từ khi xác nhận đơn hàng.",
  article3: "Mọi thông tin trao đổi qua email chính thức hoặc văn bản có ký đóng dấu.",
  article4: "Khi nhận hàng, hai bên thực hiện kiểm đếm và ký biên bản giao nhận. Mọi khiếu nại về số lượng phải được báo ngay lúc nhận hàng.",
  article5: "Phương thức thanh toán chuyển khoản. Khách hàng thực hiện thanh toán theo đợt hoặc theo hạn mức tín dụng đã thỏa thuận.",
  article6: "Bên A có nghĩa vụ cung cấp hàng đúng chủng loại. Bên B có nghĩa vụ thanh toán đúng hạn và bảo quản hàng hóa đúng quy trình kỹ thuật.",
  article7: "Sản phẩm được bảo hành theo chính sách của AkzoNobel. Các lỗi do thi công sai quy trình sẽ không được bảo hành.",
  article8: "Các trường hợp thiên tai, hỏa hoạn, dịch bệnh được coi là bất khả kháng.",
  article9: "Bên vi phạm sẽ chịu mức phạt 8% giá trị phần hợp đồng bị vi phạm và bồi thường thiệt hại phát sinh.",
  article10: "Mọi tranh chấp sẽ được ưu tiên giải quyết qua thương lượng. Trường hợp không thành sẽ đưa ra Tòa án kinh tế có thẩm quyền.",
  article11: "Hợp đồng này có hiệu lực kể từ ngày ký và được lập thành 02 bản có giá trị pháp lý như nhau."
};

const EMPTY_DETAIL: ContractDetail = {
  productName: '',
  colorCode: '',
  quantity: 100,
  unitPrice: 150000,
  technicalReqs: ''
};

function CustomerCreateContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Pre-populated params from R&D
  const colorCode = searchParams ? searchParams.get('colorCode') || '' : '';
  const colorName = searchParams ? searchParams.get('colorName') || '' : '';
  const surface = searchParams ? searchParams.get('surface') || '' : '';
  const substrate = searchParams ? searchParams.get('substrate') || '' : '';
  const requirements = searchParams ? searchParams.get('requirements') || '' : '';
  const deadline = searchParams ? searchParams.get('deadline') || '' : '';

  // Form State
  const [contractId, setContractId] = useState('');
  const [title, setTitle] = useState('Hợp đồng nguyên tắc cung cấp sơn pha chế R&D');
  const [partyBTaxCode, setPartyBTaxCode] = useState('');
  const [partyBRepresentative, setPartyBRepresentative] = useState('');
  const [partyBPosition, setPartyBPosition] = useState('Đại diện mua hàng');
  const [partyBCompanyName, setPartyBCompanyName] = useState('');
  const [partyBPhoneNumber, setPartyBPhoneNumber] = useState('');
  const [partyBAddress, setPartyBAddress] = useState('');
  const [partyBBankAccount, setPartyBBankAccount] = useState('');
  const [partyBBankName, setPartyBBankName] = useState('');
  const [partyBBankAddress, setPartyBBankAddress] = useState('');
  const [slaDeadline, setSlaDeadline] = useState(deadline);

  // Chi tiết sản phẩm
  const [details, setDetails] = useState<ContractDetail[]>([
    {
      productName: `Sơn bột pha chế R&D - ${colorName || colorCode || 'Sơn đặc chủng'}`,
      colorCode: colorCode,
      quantity: 100,
      unitPrice: 150000,
      technicalReqs: [
        surface ? `Bề mặt: ${surface}` : '',
        substrate ? `Nền: ${substrate}` : '',
        requirements ? `Yêu cầu: ${requirements}` : ''
      ].filter(Boolean).join('. ')
    }
  ]);

  // 11 Điều khoản
  const [articles, setArticles] = useState({ ...DEFAULT_ARTICLES });

  // Auto-generate Contract ID on load
  useEffect(() => {
    const year = new Date().getFullYear();
    const rand = String(Math.floor(Math.random() * 9000) + 1000);
    setContractId(`VTSC-RND-${year}-${rand}`);
  }, []);

  // Pre-populate customer details from auth user
  useEffect(() => {
    if (user) {
      setPartyBCompanyName(user.profile?.TenKhachHang || user.profile?.HoTen || '');
      setPartyBRepresentative(user.profile?.HoTen || user.profile?.TenKhachHang || '');
      setPartyBAddress(user.profile?.DiaChi || '');
      setPartyBPhoneNumber(user.profile?.SoDienThoai || '');
      setPartyBTaxCode(user.profile?.MaSoThue || '');
    }
  }, [user]);

  // Fetch products
  useEffect(() => {
    api.get('/san-pham-son')
      .then(res => setAllProducts(res.data.data || []))
      .catch(err => console.error(err));
  }, []);

  const handlePrint = async () => {
    try {
      setIsExportingPDF(true);
      const element = document.getElementById('printable-contract');
      if (!element) return;
      
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       [10, 10, 10, 10] as [number, number, number, number],
        filename:     `HopDong_NguyenTac_${contractId || 'VTSC'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['css', 'legacy'] }
      };
      
      // html2pdf().output('blob') returns a Promise resolving to a Blob
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const totalValue = details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0);

  const addDetailRow = () => setDetails([...details, { ...EMPTY_DETAIL }]);
  const removeDetailRow = (index: number) => {
    if (details.length <= 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };
  const updateDetail = (index: number, field: keyof ContractDetail, value: any) => {
    const updated = [...details];
    (updated[index] as any)[field] = value;

    // Tự động lấy đơn giá chuẩn nếu khách hàng chọn Sản phẩm
    if (field === 'productName') {
      const selectedProduct = allProducts.find(p => p.TenDongSon === value);
      if (selectedProduct) {
        updated[index].unitPrice = selectedProduct.DonGiaCoSo || 0;
      }
    }

    setDetails(updated);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const data = {
        contractId,
        title,
        customer: user?.id || '', // Automatically resolved on backend if customer creates
        slaDeadline: slaDeadline || undefined,
        terms: {
          sla: `Giao hàng trong hạn SLA ${slaDeadline ? new Date(slaDeadline).toLocaleDateString('vi-VN') : 'thỏa thuận'}.`,
          penalty: "Phạt vi phạm trễ hạn 2% giá trị/ngày.",
          duration: "Hiệu lực kể từ ngày hai bên ký số on-chain."
        },
        chiTietHopDong: details.map(d => ({
          productName: d.productName,
          colorCode: d.colorCode,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          technicalReqs: d.technicalReqs
        })),
        partyBAddress,
        partyBPhoneNumber,
        partyBBankAccount,
        partyBBankName,
        partyBRepresentative,
        partyBPosition,
        articles
      };

      const res = await api.post('/contracts', data);
      if (res.data.success) {
        setSubmitSuccess(true);
        alert('🎉 Hợp đồng nguyên tắc của bạn đã được gửi thành công đến Admin VTSC để đối soát và điền thông tin Bên bán A!');
        setTimeout(() => {
          router.push('/my-contracts');
        }, 1500);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || err.message || 'Lỗi gửi hợp đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = title && partyBRepresentative && partyBAddress;
  const isStep2Valid = details.every(d => d.productName && d.quantity > 0 && d.unitPrice > 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold text-sm transition-all mb-6 no-underline">
          <ArrowLeft size={16} /> Quay lại Trang chủ
        </Link>

        {/* Stepper */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm mb-6 flex justify-around items-center">
          {[
            { step: 1, label: 'Thông tin Bên B', icon: Building },
            { step: 2, label: 'Sản phẩm & Giá', icon: Package },
            { step: 3, label: 'Điều khoản Hợp đồng', icon: ClipboardList },
            { step: 4, label: 'Xem trước & Gửi', icon: Eye }
          ].map(s => (
            <div key={s.step} className={`flex items-center gap-3 transition-opacity ${currentStep >= s.step ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition-all ${currentStep === s.step ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : currentStep > s.step ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                {currentStep > s.step ? '✓' : s.step}
              </div>
              <span className="text-xs font-bold hidden md:inline text-slate-700">{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Parties Info */}
        {currentStep === 1 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Building className="text-blue-600" size={24} />
              <div>
                <h2 className="text-lg font-black text-slate-800">Thông tin Bên Mua (Bên B)</h2>
                <p className="text-xs text-slate-400 font-medium">Vui lòng cung cấp chính xác để lập hợp đồng nguyên tắc pháp lý</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Tiêu đề hợp đồng *</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Mã số thuế bên mua</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBTaxCode} onChange={e => setPartyBTaxCode(e.target.value)} placeholder="0201137068" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Tên công ty</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBCompanyName} onChange={e => setPartyBCompanyName(e.target.value)} placeholder="Tên công ty" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Đại diện pháp lý bên mua *</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBRepresentative} onChange={e => setPartyBRepresentative(e.target.value)} placeholder="Tên người ký" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Chức vụ đại diện *</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBPosition} onChange={e => setPartyBPosition(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Số điện thoại bên mua *</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBPhoneNumber} onChange={e => setPartyBPhoneNumber(e.target.value)} placeholder="0987654321" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Địa chỉ trụ sở *</label>
                <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBAddress} onChange={e => setPartyBAddress(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Thời hạn hợp đồng</label>
                <input type="date" className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={slaDeadline} onChange={e => setSlaDeadline(e.target.value)} />
              </div>
            </div>

            {/* Bank details */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600" /> Tài khoản thanh toán Bên mua
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Số tài khoản ngân hàng</label>
                  <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBBankAccount} onChange={e => setPartyBBankAccount(e.target.value)} placeholder="1903..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Tại ngân hàng</label>
                  <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBBankName} onChange={e => setPartyBBankName(e.target.value)} placeholder="Techcombank" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase ml-1">Địa chỉ ngân hàng</label>
                  <input className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={partyBBankAddress} onChange={e => setPartyBBankAddress(e.target.value)} placeholder="Techcombank" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button disabled={!isStep1Valid} onClick={() => setCurrentStep(2)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-blue-200">
                Tiếp tục <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Product Specifications */}
        {currentStep === 2 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Package className="text-blue-600" size={24} />
                <div>
                  <h2 className="text-lg font-black text-slate-800">Chi tiết Hàng hóa / Sản phẩm</h2>
                  <p className="text-xs text-slate-400 font-medium">Bên B rà soát khối lượng và đơn giá thỏa thuận của mẻ pha chế</p>
                </div>
              </div>
              <button onClick={addDetailRow} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-[11px] cursor-pointer transition-all">
                <Plus size={14} /> Thêm dòng sản phẩm
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-black tracking-wider">
                    <th className="pb-3 w-8">#</th>
                    <th className="pb-3 px-2 w-64">Tên sản phẩm / Dòng sơn *</th>
                    <th className="pb-3 px-2 w-28">Mã màu *</th>
                    <th className="pb-3 px-2 w-28">
                      <select className="w-full bg-transparent border-none text-xs font-bold text-slate-800 outline-none">
                        <option>Khối lượng</option>
                        <option>Thùng</option>
                      </select>
                    </th>
                    <th className="pb-3 px-2 w-32">Đơn giá (đ) *</th>
                    <th className="pb-3 px-2 w-32">Thành tiền</th>
                    <th className="pb-3 px-2 w-32">Yêu cầu Kỹ thuật</th>
                    <th className="pb-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.map((d, i) => (
                    <tr key={i} className="align-middle">
                      <td className="py-4 font-bold text-slate-400">{i + 1}</td>
                      <td className="py-4 px-2">
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer" value={d.productName} onChange={e => updateDetail(i, 'productName', e.target.value)} required>
                          <option value="">-- Chọn sản phẩm --</option>
                          {allProducts.map(p => (
                            <option key={p._id} value={p.TenDongSon}>{p.TenDongSon}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-2">
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer" value={d.colorCode} onChange={e => updateDetail(i, 'colorCode', e.target.value)}>
                          <option value="">-- Mã màu --</option>
                          {paintColors.map(c => (
                            <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={d.quantity || ''} onChange={e => updateDetail(i, 'quantity', Number(e.target.value))} min={1} required />
                      </td>
                      <td className="py-4 px-2">
                        <input type="number" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 outline-none cursor-not-allowed" value={d.unitPrice || ''} readOnly title="Giá niêm yết không thể tự thay đổi" />
                      </td>
                      <td className="py-4 px-2 text-right font-black text-slate-900">
                        {(d.quantity * d.unitPrice).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-4 px-2">
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all" value={d.technicalReqs} onChange={e => updateDetail(i, 'technicalReqs', e.target.value)} placeholder="Độ bóng, độ bền"></textarea>
                      </td>
                      <td className="py-4 text-center">
                        <button disabled={details.length <= 1} onClick={() => removeDetailRow(i)} className="text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">TỔNG GIÁ TRỊ HỢP ĐỒNG TẠM TÍNH (ĐIỀU 1):</span>
              <span className="text-base font-black text-blue-600">{totalValue.toLocaleString('vi-VN')} VNĐ</span>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setCurrentStep(1)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all cursor-pointer">
                <ChevronLeft size={16} /> Quay lại
              </button>
              <button disabled={!isStep2Valid} onClick={() => setCurrentStep(3)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-blue-200">
                Tiếp tục <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Legal Articles */}
        {currentStep === 3 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Scale className="text-blue-600" size={24} />
              <div>
                <h2 className="text-lg font-black text-slate-800">11 Điều khoản Hợp đồng chuẩn</h2>
                <p className="text-xs text-slate-400 font-medium">Bên mua có quyền phê duyệt hoặc tinh chỉnh các điều khoản cho phù hợp</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
              {Object.keys(articles).map((key, idx) => {
                const articleTitles = [
                  "Hàng hóa & chất lượng", "Quy trình đặt hàng", "Thông tin liên lạc",
                  "Giao nhận hàng hóa", "Phương thức thanh toán", "Quyền và nghĩa vụ",
                  "Chế độ bảo hành", "Trường hợp bất khả kháng", "Trách nhiệm phạt vi phạm",
                  "Giải quyết tranh chấp", "Hiệu lực văn bản"
                ];

                return (
                  <div key={key} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center">#{idx + 1}</span>
                      <span className="text-xs font-black text-slate-800">Điều {idx + 1}: {articleTitles[idx]}</span>
                    </div>
                    <textarea className="w-full bg-white border border-slate-200/60 rounded-xl p-3 text-[11px] font-bold text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-y" rows={3} value={(articles as any)[key]} onChange={e => setArticles({ ...articles, [key]: e.target.value })} />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setCurrentStep(2)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all cursor-pointer">
                <ChevronLeft size={16} /> Quay lại
              </button>
              <button onClick={() => setCurrentStep(4)} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all cursor-pointer shadow-md shadow-blue-200">
                Xem trước Hợp đồng <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Contract Preview & Send */}
        {currentStep === 4 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Eye className="text-emerald-600" size={24} />
              <div>
                <h2 className="text-lg font-black text-slate-800">Xem trước văn bản pháp lý</h2>
                <p className="text-xs text-slate-400 font-medium">Bản in mô phỏng cấu trúc hợp đồng điện tử VTSC</p>
              </div>
            </div>

            {/* Simulated Paper Draft */}
            <div className="bg-slate-100/50 p-6 rounded-2xl max-h-[450px] overflow-y-auto border border-slate-200/40">
              <div id="printable-contract" style={{ background: '#fff', color: '#000', padding: '50px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', minHeight: '1000px', fontSize: '13px', lineHeight: '1.4', position: 'relative', fontFamily: 'Arial, Helvetica, sans-serif', width: '100%', maxWidth: '210mm', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>Độc lập — Tự do — Hạnh phúc</div>
                  <div style={{ marginTop: 5, fontSize: 11 }}>--- o0o ---</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#003399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SƠN</div>
                  <div style={{ fontStyle: 'italic', color: '#666', marginTop: 5 }}>Mã số (Smart Contract ID): {contractId}</div>
                </div>

                <p style={{ marginBottom: 20 }}>Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, chúng tôi gồm có:</p>

                {/* BÊN A */}
                <div style={{ marginBottom: 25 }}>
                  <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN BÁN / BÊN CUNG CẤP (BÊN A)</div>
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ marginBottom: 4 }}><b>Tên tổ chức:</b> CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO (VTSC)</div>
                    <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> Số 215 phố Lạch Tray, Quận Ngô Quyền, TP. Hải Phòng</div>
                    <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> 0201137068</div>
                    <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> Ông Phí Bình Minh — <b>Chức vụ:</b> Trưởng phòng kinh doanh sơn</div>
                    <div style={{ fontSize: 11, color: '#444', fontStyle: 'italic', marginTop: 3 }}><b>Ví Blockchain xác thực:</b> 0x0201020304050607080910111213141516171819</div>
                  </div>
                </div>

                {/* BÊN B */}
                <div style={{ marginBottom: 25 }}>
                  <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN MUA (BÊN B)</div>
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ marginBottom: 4 }}><b>Tên khách hàng:</b> {partyBCompanyName || partyBRepresentative || '...................................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> {partyBAddress || '......................................................................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> {partyBTaxCode || '................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Điện thoại:</b> {partyBPhoneNumber || '................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> {partyBRepresentative || '................................'} — <b>Chức vụ:</b> {partyBPosition || '................................'}</div>
                    {(partyBBankAccount || partyBBankName) && <div style={{ marginBottom: 4 }}><b>Tài khoản:</b> {partyBBankAccount || '................'} tại {partyBBankName || '................'}</div>}
                  </div>
                </div>

                <p style={{ fontWeight: 'bold', marginBottom: 15 }}>Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng với các điều khoản kèm theo Mã hash (IPFS/Blockchain) bên dưới:</p>

                <div style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                  <b style={{ color: '#003399' }}>Điều 1: Hàng hóa và Giá cả</b>
                  <p style={{ margin: '8px 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{articles.article1}</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, border: '1.5px solid #003399' }}>
                    <thead>
                      <tr style={{ background: '#f8faff' }}>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Sản phẩm / Dòng sơn</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Mã màu</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Số lượng</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Đơn giá</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #003399', padding: 8 }}>{it.productName}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>{it.colorCode || '—'}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'center' }}>{it.quantity} Kg</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>{it.unitPrice.toLocaleString('vi-VN')}đ</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{(it.quantity * it.unitPrice).toLocaleString('vi-VN')}đ</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8faff', fontWeight: 'bold' }}>
                        <td colSpan={4} style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>Tổng giá trị:</td>
                        <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right', color: '#003399' }}>
                          {totalValue.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Các điều khoản khác */}
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                  <div key={num} className="article-wrapper" style={{ marginBottom: 15, pageBreakInside: 'avoid' }}>
                    <b style={{ color: '#003399' }}>Điều {num}:</b>
                    <p style={{ marginTop: 5, fontSize: 12, whiteSpace: 'pre-wrap' }}>{(articles as any)[`article${num}`]}</p>
                  </div>
                ))}

                {/* Signatures */}
                <div className="signature-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, textAlign: 'center', pageBreakInside: 'avoid' }}>
                  <div style={{ width: '45%' }}>
                    <b style={{ color: '#003399' }}>ĐẠI DIỆN BÊN A</b>
                    <div style={{ fontSize: 10, color: '#666' }}>(Đã xác nhận on-chain)</div>
                    <div style={{ height: 80 }} />
                    <div style={{ color: '#003399', fontWeight: 900 }}>Phí Bình Minh</div>
                  </div>
                  <div style={{ width: '45%' }}>
                    <b style={{ color: '#003399' }}>ĐẠI DIỆN BÊN B</b>
                    <div style={{ fontSize: 10, color: '#666' }}>(Ký trực tiếp)</div>
                    <div style={{ height: 80 }} />
                    <div style={{ color: '#003399', fontWeight: 900 }}>{partyBRepresentative || '................................'}</div>
                  </div>
                </div>
              </div>
            </div>


            {submitError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600">
                ❌ Lỗi: {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600">
                ✅ Tạo hợp đồng thành công! Đang chuyển hướng đến trang ký số...
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100 no-print">
              <button onClick={() => setCurrentStep(3)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all cursor-pointer">
                <ChevronLeft size={16} /> Quay lại
              </button>
              <div className="flex items-center gap-2">
                <button disabled={isExportingPDF || isSubmitting || submitSuccess} onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50">
                  {isExportingPDF ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                  {isExportingPDF ? 'Đang xuất file...' : 'Xuất PDF'}
                </button>
                <button disabled={isSubmitting || submitSuccess} onClick={handleSubmit} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all cursor-pointer shadow-md shadow-emerald-200">
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin" size={16} /> Đang khởi tạo hợp đồng...</>
                  ) : (
                    <><FileText size={16} /> Gửi & Tạo Hợp đồng</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 5mm; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .no-print, button, a, footer, header, nav, aside { display: none !important; }
          
          html, body, #__next, main, div[style*="position: fixed"], .glass-card, div[style*="flex: 1"] {
            position: static !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #printable-contract {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 30px !important;
            background: white !important;
            color: black !important;
            visibility: visible !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
          }

          #printable-contract * { visibility: visible !important; }
          tr { page-break-inside: avoid; }
          .article-wrapper { page-break-inside: avoid; margin-bottom: 20px; }
          .signature-section { page-break-inside: avoid; margin-top: 50px; }
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}>
      <CustomerCreateContractPage />
    </Suspense>
  );
}
