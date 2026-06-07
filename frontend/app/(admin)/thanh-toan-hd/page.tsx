'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, DollarSign, Wallet, FileCheck, Landmark, Plus, X, Save, Edit } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

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
  const { user } = useAuthStore();
  const role = user?.role;
  const [data, setData] = useState<ThanhToanHD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DA_QUYET_TOAN' | 'CHO_THU' | 'KHACH_CHAM_TRA'>('ALL');

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contracts');
      if (res.data.success) {
        setContracts(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Lỗi khi lấy danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

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
    const matchFilter = filter === 'all' ||
      (filter === 'received' && item.trangThai === 'Đã Nhận') ||
      (filter === 'overdue' && item.trangThai === 'Quá Hạn') ||
      (filter === 'pending' && (item.trangThai === 'Chưa Thanh Toán' || item.trangThai === 'Đang Chờ Kế Toán'));
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p>Đang tải dữ liệu công nợ hợp đồng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full pb-10">
      
      {/* 1. Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4">
          <Landmark className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Tổng Dòng Tiền Đã Nhập Quỹ</div>
          <div className="text-2xl font-semibold text-slate-800">{formatTy(totalReceived)}</div>
        </div>
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4 pl-0 sm:pl-4">
          <DollarSign className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Dự Kiến Thu Về Hợp Đồng</div>
          <div className="text-2xl font-semibold text-slate-800">{formatTy(totalExpected)}</div>
        </div>
        <div className="flex flex-col gap-2 border-r border-slate-100 last:border-0 pr-4 pl-0 lg:pl-4">
          <FileText className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Số Đợt Chờ Thu</div>
          <div className="text-2xl font-semibold text-slate-800">{pendingTermsCount} Lần</div>
        </div>
        <div className="flex flex-col gap-2 pl-0 sm:pl-4 lg:pl-4">
          <AlertTriangle className="text-slate-500" size={24} />
          <div className="text-sm font-semibold text-slate-500">Giá Vốn Bị Kẹt Quá Hạn</div>
          <div className="text-2xl font-semibold text-slate-800">{formatTy(overdueDebt)}</div>
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
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pl-10"
                placeholder="Truy vấn số Hợp Đồng, Tên Đối Tác..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'received', label: 'Đã Quyết Toán' },
                { id: 'pending', label: 'Chờ Thu' },
                { id: 'overdue', label: 'Khách Chậm Trả' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer border-none no-underline px-3 py-1.5 rounded-lg text-xs ${filter === f.id ? 'btn-primary' : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                  onClick={() => setFilter(f.id)}
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-x-auto rounded-none" style={{ borderRadius: '1rem', marginTop: '1rem' }}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">ID Giao Dịch</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Mã Hợp Đồng</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Thương Hiệu Đối Tác</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Hạng Mục Cần Thu</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Số Tiền Đợt Này</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Hạn Thanh Toán</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Trạng Thái</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-blue-600">{item.id}</td>
                <td className="px-6 py-4 font-semibold text-slate-600">{item.hopDong}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{item.doiTac}</td>
                <td className="px-6 py-4">{item.dotThanhToan}</td>
                <td className="px-6 py-4 font-bold text-emerald-600">{item.soTien.toLocaleString()} ₫</td>
                <td className="px-6 py-4 font-semibold" style={{ color: item.trangThai === 'Quá Hạn' ? '#e11d48' : 'inherit' }}>{item.hanChot}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-medium tracking-wide border ${item.trangThai === 'Đã Nhận' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : item.trangThai === 'Quá Hạn' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {item.trangThai}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {canEdit && (
                      <button
                        title="Cập nhật thanh toán"
                        onClick={() => openUpdateModal(item)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    <button title="Xem chi tiết" className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy khoản thu nào
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  // Fake a long ID like in the picture just for UI matching, or use termId
                  const transactionId = `${item.contractId.replace('VTSC-', '')}-${item.termId.slice(0, 10)}...`;
                  
                  return (
                    <tr 
                      key={`${item.contractId}_${item.termId}`} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/thanh-toan-hd/${item.contractMongoId}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600 text-sm">{transactionId}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                        {item.contractId}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.termName}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600 text-sm">
                        {item.amount.toLocaleString()} ₫
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
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
