'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle2, Clock, XCircle, Search, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

const DEFAULT_ARTICLES = {
  article1: "Bên B đồng ý mua và Bên A đồng ý bán các sản phẩm sơn Interpon theo danh mục đính kèm. Hàng hóa phải đảm bảo các tiêu chuẩn kỹ thuật của nhà sản xuất AkzoNobel.",
  article2: "Bên B đặt hàng qua hệ thống VTSC. Địa điểm giao hàng tại kho Bên B hoặc chân công trình. Thời gian giao hàng trong vòng 24-48h kể từ khi xác nhận đơn hàng.",
  article3: "Mọi thông tin trao đổi qua email chính thức hoặc văn bản có ký đóng dấu.",
  article4: "Khi nhận hàng, hai bên thực hiện kiểm đếm và ký biên bản giao nhận. Mọi khiếu nại về số lượng phải được báo ngay lúc nhận hàng.",
  article5: "Phương thức thanh toán chuyển khoán. Khách hàng thực hiện thanh toán theo đợt hoặc theo hạn mức tín dụng đã thỏa thuận.",
  article6: "Bên A có nghĩa vụ cung cấp hàng đúng chủng loại. Bên B có nghĩa vụ thanh toán đúng hạn và bảo quản hàng hóa đúng quy trình kỹ thuật.",
  article7: "Sản phẩm được bảo hành theo chính sách của AkzoNobel. Các lỗi do thi công sai quy trình sẽ không được bảo hành.",
  article8: "Các trường hợp thiên tai, hỏa hoạn, dịch bệnh được coi là bất khả kháng.",
  article9: "Bên vi phạm sẽ chịu mức phạt 8% giá trị phần hợp đồng bị vi phạm và bồi thường thiệt hại phát sinh.",
  article10: "Mọi tranh chấp sẽ được ưu tiên giải quyết qua thương lượng. Trường hợp không thành sẽ đưa ra Tòa án kinh tế có thẩm quyền.",
  article11: "Hợp đồng này có hiệu lực kể từ ngày ký và được lập thành 02 bản có giá trị pháp lý như nhau."
};

