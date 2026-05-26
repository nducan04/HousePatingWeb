'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Save, Calendar } from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
interface Customer {
  _id: string;
  TenKhachHang?: string;
  name?: string;
}
interface Contract {
  _id: string;
  MaHopDong: string;
  title?: string;
  NgayLap?: string;
  createdAt?: string;
  ChiTietHopDong?: {
    productName: string;
    colorCode?: string;
    quantity: number;
  }[];
}
interface Staff {
  _id: string;
  HoTen?: string;
  name?: string;
  BoPhan?: string;
  PhongBan?: string;
}
interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export default function SupportTicketModal({ isOpen, onClose, onSuccess }: SupportTicketModalProps) {
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [contractList, setContractList] = useState<Contract[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [ticketType, setTicketType] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedCustomer(''); setSelectedContract(''); setSelectedStaff('');
    setTicketType(''); setDescription(''); setDeadline(''); setError(null);
    onClose();
  };

  // 1. Fetch Master Data
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [customersRes, staffsRes] = await Promise.all([
          api.get('/khach-hang'),
          api.get('/nhan-vien')
        ]);
        const customers = customersRes.data;
        const staffs = staffsRes.data;
        setCustomerList(Array.isArray(customers.data) ? customers.data : Array.isArray(customers) ? customers : []);
        setStaffList(Array.isArray(staffs.data) ? staffs.data : Array.isArray(staffs) ? staffs : []);
      } catch (err: any) {
        setError('Không thể tải dữ liệu hệ thống. Vui lòng kiểm tra kết nối.');
        console.error('Lỗi tải master data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [isOpen]);

  // 2. Fetch Contracts khi chọn KH
  useEffect(() => {
    if (!selectedCustomer) {
      setContractList([]);
      setSelectedContract('');
      return;
    }

    const fetchContracts = async () => {
      try {
        const res = await api.get(`/contracts?customer=${selectedCustomer}`);
        const data = res.data;
        const contracts = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setContractList(contracts);

        if (contracts.length > 0) {
          const sorted = [...contracts].sort((a, b) => {
            const dateA = new Date(a.NgayLap || a.createdAt || 0).getTime();
            const dateB = new Date(b.NgayLap || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          setSelectedContract(sorted[0]._id);
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách hợp đồng', err);
      }
    };
    fetchContracts();
  }, [selectedCustomer]);

  // 3. Lọc nhân viên theo Phân loại Ticket
  const filteredStaffs = useMemo(() => {
    if (!ticketType) return [];

    return staffList.filter((staff) => {
      const dept = (staff.BoPhan || staff.PhongBan || '').toLowerCase();

      if (ticketType === 'Bảo hành' || ticketType === 'Đổi trả') {
        return dept.includes('kỹ thuật') || dept.includes('bảo hành') || dept.includes('sản xuất');
      }

      if (ticketType === 'Khiếu nại') {
        return dept.includes('kinh doanh') || dept.includes('cskh') || dept.includes('chăm sóc');
      }

      return true;
    });
  }, [staffList, ticketType]);

  useEffect(() => {
    setSelectedStaff('');
  }, [ticketType]);

  const selectedContractData = useMemo(() => {
    return contractList.find(c => c._id === selectedContract);
  }, [contractList, selectedContract]);

  const isExpired = useMemo(() => {
    if (!selectedContractData) return false;
    const dateToUse = selectedContractData.NgayLap || selectedContractData.createdAt;
    if (!dateToUse) return false;
    const contractDate = new Date(dateToUse);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - contractDate.getTime());
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
    return diffMonths > 24;
  }, [selectedContractData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setError('Đơn hàng này đã quá hạn 24 tháng. Yêu cầu đổi trả, bảo hành, khiếu nại không được hỗ trợ.');
      return;
    }
    if (!selectedCustomer || !ticketType || !description) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    // Validate deadline: không quá 7 ngày kể từ hiện tại
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const maxAllowed = new Date();
      maxAllowed.setDate(maxAllowed.getDate() + 7);
      if (deadlineDate > maxAllowed) {
        setError('Hạn xử lý không được vượt quá 1 tuần (7 ngày) kể từ ngày tạo yêu cầu.');
        return;
      }
      if (deadlineDate < new Date()) {
        setError('Hạn xử lý không được là thời điểm trong quá khứ.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        KhachHang: selectedCustomer,
        DonHang: selectedContract || null,
        LoaiYeuCau: ticketType,
        LyDo: description,
        DuKienDenHang: deadline || null,
        GiaTriTru: 0,
        MaDoiTra: `RET-${Date.now().toString().slice(-4)}`
      };

      const res = await api.post('/doi-tra', payload);

      if (res.status !== 201 && res.status !== 200) throw new Error('Tạo Ticket thất bại, vui lòng kiểm tra lại server.');

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Có lỗi xảy ra khi tạo ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Tạo Ticket Hỗ Trợ Mới</h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Đang tải dữ liệu hệ thống...</span>
            </div>
          ) : (
            <form id="ticket-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Khách hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => { setSelectedCustomer(e.target.value); setSelectedContract(''); }}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="" disabled>-- Chọn khách hàng --</option>
                    {customerList?.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.TenKhachHang || c.name || 'Khách hàng không tên'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Hợp đồng / Đơn hàng mới nhất</label>
                  <select
                    value={selectedContract}
                    onChange={(e) => setSelectedContract(e.target.value)}
                    disabled={true}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 shadow-sm focus:outline-none disabled:text-slate-500 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="" disabled>
                      {!selectedCustomer ? '-- Vui lòng chọn KH trước --' : (!contractList?.length ? '-- KH không có hợp đồng/đơn hàng --' : '-- Chọn hợp đồng liên quan --')}
                    </option>
                    {contractList?.map(contract => {
                      const cDate = contract.NgayLap || contract.createdAt;
                      const formattedDate = cDate ? new Date(cDate).toLocaleDateString('vi-VN') : '';
                      return (
                        <option key={contract._id} value={contract._id}>
                          {contract.MaHopDong} {contract.title ? `- ${contract.title}` : ''} {formattedDate ? `(${formattedDate})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedContractData && (
                  <div className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm mt-[-10px]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-semibold text-slate-800">Chi tiết đơn hàng: </span>
                        <span className="text-slate-600">{selectedContractData.MaHopDong}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">Ngày mua/ký: </span>
                        <span className="font-medium text-slate-700">
                          {selectedContractData.NgayLap || selectedContractData.createdAt ?
                            new Date(selectedContractData.NgayLap || selectedContractData.createdAt!).toLocaleDateString('vi-VN') :
                            'N/A'
                          }
                        </span>
                      </div>
                    </div>

                    {selectedContractData.ChiTietHopDong && selectedContractData.ChiTietHopDong.length > 0 ? (
                      <ul className="space-y-1.5 mt-2">
                        {selectedContractData.ChiTietHopDong.map((sp, idx) => (
                          <li key={idx} className="flex items-center text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            <span className="flex-1 truncate" title={sp.productName}>{sp.productName}</span>
                            {sp.colorCode && <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{sp.colorCode}</span>}
                            <span className="ml-3 font-medium">{sp.quantity} kg</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-400 italic mt-2">Chưa cập nhật chi tiết sản phẩm.</div>
                    )}

                    {isExpired && (
                      <div className="mt-4 p-3 bg-red-50 text-red-600 font-medium rounded-lg border border-red-100 text-sm flex items-start">
                        <span className="mr-2">⚠️</span>
                        Đơn hàng này đã mua/ký quá 24 tháng. Yêu cầu đổi trả, bảo hành, khiếu nại đối với đơn hàng này sẽ không được hệ thống hỗ trợ.
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Phân loại Ticket <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="" disabled>-- Chọn loại vấn đề --</option>
                    <option value="Bảo hành">🔧 Bảo hành</option>
                    <option value="Khiếu nại">📢 Khiếu nại</option>
                    <option value="Đổi trả">🔄 Đổi/Trả hàng</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Nhân viên phụ trách</label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    disabled={!ticketType}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="" disabled>
                      {!ticketType ? '-- Vui lòng phân loại ticket --' : (filteredStaffs.length === 0 ? '-- Không có NV phù hợp --' : '-- Chọn nhân viên xử lý --')}
                    </option>
                    {filteredStaffs.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.HoTen || staff.name} · {staff.BoPhan || staff.PhongBan}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Thời gian đến hạn xử lý yêu cầu
                    <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">≤ 7 ngày</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      max={(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 16); })()}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">⚠️ Hạn xử lý tối đa 7 ngày kể từ ngày tạo yêu cầu.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Mô tả chi tiết vấn đề <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Mô tả cụ thể vấn đề khách hàng đang gặp phải..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-900 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="ticket-form"
            disabled={isSubmitting || isLoading || isExpired}
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[130px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu Ticket
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
