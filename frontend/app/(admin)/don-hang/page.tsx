'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
    Download, Printer, Trash2, Plus, Phone, Banknote, Building, FileText, ArrowLeft, Layers, Thermometer, Ruler, FileCheck, ClipboardList, Calculator,
    Search, Filter, Eye, CheckCircle, Truck, Package, XCircle, MoreHorizontal, ChevronDown, Calendar, User, MapPin, CreditCard, Clock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '@/lib/utils/axiosAuth';
import { paintColors, trackingData } from '@/lib/data/colors-data';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@/lib/store/authStore';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { saveAs } from 'file-saver';

import { useRouter } from 'next/navigation';

const API_DON_HANG = '/don-hang';

const PAYMENT_METHODS = [
    { key: 'TIEN_MAT', label: 'Tiền mặt', icon: Banknote },
    { key: 'CHUYEN_KHOAN', label: 'Chuyển khoản', icon: CreditCard },
    { key: 'GHI_NO', label: 'Ghi nợ', icon: FileText }
];

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
    TongTonKho: number;
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
    const router = useRouter();
    const isAdminOrEmployee = user?.role === 'Admin' || user?.role === 'NhanVien';

    useEffect(() => {
        if (user && (user.role === 'KhachHangB2B' || user.role === 'KhachHangB2C')) {
            router.push('/my-orders');
        }
    }, [user, router]);

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
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [selectedColorCode, setSelectedColorCode] = useState('');
    const [colorSearchTerm, setColorSearchTerm] = useState('');
    const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
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
        }
    };

    const handleAddProduct = () => {
        if (!selectedProductId) return;
        const sp = allProducts.find(p => p._id === selectedProductId);
        if (!sp) return;
        if ((sp.TongTonKho || 0) <= 0) { alert('Sản phẩm hết hàng'); return; }

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

        setOrderItems([...orderItems, {
            sanPhamId: sp._id,
            tenSanPham: sp.TenDongSon,
            soLuong: 1,
            donGia: sp.DonGiaCoSo,
            tonKho: sp.TongTonKho || 0,
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

    const handleDownloadPhieuCoc = async () => {
        if (!selectedOrder) {
            alert('Không tìm thấy thông tin đơn hàng để in phiếu cọc!');
            return;
        }

        try {
            // Mock data values requested as fallbacks
            const customerName = selectedOrder.KhachHang?.TenKhachHang || 'An Phúc';
            const customerPhone = selectedOrder.KhachHang?.SDT || 'Chưa cập nhật';
            const productName = selectedOrder.Items?.[0]?.TenSanPham || 'Majestic Đẹp Nguyên Bản';
            const quantity = selectedOrder.Items?.reduce((s, i) => s + i.SoLuong, 0) || 1;
            const colorCode = selectedOrder.Items?.[0]?.MaMau || 'BASE';
            const powderType = selectedOrder.TechnicalSpecs?.LoaiBot || 'AkzoNobel Interpon';
            const totalValue = selectedOrder.TongTien || 1250000;
            const depositValue = selectedOrder.DaCoc || 625000;
            const remainingValue = Math.max(0, totalValue - depositValue);
            const depositPercent = totalValue > 0 ? Math.round((depositValue / totalValue) * 100) : 50;

            const doc = new Document({
                creator: "VTSC PaintPro",
                title: `Phieu_Coc_DH${selectedOrder.MaDonHang}`,
                description: "Phiếu biên nhận đặt cọc",
                styles: {
                    default: {
                        document: {
                            run: {
                                font: "Times New Roman",
                                size: 24, // 12pt (24 half-points)
                            },
                        },
                    },
                },
                sections: [
                    {
                        properties: {},
                        children: [
                            // 1. Header
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                    insideHorizontal: { style: BorderStyle.NONE },
                                    insideVertical: { style: BorderStyle.NONE },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "CÔNG TY CP TMDV VOSCO (VTSC)", bold: true })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "Hệ thống PaintPro" })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    })
                                                ]
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true, underline: {} })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),

                            new Paragraph({ text: "", spacing: { after: 400 } }),

                            // 2. Tiêu đề văn bản
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "PHIẾU BIÊN NHẬN ĐẶT CỌC", bold: true, size: 32 }) // 16pt
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Mã đơn hàng: #${selectedOrder.MaDonHang} - Ngày tạo: ${new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}`,
                                        italics: true
                                    })
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 400 }
                            }),

                            // 3. Nội dung chính
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Họ tên khách hàng: ", bold: true }),
                                    new TextRun({ text: customerName })
                                ],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Số điện thoại: ", bold: true }),
                                    new TextRun({ text: customerPhone })
                                ],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Nội dung đặt cọc: ", bold: true }),
                                    new TextRun({
                                        text: `Đặt cọc thi công/mua sơn tĩnh điện sản phẩm "${productName} (${quantity} thùng)", Mã màu: ${colorCode}, Loại bột: ${powderType}.`
                                    })
                                ],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Tổng giá trị đơn hàng: ", bold: true }),
                                    new TextRun({ text: `${totalValue.toLocaleString('vi-VN')} đ` })
                                ],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Số tiền đã đặt cọc (${depositPercent}%): `, bold: true }),
                                    new TextRun({ text: `${depositValue.toLocaleString('vi-VN')} đ` })
                                ],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Viết bằng chữ: ", bold: true }),
                                    new TextRun({ text: "(Sáu trăm hai mươi lăm nghìn đồng chẵn)", italics: true }) // Mặc định mock theo yêu cầu
                                ],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Số tiền còn lại cần thanh toán: ", bold: true }),
                                    new TextRun({ text: `${remainingValue.toLocaleString('vi-VN')} đ` })
                                ],
                                spacing: { after: 400 }
                            }),

                            // 4. Chữ ký (Footer)
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                    insideHorizontal: { style: BorderStyle.NONE },
                                    insideVertical: { style: BorderStyle.NONE },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "NGƯỜI NỘP TIỀN", bold: true })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "(Ký, ghi rõ họ tên)", italics: true })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({ text: "", spacing: { after: 1000 } })
                                                ]
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "ĐẠI DIỆN CÔNG TY", bold: true })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "(Ký, ghi rõ họ tên)", italics: true })
                                                        ],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({ text: "", spacing: { after: 1000 } })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }
                ]
            });

            Packer.toBlob(doc).then(blob => saveAs(blob, `Phieu_Coc_DH${selectedOrder.MaDonHang}.docx`));
        } catch (error) {
            console.error('Error generating document:', error);
            alert('Đã xảy ra lỗi khi tạo phiếu cọc!');
        }
    };

    const handleDownloadHoaDonGTGT = async () => {
        if (!selectedOrder) {
            alert('Không tìm thấy thông tin đơn hàng để in hóa đơn!');
            return;
        }

        try {
            // Dùng dữ liệu thật từ đơn hàng thay vì mock data
            const customerName = selectedOrder.KhachHang?.TenKhachHang || 'Khách vãng lai';
            const companyName = (selectedOrder.KhachHang as any)?.TenCongTy || '';
            const taxCode = (selectedOrder.KhachHang as any)?.MaSoThue || '(Khách lẻ)';
            const address = selectedOrder.DiaChiGiaoHang || selectedOrder.KhachHang?.DiaChi || '(Chưa cập nhật địa chỉ)';
            const paymentMethod = selectedOrder.PhuongThucThanhToan === 'TIEN_MAT' ? 'Tiền mặt (TM)' : 'Chuyển khoản (CK)';

            const productName = `Sơn tĩnh điện cao cấp ${selectedOrder.TechnicalSpecs?.LoaiBot || 'AkzoNobel Interpon'} - Dòng ${selectedOrder.Items?.[0]?.TenSanPham || 'Majestic Đẹp Nguyên Bản'} (Mã màu: ${selectedOrder.Items?.[0]?.MaMau || 'BASE'}, Nhiệt độ sấy: ${selectedOrder.TechnicalSpecs?.NhietDoSay || '195°C/15 phút'})`;
            const quantity = selectedOrder.Items?.reduce((s, i) => s + i.SoLuong, 0) || 1;

            // Financial calculations
            const totalGross = selectedOrder.TongTien || 1250000;
            const vatRate = 0.08; // 8% as example
            const totalNet = Math.round(totalGross / (1 + vatRate));
            const vatAmount = totalGross - totalNet;

            const doc = new Document({
                creator: "VTSC PaintPro",
                title: `Hoa_Don_GTGT_VTSC_${selectedOrder.MaDonHang}`,
                description: "Hóa đơn Giá trị Gia tăng",
                styles: {
                    default: {
                        document: {
                            run: {
                                font: "Arial",
                                size: 22, // 11pt (22 half-points)
                            },
                        },
                    },
                },
                sections: [
                    {
                        properties: {
                            page: {
                                margin: {
                                    top: 1134, // 2cm = ~1134 dxas
                                    bottom: 1134,
                                    left: 1417, // 2.5cm = ~1417 dxas
                                    right: 1134,
                                }
                            }
                        },
                        children: [
                            // 1. Khối thông tin Hóa đơn & Đơn vị bán hàng (Header)
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                    insideHorizontal: { style: BorderStyle.NONE },
                                    insideVertical: { style: BorderStyle.NONE },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            // Cột trái: Thông tin Người bán
                                            new TableCell({
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                                children: [
                                                    new Paragraph({ children: [new TextRun({ text: "CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ VOSCO (VTSC)", bold: true, size: 24 })], spacing: { after: 120 } }),
                                                    new Paragraph({ children: [new TextRun({ text: "Mã số thuế: 0100100456", bold: true })], spacing: { after: 120 } }),
                                                    new Paragraph({ children: [new TextRun({ text: "Địa chỉ: Số 215 Lạch Tray, Gia Viên, Hải Phòng" })], spacing: { after: 120 } }),
                                                    new Paragraph({ children: [new TextRun({ text: "Điện thoại: 024.3388.xxxx - Số tài khoản: 110000123456 tại VietinBank" })], spacing: { after: 120 } })
                                                ]
                                            }),
                                            // Cột phải: Thông tin Mẫu hóa đơn
                                            new TableCell({
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                                children: [
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "HÓA ĐƠN GIÁ TRỊ GIA TĂNG", bold: true, size: 28, color: "FF0000" })],
                                                        alignment: AlignmentType.CENTER,
                                                        spacing: { after: 120 }
                                                    }),
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "Mẫu số (Form): 1C26TAA" })],
                                                        alignment: AlignmentType.CENTER,
                                                        spacing: { after: 120 }
                                                    }),
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "Ký hiệu (Serial): K26TBB" })],
                                                        alignment: AlignmentType.CENTER,
                                                        spacing: { after: 120 }
                                                    }),
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "Số (No.): 0004512", bold: true, color: "FF0000" })],
                                                        alignment: AlignmentType.CENTER,
                                                        spacing: { after: 120 }
                                                    }),
                                                    new Paragraph({
                                                        children: [new TextRun({ text: `Ngày (Date): 21 Tháng 05 Năm 2026`, italics: true })],
                                                        alignment: AlignmentType.CENTER,
                                                        spacing: { after: 120 }
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),

                            new Paragraph({ text: "", spacing: { after: 300 } }),
                            new Paragraph({
                                border: { bottom: { style: BorderStyle.SINGLE, space: 1, color: "CCCCCC" } },
                                spacing: { after: 300 }
                            }),

                            // 2. Khối thông tin Người mua hàng (Buyer Information)
                            new Paragraph({ children: [new TextRun({ text: "Họ tên người mua hàng: ", italics: true }), new TextRun({ text: customerName, bold: true })], spacing: { after: 120 } }),
                            new Paragraph({ children: [new TextRun({ text: "Tên đơn vị: " }), new TextRun({ text: companyName || "(Không có)" })], spacing: { after: 120 } }),
                            new Paragraph({ children: [new TextRun({ text: "Mã số thuế: " }), new TextRun({ text: taxCode })], spacing: { after: 120 } }),
                            new Paragraph({ children: [new TextRun({ text: "Địa chỉ: " }), new TextRun({ text: address })], spacing: { after: 120 } }),
                            new Paragraph({ children: [new TextRun({ text: "Hình thức thanh toán: " }), new TextRun({ text: paymentMethod })], spacing: { after: 300 } }),

                            // 3. Bảng chi tiết hàng hóa, dịch vụ (Goods Table)
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                                    left: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                                    right: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
                                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
                                },
                                rows: [
                                    // Header Row
                                    new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "STT", bold: true })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tên hàng hóa, dịch vụ", bold: true })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đơn vị tính", bold: true })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Số lượng", bold: true })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đơn giá", bold: true })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Thành tiền", bold: true })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } })
                                        ]
                                    }),
                                    // Data Row
                                    new TableRow({
                                        children: [
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: productName })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Thùng" })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: quantity.toString() })], alignment: AlignmentType.CENTER })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalNet.toLocaleString('vi-VN')} đ` })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalNet.toLocaleString('vi-VN')} đ` })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, left: 100, right: 100 } })
                                        ]
                                    })
                                ]
                            }),

                            new Paragraph({ text: "", spacing: { after: 200 } }),

                            // 4. Khối tính toán tài chính (Financial Summary Rows)
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                    insideHorizontal: { style: BorderStyle.NONE },
                                    insideVertical: { style: BorderStyle.NONE },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Cộng tiền hàng (Total Net Amount):", alignment: AlignmentType.RIGHT })] }),
                                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: `${totalNet.toLocaleString('vi-VN')} đ`, alignment: AlignmentType.RIGHT })] })
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Thuế suất GTGT (VAT Rate): 8%", alignment: AlignmentType.RIGHT })] }),
                                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: " ", alignment: AlignmentType.RIGHT })] }) // Optional spacing
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: "Tiền thuế GTGT (VAT Amount):", alignment: AlignmentType.RIGHT })] }),
                                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ text: `${vatAmount.toLocaleString('vi-VN')} đ`, alignment: AlignmentType.RIGHT })] })
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Tổng cộng tiền thanh toán (Total Gross Amount):", bold: true })], alignment: AlignmentType.RIGHT })] }),
                                            new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${totalGross.toLocaleString('vi-VN')} đ`, bold: true })], alignment: AlignmentType.RIGHT })] })
                                        ]
                                    })
                                ]
                            }),

                            new Paragraph({ text: "", spacing: { after: 100 } }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Số tiền viết bằng chữ (Amount in words): ", italics: true }),
                                    new TextRun({ text: "Một triệu hai trăm năm mươi nghìn đồng chẵn.", italics: true, bold: true }) // Dùng mock text
                                ],
                                spacing: { after: 400 }
                            }),

                            // 5. Khối Ký tên (Signatures)
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                    insideHorizontal: { style: BorderStyle.NONE },
                                    insideVertical: { style: BorderStyle.NONE },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                                children: [
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "NGƯỜI MUA HÀNG", bold: true })],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", italics: true })],
                                                        alignment: AlignmentType.CENTER
                                                    })
                                                ]
                                            }),
                                            new TableCell({
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                                children: [
                                                    new Paragraph({
                                                        children: [new TextRun({ text: "NGƯỜI BÁN HÀNG", bold: true })],
                                                        alignment: AlignmentType.CENTER
                                                    }),
                                                    // Giả lập Digital Signature Box
                                                    new Table({
                                                        width: { size: 80, type: WidthType.PERCENTAGE },
                                                        alignment: AlignmentType.CENTER,
                                                        borders: {
                                                            top: { style: BorderStyle.SINGLE, size: 6, color: "0055AA" },
                                                            bottom: { style: BorderStyle.SINGLE, size: 6, color: "0055AA" },
                                                            left: { style: BorderStyle.SINGLE, size: 6, color: "0055AA" },
                                                            right: { style: BorderStyle.SINGLE, size: 6, color: "0055AA" },
                                                        },
                                                        rows: [
                                                            new TableRow({
                                                                children: [
                                                                    new TableCell({
                                                                        margins: { top: 150, bottom: 150, left: 150, right: 150 },
                                                                        children: [
                                                                            new Paragraph({
                                                                                children: [new TextRun({ text: "✔ Ký bởi: CÔNG TY CP TMDV VOSCO - VTSC", bold: true, color: "008800", size: 18 })],
                                                                                alignment: AlignmentType.CENTER,
                                                                                spacing: { after: 100 }
                                                                            }),
                                                                            new Paragraph({
                                                                                children: [new TextRun({ text: `Ký ngày: 21/05/2026`, italics: true, size: 16 })],
                                                                                alignment: AlignmentType.CENTER
                                                                            })
                                                                        ]
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }
                ]
            });

            Packer.toBlob(doc).then(blob => saveAs(blob, `Hoa_Don_GTGT_VTSC_${selectedOrder.MaDonHang}.docx`));
        } catch (error) {
            console.error('Error generating document:', error);
            alert('Đã xảy ra lỗi khi tạo Hóa đơn GTGT!');
        }
    };

    const STATUS_MAP = {
        'CHO_XAC_NHAN': { label: 'Chờ xác nhận', color: '#d97706', icon: Clock },
        'DANG_XU_LY': { label: 'Đã xử lý xong', color: '#2563eb', icon: Package },
        'DANG_GIAO': { label: 'Đang vận chuyển', color: '#7c3aed', icon: Truck },
        'DA_GIAO': { label: 'Đã giao hàng', color: '#059669', icon: CheckCircle },
        'DA_HUY': { label: 'Đã hủy', color: '#e11d48', icon: XCircle },
    };

    const TABS = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'CHO_XAC_NHAN', label: 'Chờ xác nhận' },
        { key: 'DANG_XU_LY', label: 'Đã xử lý xong' },
        { key: 'DANG_GIAO', label: 'Đang vận chuyển' },
        { key: 'DA_GIAO', label: 'Đã giao hàng' },
        { key: 'DA_HUY', label: 'Đã hủy' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Đơn Hàng</h1>
                    <p className="text-sm text-slate-400 font-medium mt-1">
                        Theo dõi, xác nhận và xử lý toàn bộ đơn hàng từ khách hàng lẻ và doanh nghiệp.
                    </p>
                </div>
            </div>

            {/* Header Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {TABS.slice(1).map(tab => {
                    const count = orders.filter(o => o.TrangThai === tab.key).length;
                    const statusInfo = STATUS_MAP[tab.key as keyof typeof STATUS_MAP];
                    const Icon = statusInfo.icon;
                    return (
                        <div
                            key={tab.key}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
                        >
                            <div
                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"
                                style={{ backgroundColor: `${statusInfo.color}12` }}
                            ></div>
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                        {tab.label}
                                    </p>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {count}{' '}
                                        <span className="text-xs font-bold text-slate-400 ml-1">đơn</span>
                                    </h3>
                                </div>
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}
                                >
                                    <Icon size={22} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Kiện Hàng Gần Đây / Tracking Section */}
            <div className="bg-gradient-to-br from-blue-50/40 via-indigo-50/20 to-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <Truck size={22} className="animate-bounce" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Theo Dõi Kiện Hàng Mới Nhất</h2>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">Click vào kiện hàng để xem chi tiết lộ trình vận chuyển trên toàn cầu</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trackingData.map(t => {
                        const currentStep = t.steps.find(s => s.status === 'current');
                        const completedSteps = t.steps.filter(s => s.status === 'completed').length;
                        const totalSteps = t.steps.length;
                        return (
                            <div
                                key={t.code}
                                className="bg-white border border-slate-100 rounded-3xl p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group relative overflow-hidden"
                                onClick={() => {
                                    window.location.href = `/tracking?code=${t.code}`;
                                }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/20 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                                
                                <div className="relative z-10 flex-1">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                        {t.code}
                                    </span>
                                    <div className="font-extrabold text-slate-800 mt-3 text-[14px]">{t.customer}</div>
                                    <div className="text-[12px] text-slate-400 font-semibold mt-0.5">{t.product}</div>
                                    
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-400">{completedSteps}/{totalSteps} chặng</span>
                                    </div>
                                    {currentStep && (
                                        <span className="inline-block mt-3 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold shadow-sm">
                                            • {currentStep.label.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="relative z-10 bg-white p-3 rounded-2xl border border-slate-100 group-hover:border-blue-200 transition-colors shadow-sm ml-4">
                                    <QRCodeSVG value={`https://vtsc.vn/tracking/${t.code}`} size={75} bgColor="#ffffff" fgColor="#0c102a" level="M" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
                        <div className="relative w-full md:w-80 group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-none rounded-2xl px-12 py-3.5 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                                placeholder="Tìm mã đơn, khách hàng..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-2xl overflow-x-auto max-w-full">
                            {TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${activeTab === tab.key
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAdminOrEmployee && (
                            <>
                                <button
                                    onClick={exportToExcel}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[14px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 cursor-pointer"
                                >
                                    <Download size={18} /> Xuất Excel
                                </button>
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[14px] bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                                >
                                    <Plus size={18} /> Tạo đơn hàng
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest w-36 whitespace-nowrap">Mã đơn hàng</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Khách hàng</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Số lượng</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tổng tiền</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Thanh toán</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Trạng thái</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Hạn xác nhận</th>
                                <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest w-40 whitespace-nowrap">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-20 text-blue-600 font-bold">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-20 text-slate-400 font-medium italic">
                                        Không tìm thấy đơn hàng nào.
                                    </td>
                                </tr>
                            ) : filteredOrders.map(order => (
                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                                            #{order.MaDonHang}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 text-[14px]">{order.KhachHang?.TenKhachHang || 'Vãng lai'}</div>
                                        <div className="text-[12px] text-slate-400 font-medium mt-0.5">{order.KhachHang?.SDT}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium text-[14px]">
                                        {order.Items.reduce((acc, curr) => acc + curr.SoLuong, 0)} sản phẩm
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-emerald-600 text-[15px]">
                                            {order.TongTien.toLocaleString()} ₫
                                        </div>
                                        {order.KhuyenMai && (
                                            <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                🎁 {order.KhuyenMai.MaVoucher}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium text-[14px]">
                                        {order.PhuongThucThanhToan === 'TIEN_MAT' ? 'Tiền mặt' :
                                            order.PhuongThucThanhToan === 'CHUYEN_KHOAN' ? 'Chuyển khoản' :
                                                order.PhuongThucThanhToan === 'GHI_NO' ? 'Ghi nợ' :
                                                    order.PhuongThucThanhToan || 'COD'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider" style={{
                                            background: `${STATUS_MAP[order.TrangThai].color}15`,
                                            color: STATUS_MAP[order.TrangThai].color,
                                        }}>
                                            {STATUS_MAP[order.TrangThai].label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-medium">
                                        {order.TrangThai === 'CHO_XAC_NHAN' ? (
                                            <div style={{ color: new Date(order.HanXacNhan) < new Date() ? '#e11d48' : '#059669' }}>
                                                {new Date(order.HanXacNhan).toLocaleString()}
                                            </div>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            {isAdminOrEmployee && (
                                                <>
                                                    {order.TrangThai === 'CHO_XAC_NHAN' && (
                                                        <button
                                                            onClick={() => {
                                                                handleUpdateStatus(order._id, 'DANG_XU_LY');
                                                            }}
                                                            className="h-8 px-3 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer text-xs font-bold uppercase tracking-wider"
                                                            title="Xác nhận sản xuất"
                                                        >
                                                            Xác nhận
                                                        </button>
                                                    )}
                                                    {order.TrangThai === 'DANG_XU_LY' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(order._id, 'DANG_GIAO')}
                                                            className="h-8 px-3 flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer text-xs font-bold uppercase tracking-wider"
                                                            title="Giao hàng"
                                                        >
                                                            Giao hàng
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
            </div>

            {/* ═══ CREATE ORDER MODAL ═══ */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Plus size={22} className="text-blue-600" /> Tạo Đơn Hàng Mới
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
                            {/* Left: Khách hàng + sản phẩm */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Khách hàng */}
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                                            Khách hàng <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer"
                                            value={selectedCustomerId}
                                            onChange={e => handleSelectCustomer(e.target.value)}
                                        >
                                            <option value="">-- Chọn khách hàng --</option>
                                            {customers.map(c => (
                                                <option key={c._id} value={c._id} className="text-slate-800 bg-white">
                                                    [{c.MaKH}] {c.TenKhachHang} — {c.SDT} ({c.PhanLoai || 'Chưa phân loại'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Khuyến mãi */}
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                                            Chương trình ưu đãi
                                        </label>
                                        <select
                                            className={`w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer ${calculatedDiscount > 0 ? 'ring-2 ring-emerald-500/20' : ''}`}
                                            value={selectedPromotionId}
                                            onChange={e => setSelectedPromotionId(e.target.value)}
                                        >
                                            <option value="">-- Không sử dụng ưu đãi --</option>
                                            {promotions.map(p => (
                                                <option key={p._id} value={p._id} disabled={orderSubtotal < p.DonHangToiThieu} className="text-slate-800 bg-white">
                                                    {p.MaVoucher} — {p.LoaiGiamGia === 'PHAN_TRAM' ? `Giảm ${p.MucGiam}%` : `Giảm ${p.MucGiam.toLocaleString()}₫`} {orderSubtotal < p.DonHangToiThieu ? `(Thiếu ${(p.DonHangToiThieu - orderSubtotal).toLocaleString()}₫)` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Thêm sản phẩm */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                                        Sản phẩm sơn <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="flex gap-3 relative">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-[14px] text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium cursor-text"
                                                placeholder="-- Nhập chữ để tìm dòng sơn --"
                                                value={selectedProductId && !productSearchTerm ? (allProducts.find(p => p._id === selectedProductId)?.TenDongSon || '') : productSearchTerm}
                                                onChange={e => {
                                                    setProductSearchTerm(e.target.value);
                                                    if (selectedProductId) {
                                                        setSelectedProductId('');
                                                        setSelectedColorCode('');
                                                        setColorSearchTerm('');
                                                    }
                                                    setIsProductDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsProductDropdownOpen(true)}
                                                onBlur={() => setTimeout(() => setIsProductDropdownOpen(false), 250)}
                                            />
                                            {isProductDropdownOpen && (
                                                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 py-2">
                                                    {allProducts
                                                        .filter(p => (p.TongTonKho || 0) > 0 && (!productSearchTerm || p.TenDongSon.toLowerCase().includes(productSearchTerm.toLowerCase())))
                                                        .map(p => (
                                                            <div
                                                                key={p._id}
                                                                className="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50/50 last:border-none text-[13px] font-medium text-slate-700 transition-colors"
                                                                onClick={() => {
                                                                    setSelectedProductId(p._id);
                                                                    setProductSearchTerm(p.TenDongSon);
                                                                    setIsProductDropdownOpen(false);
                                                                }}
                                                            >
                                                                {p.TenDongSon} — {p.DonGiaCoSo.toLocaleString()}₫ <span className="text-emerald-600 font-bold ml-1">(Kho: {p.TongTonKho || 0})</span>
                                                            </div>
                                                        ))}
                                                    {allProducts.filter(p => (p.TongTonKho || 0) > 0 && (!productSearchTerm || p.TenDongSon.toLowerCase().includes(productSearchTerm.toLowerCase()))).length === 0 && (
                                                        <div className="px-5 py-4 text-[13px] text-slate-400 italic">Không tìm thấy dòng sơn nào phù hợp</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleAddProduct}
                                            disabled={!selectedProductId || !selectedColorCode}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-[14px] hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-55 disabled:cursor-not-allowed transition-all cursor-pointer border-none shrink-0"
                                        >
                                            Thêm sản phẩm
                                        </button>
                                    </div>

                                    {/* Bảng màu sơn - dạng Combobox */}
                                    {selectedProductId && (
                                        <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-3 relative">
                                            <label className="text-[11px] font-black text-slate-450 uppercase tracking-wider block">
                                                Mã màu sơn <span className="text-rose-500">*</span>
                                            </label>
                                            
                                            <div className="relative">
                                                <div 
                                                    className="w-full bg-white border border-slate-200 hover:border-blue-400 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between cursor-pointer transition-all shadow-sm"
                                                    onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                                                >
                                                    {selectedColorCode ? (() => {
                                                        const c = paintColors.find(pc => pc.code === selectedColorCode);
                                                        return c ? (
                                                            <div className="flex items-center gap-3 w-full">
                                                                <div className="w-7 h-7 rounded-md shadow-inner border border-slate-200" style={{ background: c.hex }} />
                                                                <div className="font-bold text-slate-700 flex-1">{c.code} <span className="text-slate-400 font-normal ml-2">{c.name}</span></div>
                                                                <span 
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedColorCode(''); setColorSearchTerm(''); }}
                                                                    className="text-slate-400 hover:text-rose-500 p-1 font-bold text-lg"
                                                                >
                                                                    ×
                                                                </span>
                                                            </div>
                                                        ) : <span className="text-slate-400">Chọn mã màu...</span>;
                                                    })() : <span className="text-slate-400">Nhấp để chọn mã màu...</span>}
                                                    {!selectedColorCode && <span className="text-slate-400 text-xs">▼</span>}
                                                </div>

                                                {isColorDropdownOpen && (
                                                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-150 rounded-xl shadow-xl overflow-hidden z-50">
                                                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                                                placeholder="Tìm mã màu hoặc tên (VD: RAL, Silver)..."
                                                                value={colorSearchTerm}
                                                                onChange={e => setColorSearchTerm(e.target.value)}
                                                                onClick={e => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
                                                            {paintColors
                                                                .filter(c => {
                                                                    if (!colorSearchTerm) return true;
                                                                    const q = colorSearchTerm.toLowerCase();
                                                                    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
                                                                })
                                                                .map(c => (
                                                                    <div
                                                                        key={c.code}
                                                                        onClick={() => { 
                                                                            setSelectedColorCode(c.code); 
                                                                            setColorSearchTerm(''); 
                                                                            setIsColorDropdownOpen(false); 
                                                                        }}
                                                                        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-blue-50 border-b border-slate-50 last:border-none transition-colors"
                                                                    >
                                                                        <div className="w-7 h-7 rounded-md shadow-inner border border-slate-200 flex-shrink-0" style={{ background: c.hex }} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-[13px] font-bold text-slate-700">{c.code}</div>
                                                                            <div className="text-[11px] text-slate-400 truncate">{c.name} • {c.category}</div>
                                                                        </div>
                                                                        <div className="text-[11px] font-semibold text-slate-400">{c.surface}</div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Danh sách sản phẩm đã chọn */}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-150">
                                                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                                                    <th className="px-4 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Mã màu</th>
                                                    <th className="px-4 py-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Số lượng</th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Đơn giá</th>
                                                    <th className="px-4 py-3 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">Thành tiền</th>
                                                    <th className="px-4 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {orderItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-405 font-medium italic text-sm">
                                                            Chưa có sản phẩm nào được chọn
                                                        </td>
                                                    </tr>
                                                ) : orderItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-slate-800 text-xs">{item.tenSanPham}</div>
                                                            <div className="text-[10px] text-slate-400">Kho: {item.tonKho} thùng</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center gap-1.5 justify-center">
                                                                <div className="w-4 h-4 rounded-md shadow-inner border border-slate-200 flex-shrink-0" style={{ background: item.hexCode }} />
                                                                <span className="text-[11px] font-black text-slate-700">{item.maMau}</span>
                                                            </div>
                                                            <div className="text-[9px] text-slate-400">{item.tenMau}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleItemQtyChange(idx, item.soLuong - 1)}
                                                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer border-none font-bold text-sm"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    value={item.soLuong}
                                                                    onChange={e => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                                                                    className="w-12 text-center bg-slate-50 border border-slate-150 rounded-lg py-1 font-bold text-slate-805 text-xs outline-none"
                                                                    min={1}
                                                                    max={item.tonKho}
                                                                />
                                                                <button
                                                                    onClick={() => handleItemQtyChange(idx, item.soLuong + 1)}
                                                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex items-center justify-center cursor-pointer border-none font-bold text-sm"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-[12px] font-semibold text-slate-700">
                                                            {item.donGia.toLocaleString()} ₫
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-[12px] font-black text-blue-600">
                                                            {(item.donGia * item.soLuong).toLocaleString()} ₫
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleRemoveItem(idx)}
                                                                className="text-slate-400 hover:text-rose-500 transition-colors bg-transparent border-none cursor-pointer"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {orderItems.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-slate-50/50 font-black text-slate-700 border-t border-slate-150">
                                                        <td colSpan={4} className="px-4 py-3.5 text-right text-xs uppercase tracking-wider">Tổng cộng sản phẩm:</td>
                                                        <td className="px-4 py-3.5 text-right text-sm text-emerald-600 font-black">
                                                            {orderSubtotal.toLocaleString()} ₫
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>

                                {/* THÔNG SỐ KỸ THUẬT SƠN */}
                                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-4">
                                    <div className="text-[12px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        <Layers size={16} /> Thông số kỹ thuật sơn (MERN)
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Loại bột sơn</label>
                                            <input type="text" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={loaiBot} onChange={e => setLoaiBot(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Nhiệt độ sấy</label>
                                            <input type="text" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={nhietDoSay} onChange={e => setNhietDoSay(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Độ dày lớp phủ</label>
                                            <input type="text" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={doDayLopPhu} onChange={e => setDoDayLopPhu(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 flex justify-between items-center">
                                                <span>Diện tích sơn (m2)</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCalculatorOpen(true)}
                                                    className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-2 py-0.5 cursor-pointer transition-colors flex items-center gap-1"
                                                >
                                                    <Calculator size={10} /> Công cụ tính
                                                </button>
                                            </label>
                                            <input type="number" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={tongDienTichSon} onChange={e => setTongDienTichSon(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Thông tin giao hàng + thanh toán */}
                            <div className="lg:col-span-5 flex flex-col gap-6 lg:border-l lg:border-slate-100 lg:pl-8">
                                {/* Địa chỉ giao hàng */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                                        Địa chỉ giao hàng <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium resize-none min-h-[80px]"
                                        placeholder="Nhập địa chỉ giao hàng chi tiết..."
                                        value={diaChiGiaoHang}
                                        onChange={e => setDiaChiGiaoHang(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* SĐT người nhận */}
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                                            SĐT người nhận <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                                            placeholder="VD: 0912345678"
                                            value={sdtNguoiNhan}
                                            onChange={e => setSdtNguoiNhan(e.target.value)}
                                        />
                                    </div>

                                    {/* Nhân viên phụ trách */}
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">
                                            Nhân viên sales phụ trách
                                        </label>
                                        <select
                                            className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium cursor-pointer"
                                            value={selectedSalespersonId}
                                            onChange={e => setSelectedSalespersonId(e.target.value)}
                                        >
                                            <option value="">-- Chọn nhân viên --</option>
                                            {allStaff.filter(s => s.BoPhan === 'Kinh doanh' || s.BoPhan === 'Sale / MKT' || s.BoPhan === 'CSKH Bảo Hành').map(s => (
                                                <option key={s._id} value={s._id} className="text-slate-800 bg-white">{s.MaNV} - {s.HoTen}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Phương thức thanh toán */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3 block">
                                        Phương thức thanh toán
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PAYMENT_METHODS.map(pm => {
                                            const PMIcon = pm.icon;
                                            const isActive = phuongThucTT === pm.key;
                                            return (
                                                <button
                                                    key={pm.key}
                                                    type="button"
                                                    onClick={() => setPhuongThucTT(pm.key)}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer gap-2 ${isActive
                                                        ? 'border-blue-600 bg-blue-50/50 text-blue-600 font-bold shadow-sm'
                                                        : 'border-slate-100 bg-slate-50/30 text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <PMIcon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                                    <span className="text-[11px] whitespace-nowrap">{pm.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CHI PHÍ BỔ SUNG & ĐẶT CỌC */}
                                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Phụ phí (Đóng gói/VC)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-sm text-amber-600 font-bold outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                                            value={phuPhi}
                                            onChange={e => setPhuPhi(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Số tiền đã cọc</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-100 rounded-xl px-3 py-2 text-sm text-emerald-600 font-bold outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                                            value={daCoc}
                                            onChange={e => setDaCoc(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {/* Ghi chú */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Ghi chú đơn hàng</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium resize-none min-h-[60px]"
                                        placeholder="Nhập ghi chú khác (tùy chọn)..."
                                        value={ghiChu}
                                        onChange={e => setGhiChu(e.target.value)}
                                    />
                                </div>

                                {/* Tổng kết & Xác nhận */}
                                <div className="border-t border-slate-100 pt-6 mt-auto space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-400">Trạng thái:</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-50 text-amber-600">Chờ xác nhận</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-400">Thanh toán:</span>
                                        <span className="text-slate-800 font-bold">{PAYMENT_METHODS.find(p => p.key === phuongThucTT)?.label}</span>
                                    </div>
                                    {calculatedDiscount > 0 && (
                                        <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                                            <span>Chiết khấu ưu đãi:</span>
                                            <span className="font-black">-{calculatedDiscount.toLocaleString()} ₫</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">TỔNG THANH TOÁN:</span>
                                        <span className="text-2xl font-black text-emerald-600">{(orderSubtotal + phuPhi - calculatedDiscount).toLocaleString()} ₫</span>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={isSubmittingOrder}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                    >
                                        {isSubmittingOrder ? (
                                            'ĐANG TẠO ĐƠN HÀNG...'
                                        ) : (
                                            <><CheckCircle size={18} /> TẠO ĐƠN HÀNG</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ DETAILS MODAL ═══ */}
            {isDetailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Custom Header with Back Button */}
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none"
                                >
                                    <ArrowLeft size={14} /> Quay lại
                                </button>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Chi tiết đơn hàng #{selectedOrder.MaDonHang}</h3>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-50 text-blue-600">
                                {STATUS_MAP[selectedOrder.TrangThai].label}
                            </span>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* I. THÔNG TIN KHÁCH HÀNG & SẢN PHẨM */}
                                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:shadow-sm transition-all space-y-4">
                                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <User size={14} /> I. Thông tin khách hàng
                                    </h4>
                                    <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Khách hàng:</span>
                                            <span className="font-bold text-slate-800">{selectedOrder.KhachHang?.TenKhachHang || 'Khách vãng lai'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Số điện thoại:</span>
                                            <span className="text-slate-800">{selectedOrder.KhachHang?.SDT || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Sản phẩm:</span>
                                            <span className="font-bold text-slate-800">{selectedOrder.Items?.[0]?.TenSanPham} ({selectedOrder.Items?.reduce((s, i) => s + i.SoLuong, 0)} thùng)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Diện tích sơn:</span>
                                            <span className="font-bold text-amber-600">{selectedOrder.TongDienTichSon || 0} m2</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Ngày tạo:</span>
                                            <span className="text-slate-800">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* II. THÔNG SỐ KỸ THUẬT SƠN (MERN) */}
                                <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl hover:shadow-sm transition-all space-y-4">
                                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-slate-100">
                                        <Layers size={14} /> II. Thông số kỹ thuật sơn
                                    </h4>
                                    <div className="space-y-2.5 text-[13px] font-medium text-slate-600">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Mã màu chọn:</span>
                                            <span className="font-black text-blue-600">{selectedOrder.Items?.[0]?.MaMau || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Loại bột:</span>
                                            <span className="text-slate-800">{selectedOrder.TechnicalSpecs?.LoaiBot || 'AkzoNobel Interpon'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Nhiệt độ sấy:</span>
                                            <span className="text-slate-800">{selectedOrder.TechnicalSpecs?.NhietDoSay || '195°C / 15 phút'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Độ dày lớp phủ:</span>
                                            <span className="text-slate-800">{selectedOrder.TechnicalSpecs?.DoDayLopPhu || '75 µm'}</span>
                                        </div>
                                        <div className="pt-2">
                                            <button className="px-3 py-1.5 bg-white border border-blue-150 hover:bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-sm transition-colors cursor-pointer">
                                                📈 Xem biểu đồ hiệu suất
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* III. THÔNG TIN THANH TOÁN (PAYMENT) */}
                            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                                    <CreditCard size={14} /> III. Thông tin thanh toán (Payment)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-150">
                                    <div className="space-y-3 text-[13px] font-medium text-slate-650">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Đơn giá / m2:</span>
                                            <span className="text-slate-800">{(selectedOrder.TongTien / (selectedOrder.TongDienTichSon || 1)).toLocaleString()}đ / m2</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Thành tiền sản phẩm:</span>
                                            <span className="text-slate-800">{(selectedOrder.TongTien - (selectedOrder.PhuPhi || 0)).toLocaleString()}đ</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Phụ phí (đóng gói/VC):</span>
                                            <span className="text-slate-800">{(selectedOrder.PhuPhi || 0).toLocaleString()}đ</span>
                                        </div>
                                        {selectedOrder.GiamGia !== undefined && selectedOrder.GiamGia > 0 && (
                                            <div className="flex justify-between text-emerald-600 font-bold">
                                                <span>Chiết khấu ({selectedOrder.KhuyenMai?.MaVoucher || 'Voucher'}):</span>
                                                <span>-{(selectedOrder.GiamGia || 0).toLocaleString()}đ</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-slate-100 pt-3 text-[14px]">
                                            <span className="font-bold text-slate-900">TỔNG CỘNG:</span>
                                            <span className="font-black text-emerald-600">{selectedOrder.TongTien.toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-[13px] font-medium text-slate-650 pt-4 md:pt-0 md:pl-8">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-400">Khách đã đặt cọc:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900">{(selectedOrder.DaCoc || 0).toLocaleString()}đ ({Math.round(((selectedOrder.DaCoc || 0) / selectedOrder.TongTien) * 100)}%)</span>
                                                {selectedOrder.TrangThai === 'CHO_XAC_NHAN' && (
                                                    <button
                                                        onClick={() => {
                                                            setDepositAmount(selectedOrder.DaCoc || 0);
                                                            setIsPaymentModalOpen(true);
                                                        }}
                                                        className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-slate-50 rounded-lg text-[10px] font-bold tracking-wider cursor-pointer transition-colors shadow-sm"
                                                    >
                                                        Cập nhật
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-100 pt-4 text-[16px]">
                                            <span className="font-bold text-slate-900">SỐ TIỀN CÒN LẠI:</span>
                                            <span className="font-black text-rose-500">{Math.max(0, selectedOrder.TongTien - (selectedOrder.DaCoc || 0)).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline / Action Section */}
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                                    <Calendar size={18} className="text-blue-500" />
                                    <div className="flex-1 text-sm font-medium text-slate-700">
                                        <span className="text-slate-400">[{new Date(selectedOrder.createdAt).toLocaleDateString()}]</span> Đã đặt cọc đơn hàng <span className="font-bold text-emerald-600">[{(selectedOrder.DaCoc || 0).toLocaleString()}đ]</span>
                                    </div>
                                    <button
                                        onClick={handleDownloadPhieuCoc}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                        disabled={isPrinting}
                                    >
                                        <FileCheck size={14} /> In Phiếu Cọc
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                                    <FileText size={18} className="text-purple-500" />
                                    <div className="flex-1 text-sm font-medium text-slate-700">
                                        <span className="text-slate-400">[{new Date().toLocaleDateString()}]</span> Tiến độ sản xuất & Vận chuyển hàng hóa
                                    </div>
                                    {selectedOrder.TrangThai === 'CHO_XAC_NHAN' && (
                                        <button
                                            onClick={() => {
                                                handleUpdateStatus(selectedOrder._id, 'DANG_XU_LY');
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border-none"
                                        >
                                            Bắt đầu sản xuất
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDownloadHoaDonGTGT}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-emerald-650 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                        disabled={isPrinting}
                                    >
                                        <Printer size={14} /> In Hóa Đơn GTGT
                                    </button>
                                </div>
                            </div>

                            {/* Status Control Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                                {selectedOrder.TrangThai !== 'DA_GIAO' && selectedOrder.TrangThai !== 'DA_HUY' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder._id, 'DA_HUY')}
                                        className="px-5 py-2.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Hủy đơn hàng
                                    </button>
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
                                <tbody>
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
                                </tbody>
                            </table>

                            <div style={{ border: '1px solid #ddd', padding: '5mm', marginBottom: '10mm' }}>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '2mm' }}>III. CHI TIẾT THANH TOÁN</h3>
                                <table style={{ width: '100%' }}>
                                    <tbody>
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
                                    </tbody>
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                                <Truck size={20} className="text-purple-600" /> Điều phối tài xế giao hàng
                            </h3>
                            <button
                                onClick={() => setIsDriverModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Vui lòng chọn tài xế từ bộ phận <strong>Nhân viên Kỹ thuật (Kho / Logistics)</strong> để bắt đầu quá trình vận chuyển.
                            </p>

                            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                                {drivers.map(driver => (
                                    <div
                                        key={driver._id}
                                        onClick={() => setSelectedDriverId(driver._id)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${selectedDriverId === driver._id
                                            ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                                            : 'border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                            <User size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-[13px] text-slate-805">{driver.HoTen}</div>
                                            <div className="text-[11px] text-slate-400 truncate">{driver.BoPhan} • SĐT: {driver.SDT}</div>
                                        </div>
                                        {selectedDriverId === driver._id && <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />}
                                    </div>
                                ))}
                                {drivers.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 font-medium italic text-xs">
                                        Không tìm thấy nhân viên Kỹ thuật phù hợp ở bộ phận Kho/Logistics.
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button onClick={() => setIsDriverModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-bold text-xs transition-colors cursor-pointer">Hủy</button>
                                <button
                                    onClick={() => pendingStatusUpdate && handleUpdateStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, selectedDriverId)}
                                    disabled={!selectedDriverId}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer border-none"
                                >
                                    Xác nhận giao hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PAINT CALCULATOR MODAL ═══ */}
            {isCalculatorOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <Calculator size={20} className="text-blue-600" /> Tính diện tích bề mặt sơn
                            </h3>
                            <button
                                onClick={() => setIsCalculatorOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
                            >
                                ×
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                            {/* Unit Toggle */}
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl">
                                <span className="text-xs font-semibold text-slate-500 pl-2">Đơn vị đo lường</span>
                                <div className="flex gap-1 p-0.5 bg-slate-200/50 rounded-xl">
                                    <button onClick={() => setCalcUnit('m')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${calcUnit === 'm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 bg-transparent'}`}>Mét (m)</button>
                                    <button onClick={() => setCalcUnit('ft')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${calcUnit === 'ft' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 bg-transparent'}`}>Feet (ft)</button>
                                </div>
                            </div>

                            {/* Walls Section */}
                            <div className="space-y-3">
                                <div className="text-xs font-black text-blue-600 uppercase tracking-wider">
                                    Bề mặt tường ({calcWalls.length})
                                </div>
                                <div className="space-y-3">
                                    {calcWalls.map((wall, index) => (
                                        <div key={wall.id} className="flex gap-2 items-center">
                                            <div className="relative flex-1">
                                                <input type="number" placeholder="Chiều dài" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={wall.length} onChange={(e) => updateCalcItem(wall.id, 'length', e.target.value, 'wall')} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{calcUnit}</span>
                                            </div>
                                            <div className="relative flex-1">
                                                <input type="number" placeholder="Chiều cao" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={wall.height} onChange={(e) => updateCalcItem(wall.id, 'height', e.target.value, 'wall')} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{calcUnit}</span>
                                            </div>
                                            {calcWalls.length > 1 && (
                                                <button onClick={() => handleRemoveCalcItem(wall.id, 'wall')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={handleAddCalcWall} className="w-full py-2.5 bg-white border border-dashed border-blue-200 hover:bg-blue-50/50 text-blue-650 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                        <Plus size={14} /> Thêm diện tích tường
                                    </button>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            <div className="space-y-3">
                                <div className="text-xs font-black text-rose-500 uppercase tracking-wider">
                                    Diện tích khấu trừ (Cửa đi / Cửa sổ) ({calcDeductions.length})
                                </div>
                                <div className="space-y-3">
                                    {calcDeductions.map((ded, index) => (
                                        <div key={ded.id} className="flex gap-2 items-center">
                                            <div className="relative flex-1">
                                                <input type="number" placeholder="Chiều dài" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={ded.length} onChange={(e) => updateCalcItem(ded.id, 'length', e.target.value, 'deduction')} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{calcUnit}</span>
                                            </div>
                                            <div className="relative flex-1">
                                                <input type="number" placeholder="Chiều cao" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-medium" value={ded.height} onChange={(e) => updateCalcItem(ded.id, 'height', e.target.value, 'deduction')} />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{calcUnit}</span>
                                            </div>
                                            <button onClick={() => handleRemoveCalcItem(ded.id, 'deduction')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                    <button onClick={handleAddCalcDeduction} className="w-full py-2.5 bg-white border border-dashed border-rose-200 hover:bg-rose-50/50 text-rose-500 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                                        <Plus size={14} /> Thêm cửa sổ / cửa đi
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Results */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0 space-y-4">
                            <div className="space-y-2 text-xs font-semibold text-slate-500">
                                <div className="flex justify-between">
                                    <span>Diện tích tường khả dụng:</span>
                                    <span className="text-slate-800 font-bold">{calculatedResult.area} m²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Định mức che phủ kỹ thuật:</span>
                                    <span className="text-slate-800 font-bold">12.3 m² / Lít (2 lớp phủ)</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-end border-t border-slate-200/60 pt-3">
                                <span className="text-xs font-black text-slate-900 uppercase">Khối lượng sơn ước tính:</span>
                                <span className="text-2xl font-black text-blue-600">{calculatedResult.liters} Lít</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setIsCalculatorOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-bold text-xs transition-colors cursor-pointer">Hủy</button>
                                <button
                                    onClick={() => {
                                        setTongDienTichSon(calculatedResult.area);
                                        setIsCalculatorOpen(false);
                                    }}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                >
                                    <FileCheck size={16} /> Áp dụng kết quả
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PAYMENT MODAL ═══ */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <CreditCard size={20} className="text-amber-500" /> Cập nhật tiền cọc
                            </h3>
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors text-xl font-bold cursor-pointer border-none bg-transparent"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Số tiền cọc thực nhận (VNĐ)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-xl font-black text-right text-emerald-600 outline-none focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                                />
                                <div className="flex gap-2">
                                    {[0.3, 0.5, 1].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setDepositAmount(Math.round(selectedOrder!.TongTien * p))}
                                            className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                        >
                                            {p * 100}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                * Cập nhật số tiền đặt cọc là điều kiện bắt buộc để hệ thống xác nhận hóa đơn và hiển thị nút lệnh <strong>Bắt đầu sản xuất</strong>.
                            </p>

                            <div className="flex gap-3 pt-4 border-t border-slate-50">
                                <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-bold text-xs transition-colors cursor-pointer">Hủy</button>
                                <button onClick={handleUpdateDeposit} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer border-none">Xác nhận thanh toán</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
