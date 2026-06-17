'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, DollarSign, Wallet, FileCheck, Landmark, Plus, X, Save, Edit, FileText, AlertTriangle } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Types
interface HopDongData {
  _id: string;
  contractId: string;
  value: number;
  daThanhToan: number;
  NgayLap?: string;
  createdAt?: string;
  customer?: { _id: string; name?: string } | null;
  partyBRepresentative?: string;
  employee?: { _id: string; name?: string } | null;
  status: string;
}

interface ThanhToanHD {
  id: string;
  contractId: string;
  hopDong: string;
  doiTac: string;
  dotThanhToan: string;
  soTien: number;
  hanChot: string;
  nhanVien: string;
  trangThai: 'Đã Nhận' | 'Đang Chờ Kế Toán' | 'Chưa Thanh Toán' | 'Quá Hạn';
  rawDate: Date;
  rawTotal: number;
  rawPaid: number;
}

export default function ThanhToanHopDongPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const role = user?.role;
  const [data, setData] = useState<ThanhToanHD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');



  useEffect(() => {
    fetchContracts();
  }, []);

  // 1. Flatten the data: One row per Payment Term
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Modals state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ThanhToanHD | null>(null);
  const [updateAmount, setUpdateAmount] = useState<number | string>('');

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderContent, setReminderContent] = useState('');

  const canEdit = role === 'Admin' || role === 'NhanVien';

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contracts');
      if (res.data.success) {
        const contracts: HopDongData[] = res.data.data;
        const installments: ThanhToanHD[] = [];

        contracts.forEach(c => {
          const total = c.value || 0;
          const paid = c.daThanhToan || 0;
          const date = new Date(c.NgayLap || c.createdAt || Date.now());

          const partnerName = c.customer?.name || c.partyBRepresentative || 'Không rõ';
          const employeeName = c.employee?.name || 'Chưa phân công';
          const contractCode = c.contractId || 'Chưa có mã';

          // Đợt 1 (30%)
          const dot1Tien = total * 0.3;
          const dot1Han = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
          let dot1Status: any = 'Chưa Thanh Toán';
          if (paid >= dot1Tien) dot1Status = 'Đã Nhận';
          else if (dot1Han < new Date()) dot1Status = 'Quá Hạn';

          installments.push({
            id: `${contractCode}-${c._id}-D1`,
            contractId: c._id,
            hopDong: contractCode,
            doiTac: partnerName,
            dotThanhToan: 'Đợt 1 (30% Cọc)',
            soTien: dot1Tien,
            hanChot: dot1Han.toLocaleDateString('vi-VN'),
            nhanVien: employeeName,
            trangThai: dot1Status,
            rawDate: dot1Han,
            rawTotal: total,
            rawPaid: paid
          });

          // Đợt 2 (40%)
          const dot2Tien = total * 0.4;
          const dot2Han = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
          let dot2Status: any = 'Chưa Thanh Toán';
          if (paid >= (dot1Tien + dot2Tien)) dot2Status = 'Đã Nhận';
          else if (dot2Han < new Date() && paid >= dot1Tien) dot2Status = 'Quá Hạn';

          installments.push({
            id: `${contractCode}-${c._id}-D2`,
            contractId: c._id,
            hopDong: contractCode,
            doiTac: partnerName,
            dotThanhToan: 'Đợt 2 (Theo Tiến độ)',
            soTien: dot2Tien,
            hanChot: dot2Han.toLocaleDateString('vi-VN'),
            nhanVien: employeeName,
            trangThai: dot2Status,
            rawDate: dot2Han,
            rawTotal: total,
            rawPaid: paid
          });

          // Đợt 3 (30%)
          const dot3Tien = total * 0.3;
          const dot3Han = new Date(date.getTime() + 60 * 24 * 60 * 60 * 1000);
          let dot3Status: any = 'Chưa Thanh Toán';
          if (paid >= total) dot3Status = 'Đã Nhận';
          else if (dot3Han < new Date() && paid >= (dot1Tien + dot2Tien)) dot3Status = 'Quá Hạn';

          installments.push({
            id: `${contractCode}-${c._id}-D3`,
            contractId: c._id,
            hopDong: contractCode,
            doiTac: partnerName,
            dotThanhToan: 'Đợt 3 (Quyết Toán)',
            soTien: dot3Tien,
            hanChot: dot3Han.toLocaleDateString('vi-VN'),
            nhanVien: employeeName,
            trangThai: dot3Status,
            rawDate: dot3Han,
            rawTotal: total,
            rawPaid: paid
          });
        });

        installments.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        setData(installments);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleUpdatePayment = async () => {
    if (!selectedItem || updateAmount === '') return;
    try {
      // Gọi API PATCH /payments/contract/:id như BRD
      const res = await api.patch(`/payments/contract/${selectedItem.contractId}`, {
        paidAmount: Number(updateAmount)
      });
      if (res.data.success) {
        setIsUpdateModalOpen(false);
        fetchContracts();
      }
    } catch (error) {
      console.error('Update payment failed:', error);
      alert('Cập nhật thanh toán thất bại!');
    }
  };

  const openUpdateModal = (item: ThanhToanHD) => {
    setSelectedItem(item);
    setUpdateAmount(item.rawPaid); // Hiển thị số tiền đã trả hiện tại của toàn hợp đồng
    setIsUpdateModalOpen(true);
  };

  const openReminder = () => {
    const overdueList = data.filter(d => d.trangThai === 'Quá Hạn');
    if (overdueList.length === 0) {
      alert('Không có đợt thanh toán nào quá hạn để nhắc nợ.');
      return;
    }
    const overdue = overdueList[0]; // Mặc định lấy cái đầu tiên
    const template = `Kính gửi đối tác ${overdue.doiTac},\n\nChúng tôi xin thông báo về khoản thanh toán thuộc hợp đồng ${overdue.hopDong}.\n- Hạng mục: ${overdue.dotThanhToan}\n- Số tiền tương ứng: ${overdue.soTien.toLocaleString()} VNĐ\n- Hạn chót: ${overdue.hanChot}\n\nHiện tại khoản thanh toán này đã quá hạn so với tiến độ cam kết. Kính mong quý công ty sắp xếp thanh toán sớm để đảm bảo tiến độ công việc.\n\nTrân trọng,\nKế Toán VTSC PaintPro`;
    setReminderContent(template);
    setIsReminderModalOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reminderContent);
    alert('Đã sao chép nội dung vào khay nhớ tạm!');
    setIsReminderModalOpen(false);
  };

  const STATS = {
    totalExpected: data.reduce((sum, d) => sum + d.soTien, 0),
    totalReceived: data.filter(d => d.trangThai === 'Đã Nhận').reduce((sum, d) => sum + d.soTien, 0),
    totalOverdue: data.filter(d => d.trangThai === 'Quá Hạn').reduce((sum, d) => sum + d.soTien, 0),
    pendingItems: data.filter(d => d.trangThai === 'Chưa Thanh Toán' || d.trangThai === 'Đang Chờ Kế Toán').length,
  };

  const filteredData = data.filter(item => {
    const matchSearch = (item.hopDong || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.doiTac || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = activeTab === 'ALL' ||
      (activeTab === 'DA_QUYET_TOAN' && item.trangThai === 'Đã Nhận') ||
      (activeTab === 'KHACH_CHAM_TRA' && item.trangThai === 'Quá Hạn') ||
      (activeTab === 'CHO_THU' && (item.trangThai === 'Chưa Thanh Toán' || item.trangThai === 'Đang Chờ Kế Toán'));
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Đã Nhận':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Đã Nhận</span>;
      case 'Đang Chờ Kế Toán':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Đang Chờ Kế Toán</span>;
      case 'Chưa Thanh Toán':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Chưa Thanh Toán</span>;
      case 'Quá Hạn':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">Quá Hạn</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p>Đang tải dữ liệu công nợ hợp đồng...</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => (val || 0).toLocaleString('vi-VN') + ' đ';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      
      {/* 1. Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4">
          <Landmark className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Tổng Dòng Tiền Đã Nhập Quỹ</div>
          <div className="text-2xl font-semibold text-slate-800">{formatCurrency(STATS.totalReceived)}</div>
        </div>
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4 pl-0 sm:pl-4">
          <DollarSign className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Dự Kiến Thu Về Hợp Đồng</div>
          <div className="text-2xl font-semibold text-slate-800">{formatCurrency(STATS.totalExpected)}</div>
        </div>
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4 pl-0 lg:pl-4">
          <FileText className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Số Đợt Chờ Thu</div>
          <div className="text-2xl font-semibold text-slate-800">{STATS.pendingItems} Lần</div>
        </div>
        <div className="flex flex-col gap-2 pl-0 sm:pl-4 lg:pl-4">
          <AlertTriangle className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Giá Vốn Bị Kẹt Quá Hạn</div>
          <div className="text-2xl font-semibold text-slate-800">{formatCurrency(STATS.totalOverdue)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.125rem' }}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Truy vấn số Hợp Đồng, Tên Đối Tác..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'DA_QUYET_TOAN', label: 'Đã Quyết Toán' },
                { id: 'CHO_THU', label: 'Chờ Thu' },
                { id: 'KHACH_CHAM_TRA', label: 'Khách Chậm Trả' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${activeTab === f.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                  onClick={() => setActiveTab(f.id as any)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={openReminder}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <Plus size={16} /> Lập Phiếu Nhắc Nợ
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã Giao Dịch</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hợp Đồng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đối Tác</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hạng Mục</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Số Tiền</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hạn Chót</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const transactionId = `${item.hopDong.replace('VTSC-', '')}-${item.id.split('-').pop()}`;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => openUpdateModal(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600 text-sm">{transactionId}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                        {item.hopDong}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.doiTac}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.dotThanhToan}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 text-sm">
                        {item.soTien.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.hanChot || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.trangThai)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/hop-dong-pha-che/${item.contractId}`);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết hợp đồng"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/thanh-toan-hd/${item.contractId}`);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Thanh toán / Quản lý công nợ"
                          >
                            <Wallet size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cập Nhật Thanh Toán Modal */}
      {isUpdateModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Cập nhật thanh toán Hợp đồng</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 text-sm text-slate-600">
                <p>Hợp đồng: <strong>{selectedItem.hopDong}</strong></p>
                <p>Đối tác: <strong>{selectedItem.doiTac}</strong></p>
                <p>Tổng giá trị HĐ: <strong>{selectedItem.rawTotal.toLocaleString()} ₫</strong></p>
                <p className="mt-2 text-rose-500 text-xs italic">* Vui lòng nhập SỐ TỔNG TIỀN ĐÃ TRẢ cộng dồn của Hợp đồng này cho đến thời điểm hiện tại.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Số tiền đã trả hiện tại (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    value={updateAmount}
                    onChange={(e) => setUpdateAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdatePayment}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save size={16} /> Lưu Cập Nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lập Phiếu Nhắc Nợ Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Lập Phiếu Nhắc Nợ (Template)</h3>
              <button onClick={() => setIsReminderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-3">Bạn có thể chỉnh sửa nội dung bên dưới, sau đó sao chép để gửi email hoặc Zalo cho đối tác.</p>
              <textarea
                className="w-full h-48 bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                value={reminderContent}
                onChange={(e) => setReminderContent(e.target.value)}
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsReminderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Sao Chép Nội Dung
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