export default function MyContractsPage() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);

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

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                      <td className="py-4 px-4 text-right text-sm font-black text-blue-600">
                        {contract.value.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-4 px-4 text-center flex justify-center">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-xl" onClick={() => setSelectedContract(contract)}>
                          <Eye size={14} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">{selectedContract.title}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">Mã HĐ: <span className="text-blue-600">{selectedContract.contractId}</span></p>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-0 overflow-y-auto flex-1 bg-slate-100/50">
              <div style={{ background: '#fff', color: '#000', padding: '50px', maxWidth: '800px', margin: '2rem auto', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontSize: '13px', lineHeight: '1.4' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>Độc lập — Tự do — Hạnh phúc</div>
                  <div style={{ marginTop: 5, fontSize: 11 }}>--- o0o ---</div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 30 }}>
                  <div style={{ fontWeight: 900, fontSize: 20, color: '#003399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SƠN</div>
                  <div style={{ fontStyle: 'italic', color: '#666', marginTop: 5 }}>Mã số (Smart Contract ID): {selectedContract.contractId}</div>
                </div>

                <p style={{ marginBottom: 20 }}>Hôm nay, ngày {new Date(selectedContract.createdAt || Date.now()).getDate()} tháng {new Date(selectedContract.createdAt || Date.now()).getMonth() + 1} năm {new Date(selectedContract.createdAt || Date.now()).getFullYear()}, chúng tôi gồm có:</p>

                {/* BÊN A */}
                <div style={{ marginBottom: 25 }}>
                  <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN BÁN / BÊN CUNG CẤP (BÊN A)</div>
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ marginBottom: 4 }}><b>Tên tổ chức:</b> CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO</div>
                    <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> Số 215 phố Lạch Tray, Quận Ngô Quyền, TP. Hải Phòng</div>
                    <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> 0201137068</div>
                    <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> Ông Phí Bình Minh — <b>Chức vụ:</b> Trưởng phòng kinh doanh sơn</div>
                    <div style={{ fontSize: 11, color: '#444', fontStyle: 'italic', marginTop: 3 }}><b>Ví Blockchain xác thực:</b> 0x0201020304050607080910111213141516171819</div>
                  </div>
                </div>

                {/* BÊN B */}
                <div style={{ marginBottom: 25 }}>
                  <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN MUA / BÊN NHẬN (BÊN B)</div>
                  <div style={{ paddingLeft: 10 }}>
                    <div style={{ marginBottom: 4 }}><b>Tên tổ chức:</b> {selectedContract.customer?.name || selectedContract.customer?.TenKhachHang || '...................................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> {selectedContract.partyBAddress || '......................................................................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> {selectedContract.partyBTaxCode || '................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> {selectedContract.partyBRepresentative || '................................'} — <b>Chức vụ:</b> {selectedContract.partyBPosition || '................................'}</div>
                    <div style={{ marginBottom: 4 }}><b>Tài khoản:</b> {selectedContract.partyBBankAccount || '................................'} tại {selectedContract.partyBBankName || '................................'}</div>
                  </div>
                </div>

                <p style={{ fontWeight: 'bold', marginBottom: 15 }}>Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng với các điều khoản kèm theo Mã hash (IPFS/Blockchain) bên dưới:</p>

                <div style={{ marginBottom: 20 }}>
                  <b style={{ color: '#003399' }}>Điều 1: Hàng hóa và giá cả:</b>
                  <p style={{ margin: '8px 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{(selectedContract.articles && selectedContract.articles.article1) || DEFAULT_ARTICLES.article1}</p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, border: '1.5px solid #003399' }}>
                    <thead>
                      <tr style={{ background: '#f8faff' }}>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Sản phẩm</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Mã màu</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Số lượng</th>
                        <th style={{ border: '1px solid #003399', padding: 8, fontSize: 12 }}>Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedContract.chiTietHopDong || []).map((it: any, i: number) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid #003399', padding: 8 }}>{it.productCode ? `[${it.productCode}] ` : ''}{it.productName}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>{it.colorCode}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>{it.quantity}</td>
                          <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>{it.unitPrice.toLocaleString()} ₫</td>
                        </tr>
                      ))}
                      {(!selectedContract.chiTietHopDong || selectedContract.chiTietHopDong.length === 0) && (
                        <tr><td colSpan={4} style={{ border: '1px solid #003399', padding: 10, textAlign: 'center', opacity: 0.5 }}>Chưa có danh mục hàng hóa</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                  <div key={num} className="article-wrapper" style={{ marginBottom: 15 }}>
                    <b style={{ color: '#003399' }}>Điều {num}:</b>
                    <p style={{ marginTop: 5, fontSize: 12, whiteSpace: 'pre-wrap' }}>{(selectedContract.articles && selectedContract.articles[`article${num}`]) || (DEFAULT_ARTICLES as any)[`article${num}`]}</p>
                  </div>
                ))}

                <div className="signature-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, textAlign: 'center' }}>
                  <div style={{ width: '45%' }}>
                    <b style={{ color: '#003399' }}>ĐẠI DIỆN BÊN A</b>
                    <div style={{ fontSize: 10, color: '#666' }}>(Đã xác thực chữ ký điện tử)</div>
                    <div style={{ height: 80 }}></div>
                    <div style={{ color: '#003399', fontWeight: 900 }}>Phí Bình Minh</div>
                  </div>
                  <div style={{ width: '45%' }}>
                    <b style={{ color: '#003399' }}>ĐẠI DIỆN BÊN B</b>
                    <div style={{ fontSize: 10, color: '#666' }}>{['signed', 'completed'].includes(selectedContract.status) ? '(Đã xác thực chữ ký điện tử)' : ''}</div>
                    <div style={{ height: 80 }}></div>
                    <div style={{ color: '#003399', fontWeight: 900 }}>{selectedContract.partyBRepresentative || '................................'}</div>
                  </div>
                </div>

                <div style={{ marginTop: 40, textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 20 }}>
                  <div style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>Hợp đồng này được khởi tạo và bảo đảm bảo tính bất biến bởi hệ thống VTSC Blockchain.</div>
                  {selectedContract.txHash && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>TxHash: {selectedContract.txHash}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors bg-white border border-slate-200 shadow-sm"
              >
                Đóng
              </button>

              {selectedContract.status === 'created' && (
                <Link href={`/my-contracts/${selectedContract._id}`} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2 no-underline">
                  <FileText size={16} /> Ký Hợp đồng ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
