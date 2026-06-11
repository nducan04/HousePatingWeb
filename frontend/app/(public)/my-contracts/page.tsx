'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle2, Clock, XCircle, Search, Building, ArrowLeft, X, Download, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from '@/lib/utils/notification';
import { paintColors } from '@/lib/data/colors-data';

export default function MyContractsPage() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await api.get('/contracts');
        if (res.data.success) {
          setContracts(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách hợp đồng:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const handlePrint = async () => {
    try {
      setIsExportingPDF(true);
      const element = document.getElementById('printable-contract');
      if (!element) return;

      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `HopDong_NguyenTac_${selectedContract?.contractId || 'VTSC'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      toast.error('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
      case 'draft':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><Clock size={14} /> Chờ xác nhận</span>;
      case 'signed':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><CheckCircle2 size={14} /> Đã ký kết</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><CheckCircle2 size={14} /> Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><XCircle size={14} /> Đã hủy</span>;
      default:
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 font-bold rounded-lg text-[12px] flex items-center gap-1"><Clock size={14} /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button (Top Left) */}
        <Link href="/" className="absolute top-8 left-4 lg:left-8 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all z-10 shadow-sm cursor-pointer no-underline">
          <ArrowLeft size={16} /> Quay lại
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                <FileText size={20} />
              </div>
              Quản lý Hợp đồng của tôi
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Xem và theo dõi tiến độ các hợp đồng nguyên tắc bạn đã gửi yêu cầu.
            </p>
          </div>
          <Link href="/my-contracts/create" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-md shadow-blue-200 no-underline">
            + Tạo Hợp đồng mới
          </Link>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Mã Hợp đồng</th>
                  <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Tiêu đề</th>
                  <th className="py-4 px-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Ngày gửi</th>
                  <th className="py-4 px-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Tổng giá trị</th>
                  <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="py-4 px-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">Đang tải dữ liệu...</td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-bold">Bạn chưa tạo hợp đồng nào.</td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr key={contract._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">{contract.contractId}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-800">{contract.title}</div>
                        <div className="text-[11px] font-bold text-slate-400 mt-1">{contract.chiTietHopDong?.length || 0} sản phẩm</div>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-600">
                        {new Date(contract.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-4 text-right text-sm">
                        <div className="font-black text-blue-600">
                          {contract.value.toLocaleString('vi-VN')} đ
                        </div>
                        {contract.daThanhToan > 0 && (
                          <div className="text-[11px] font-bold text-emerald-600 mt-1">
                            Đã trả: {contract.daThanhToan.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                        {(contract.value - (contract.daThanhToan || 0)) > 0 && (
                          <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Còn lại: {(contract.value - (contract.daThanhToan || 0)).toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center flex justify-center">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-lg" onClick={() => setSelectedContract(contract)}>
                            <Eye size={14} /> Xem
                          </button>
                          {['signed', 'delivering'].includes(contract.status) && (contract.value - (contract.daThanhToan || 0)) > 0 && (
                            <Link
                              href={`/my-contracts/${contract._id}/payment`}
                              className="inline-flex items-center gap-1 text-xs font-black bg-[#A50064] text-white hover:bg-[#850050] transition-colors cursor-pointer px-3 py-2 rounded-lg border-none shadow-sm shadow-[#A50064]/10 no-underline"
                            >
                              <div className="w-3.5 h-3.5 rounded bg-white flex items-center justify-center text-[7px] font-black text-[#A50064]">M</div>
                              Thanh toán
                            </Link>
                          )}
                          {(contract.txHash || contract.status !== 'draft') && (
                            <Link
                              href={`/my-contracts/${contract._id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg no-underline"
                            >
                              <Shield size={14} /> Xem tính minh bạch
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-8 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800">Chi tiết Hợp đồng</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">Mã hợp đồng: {selectedContract.contractId}</p>
              </div>
              <div className="flex items-center gap-3">
                <button disabled={isExportingPDF} onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isExportingPDF ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  {isExportingPDF ? 'Đang xuất...' : 'Xuất PDF'}
                </button>
                <button onClick={() => setSelectedContract(null)} className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
              <div id="printable-contract" style={{ background: '#fff', color: '#000', padding: '50px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', minHeight: '1000px', fontSize: '13px', lineHeight: '1.4', position: 'relative', fontFamily: 'Arial, Helvetica, sans-serif', width: '100%', maxWidth: '210mm', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>Độc lập — Tự do — Hạnh phúc</div>
                  <div style={{ marginTop: 5, fontSize: 11 }}>--- o0o ---</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#003399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SƠN</div>
                  <div style={{ fontStyle: 'italic', color: '#666', marginTop: 5 }}>Mã số (Smart Contract ID): {selectedContract.contractId}</div>
                </div>

                <p style={{ marginBottom: 20 }}>Hôm nay, ngày {new Date(selectedContract.createdAt).getDate()} tháng {new Date(selectedContract.createdAt).getMonth() + 1} năm {new Date(selectedContract.createdAt).getFullYear()}, chúng tôi gồm có:</p>

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

                <div style={{ marginBottom: 25 }}>
                  <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN MUA (BÊN B)</div>
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ marginBottom: 4 }}><b>Tên khách hàng:</b> {selectedContract.partyBCompanyName || selectedContract.partyBRepresentative || user?.profile?.TenKhachHang || user?.profile?.HoTen || '...................................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> {selectedContract.partyBAddress || '......................................................................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> {selectedContract.partyBTaxCode || '................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Điện thoại:</b> {selectedContract.partyBPhoneNumber || '................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> {selectedContract.partyBRepresentative || '................................'} — <b>Chức vụ:</b> {selectedContract.partyBPosition || '................................'}</div>
                    {(selectedContract.partyBBankAccount || selectedContract.partyBBankName) && <div style={{ marginBottom: 4 }}><b>Tài khoản:</b> {selectedContract.partyBBankAccount || '................'} tại {selectedContract.partyBBankName || '................'}</div>}
                  </div>
                </div>

                <p style={{ fontWeight: 'bold', marginBottom: 15 }}>Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng với các điều khoản kèm theo Mã hash (IPFS/Blockchain) bên dưới:</p>

                <div style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                  <b style={{ color: '#003399' }}>Điều 1: Hàng hóa và Giá cả</b>
                  <p style={{ margin: '8px 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{selectedContract.articles?.article1 || "Bên B đồng ý mua và Bên A đồng ý bán các sản phẩm sơn Interpon theo danh mục đính kèm. Hàng hóa phải đảm bảo các tiêu chuẩn kỹ thuật của nhà sản xuất AkzoNobel."}</p>
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
                      {selectedContract.chiTietHopDong?.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #003399', padding: 8 }}>{it.productName}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>{it.colorCode} {paintColors.find(c => c.code === it.colorCode) ? `— ${paintColors.find(c => c.code === it.colorCode)?.name}` : ''}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'center' }}>{it.quantity}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>{(it.unitPrice || 0).toLocaleString('vi-VN')}đ</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString('vi-VN')}đ</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8faff', fontWeight: 'bold' }}>
                        <td colSpan={4} style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>Tổng giá trị:</td>
                        <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right', color: '#003399' }}>
                          {(selectedContract.value || 0).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => {
                  const defaultArticles = [
                    "", "",
                    "Bên B đặt hàng qua hệ thống VTSC. Địa điểm giao hàng tại kho Bên B hoặc chân công trình. Thời gian giao hàng trong vòng 24-48h kể từ khi xác nhận đơn hàng.",
                    "Mọi thông tin trao đổi qua email chính thức hoặc văn bản có ký đóng dấu.",
                    "Khi nhận hàng, hai bên thực hiện kiểm đếm và ký biên bản giao nhận. Mọi khiếu nại về số lượng phải được báo ngay lúc nhận hàng.",
                    "Phương thức thanh toán chuyển khoản. Khách hàng thực hiện thanh toán theo đợt hoặc theo hạn mức tín dụng đã thỏa thuận.",
                    "Bên A có nghĩa vụ cung cấp hàng đúng chủng loại. Bên B có nghĩa vụ thanh toán đúng hạn và bảo quản hàng hóa đúng quy trình kỹ thuật.",
                    "Sản phẩm được bảo hành theo chính sách của AkzoNobel. Các lỗi do thi công sai quy trình sẽ không được bảo hành.",
                    "Các trường hợp thiên tai, hỏa hoạn, dịch bệnh được coi là bất khả kháng.",
                    "Bên vi phạm sẽ chịu mức phạt 8% giá trị phần hợp đồng bị vi phạm và bồi thường thiệt hại phát sinh.",
                    "Mọi tranh chấp sẽ được ưu tiên giải quyết qua thương lượng. Trường hợp không thành sẽ đưa ra Tòa án kinh tế có thẩm quyền.",
                    "Hợp đồng này có hiệu lực kể từ ngày ký và được lập thành 02 bản có giá trị pháp lý như nhau."
                  ];
                  return (
                    <div key={num} className="article-wrapper" style={{ marginBottom: 15, pageBreakInside: 'avoid' }}>
                      <b style={{ color: '#003399' }}>Điều {num}:</b>
                      <p style={{ marginTop: 5, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                        {selectedContract.articles?.[`article${num}`] || defaultArticles[num]}
                      </p>
                    </div>
                  );
                })}

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
                    <div style={{ color: '#003399', fontWeight: 900 }}>{selectedContract.partyBRepresentative || '................................'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
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
      ` }} />
    </div>
  );
}
