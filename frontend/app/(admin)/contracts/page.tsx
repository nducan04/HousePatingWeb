'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Eye, FileSignature, TrendingUp, Handshake, ShieldCheck,
  Plus, Check, X, ChevronRight, ChevronLeft, Building, User, Mail,
  Phone, CreditCard, Package, Scale, ShieldAlert, History, Printer,
  FileText, ClipboardList, PenTool, Globe, Loader2
} from 'lucide-react';
import api from '@/lib/utils/axiosAuth';
import { useAuthStore } from '@/lib/store/authStore';

interface HopDong {
  _id: string;
  contractId: string;
  title: string;
  customer?: {
    _id: string;
    name: string;
    code: string;
    segment: string;
  } | null;
  value: number;
  status: string;
  createdAt: string;
  // New fields
  partyBAddress?: string;
  partyBTaxCode?: string;
  partyBBankAccount?: string;
  partyBBankName?: string;
  partyBRepresentative?: string;
  partyBPosition?: string;
  articles?: any;
}

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

export default function ContractsPage() {
  const { user } = useAuthStore();
  const isAdminOrEmployee = user?.role === 'Admin' || user?.role === 'NhanVien';

  const [data, setData] = useState<HopDong[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal & Wizard States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<any>({
    contractId: '',
    title: 'Hợp đồng nguyên tắc mua bán sơn VTSC-KSM',
    customer: '',
    clientAddress: '', // Wallet address
    partyBAddress: '',
    partyBTaxCode: '',
    partyBBankAccount: '',
    partyBBankName: '',
    partyBRepresentative: '',
    partyBPosition: '',
    chiTietHopDong: [],
    articles: { ...DEFAULT_ARTICLES }
  });

  const [newItem, setNewItem] = useState({
    productCode: '',
    productName: '',
    colorCode: '',
    quantity: 0,
    unitPrice: 0,
    technicalReqs: ''
  });

  useEffect(() => {
    fetchData();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/contracts');
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/khach-hang');
      if (res.data.success) setCustomers(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/san-pham-son?limit=1000');
      if (res.data.success) setProducts(res.data.data);
    } catch (error) {
      console.error('Lỗi tải danh mục sản phẩm sơn:', error);
    }
  };

  const openForm = () => {
    setFormData({
      contractId: 'VTSC-KSM-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 9000 + 1000),
      title: 'Hợp đồng nguyên tắc mua bán sơn VTSC-KSM',
      customer: '',
      clientAddress: '',
      partyBAddress: '',
      partyBTaxCode: '',
      partyBBankAccount: '',
      partyBBankName: '',
      partyBRepresentative: '',
      partyBPosition: '',
      chiTietHopDong: [],
      articles: { ...DEFAULT_ARTICLES }
    });
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find(c => c._id === customerId);
    if (cust) {
      setFormData({
        ...formData,
        customer: customerId,
        partyBAddress: cust.DiaChi || '',
        partyBTaxCode: cust.MaSoThue || '',
        clientAddress: cust.WalletAddress || '',
        partyBRepresentative: cust.NguoiDaiDien || ''
      });
    }
  };

  const viewContract = (item: any) => {
    setFormData({
      contractId: item.contractId || item.MaHopDong,
      title: item.title,
      customer: item.customer?._id || item.CustomerID?._id || item.CustomerID,
      clientAddress: item.clientAddress || '',
      partyBAddress: item.partyBAddress || '',
      partyBTaxCode: item.partyBTaxCode || '',
      partyBBankAccount: item.partyBBankAccount || '',
      partyBBankName: item.partyBBankName || '',
      partyBRepresentative: item.partyBRepresentative || '',
      partyBPosition: item.partyBPosition || '',
      chiTietHopDong: item.ChiTietHopDong || item.chiTietHopDong || [],
      articles: { ...DEFAULT_ARTICLES, ...(item.articles || {}) }
    });
    setCurrentStep(4);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const addProductItem = () => {
    if (!newItem.productName || newItem.quantity <= 0) return;
    setFormData({
      ...formData,
      chiTietHopDong: [...formData.chiTietHopDong, { ...newItem }]
    });
    setNewItem({ productCode: '', productName: '', colorCode: '', quantity: 0, unitPrice: 0, technicalReqs: '' });
  };

  const removeProductItem = (index: number) => {
    const updated = [...formData.chiTietHopDong];
    updated.splice(index, 1);
    setFormData({ ...formData, chiTietHopDong: updated });
  };

  const handleProductSelection = (code: string) => {
    const prod = products.find(p => p.MaSanPham === code);
    if (prod) {
      setNewItem({
        ...newItem,
        productCode: code,
        productName: prod.TenDongSon,
        unitPrice: prod.DonGiaCoSo || 0,
        colorCode: '' // Reset color when product changes
      });
    } else {
      setNewItem({ ...newItem, productCode: code });
    }
  };

  const getAllUniqueColors = () => {
    const allColors: any[] = [];
    const seen = new Set();
    products.forEach(p => {
      p.DanhSachMaMau?.forEach((c: any) => {
        if (!seen.has(c.MaMau)) {
          seen.add(c.MaMau);
          allColors.push(c);
        }
      });
    });
    return allColors;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/contracts', formData);
      if (res.data.success) {
        alert('Tạo hợp đồng thành công!');
        fetchData();
        setIsModalOpen(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Lỗi khi tạo hợp đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contractId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filter === 'all' ||
        (filter === 'active' && item.status === 'signed') ||
        (filter === 'pending' && item.status === 'draft') ||
        (filter === 'done' && item.status === 'completed');
      return matchSearch && matchFilter;
    });
  }, [data, searchTerm, filter]);

  const TOTAL_STATS = useMemo(() => ({
    count: data.length,
    active: data.filter(d => d.status === 'signed' || d.status === 'delivering').length,
    pending: data.filter(d => d.status === 'draft' || d.status === 'created').length,
    value: data.reduce((sum, d) => sum + d.value, 0)
  }), [data]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Background decoration removed as per prism removal request */}

      <div className="no-print" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
          Quản Lý Hợp Đồng Pháp Lý
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>Số hóa và quản lý điều khoản thương mại VTSC</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 no-print" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="kpi-card cyan">
          <div className="kpi-icon"><FileSignature size={22} /></div>
          <div className="kpi-label">Tổng Hợp Đồng</div>
          <div className="kpi-value">{TOTAL_STATS.count}</div>
        </div>
        <div className="kpi-card emerald">
          <div className="kpi-icon"><ShieldCheck size={22} /></div>
          <div className="kpi-label">Đang Hiệu Lực</div>
          <div className="kpi-value">{TOTAL_STATS.active}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-icon"><Handshake size={22} /></div>
          <div className="kpi-label">Chờ Ký Duyệt</div>
          <div className="kpi-value">{TOTAL_STATS.pending}</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon"><TrendingUp size={22} /></div>
          <div className="kpi-label">Giá Trị Đang Vận Hành</div>
          <div className="kpi-value">{(TOTAL_STATS.value / 1000000).toFixed(0)}M</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card no-print" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input type="text" className="form-input" placeholder="Tìm mã HĐ, tên khách hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ id: 'all', label: 'Tất cả' }, { id: 'active', label: 'Đang chạy' }, { id: 'pending', label: 'Bản nháp' }].map(f => (
                <button key={f.id} className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.id)}>{f.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={fetchData}><History size={16} /> Lịch sử</button>
            {isAdminOrEmployee && (
              <button onClick={openForm} className="btn btn-primary">
                <Plus size={16} /> Soạn Thảo Hợp Đồng Mới
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-none no-print" style={{ overflow: 'hidden', borderRadius: 0, marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Hợp Đồng</th>
              <th>Khách Hàng / Đối Tác</th>
              <th>Tổng Giá Trị</th>
              <th>Trạng Thái</th>
              <th>Ngày Khởi Tạo</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}><FileSignature className="animate-pulse" style={{ display: 'inline' }} /> Đang tải cơ sở dữ liệu pháp lý...</td></tr>
            ) : filteredData.map(item => (
              <tr key={item._id}>
                <td style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>#{item.contractId}</td>
                <td style={{ fontWeight: 600 }}>{item.customer?.name}</td>
                <td style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>{item.value.toLocaleString()} ₫</td>
                <td>
                  <span className={`badge ${['signed', 'completed'].includes(item.status) ? 'approved' : 'warning'}`}>
                    {item.status.toUpperCase()}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-sm" title="Xem chi tiết" onClick={() => viewContract(item)}><Eye size={16} /></button>
                    <button className="btn btn-ghost btn-sm" title="In hợp đồng" onClick={() => viewContract(item)}><Printer size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Advanced 4-Step Wizard Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)' }}>
          <div className="glass-card" style={{ width: '95%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', animation: 'slideUp 0.3s', background: 'var(--bg-card)' }}>

            {/* Modal Header */}
            <div className="no-print" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 10, background: 'var(--accent-cyan-soft)', borderRadius: '12px' }}><Scale className="text-[var(--accent-cyan)]" /></div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Soạn Thảo Hợp Đồng Nguyên Tắc</h3>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Mã số: {formData.contractId}</span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost"><X size={24} /></button>
            </div>

            {/* Stepper Indication */}
            <div className="no-print" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: 40, borderBottom: '1px solid var(--border-color)' }}>
              {[
                { step: 1, label: 'Bên B (Người mua)', icon: Building },
                { step: 2, label: 'Hàng hóa & Giá', icon: Package },
                { step: 3, label: '11 Điều khoản', icon: ClipboardList },
                { step: 4, label: 'Xem trước', icon: Eye }
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep === s.step ? 1 : 0.4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: currentStep >= s.step ? 'var(--accent-cyan)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                    {currentStep > s.step ? <Check size={14} /> : s.step}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

              {/* STEP 1: Parties Info */}
              {currentStep === 1 && (
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="glass-card" style={{ padding: 24, background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--accent-cyan)' }}><Globe size={18} /> Đại diện Bên B (Người Mua)</h4>
                    <div className="grid-2">
                      <div>
                        <label className="form-label">Chọn Khách hàng (Đối tác)</label>
                        <select className="form-input" style={{ width: '100%', background: 'var(--bg-input)' }} value={formData.customer} onChange={e => handleCustomerSelect(e.target.value)}>
                          <option value="">-- Chọn khách hàng --</option>
                          {customers.map(c => <option key={c._id} value={c._id}>{c.TenKhachHang} ({c.PhanLoai})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Tên Hợp đồng</label>
                        <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Mã số thuế</label>
                        <input type="text" className="form-input" value={formData.partyBTaxCode} onChange={e => setFormData({ ...formData, partyBTaxCode: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Người đại diện</label>
                        <input type="text" className="form-input" value={formData.partyBRepresentative} onChange={e => setFormData({ ...formData, partyBRepresentative: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Chức vụ</label>
                        <input type="text" className="form-input" placeholder="VD: Giám đốc" value={formData.partyBPosition} onChange={e => setFormData({ ...formData, partyBPosition: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Địa chỉ trụ sở</label>
                        <input type="text" className="form-input" value={formData.partyBAddress} onChange={e => setFormData({ ...formData, partyBAddress: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 24, background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--accent-purple)' }}><CreditCard size={18} /> Thông tin Thanh toán & Ví Số</h4>
                    <div className="grid-2">
                      <div>
                        <label className="form-label">Số tài khoản ngân hàng</label>
                        <input type="text" className="form-input" placeholder="1903..." value={formData.partyBBankAccount} onChange={e => setFormData({ ...formData, partyBBankAccount: e.target.value })} />
                      </div>
                      <div>
                        <label className="form-label">Tại ngân hàng</label>
                        <input type="text" className="form-input" placeholder="Techcombank..." value={formData.partyBBankName} onChange={e => setFormData({ ...formData, partyBBankName: e.target.value })} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Địa chỉ ví SmartContract (Tùy chọn cho B2B)</label>
                        <input type="text" className="form-input" placeholder="0x..." value={formData.clientAddress} onChange={e => setFormData({ ...formData, clientAddress: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Products Table */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--accent-cyan-soft)', background: 'rgba(2, 103, 255, 0.05)' }}>
                    <h4 style={{ marginBottom: '20px', fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Package size={22} className="text-[var(--accent-cyan)]" /> THÊM DÒNG HÀNG HÓA (ĐIỀU 1)
                    </h4>

                    {/* Premium Entry Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr 1fr 1.2fr auto', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
                      <div className="input-group-premium">
                        <label className="form-label-mini">Mã sản phẩm</label>
                        <div style={{ position: 'relative' }}>
                          <FileText size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                          <select
                            className="form-input-premium"
                            style={{ paddingLeft: 32, background: 'var(--bg-input)' }}
                            value={newItem.productCode}
                            onChange={e => handleProductSelection(e.target.value)}
                          >
                            <option value="">-- Chọn mã SP --</option>
                            {products.map(p => (
                              <option key={p._id} value={p.MaSanPham}>{p.MaSanPham} - {p.TenDongSon}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="input-group-premium">
                        <label className="form-label-mini">Tên hàng / Dòng sơn</label>
                        <div style={{ position: 'relative' }}>
                          <Package size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                          <input type="text" className="form-input-premium" placeholder="VD: Interpon D1036" value={newItem.productName} readOnly />
                        </div>
                      </div>
                      <div className="input-group-premium">
                        <label className="form-label-mini">Mã màu phối</label>
                        <div style={{ position: 'relative' }}>
                          <PenTool size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                          <input
                            type="text"
                            list="color-suggestions"
                            className="form-input-premium"
                            style={{ paddingLeft: 32 }}
                            placeholder="Chọn hoặc gõ mã..."
                            value={newItem.colorCode}
                            onChange={e => setNewItem({ ...newItem, colorCode: e.target.value })}
                          />
                          <datalist id="color-suggestions">
                            {(newItem.productCode
                              ? (products.find(p => p.MaSanPham === newItem.productCode)?.DanhSachMaMau || [])
                              : getAllUniqueColors()
                            ).map((c: any, idx: number) => (
                              <option key={`${c.MaMau}-${idx}`} value={c.MaMau}>{c.TenMau}</option>
                            ))}
                          </datalist>
                        </div>

                      </div>
                      <div className="input-group-premium">
                        <label className="form-label-mini">Số lượng (Kg)</label>
                        <input type="number" className="form-input-premium" placeholder="0" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                      </div>
                      <div className="input-group-premium">
                        <label className="form-label-mini">Đơn giá (VNĐ)</label>
                        <input type="number" className="form-input-premium" placeholder="0" value={newItem.unitPrice} onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })} />
                      </div>
                      <button onClick={addProductItem} className="btn-add-row">
                        <Plus size={20} /> THÊM DÒNG
                      </button>
                    </div>

                    <div style={{ padding: '0 5px' }}>
                      <label className="form-label-mini">Yêu cầu kỹ thuật đi kèm (Tùy chọn)</label>
                      <input type="text" className="form-input-premium" style={{ width: '100%' }} placeholder="VD: Chịu nhiệt cao, bền màu 10 năm..." value={newItem.technicalReqs} onChange={e => setNewItem({ ...newItem, technicalReqs: e.target.value })} />
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="glass-card" style={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}>
                    <table className="data-table">
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                          <th style={{ paddingLeft: 24 }}>Mã SP</th>
                          <th>Tên Hàng Hóa</th>
                          <th>Mã Màu</th>
                          <th>Số Lượng</th>
                          <th>Đơn Giá</th>
                          <th>Thành Tiền</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.chiTietHopDong.map((item: any, idx: number) => (
                          <tr key={idx} className="hover-row">
                            <td style={{ paddingLeft: 24, fontWeight: 700, color: 'var(--accent-cyan)', fontSize: 13 }}>{item.productCode || '---'}</td>
                            <td>
                              <div style={{ fontWeight: 800, fontSize: 14 }}>{item.productName}</div>
                              {item.technicalReqs && <div style={{ fontSize: 11, opacity: 0.5 }}>{item.technicalReqs}</div>}
                            </td>
                            <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-purple)' }}>{item.colorCode}</span></td>
                            <td><span style={{ fontWeight: 700 }}>{item.quantity}</span> <span style={{ opacity: 0.5 }}>Kg</span></td>
                            <td>{item.unitPrice.toLocaleString()} ₫</td>
                            <td><span style={{ fontWeight: 900, color: 'var(--accent-cyan)' }}>{(item.quantity * item.unitPrice).toLocaleString()}</span> ₫</td>
                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => removeProductItem(idx)}><X size={16} className="text-rose-500" /></button>
                            </td>
                          </tr>
                        ))}
                        {formData.chiTietHopDong.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.3, padding: 60, fontStyle: 'italic' }}>Chưa có sản phẩm nào cho Điều 1. Hãy điền form bên trên.</td></tr>
                        )}
                      </tbody>
                      {formData.chiTietHopDong.length > 0 && (
                        <tfoot>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700, padding: '16px 24px' }}>TỔNG GIÁ TRỊ DỰ KIÊN:</td>
                            <td style={{ fontWeight: 900, color: 'var(--accent-emerald)', fontSize: '1.2rem', padding: '16px 24px' }}>
                              {formData.chiTietHopDong.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0).toLocaleString()} ₫
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 3: Legal Articles */}
              {currentStep === 3 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '10px' }}>
                  {Object.keys(formData.articles).map((key, index) => {
                    const articleTitles = [
                      "Hàng hóa và chất lượng", "Giao nhận hàng", "Trao đổi thông tin", "Phương thức giao hàng",
                      "Thanh toán", "Quyền và nghĩa vụ", "Bảo hành sản phẩm", "Bất khả kháng",
                      "Phạt vi phạm", "Giải quyết tranh chấp", "Hiệu lực hợp đồng"
                    ];
                    return (
                      <div key={key} className="article-card-premium">
                        <div className="article-header">
                          <div className="article-number">#{index + 1}</div>
                          <div className="article-title">Điều {index + 1}: {articleTitles[index]}</div>
                        </div>
                        <div className="article-content-area">
                          <div style={{ fontSize: 11, marginBottom: 8, opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Nội dung chi tiết điều khoản:</div>
                          <textarea
                            className="article-textarea"
                            value={formData.articles[key]}
                            onChange={e => {
                              const newArticles = { ...formData.articles, [key]: e.target.value };
                              setFormData({ ...formData, articles: newArticles });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STEP 4: Final Preview */}
              {currentStep === 4 && (
                <div id="printable-contract" style={{ background: '#fff', color: '#000', padding: '50px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', minHeight: '1000px', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 13, color: '#333' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div style={{ fontWeight: 'bold', fontSize: 13 }}>Độc lập — Tự do — Hạnh phúc</div>
                    <div style={{ marginTop: 5, fontSize: 11 }}>--- o0o ---</div>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 30 }}>
                    <div style={{ fontWeight: 900, fontSize: 20, color: '#003399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SƠN</div>
                    <div style={{ fontStyle: 'italic', color: '#666', marginTop: 5 }}>Mã số (Smart Contract ID): {formData.contractId}</div>
                  </div>

                  <p style={{ marginBottom: 20 }}>Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, chúng tôi gồm có:</p>

                  {/* BÊN A */}
                  <div style={{ marginBottom: 25 }}>
                    <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN BÁN / BÊN CUNG CẤP (BÊN A)</div>
                    <div style={{ paddingLeft: 10 }}>
                      <div style={{ marginBottom: 4 }}><b>Tên tổ chức:</b> CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO</div>
                      <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> Số 215 phố Lạch Tray, Quận Ngô Quyền, TP. Hải Phòng</div>
                      <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> 0201137068</div>
                      <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> Ông Đặng Hồng Trường — <b>Chức vụ:</b> Giám đốc</div>
                      <div style={{ fontSize: 11, color: '#444', fontStyle: 'italic', marginTop: 3 }}><b>Ví Blockchain xác thực:</b> 0x0201020304050607080910111213141516171819</div>
                    </div>
                  </div>

                  {/* BÊN B */}
                  <div style={{ marginBottom: 25 }}>
                    <div style={{ fontWeight: 'bold', color: '#003399', fontSize: 15, borderBottom: '1px solid #003399', paddingBottom: 5, marginBottom: 10 }}>BÊN MUA / BÊN NHẬN (BÊN B)</div>
                    <div style={{ paddingLeft: 10 }}>
                      <div style={{ marginBottom: 4 }}><b>Tên tổ chức:</b> {formData.customer ? customers.find(c => c._id === formData.customer)?.TenKhachHang : '...................................................'}</div>
                      <div style={{ marginBottom: 4 }}><b>Địa chỉ:</b> {formData.partyBAddress || '......................................................................................'}</div>
                      <div style={{ marginBottom: 4 }}><b>Mã số thuế:</b> {formData.partyBTaxCode || '................................'}</div>
                      <div style={{ marginBottom: 4 }}><b>Người đại diện:</b> {formData.partyBRepresentative || '................................'} — <b>Chức vụ:</b> {formData.partyBPosition || '................................'}</div>
                      <div style={{ marginBottom: 4 }}><b>Tài khoản:</b> {formData.partyBBankAccount || '................................'} tại {formData.partyBBankName || '................................'}</div>
                      <div style={{ fontSize: 11, color: '#444', fontStyle: 'italic', marginTop: 3 }}><b>Ví Blockchain xác thực:</b> {formData.clientAddress || 'Chưa liên kết ví số'}</div>
                    </div>
                  </div>

                  <p style={{ fontWeight: 'bold', marginBottom: 15 }}>Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng với các điều khoản kèm theo Mã hash (IPFS/Blockchain) bên dưới:</p>

                  <div style={{ marginBottom: 20 }}>
                    <b style={{ color: '#003399' }}>Điều 1: Hàng hóa và giá cả:</b>
                    <p style={{ margin: '8px 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{formData.articles.article1 || 'Bên B đồng ý mua và Bên A đồng ý bán nội thất interpon Interpon theo danh mục đính kèm. Hàng hóa phải đảm bảo các tiêu chuẩn kỹ thuật.'}</p>
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
                        {formData.chiTietHopDong.map((it: any, i: number) => (
                          <tr key={i}>
                            <td style={{ border: '1px solid #003399', padding: 8 }}>{it.productCode ? `[${it.productCode}] ` : ''}{it.productName}</td>
                            <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'center', fontWeight: 'bold' }}>{it.colorCode}</td>
                            <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>{it.quantity}</td>
                            <td style={{ border: '1px solid #003399', padding: 8, textAlign: 'right' }}>{it.unitPrice.toLocaleString()} ₫</td>
                          </tr>
                        ))}
                        {formData.chiTietHopDong.length === 0 && (
                          <tr><td colSpan={4} style={{ border: '1px solid #003399', padding: 10, textAlign: 'center', opacity: 0.5 }}>Chưa có danh mục hàng hóa</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                    <div key={num} className="article-wrapper" style={{ marginBottom: 15 }}>
                      <b style={{ color: '#003399' }}>Điều {num}:</b>
                      <p style={{ marginTop: 5, fontSize: 12, whiteSpace: 'pre-wrap' }}>{formData.articles[`article${num}`]}</p>
                    </div>
                  ))}

                  <div className="signature-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 60, textAlign: 'center' }}>
                    <div style={{ width: '45%' }}>
                      <b style={{ color: '#003399' }}>ĐẠI DIỆN BÊN A</b>
                      <div style={{ fontSize: 10, color: '#666' }}>(Đã xác thực chữ ký điện tử)</div>
                      <div style={{ height: 80 }}></div>
                      <div style={{ color: '#003399', fontWeight: 900 }}>Đặng Hồng Trường</div>
                    </div>
                    <div style={{ width: '45%' }}>
                      <b style={{ color: '#003399' }}>ĐẠI DIỆN BÊN B</b>
                      <div style={{ fontSize: 10, color: '#666' }}>(Đã xác thực chữ ký điện tử)</div>
                      <div style={{ height: 80 }}></div>
                      <div style={{ color: '#003399', fontWeight: 900 }}>{formData.partyBRepresentative || '................................'}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 40, textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 20 }}>
                    <div style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>Hợp đồng này được khởi tạo và bảo đảm bảo tính bất biến bởi hệ thống VTSC Blockchain.</div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="no-print" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn btn-ghost"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                <ChevronLeft size={20} /> Quay lại
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                {currentStep === 4 && (
                  <button className="btn btn-ghost" onClick={handlePrint} style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Printer size={18} /> IN & XUẤT PDF
                  </button>
                )}
                {currentStep < 4 ? (
                  <button className="btn btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                    Tiếp theo <ChevronRight size={20} />
                  </button>
                ) : (
                  <button className="btn btn-primary" disabled={isSubmitting} style={{ background: 'var(--accent-emerald)', border: 'none' }} onClick={handleSubmit}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}XÁC NHẬN
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--text-secondary); }
        .form-label-mini { display: block; font-size: 11px; font-weight: 800; margin-bottom: 6px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
        .hover-row:hover { background: rgba(255,255,255,0.03); }
        
        .form-input-premium {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 12px 10px 32px;
          color: var(--text-primary);
          width: 100%;
          outline: none;
          transition: all 0.3s;
        }
        .form-input-premium:focus {
          border-color: var(--accent-cyan);
          background: rgba(0, 212, 255, 0.05);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
        }
        .btn-add-row {
          height: 44px;
          background: linear-gradient(135deg, var(--accent-cyan), #0066cc);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 20px;
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-add-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
        }
        
        @media print {
          @page { size: A4; margin: 5mm; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .no-print, .btn, .search-box, nav, aside, header, .topbar, .sidebar { display: none !important; }
          
          /* Force all containers to be visible and expandable */
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
            max-width: 210mm !important; /* Force A4 width */
            margin: 0 auto !important;
            padding: 30px !important; /* Reduced internal padding for wider text */
            background: white !important;
            color: black !important;
            visibility: visible !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
          }

          #printable-contract * { visibility: visible !important; }
          
          /* Page break optimization */
          tr { page-break-inside: avoid; }
          .article-wrapper { page-break-inside: avoid; margin-bottom: 20px; }
          .signature-section { page-break-inside: avoid; margin-top: 50px; }
        }
        
        .article-card-premium {
          background: var(--bg-card);
          border: 1px solid var(--border-color);   
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s;
        }
        .article-card-premium:hover {
          border-color: var(--accent-cyan-soft);
          background: rgba(2, 103, 255, 0.03);
        }
        .article-header {
          padding: 16px;
          background: var(--bg-primary);
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .article-number {
          background: var(--accent-cyan);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 11px;
        }
        .article-title {
          font-weight: 800;
          font-size: 14px;
          color: var(--text-primary);
        }
        .article-content-area {
          padding: 16px;
        }
        .article-textarea {
          width: 100%;
          min-height: 100px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          padding: 12px;
          font-size: 13px;
          line-height: 1.6;
          resize: none;
          outline: none;
          transition: border-color 0.3s;
        }
        .article-textarea:focus {
          border-color: var(--accent-cyan);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
