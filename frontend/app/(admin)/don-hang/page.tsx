'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Download, Printer, Trash2, Plus, Phone, Banknote, Building, FileText, ArrowLeft, Layers, Thermometer, Ruler, FileCheck, ClipboardList, Calculator,
    Search, Filter, Eye, CheckCircle, Truck, Package, XCircle, MoreHorizontal, ChevronDown, Calendar, User, MapPin, CreditCard, Clock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '@/lib/utils/axiosAuth';
import { paintColors } from '@/lib/data/colors-data';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/lib/store/authStore';

const API_DON_HANG = '/don-hang';

interface OrderItem {
    SanPham: any;
    TenSanPham: string;
    MaMau: string;
    SoLuong: number;
    DonGia: number;
    ThanhTien: number;
}

interface Order {
    _id: string;
    MaDonHang: string;
    KhachHang: {
        _id: string;
        MaKH: string;
        TenKhachHang: string;
        SDT: string;
        DiaChi: string;
    };
    Items: OrderItem[];
    TongTien: number;
    TrangThai: 'CHO_XAC_NHAN' | 'DANG_XU_LY' | 'DANG_GIAO' | 'DA_GIAO' | 'DA_HUY';
    PhuongThucThanhToan: string;
    TrangThaiThanhToan: string;
    DiaChiGiaoHang: string;
    HanXacNhan: string;
    createdAt: string;
    GhiChu?: string;
    // New fields
    TongDienTichSon?: number;
    PhuPhi?: number;
    DaCoc?: number;
    TechnicalSpecs?: {
        LoaiBot: string;
        NhietDoSay: string;
        DoDayLopPhu: string;
    };
    KhuyenMai?: KhuyenMai;
    GiamGia?: number;
    NhanVienPhuTrach?: {
        _id: string;
        MaNV: string;
        HoTen: string;
    };
}

interface KhuyenMai {
    _id: string;
    MaVoucher: string;
    LoaiGiamGia: 'PHAN_TRAM' | 'GIAM_THANG' | 'TANG_KEM';
    MucGiam: number;
    GiamToiDa: number;
    DonHangToiThieu: number;
    TrangThai: string;
}

interface KhachHang {
    _id: string;
    MaKH: string;
    TenKhachHang: string;
    SDT: string;
    DiaChi: string;
    PhanLoai?: string;
}

interface Driver {
    _id: string;
    HoTen: string;
    SDT: string;
    BoPhan: string;
}

interface MaMauSon {
    _id: string;
    MaMau: string;
    TenMau: string;
    HexCode?: string;
    TrangThai: boolean;
}

interface SanPham {
    _id: string;
    MaSanPham: string;
    TenDongSon: string;
    DonGiaCoSo: number;
    TonKho: number;
    HinhAnh?: string;
    DanhSachMaMau?: MaMauSon[];
}

interface NewOrderItem {
    sanPhamId: string;
    tenSanPham: string;
    soLuong: number;
    donGia: number;
    tonKho: number;
    maMau: string;
    tenMau: string;
    hexCode: string;
}

export default function OrderManagementPage() {
    const { user } = useAuthStore();
    const isAdminOrEmployee = user?.role === 'Admin' || user?.role === 'NhanVien';

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Create Order Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [customers, setCustomers] = useState<KhachHang[]>([]);
    const [allProducts, setAllProducts] = useState<SanPham[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [orderItems, setOrderItems] = useState<NewOrderItem[]>([]);
    const [diaChiGiaoHang, setDiaChiGiaoHang] = useState('');
    const [sdtNguoiNhan, setSdtNguoiNhan] = useState('');
    const [phuongThucTT, setPhuongThucTT] = useState('TIEN_MAT');
    const [ghiChu, setGhiChu] = useState('');

    // New Technical & Financial states for creation
    const [tongDienTichSon, setTongDienTichSon] = useState(1);
    const [phuPhi, setPhuPhi] = useState(0);
    const [daCoc, setDaCoc] = useState(0);
    const [loaiBot, setLoaiBot] = useState('AkzoNobel Interpon');
    const [nhietDoSay, setNhietDoSay] = useState('195°C / 15 phút');
    const [doDayLopPhu, setDoDayLopPhu] = useState('75 µm');
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedColorCode, setSelectedColorCode] = useState('');
    const [colorSearchTerm, setColorSearchTerm] = useState('');
    const [selectedSalespersonId, setSelectedSalespersonId] = useState('');
    const [allStaff, setAllStaff] = useState<any[]>([]);

    // Driver Selection states
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: string } | null>(null);

    // Promotion states
    const [promotions, setPromotions] = useState<KhuyenMai[]>([]);
    const [selectedPromotionId, setSelectedPromotionId] = useState('');
    const [calculatedDiscount, setCalculatedDiscount] = useState(0);

    // Paint Calculator states
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [calcUnit, setCalcUnit] = useState<'m' | 'ft'>('m');
    const [calcWalls, setCalcWalls] = useState<any[]>([{ id: Date.now(), length: '', height: '' }]);
    const [calcDeductions, setCalcDeductions] = useState<any[]>([]);

    // Payment Modal states
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState(0);

    // Refs for PDF printing
    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchOrders();
        fetchCustomers();
        fetchProducts();
        fetchDrivers();
        fetchPromotions();
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get('/nhan-vien');
            if (res.data.success) {
                setAllStaff(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách nhân sự:', error);
        }
    };

    const fetchPromotions = async () => {
        try {
            const res = await api.get('/khuyen-mai');
            if (res.data.success) {
                // Only active ones
                setPromotions(res.data.data.filter((p: any) => p.TrangThai === 'DANG_DIEN_RA'));
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách khuyến mãi:', error);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await api.get('/nhan-vien');
            if (res.data.success) {
                // Filter for Logistics/Warehouse/Shipping departments & Delivery/Technical Staff
                const eligibleDrivers = res.data.data.filter((nv: any) =>
                    (nv.BoPhan === 'Kho / Logistics' || nv.BoPhan === 'Kho' || nv.BoPhan === 'Logistic' || nv.BoPhan === 'Vận tải' || nv.BoPhan === 'Giao nhận') &&
                    (nv.ChucVu === 'Nhân viên giao hàng' || nv.ChucVu === 'Tài xế' || nv.ChucVu === 'Nhân viên kỹ thuật' || nv.ChucVu === 'Trưởng bộ phận kho / logistic' || nv.BoPhan === 'Vận tải' || nv.BoPhan === 'Giao nhận')
                );
                setDrivers(eligibleDrivers);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách tài xế:', error);
        }
    };

    const exportToPDF = async (type: 'COC' | 'HOA_DON') => {
        if (!selectedOrder || !printRef.current) return;
        setIsPrinting(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`${type}_${selectedOrder.MaDonHang}.pdf`);
        } catch (error) {
            console.error('Lỗi in ấn:', error);
            alert('Có lỗi xảy ra khi tạo file PDF');
        } finally {
            setIsPrinting(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${API_DON_HANG}?status=${activeTab}`);
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/khach-hang');
            if (res.data.success) setCustomers(res.data.data);
        } catch (err) { console.error(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/san-pham-son');
            if (res.data.success) setAllProducts(res.data.data);
        } catch (err) { console.error(err); }
    };

    const openCreateModal = () => {
        fetchCustomers();
        fetchProducts();
        setSelectedCustomerId('');
        setOrderItems([]);
        setDiaChiGiaoHang('');
        setSdtNguoiNhan('');
        setPhuongThucTT('TIEN_MAT');
        setGhiChu('');
        setSelectedProductId('');
        setSelectedColorCode('');
        setColorSearchTerm('');
        setSelectedPromotionId('');
        setCalculatedDiscount(0);
        setIsCreateModalOpen(true);
    };

    // Paint Calculator logic
    const handleAddCalcWall = () => {
        setCalcWalls([...calcWalls, { id: Date.now(), length: '', height: '' }]);
    };
    const handleAddCalcDeduction = () => {
        setCalcDeductions([...calcDeductions, { id: Date.now(), length: '', height: '' }]);
    };
    const handleRemoveCalcItem = (id: number, type: 'wall' | 'deduction') => {
        if (type === 'wall') {
            if (calcWalls.length > 1) setCalcWalls(calcWalls.filter(w => w.id !== id));
        } else {
            setCalcDeductions(calcDeductions.filter(d => d.id !== id));
        }
    };
    const updateCalcItem = (id: number, field: string, value: string, type: 'wall' | 'deduction') => {
        if (type === 'wall') {
            setCalcWalls(calcWalls.map(w => w.id === id ? { ...w, [field]: value } : w));
        } else {
            setCalcDeductions(calcDeductions.map(d => d.id === id ? { ...d, [field]: value } : d));
        }
    };

    const calculatedResult = useMemo(() => {
        let wallArea = calcWalls.reduce((sum, w) => sum + (Number(w.length) * Number(w.height) || 0), 0);
        let deductionArea = calcDeductions.reduce((sum, d) => sum + (Number(d.length) * Number(d.height) || 0), 0);

        if (calcUnit === 'ft') {
            wallArea = wallArea * 0.092903; // sq ft to sq m
            deductionArea = deductionArea * 0.092903;
        }

        const totalArea = Math.max(0, wallArea - deductionArea);
        const liters = (totalArea * 2) / 12.3; // 2 coats, coverage 12.3m2/L

        return {
            area: Math.round(totalArea * 100) / 100,
            liters: Math.round(liters * 10) / 10
        };
    }, [calcWalls, calcDeductions, calcUnit]);

    const handleSelectCustomer = (id: string) => {
        setSelectedCustomerId(id);
        const kh = customers.find(c => c._id === id);
        if (kh) {
            setDiaChiGiaoHang(kh.DiaChi || '');
            setSdtNguoiNhan(kh.SDT || '');

            // Recalculate existing items' unit price based on the selected customer's classification
            let factor = 1.0;
            if (kh.PhanLoai === 'B2B') factor = 1.2;
            else if (kh.PhanLoai === 'B2C') factor = 1.3;

            setOrderItems(prevItems => prevItems.map(item => {
                const sp = allProducts.find(p => p._id === item.sanPhamId);
                const basePrice = sp ? sp.DonGiaCoSo : item.donGia;
                return {
                    ...item,
                    donGia: basePrice * factor
                };
            }));
        }
    };

    const handleAddProduct = () => {
        if (!selectedProductId) return;
        const sp = allProducts.find(p => p._id === selectedProductId);
        if (!sp) return;
        if (sp.TonKho <= 0) { alert('Sản phẩm hết hàng'); return; }

        if (!selectedColorCode) return alert('Vui lòng chọn mã màu sơn');

        const color = paintColors.find(c => c.code === selectedColorCode);
        const chosenMaMau = color?.code || selectedColorCode;
        const chosenTenMau = color?.name || selectedColorCode;
        const chosenHex = color?.hex || '#888888';

        const uniqueKey = `${sp._id}_${chosenMaMau}`;
        if (orderItems.find(i => `${i.sanPhamId}_${i.maMau}` === uniqueKey)) {
            alert('Sản phẩm với mã màu này đã có trong danh sách');
            return;
        }

        const kh = customers.find(c => c._id === selectedCustomerId);
        let factor = 1.0;
        if (kh?.PhanLoai === 'B2B') factor = 1.2;
        else if (kh?.PhanLoai === 'B2C') factor = 1.3;

        setOrderItems([...orderItems, {
            sanPhamId: sp._id,
            tenSanPham: sp.TenDongSon,
            soLuong: 1,
            donGia: sp.DonGiaCoSo * factor,
            tonKho: sp.TonKho,
            maMau: chosenMaMau,
            tenMau: chosenTenMau,
            hexCode: chosenHex
        }]);
        setSelectedProductId('');
        setSelectedColorCode('');
        setColorSearchTerm('');
    };

    const handleRemoveItem = (idx: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== idx));
    };

    const handleItemQtyChange = (idx: number, qty: number) => {
        if (qty < 1) return;
        const item = orderItems[idx];
        if (qty > item.tonKho) { alert(`Tối đa ${item.tonKho} thùng`); return; }
        const updated = [...orderItems];
        updated[idx] = { ...item, soLuong: qty };
        setOrderItems(updated);
    };

    const orderSubtotal = orderItems.reduce((s, i) => s + i.donGia * i.soLuong, 0);

    // Calculate discount when items or promotion changes
    useEffect(() => {
        if (!selectedPromotionId) {
            setCalculatedDiscount(0);
            return;
        }

        const promo = promotions.find(p => p._id === selectedPromotionId);
        if (!promo) {
            setCalculatedDiscount(0);
            return;
        }

        if (orderSubtotal < promo.DonHangToiThieu) {
            setCalculatedDiscount(0);
            return;
        }

        let discount = 0;
        if (promo.LoaiGiamGia === 'PHAN_TRAM') {
            discount = (orderSubtotal * promo.MucGiam) / 100;
            if (promo.GiamToiDa > 0 && discount > promo.GiamToiDa) discount = promo.GiamToiDa;
        } else if (promo.LoaiGiamGia === 'GIAM_THANG') {
            discount = promo.MucGiam;
        }
        setCalculatedDiscount(discount);
    }, [selectedPromotionId, orderSubtotal, promotions]);

    const handleCreateOrder = async () => {
        if (!selectedCustomerId) return alert('Vui lòng chọn khách hàng');
        if (orderItems.length === 0) return alert('Vui lòng thêm ít nhất 1 sản phẩm');
        if (!diaChiGiaoHang) return alert('Vui lòng nhập địa chỉ giao hàng');
        if (!sdtNguoiNhan) return alert('Vui lòng nhập số điện thoại người nhận');

        setIsSubmittingOrder(true);
        try {
            const maDH = `DH${Date.now().toString().slice(-8)}`;
            const items = orderItems.map(i => ({
                SanPham: i.sanPhamId,
                TenSanPham: i.tenSanPham,
                MaMau: i.maMau,
                SoLuong: i.soLuong,
                DonGia: i.donGia,
                ThanhTien: i.donGia * i.soLuong
            }));

            const res = await api.post(API_DON_HANG, {
                MaDonHang: maDH,
                KhachHang: selectedCustomerId,
                NhanVienPhuTrach: selectedSalespersonId || undefined,
                Items: items,
                TongTien: orderSubtotal + phuPhi - calculatedDiscount,
                GiamGia: calculatedDiscount,
                khuyenMaiId: selectedPromotionId || undefined,
                TrangThai: 'CHO_XAC_NHAN',
                PhuongThucThanhToan: phuongThucTT,
                TrangThaiThanhToan: 'CHUA_THANH_TOAN',
                DiaChiGiaoHang: diaChiGiaoHang,
                GhiChu: ghiChu ? `SĐT nhận: ${sdtNguoiNhan} | ${ghiChu}` : `SĐT nhận: ${sdtNguoiNhan}`,
                // New fields
                TongDienTichSon: tongDienTichSon,
                PhuPhi: phuPhi,
                DaCoc: daCoc,
                TechnicalSpecs: {
                    LoaiBot: loaiBot,
                    NhietDoSay: nhietDoSay,
                    DoDayLopPhu: doDayLopPhu
                }
            });

            if (res.data.success) {
                alert(`Tạo đơn hàng thành công! Mã đơn: ${maDH}`);
                setIsCreateModalOpen(false);
                fetchOrders();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi tạo đơn hàng');
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string, driverId?: string) => {
        // If switching to DANG_GIAO and no driver provided yet, open picker
        if (status === 'DANG_GIAO' && !driverId) {
            setPendingStatusUpdate({ id, status });
            setIsDriverModalOpen(true);
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái ${status}?`)) return;

        try {
            const payload: any = { status };
            if (driverId) {
                payload.taiXeId = driverId;
                const driver = drivers.find(d => d._id === driverId);
                if (driver) payload.sdtTaiXe = driver.SDT;
            }

            const res = await api.patch(`${API_DON_HANG}/${id}/status`, payload);
            if (res.data.success) {
                alert('Cập nhật trạng thái thành công!');
                fetchOrders();
                setIsDriverModalOpen(false);
                setSelectedDriverId('');
                setPendingStatusUpdate(null);
                if (selectedOrder?._id === id) {
                    setIsDetailsModalOpen(false);
                }
            }
        } catch (error: any) {
            console.error('Update status error:', error);
            alert(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
        }
    };

    const handleUpdateDeposit = async () => {
        if (!selectedOrder) return;
        try {
            const res = await api.patch(`${API_DON_HANG}/${selectedOrder._id}/deposit`, { amount: depositAmount });
            if (res.data.success) {
                alert('Cập nhật tiền cọc thành công!');
                setIsPaymentModalOpen(false);
                fetchOrders();
                // Update local selectedOrder to reflect changes if modal is open
                setSelectedOrder({ ...selectedOrder, DaCoc: depositAmount });
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Lỗi cập nhật tiền cọc');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
        try {
            await api.delete(`${API_DON_HANG}/${id}`);
            alert('Đã xóa đơn hàng');
            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.MaDonHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.KhachHang?.TenKhachHang?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        const dataToExport = filteredOrders.map(order => ({
            'Mã Đơn Hàng': order.MaDonHang,
            'Khách Hàng': order.KhachHang?.TenKhachHang || 'Vãng lai',
            'SĐT': order.KhachHang?.SDT || '',
            'Số Lượng SP': order.Items?.reduce((acc, curr) => acc + curr.SoLuong, 0) || 0,
            'Tổng Tiền': order.TongTien,
            'Ghi Chú': order.GhiChu || '',
            'Ngày Tạo': new Date(order.createdAt).toLocaleString(),
            'Hạn Xác Nhận': new Date(order.HanXacNhan).toLocaleString(),
            'Trạng Thái': STATUS_MAP[order.TrangThai as keyof typeof STATUS_MAP]?.label || order.TrangThai
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Don-Hang");
        XLSX.writeFile(workbook, `VTSC_Danh_Sach_Don_Hang_${new Date().toLocaleDateString().replace(/\//g, '_')}.xlsx`);
    };

    const STATUS_MAP = {
        'CHO_XAC_NHAN': { label: 'Chờ xác nhận', color: '#d97706', icon: Clock },
        'DANG_XU_LY': { label: 'Đang xử lý', color: '#2563eb', icon: Package },
        'DANG_GIAO': { label: 'Đang vận chuyển', color: '#7c3aed', icon: Truck },
        'DA_GIAO': { label: 'Đã giao hàng', color: '#059669', icon: CheckCircle },
        'DA_HUY': { label: 'Đã hủy', color: '#e11d48', icon: XCircle },
    };

    const TABS = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
        { key: 'DANG_XU_LY', label: 'Đang xử lý' },
        { key: 'DANG_GIAO', label: 'Đang vận chuyển' },
        { key: 'DA_GIAO', label: 'Đã giao hàng' },
        { key: 'DA_HUY', label: 'Đã hủy' },
    ];

    const PAYMENT_METHODS = [
        { key: 'TIEN_MAT', label: 'Tiền mặt', icon: Banknote },
        { key: 'CHUYEN_KHOAN', label: 'Chuyển khoản', icon: Building },
        { key: 'GHI_NO', label: 'Ghi nợ', icon: FileText },
    ];

    return (
        <div className="order-page" style={{ padding: '1.75rem' }}>
            {/* Header Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.125rem', marginBottom: '2.25rem' }}>
                {TABS.slice(1).map(tab => {
                    const count = orders.filter(o => o.TrangThai === tab.key).length;
                    const statusInfo = STATUS_MAP[tab.key as keyof typeof STATUS_MAP];
                    const Icon = statusInfo.icon;
                    return (
                        <div key={tab.key} className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.125rem', borderLeft: `4px solid ${statusInfo.color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 4 }}>{tab.label}</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{count}</div>
                                </div>
                                <Icon size={24} style={{ color: statusInfo.color, opacity: 0.8 }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters & Search */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ padding: '1.125rem', marginBottom: '1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.125rem', overflowX: 'auto', flex: 1, marginRight: '1.75rem' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
                                color: activeTab === tab.key ? '#fff' : '#475569',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="relative" style={{ width: '280px' }}>
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="Tìm mã đơn, khách hàng..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isAdminOrEmployee && (
                        <>
                            <button onClick={exportToExcel} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ border: '1px solid #e2e8f0', color: '#059669', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                                <Download size={18} /> Xuất Excel
                            </button>
                            <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                                <Plus size={18} /> Tạo đơn hàng
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden rounded-none" style={{ overflow: 'hidden', borderRadius: 0 }}>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th>Mã đơn hàng</th>
                            <th>Khách hàng</th>
                            <th>Số lượng</th>
                            <th>Tổng tiền</th>
                            <th>Thanh toán</th>
                            <th>Trạng thái</th>
                            <th>Hạn xác nhận</th>
                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Không tìm thấy đơn hàng nào.</td></tr>
                        ) : filteredOrders.map(order => (
                            <tr key={order._id}>
                                <td style={{ fontWeight: 700, color: '#2563eb' }}>#{order.MaDonHang}</td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{order.KhachHang?.TenKhachHang}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{order.KhachHang?.SDT}</div>
                                </td>
                                <td>{order.Items.reduce((acc, curr) => acc + curr.SoLuong, 0)} sản phẩm</td>
                                <td style={{ fontWeight: 600 }}>
                                    {order.TongTien.toLocaleString()} ₫
                                    {order.KhuyenMai && (
                                        <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>
                                            🎁 {order.KhuyenMai.MaVoucher}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span style={{ fontSize: '0.875rem', color: '#475569' }}>
                                        {order.PhuongThucThanhToan === 'TIEN_MAT' ? 'Tiền mặt' :
                                            order.PhuongThucThanhToan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' :
                                                order.PhuongThucThanhToan === 'GHI_NO' ? 'Ghi nợ' :
                                                    order.PhuongThucThanhToan || 'COD'}
                                    </span>
                                </td>
                                <td>
                                    <span className="badge" style={{
                                        background: `${STATUS_MAP[order.TrangThai].color}20`,
                                        color: STATUS_MAP[order.TrangThai].color,
                                        borderColor: `${STATUS_MAP[order.TrangThai].color}40`
                                    }}>
                                        {STATUS_MAP[order.TrangThai].label}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.875rem' }}>
                                    {order.TrangThai === 'CHO_XAC_NHAN' ? (
                                        <div style={{ color: new Date(order.HanXacNhan) < new Date() ? '#e11d48' : '#059669' }}>
                                            {new Date(order.HanXacNhan).toLocaleString()}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {isAdminOrEmployee && (
                                            <>
                                                {order.TrangThai === 'CHO_XAC_NHAN' && (
                                                    <button
                                                        onClick={() => {
                                                            if ((order.DaCoc || 0) <= 0) {
                                                                alert('Đơn hàng chưa có tiền cọc. Vui lòng cập nhật tiền cọc TRƯỚC khi xác nhận sản xuất.');
                                                                return;
                                                            }
                                                            handleUpdateStatus(order._id, 'DANG_XU_LY');
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs"
                                                        title="Xác nhận đơn"
                                                        style={{ padding: '4px 8px', fontSize: '10px' }}
                                                    >
                                                        XÁC NHẬN
                                                    </button>
                                                )}
                                                {order.TrangThai === 'DANG_XU_LY' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order._id, 'DANG_GIAO')}
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs"
                                                        title="Giao hàng"
                                                        style={{ padding: '4px 8px', fontSize: '10px', background: '#7c3aed', borderColor: '#7c3aed' }}
                                                    >
                                                        GIAO HÀNG
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ═══ CREATE ORDER MODAL ═══ */}
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '95%', maxWidth: '1100px', maxHeight: '92vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 0 }}>
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Plus size={22} color="#2563eb" /> Tạo Đơn Hàng Mới
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: '24px', padding: '0 12px' }}>&times;</button>
                        </div>

                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
                            {/* Left: Khách hàng + sản phẩm */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {/* Khách hàng */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <User size={16} color="#2563eb" /> Khách hàng <span style={{ color: '#e11d48' }}>*</span>
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={selectedCustomerId}
                                            onChange={e => handleSelectCustomer(e.target.value)}
                                            style={{ width: '100%', background: 'black' }}
                                        >
                                            <option value="">-- Chọn khách hàng --</option>
                                            {customers.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    [{c.MaKH}] {c.TenKhachHang} — {c.SDT} ({c.PhanLoai})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Khuyến mãi */}
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <CreditCard size={16} color="#d97706" /> Chương trình ưu đãi
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={selectedPromotionId}
                                            onChange={e => setSelectedPromotionId(e.target.value)}
                                            style={{ width: '100%', background: 'black', borderColor: calculatedDiscount > 0 ? '#059669' : '#e2e8f0' }}
                                        >
                                            <option value="">-- Không sử dụng ưu đãi --</option>
                                            {promotions.map(p => (
                                                <option key={p._id} value={p._id} disabled={orderSubtotal < p.DonHangToiThieu}>
                                                    {p.MaVoucher} — {p.LoaiGiamGia === 'PHAN_TRAM' ? `Giảm ${p.MucGiam}%` : `Giảm ${p.MucGiam.toLocaleString()}₫`} {orderSubtotal < p.DonHangToiThieu ? `(Thiếu ${(p.DonHangToiThieu - orderSubtotal).toLocaleString()}₫)` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Thêm sản phẩm */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Package size={16} color="#2563eb" /> Sản phẩm <span style={{ color: '#e11d48' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            value={selectedProductId}
                                            onChange={e => { setSelectedProductId(e.target.value); setSelectedColorCode(''); setColorSearchTerm(''); }}
                                            style={{ flex: 2, minWidth: 200, background: 'black' }}
                                        >
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {allProducts.filter(p => p.TonKho > 0).map(p => {
                                                const kh = customers.find(c => c._id === selectedCustomerId);
                                                let factor = 1.0;
                                                let labelSuffix = "";
                                                if (kh?.PhanLoai === 'B2B') {
                                                    factor = 1.2;
                                                    labelSuffix = " (B2B +20%)";
                                                } else if (kh?.PhanLoai === 'B2C') {
                                                    factor = 1.3;
                                                    labelSuffix = " (B2C +30%)";
                                                }
                                                const displayPrice = p.DonGiaCoSo * factor;
                                                return (
                                                    <option key={p._id} value={p._id}>
                                                        {p.TenDongSon} — {displayPrice.toLocaleString()}₫{labelSuffix} (Kho: {p.TonKho})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <button onClick={handleAddProduct} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm px-3 py-1.5 rounded-lg text-xs" disabled={!selectedProductId || !selectedColorCode} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 38 }}>
                                            <Plus size={16} /> Thêm
                                        </button>
                                    </div>

                                    {/* THÔNG SỐ KỸ THUẬT SƠN */}
                                    <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1 }}>Thông số kỹ thuật sơn (MERN)</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 11, color: '#475569', marginBottom: 4, display: 'block' }}>Loại bột sơn</label>
                                                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={loaiBot} onChange={e => setLoaiBot(e.target.value)} style={{ width: '100%', fontSize: 12 }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, color: '#475569', marginBottom: 4, display: 'block' }}>Nhiệt độ sấy</label>
                                                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={nhietDoSay} onChange={e => setNhietDoSay(e.target.value)} style={{ width: '100%', fontSize: 12 }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, color: '#475569', marginBottom: 4, display: 'block' }}>Độ dày lớp phủ</label>
                                                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={doDayLopPhu} onChange={e => setDoDayLopPhu(e.target.value)} style={{ width: '100%', fontSize: 12 }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, color: '#475569', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    Tổng diện tích sơn (m2)
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsCalculatorOpen(true)}
                                                        style={{
                                                            fontSize: 10, color: '#2563eb', background: 'rgba(0,212,255,0.05)',
                                                            border: '1px solid #2563eb', borderRadius: 4, padding: '2px 6px',
                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                                        }}
                                                    >
                                                        <Calculator size={10} /> Tính toán
                                                    </button>
                                                </label>
                                                <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={tongDienTichSon} onChange={e => setTongDienTichSon(Number(e.target.value))} style={{ width: '100%', fontSize: 12 }} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bảng màu sơn - luôn hiển khi đã chọn sản phẩm */}
                                    {selectedProductId && (
                                        <div style={{ marginTop: 12 }}>
                                            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Eye size={16} color="#d97706" /> Chọn mã màu sơn <span style={{ color: '#e11d48', background: 'black' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                placeholder="Tìm mã màu hoặc tên màu (VD: RAL-1015, Silver, Red...)"
                                                value={colorSearchTerm}
                                                onChange={e => setColorSearchTerm(e.target.value)}
                                                style={{ width: '100%', marginBottom: 8 }}
                                            />
                                            {selectedColorCode && (() => {
                                                const c = paintColors.find(pc => pc.code === selectedColorCode);
                                                return c ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,212,255,0.08)', borderRadius: 6, border: '1px solid #2563eb', marginBottom: 8 }}>
                                                        <div style={{ width: 28, height: 28, borderRadius: 4, background: c.hex, border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#2563eb' }}>{c.code}</div>
                                                            <div style={{ fontSize: 11, color: '#475569' }}>{c.name} • {c.category} • {c.gloss}</div>
                                                        </div>
                                                        <button onClick={() => { setSelectedColorCode(''); setColorSearchTerm(''); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: 16 }}>×</button>
                                                    </div>
                                                ) : null;
                                            })()}
                                            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                                                {paintColors
                                                    .filter(c => {
                                                        if (!colorSearchTerm) return true;
                                                        const q = colorSearchTerm.toLowerCase();
                                                        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
                                                    })
                                                    .map(c => (
                                                        <div
                                                            key={c.code}
                                                            onClick={() => { setSelectedColorCode(c.code); setColorSearchTerm(''); }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                                                cursor: 'pointer', borderBottom: '1px solid #e2e8f0',
                                                                background: selectedColorCode === c.code ? 'rgba(0,212,255,0.1)' : 'transparent',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                            onMouseLeave={e => (e.currentTarget.style.background = selectedColorCode === c.code ? 'rgba(0,212,255,0.1)' : 'transparent')}
                                                        >
                                                            <div style={{ width: 22, height: 22, borderRadius: 3, background: c.hex, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{c.code}</div>
                                                                <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name} • {c.category}</div>
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{c.surface}</div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Danh sách sản phẩm đã chọn */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <tr>
                                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Sản phẩm</th>
                                                <th style={{ padding: '10px', textAlign: 'center', fontSize: 12 }}>Mã màu</th>
                                                <th style={{ padding: '10px', textAlign: 'center', fontSize: 12 }}>SL</th>
                                                <th style={{ padding: '10px', textAlign: 'right', fontSize: 12 }}>Đơn giá</th>
                                                <th style={{ padding: '10px', textAlign: 'right', fontSize: 12 }}>Thành tiền</th>
                                                <th style={{ padding: '10px', width: 40 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.length === 0 ? (
                                                <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#666', fontSize: 13 }}>Chưa có sản phẩm nào</td></tr>
                                            ) : orderItems.map((item, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '10px 12px' }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.tenSanPham}</div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Kho: {item.tonKho}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                                                            <div style={{ width: 16, height: 16, borderRadius: 3, background: item.hexCode, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                                            <div style={{ fontSize: 11, fontWeight: 600 }}>{item.maMau}</div>
                                                        </div>
                                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.tenMau}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                                            <button onClick={() => handleItemQtyChange(idx, item.soLuong - 1)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: '#0f172a' }}>-</button>
                                                            <input
                                                                type="number"
                                                                value={item.soLuong}
                                                                onChange={e => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                                                                style={{ width: 50, textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 4px', color: '#0f172a' }}
                                                                min={1}
                                                                max={item.tonKho}
                                                            />
                                                            <button onClick={() => handleItemQtyChange(idx, item.soLuong + 1)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: '#0f172a' }}>+</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontSize: 13 }}>{item.donGia.toLocaleString()} ₫</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb', fontSize: 13 }}>{(item.donGia * item.soLuong).toLocaleString()} ₫</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button onClick={() => handleRemoveItem(idx)} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer' }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        {orderItems.length > 0 && (
                                            <tfoot style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700 }}>
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '14px 12px', textAlign: 'right', fontSize: 14 }}>TỔNG CỘNG:</td>
                                                    <td style={{ textAlign: 'right', color: '#059669', fontSize: 18, paddingRight: 10 }}>{orderSubtotal.toLocaleString()} ₫</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            {/* Right: Thông tin giao hàng + thanh toán */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, borderLeft: '1px solid #e2e8f0', paddingLeft: 32 }}>
                                {/* Địa chỉ giao hàng */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MapPin size={16} color="#2563eb" /> Địa chỉ giao hàng <span style={{ color: '#e11d48' }}>*</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        style={{ minHeight: 70, padding: 10, width: '100%' }}
                                        placeholder="Nhập địa chỉ giao hàng..."
                                        value={diaChiGiaoHang}
                                        onChange={e => setDiaChiGiaoHang(e.target.value)}
                                    />
                                </div>

                                {/* Nhân viên phụ trách */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <User size={16} color="#d97706" /> Nhân viên kinh doanh phụ trách
                                    </label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={selectedSalespersonId}
                                        onChange={e => setSelectedSalespersonId(e.target.value)}
                                        style={{ width: '100%', background: 'black' }}
                                    >
                                        <option value="">-- Chọn nhân viên --</option>
                                        {allStaff.filter(s => s.BoPhan === 'Kinh doanh' || s.BoPhan === 'Sale / MKT' || s.BoPhan === 'CSKH Bảo Hành').map(s => (
                                            <option key={s._id} value={s._id}>{s.MaNV} - {s.HoTen}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* SĐT người nhận */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Phone size={16} color="#2563eb" /> Số điện thoại người nhận <span style={{ color: '#e11d48' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        style={{ width: '100%' }}
                                        placeholder="VD: 0912345678"
                                        value={sdtNguoiNhan}
                                        onChange={e => setSdtNguoiNhan(e.target.value)}
                                    />
                                </div>

                                {/* Phương thức thanh toán */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CreditCard size={16} color="#2563eb" /> Phương thức thanh toán
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {PAYMENT_METHODS.map(pm => {
                                            const PMIcon = pm.icon;
                                            const isActive = phuongThucTT === pm.key;
                                            return (
                                                <button
                                                    key={pm.key}
                                                    onClick={() => setPhuongThucTT(pm.key)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 12,
                                                        padding: '14px 16px', borderRadius: 8,
                                                        border: `2px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
                                                        background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                                                        color: isActive ? '#2563eb' : '#475569',
                                                        cursor: 'pointer', fontWeight: isActive ? 700 : 400,
                                                        transition: 'all 0.2s',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <PMIcon size={20} />
                                                    <span>{pm.label}</span>
                                                    {isActive && <CheckCircle size={16} style={{ marginLeft: 'auto' }} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CHI PHÍ BỔ SUNG & ĐẶT CỌC */}
                                <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, color: '#475569', marginBottom: 4, display: 'block' }}>Phụ phí (Đóng gói/VC)</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={phuPhi} onChange={e => setPhuPhi(Number(e.target.value))} style={{ width: '100%', color: '#d97706', fontWeight: 600 }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, color: '#475569', marginBottom: 4, display: 'block' }}>Số tiền đã cọc</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={daCoc} onChange={e => setDaCoc(Number(e.target.value))} style={{ width: '100%', color: '#059669', fontWeight: 600 }} />
                                    </div>
                                </div>

                                {/* Ghi chú */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Ghi chú</label>
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        style={{ minHeight: 60, padding: 10, width: '100%' }}
                                        placeholder="Ghi chú đơn hàng (tùy chọn)..."
                                        value={ghiChu}
                                        onChange={e => setGhiChu(e.target.value)}
                                    />
                                </div>

                                {/* Tổng kết & Xác nhận */}
                                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20, marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ color: '#475569' }}>Trạng thái:</span>
                                        <span className="badge" style={{ background: 'rgba(255,193,7,0.15)', color: '#d97706', borderColor: 'rgba(255,193,7,0.3)' }}>Chờ xác nhận</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ color: '#475569' }}>Thanh toán:</span>
                                        <span style={{ fontWeight: 600 }}>{PAYMENT_METHODS.find(p => p.key === phuongThucTT)?.label}</span>
                                    </div>
                                    {calculatedDiscount > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ color: '#059669', fontWeight: 600 }}>Chiết khấu:</span>
                                            <span style={{ fontWeight: 700, color: '#059669' }}>-{calculatedDiscount.toLocaleString()} ₫</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <span style={{ fontWeight: 700, fontSize: 16 }}>TỔNG TIỀN:</span>
                                        <span style={{ fontWeight: 700, fontSize: 22, color: '#059669' }}>{(orderSubtotal + phuPhi - calculatedDiscount).toLocaleString()} ₫</span>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={isSubmittingOrder}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                        style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                                    >
                                        {isSubmittingOrder ? 'ĐANG TẠO ĐƠN...' : <><CheckCircle size={20} /> TẠO ĐƠN HÀNG</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ DETAILS MODAL (REDESIGNED) ═══ */}
            {isDetailsModalOpen && selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', overflowY: 'auto', padding: '2rem 0' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '95%', maxWidth: '1000px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: 0, background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        {/* Custom Header with Back Button */}
                        <div style={{ padding: '20px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={() => setIsDetailsModalOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, color: '#0f172a', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <ArrowLeft size={18} /> Quay lại
                            </button>
                            <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>CHI TIẾT ĐƠN HÀNG #{selectedOrder.MaDonHang}</h3>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '32px' }}>
                            {/* Section I & II Container */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                                {/* I. THÔNG TIN KHÁCH HÀNG & SẢN PHẨM */}
                                <div style={{ border: '1px dashed #e2e8f0', padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.01)' }}>
                                    <h4 style={{ margin: '0 0 20px 0', fontSize: 15, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                                        <User size={18} /> I. THÔNG TIN KHÁCH HÀNG & SẢN PHẨM
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 100 }}>* Khách hàng:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedOrder.KhachHang?.TenKhachHang}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 100 }}>* Số ĐT:</span>
                                            <span>{selectedOrder.KhachHang?.SDT}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 100 }}>* Sản phẩm:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedOrder.Items?.[0]?.TenSanPham} ({selectedOrder.Items?.reduce((s, i) => s + i.SoLuong, 0)} {selectedOrder.Items?.[0]?.SanPham?.DonViTinh || 'thùng'})</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 100 }}>* Diện tích:</span>
                                            <span style={{ color: '#d97706', fontWeight: 700 }}>{selectedOrder.TongDienTichSon || 0} m2</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 100 }}>* Ngày tạo:</span>
                                            <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* II. THÔNG SỐ KỸ THUẬT SƠN (MERN) */}
                                <div style={{ border: '1px dashed #e2e8f0', padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.01)' }}>
                                    <h4 style={{ margin: '0 0 20px 0', fontSize: 15, color: '#059669', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                                        <Layers size={18} /> II. THÔNG SỐ KỸ THUẬT SƠN (MERN)
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 110 }}>* Mã màu:</span>
                                            <span style={{ fontWeight: 700, color: '#2563eb' }}>{selectedOrder.Items?.[0]?.MaMau || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 110 }}>* Loại bột:</span>
                                            <span>{selectedOrder.TechnicalSpecs?.LoaiBot || 'AkzoNobel Interpon'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 110 }}>* Nhiệt độ sấy:</span>
                                            <span>{selectedOrder.TechnicalSpecs?.NhietDoSay || '195°C / 15 phút'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <span style={{ color: '#475569', minWidth: 110 }}>* Độ dày lớp phủ:</span>
                                            <span>{selectedOrder.TechnicalSpecs?.DoDayLopPhu || '75 µm'}</span>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ fontSize: 11, padding: '4px 10px', color: '#2563eb', border: '1px solid #2563eb' }}>📈 Xem biểu đồ hiệu suất thực</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* III. THÔNG TIN THANH TOÁN (PAYMENT) */}
                            <div style={{ border: '1px dashed #e2e8f0', padding: 24, borderRadius: 12, background: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
                                <h4 style={{ margin: '0 0 20px 0', fontSize: 15, color: '#d97706', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                                    <CreditCard size={18} /> III. THÔNG TIN THANH TOÁN (PAYMENT)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#475569' }}>* Đơn giá trung bình (m2):</span>
                                            <span>{(selectedOrder.TongTien / (selectedOrder.TongDienTichSon || 1)).toLocaleString()}đ / m2</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#475569' }}>* Thành tiền (SP):</span>
                                            <span>{(selectedOrder.TongTien - (selectedOrder.PhuPhi || 0)).toLocaleString()}đ</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#475569' }}>* Phụ phí (Đóng gói/VC):</span>
                                            <span>{(selectedOrder.PhuPhi || 0).toLocaleString()}đ</span>
                                        </div>
                                        {selectedOrder.GiamGia !== undefined && selectedOrder.GiamGia > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                                                <span style={{ fontWeight: 600 }}>* Ưu đãi ({selectedOrder.KhuyenMai?.MaVoucher || 'Voucher'}):</span>
                                                <span style={{ fontWeight: 700 }}>-{(selectedOrder.GiamGia || 0).toLocaleString()}đ</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                                            <span style={{ fontWeight: 700, fontSize: 16 }}>* TỔNG CỘNG:</span>
                                            <span style={{ fontWeight: 800, fontSize: 20, color: '#059669' }}>{selectedOrder.TongTien.toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 40 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#475569' }}>* Đã cọc:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ fontWeight: 700 }}>{(selectedOrder.DaCoc || 0).toLocaleString()}đ ({Math.round(((selectedOrder.DaCoc || 0) / selectedOrder.TongTien) * 100)}%)</span>
                                                {selectedOrder.TrangThai === 'CHO_XAC_NHAN' && (
                                                    <button
                                                        onClick={() => {
                                                            setDepositAmount(selectedOrder.DaCoc || 0);
                                                            setIsPaymentModalOpen(true);
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs"
                                                        style={{ padding: '2px 8px', fontSize: '10px', color: '#2563eb', border: '1px solid #2563eb' }}
                                                    >
                                                        Cập nhật cọc
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                                            <span style={{ fontWeight: 700, fontSize: 18 }}>* CÒN LẠI:</span>
                                            <span style={{ fontWeight: 800, fontSize: 22, color: '#e11d48' }}>{(selectedOrder.TongTien - (selectedOrder.DaCoc || 0)).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline / Action Section */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <Calendar size={18} color="#2563eb" />
                                    <div style={{ flex: 1, fontSize: 14 }}>
                                        <span style={{ color: '#475569' }}>[{new Date(selectedOrder.createdAt).toLocaleDateString()}]</span> Đã cọc (Chuyển khoản) <span style={{ fontWeight: 700, color: '#059669' }}>[{(selectedOrder.DaCoc || 0).toLocaleString()}đ]</span>
                                    </div>
                                    <button onClick={() => exportToPDF('COC')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb' }} disabled={isPrinting}>
                                        <FileCheck size={14} /> In Phiếu Cọc
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <FileText size={18} color="#7c3aed" />
                                    <div style={{ flex: 1, fontSize: 14 }}>
                                        <span style={{ color: '#475569' }}>[{new Date().toLocaleDateString()}]</span> Đơn hàng đang được xử lý <span style={{ fontWeight: 700 }}>[Thanh toán nốt]</span>
                                    </div>
                                    {selectedOrder.TrangThai === 'CHO_XAC_NHAN' && (
                                        <button
                                            onClick={() => {
                                                if ((selectedOrder.DaCoc || 0) <= 0) {
                                                    alert('Vui lòng cập nhật tiền cọc TRƯỚC khi bắt đầu sản xuất để đảm bảo quy trình tài chính.');
                                                    return;
                                                }
                                                handleUpdateStatus(selectedOrder._id, 'DANG_XU_LY');
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                            style={{ background: (selectedOrder.DaCoc || 0) <= 0 ? '#94a3b8' : 'var(--accent-primary)', opacity: (selectedOrder.DaCoc || 0) <= 0 ? 0.7 : 1 }}
                                        >
                                            Bắt đầu sản xuất
                                        </button>
                                    )}
                                    <button onClick={() => exportToPDF('HOA_DON')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 px-3 py-1.5 rounded-lg text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669' }} disabled={isPrinting}>
                                        <Printer size={14} /> In Hóa Đơn GTGT
                                    </button>
                                </div>
                            </div>

                            {/* Status Control Buttons */}
                            <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                {selectedOrder.TrangThai !== 'DA_GIAO' && selectedOrder.TrangThai !== 'DA_HUY' && (
                                    <button onClick={() => handleUpdateStatus(selectedOrder._id, 'DA_HUY')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ color: '#e11d48', border: '1px solid #e11d48' }}>Hủy đơn hàng</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* HIDDEN PRINT TEMPLATE (Pure white for PDF) */}
                    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                        <div ref={printRef} style={{ width: '210mm', padding: '20mm', background: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
                            <div style={{ borderBottom: '2px solid #333', paddingBottom: '10mm', marginBottom: '10mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '28px' }}>VTSC PAINT PRO</h1>
                                    <p style={{ margin: '5px 0' }}>Hệ thống Quản lý Bền mặt Công nghiệp</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h2 style={{ margin: 0 }}>PHIẾU XÁC NHẬN</h2>
                                    <p>Mã: #{selectedOrder.MaDonHang}</p>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10mm' }}>
                                <tr>
                                    <td style={{ width: '50%', verticalAlign: 'top', padding: '5mm', border: '1px solid #ddd' }}>
                                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm' }}>I. KHÁCH HÀNG & PHỤ TRÁCH</h3>
                                        <p><strong>Khách hàng:</strong> {selectedOrder.KhachHang?.TenKhachHang}</p>
                                        <p><strong>Số ĐT:</strong> {selectedOrder.KhachHang?.SDT}</p>
                                        <p><strong>NV Sales:</strong> {selectedOrder.NhanVienPhuTrach ? `${selectedOrder.NhanVienPhuTrach.MaNV} - ${selectedOrder.NhanVienPhuTrach.HoTen}` : 'Chưa gán'}</p>
                                        <p><strong>Diện tích sơn:</strong> {selectedOrder.TongDienTichSon} m2</p>
                                    </td>
                                    <td style={{ width: '50%', verticalAlign: 'top', padding: '5mm', border: '1px solid #ddd' }}>
                                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm' }}>II. THÔNG SỐ KỸ THUẬT (MERN)</h3>
                                        <p><strong>Mã màu:</strong> {selectedOrder.Items?.[0]?.MaMau}</p>
                                        <p><strong>Loại bột:</strong> {selectedOrder.TechnicalSpecs?.LoaiBot}</p>
                                        <p><strong>Nhiệt độ sấy:</strong> {selectedOrder.TechnicalSpecs?.NhietDoSay}</p>
                                        <p><strong>Độ dày lớp phủ:</strong> {selectedOrder.TechnicalSpecs?.DoDayLopPhu}</p>
                                    </td>
                                </tr>
                            </table>

                            <div style={{ border: '1px solid #ddd', padding: '5mm', marginBottom: '10mm' }}>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm' }}>III. CHI TIẾT THANH TOÁN</h3>
                                <table style={{ width: '100%' }}>
                                    <tr>
                                        <td>Thành tiền hàng:</td>
                                        <td style={{ textAlign: 'right' }}>{(selectedOrder.TongTien - (selectedOrder.PhuPhi || 0)).toLocaleString()}đ</td>
                                    </tr>
                                    <tr>
                                        <td>Phụ phí (VC/Đóng gói):</td>
                                        <td style={{ textAlign: 'right' }}>{(selectedOrder.PhuPhi || 0).toLocaleString()}đ</td>
                                    </tr>
                                    <tr style={{ fontWeight: 'bold', fontSize: '18px' }}>
                                        <td style={{ paddingTop: '5mm' }}>TỔNG CỘNG:</td>
                                        <td style={{ textAlign: 'right', paddingTop: '5mm' }}>{selectedOrder.TongTien.toLocaleString()}đ</td>
                                    </tr>
                                    <tr style={{ color: '#28a745' }}>
                                        <td>Đã đặt cọc:</td>
                                        <td style={{ textAlign: 'right' }}>{(selectedOrder.DaCoc || 0).toLocaleString()}đ</td>
                                    </tr>
                                    <tr style={{ fontWeight: 'bold', color: '#dc3545', fontSize: '20px' }}>
                                        <td style={{ paddingTop: '3mm', borderTop: '2px double #ddd' }}>CÒN LẠI:</td>
                                        <td style={{ textAlign: 'right', paddingTop: '3mm', borderTop: '2px double #ddd' }}>{(selectedOrder.TongTien - (selectedOrder.DaCoc || 0)).toLocaleString()}đ</td>
                                    </tr>
                                </table>
                            </div>

                            <div style={{ marginTop: '20mm', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ textAlign: 'center', width: '200px' }}>
                                    <p>Khách hàng</p>
                                    <div style={{ height: '30mm' }}></div>
                                    <p>(Ký tên)</p>
                                </div>
                                <div style={{ textAlign: 'center', width: '200px' }}>
                                    <p>Người lập phiếu</p>
                                    <div style={{ height: '30mm' }}></div>
                                    <p>(Ký tên)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══ DRIVER SELECTION MODAL ═══ */}
            {isDriverModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '90%', maxWidth: '500px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Truck size={20} color="#7c3aed" /> Điều phối Tài xế giao hàng
                            </h3>
                            <button onClick={() => setIsDriverModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: '20px' }}>&times;</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
                                Vui lòng chọn tài xế từ bộ phận <strong>Nhân viên Kỹ thuật (Kho / Logistics)</strong> để bắt đầu quá trình vận chuyển.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '300px', overflowY: 'auto' }}>
                                {drivers.map(driver => (
                                    <div
                                        key={driver._id}
                                        onClick={() => setSelectedDriverId(driver._id)}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: 8,
                                            border: `1px solid ${selectedDriverId === driver._id ? '#2563eb' : '#e2e8f0'}`,
                                            background: selectedDriverId === driver._id ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={18} color="#475569" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{driver.HoTen}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{driver.BoPhan} • SĐT: {driver.SDT}</div>
                                        </div>
                                        {selectedDriverId === driver._id && <CheckCircle size={18} color="#2563eb" />}
                                    </div>
                                ))}
                                {drivers.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                                        Không tìm thấy nhân viên giao hàng phù hợp ở bộ phận Kho & Logistics.
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button onClick={() => setIsDriverModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ flex: 1 }}>Hủy</button>
                                <button
                                    onClick={() => pendingStatusUpdate && handleUpdateStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, selectedDriverId)}
                                    disabled={!selectedDriverId}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    style={{ flex: 2 }}
                                >
                                    XÁC NHẬN GIAO HÀNG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PAINT CALCULATOR MODAL ═══ */}
            {isCalculatorOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '90%', maxWidth: '600px', padding: 0, border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Tính Toán Diện Tích Sơn</h3>
                            <button onClick={() => setIsCalculatorOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: '24px', padding: '0 8px' }}>&times;</button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, maxHeight: '65vh' }}>
                            {/* Unit Toggle */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <span style={{ fontSize: 13, color: '#475569' }}>Tính toán diện tích theo bề mặt</span>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
                                    <button onClick={() => setCalcUnit('m')} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: calcUnit === 'm' ? '#2563eb' : 'transparent', color: calcUnit === 'm' ? '#000' : '#0f172a', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>m</button>
                                    <button onClick={() => setCalcUnit('ft')} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: calcUnit === 'ft' ? '#2563eb' : 'transparent', color: calcUnit === 'ft' ? '#000' : '#0f172a', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>ft</button>
                                </div>
                            </div>

                            {/* Walls Section */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>Bề mặt tường ({calcWalls.length})</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {calcWalls.map((wall, index) => (
                                        <div key={wall.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input type="number" placeholder="Chiều dài" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={wall.length} onChange={(e) => updateCalcItem(wall.id, 'length', e.target.value, 'wall')} style={{ width: '100%', fontSize: 13 }} />
                                                <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 11, color: '#94a3b8' }}>{calcUnit}</span>
                                            </div>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input type="number" placeholder="Chiều cao" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={wall.height} onChange={(e) => updateCalcItem(wall.id, 'height', e.target.value, 'wall')} style={{ width: '100%', fontSize: 13 }} />
                                                <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 11, color: '#94a3b8' }}>{calcUnit}</span>
                                            </div>
                                            {calcWalls.length > 1 && (
                                                <button onClick={() => handleRemoveCalcItem(wall.id, 'wall')} style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: 5 }}><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={handleAddCalcWall} style={{ background: 'transparent', border: '1px dashed #2563eb', color: '#2563eb', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                                        <Plus size={14} /> Thêm tường
                                    </button>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e11d48' }}>Khấu trừ (Cửa/Sổ) ({calcDeductions.length})</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {calcDeductions.map((ded, index) => (
                                        <div key={ded.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input type="number" placeholder="Chiều dài" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={ded.length} onChange={(e) => updateCalcItem(ded.id, 'length', e.target.value, 'deduction')} style={{ width: '100%', fontSize: 13 }} />
                                                <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 11, color: '#94a3b8' }}>{calcUnit}</span>
                                            </div>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <input type="number" placeholder="Chiều cao" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" value={ded.height} onChange={(e) => updateCalcItem(ded.id, 'height', e.target.value, 'deduction')} style={{ width: '100%', fontSize: 13 }} />
                                                <span style={{ position: 'absolute', right: 10, top: 10, fontSize: 11, color: '#94a3b8' }}>{calcUnit}</span>
                                            </div>
                                            <button onClick={() => handleRemoveCalcItem(ded.id, 'deduction')} style={{ background: 'transparent', border: 'none', color: '#e11d48', cursor: 'pointer', padding: 5 }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={handleAddCalcDeduction} style={{ background: 'transparent', border: '1px dashed #e11d48', color: '#e11d48', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                                        <Plus size={14} /> Thêm cửa/sổ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Results */}
                        <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 4 }}>
                                <span>Ước lượng:</span>
                                <span>{calculatedResult.area} mét vuông</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 12 }}>
                                <span>Độ che phủ (định mức):</span>
                                <span>12.3 mét vuông / Lít</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                                <span style={{ fontSize: 18, fontWeight: 700 }}>Bạn sẽ cần:</span>
                                <span style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>{calculatedResult.liters} Lít</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setIsCalculatorOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ flex: 1 }}>Hủy</button>
                                <button
                                    onClick={() => {
                                        setTongDienTichSon(calculatedResult.area);
                                        setIsCalculatorOpen(false);
                                    }}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <FileCheck size={18} /> ÁP DỤNG KẾT QUẢ
                                </button>
                            </div>
                            <p style={{ marginTop: 12, fontSize: 10, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>
                                * Kết quả thực tế có thể khác nhau. Tính toán dựa trên 2 lớp phủ.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══ PAYMENT MODAL ═══ */}
            {isPaymentModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md transition-all duration-300 overflow-hidden" style={{ width: '90%', maxWidth: '400px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <CreditCard size={20} color="#d97706" /> Cập nhật tiền cọc
                            </h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ fontSize: '20px' }}>&times;</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 13, color: '#475569', marginBottom: 8, display: 'block' }}>Số tiền khách đã trả (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    style={{ width: '100%', fontSize: 20, fontWeight: 700, textAlign: 'right', color: '#059669' }}
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                                />
                                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                    {[0.3, 0.5, 1].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setDepositAmount(Math.round(selectedOrder!.TongTien * p))}
                                            style={{ flex: 1, padding: '6px', fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer' }}
                                        >
                                            {p * 100}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>
                                * Việc cập nhật số tiền cọc giúp hệ thống xác nhận quy trình thanh toán và cho phép lệnh <strong>Bắt đầu sản xuất</strong> được thực thi.
                            </p>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setIsPaymentModalOpen(false)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700" style={{ flex: 1 }}>Hủy</button>
                                <button onClick={handleUpdateDeposit} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-none no-underline bg-blue-600 text-white hover:bg-blue-700 shadow-sm" style={{ flex: 2 }}>XÁC NHẬN THANH TOÁN</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
