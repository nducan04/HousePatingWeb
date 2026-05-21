const DonHang = require('../models/DonHang');
const SanPhamSon = require('../models/SanPhamSon');
const GioHang = require('../models/GioHang');
const KhuyenMai = require('../models/KhuyenMai');
const VanChuyen = require('../models/VanChuyen');
const NhanVien = require('../models/NhanVien');
const mongoose = require('mongoose');

// @desc    Checkout from cart
// @route   POST /api/don-hang/checkout
exports.checkoutFromCart = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { sessionId, khachHangId, diaChiGiaoHang, discountCode, ghiChu } = req.body;

        // 1. Lấy giỏ hàng
        const cart = await GioHang.findOne({ SessionId: sessionId }).populate('Items.SanPham');
        if (!cart || cart.Items.length === 0) throw new Error('Giỏ hàng trống');

        // 2. Tính toán tiền và check kho
        let orderItems = [];
        let subtotal = 0;

        for (let item of cart.Items) {
            const sp = await SanPhamSon.findById(item.SanPham._id).session(session);
            if (!sp) throw new Error(`Sản phẩm ${item.SanPham.TenDongSon} không còn tồn tại`);

            const colorSKU = sp.DanhSachMaMau.find(m => m.MaMau === item.MaMau);
            if (!colorSKU) throw new Error(`Sản phẩm ${sp.TenDongSon} không hỗ trợ mã màu ${item.MaMau}`);

            if (colorSKU.TonKhoKhaDung < item.SoLuong) {
                throw new Error(`Sản phẩm ${sp.TenDongSon} màu ${item.MaMau} không đủ tồn kho (Còn: ${colorSKU.TonKhoKhaDung} Thùng)`);
            }

            // Trừ tồn kho khả dụng, cộng tồn kho tạm giữ (giữ chỗ)
            colorSKU.TonKhoKhaDung -= item.SoLuong;
            colorSKU.TonKhoTamGiu += item.SoLuong;
            sp.SoLuongDaBan += item.SoLuong;
            await sp.save({ session });

            orderItems.push({
                SanPham: sp._id,
                TenSanPham: sp.TenDongSon,
                MaMau: item.MaMau,
                SoLuong: item.SoLuong,
                DonGia: sp.DonGiaCoSo,
                ThanhTien: sp.DonGiaCoSo * item.SoLuong
            });
            subtotal += sp.DonGiaCoSo * item.SoLuong;
        }

        // 3. Xử lý mã giảm giá (Voucher)
        let discountAmount = 0;
        if (discountCode) {
            const voucher = await KhuyenMai.findOne({ MaVoucher: discountCode.toUpperCase() }).session(session);
            if (voucher && voucher.TrangThai === 'DANG_DIEN_RA') {
                if (subtotal >= voucher.DonHangToiThieu) {
                    if (voucher.LoaiGiamGia === 'PHAN_TRAM') {
                        discountAmount = (subtotal * voucher.MucGiam) / 100;
                        if (voucher.GiamToiDa > 0 && discountAmount > voucher.GiamToiDa) discountAmount = voucher.GiamToiDa;
                    } else if (voucher.LoaiGiamGia === 'GIAM_THANG') {
                        discountAmount = voucher.MucGiam;
                    }
                    
                    // Cập nhật lượt dùng voucher
                    voucher.SoLuongDaDung += 1;
                    if (voucher.SoLuongDaDung >= voucher.SoLuongToiDa) voucher.TrangThai = 'DA_KET_THUC';
                    await voucher.save({ session });
                }
            }
        }

        // 4. Tạo đơn hàng
        const maDonHang = `DH${Date.now().toString().slice(-8)}`;
        const donHang = new DonHang({
            MaDonHang: maDonHang,
            KhachHang: khachHangId,
            Items: orderItems,
            TongTien: subtotal - discountAmount,
            TrangThai: 'CHO_XAC_NHAN',
            DiaChiGiaoHang: diaChiGiaoHang,
            GhiChu: ghiChu
        });

        await donHang.save({ session });

        // 5. Xóa giỏ hàng
        await GioHang.findOneAndDelete({ SessionId: sessionId }).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, data: donHang, message: 'Đặt hàng thành công!' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get all orders with filtering
exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        // RBAC: Khách hàng chỉ thấy đơn của mình
        if (req.user && (req.user.VaiTro === 'KhachHangB2C' || req.user.VaiTro === 'KhachHangB2B')) {
            const KhachHang = require('../models/KhachHang');
            const kh = await KhachHang.findOne({ AccountID: req.user._id });
            if (kh) query.KhachHang = kh._id;
            else return res.status(200).json({ success: true, count: 0, data: [] });
        }

        if (status && status !== 'ALL') {
            query.TrangThai = status;
        }

        const orders = await DonHang.find(query)
            .populate('KhachHang', 'MaKH TenKhachHang DiaChi SDT')
            .populate('KhuyenMai', 'MaVoucher LoaiGiamGia MucGiam')
            .populate('NhanVienPhuTrach', 'MaNV HoTen')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single order
exports.getOrderById = async (req, res) => {
    try {
        const order = await DonHang.findById(req.params.id)
            .populate('KhachHang')
            .populate('Items.SanPham')
            .populate('KhuyenMai')
            .populate('NhanVienPhuTrach', 'MaNV HoTen');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create order (Manual/Seeding)
exports.createOrder = async (req, res) => {
    try {
        const { khuyenMaiId, ...rest } = req.body;
        const orderData = { ...rest };

        if (khuyenMaiId) {
            const voucher = await KhuyenMai.findById(khuyenMaiId);
            if (voucher && voucher.TrangThai === 'DANG_DIEN_RA') {
                orderData.KhuyenMai = khuyenMaiId;
                // Note: The discount amount (GiamGia) should be provided by the frontend 
                // but we could also calculate it here for extra safety.
                // For now, let's assume the frontend sends the calculated GiamGia.
                
                // Update voucher used count
                voucher.SoLuongDaDung += 1;
                if (voucher.SoLuongDaDung >= voucher.SoLuongToiDa) voucher.TrangThai = 'DA_KET_THUC';
                await voucher.save();
            }
        }

        const order = new DonHang(orderData);
        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update Order Status
exports.updateStatus = async (req, res) => {
    let session = null;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (sessionError) {
        console.warn('MongoDB Transactions not supported or replica set not ready. Proceeding without transaction.');
        session = null;
    }

    try {
        const { id } = req.params;
        const { status, taiXeId, sdtTaiXe } = req.body;

        const order = await DonHang.findById(id).session(session);
        if (!order) throw new Error('Không tìm thấy đơn hàng');

        const oldStatus = order.TrangThai;

        // 1. Nếu đơn hàng được giao (DANG_GIAO hoặc DA_GIAO), trừ tồn kho tạm giữ
        if ((status === 'DANG_GIAO' || status === 'DA_GIAO') && (oldStatus === 'CHO_XAC_NHAN' || oldStatus === 'DANG_XU_LY')) {
            for (let item of order.Items) {
                const sp = await SanPhamSon.findById(item.SanPham).session(session);
                if (sp) {
                    const colorSKU = sp.DanhSachMaMau.find(m => m.MaMau === item.MaMau);
                    if (colorSKU) {
                        colorSKU.TonKhoTamGiu = Math.max(0, colorSKU.TonKhoTamGiu - item.SoLuong);
                        await sp.save({ session });
                    }
                }
            }
        }

        // 2. Nếu đơn hàng bị HỦY (DA_HUY), hoàn trả lại kho khả dụng tương ứng
        if (status === 'DA_HUY') {
            if (oldStatus === 'CHO_XAC_NHAN' || oldStatus === 'DANG_XU_LY') {
                // Hủy trước khi xuất kho giao hàng: Trả về Khả dụng, giảm Tạm giữ, giảm Số lượng đã bán
                for (let item of order.Items) {
                    const sp = await SanPhamSon.findById(item.SanPham).session(session);
                    if (sp) {
                        const colorSKU = sp.DanhSachMaMau.find(m => m.MaMau === item.MaMau);
                        if (colorSKU) {
                            colorSKU.TonKhoKhaDung += item.SoLuong;
                            colorSKU.TonKhoTamGiu = Math.max(0, colorSKU.TonKhoTamGiu - item.SoLuong);
                            sp.SoLuongDaBan = Math.max(0, sp.SoLuongDaBan - item.SoLuong);
                            await sp.save({ session });
                        }
                    }
                }
            } else if (oldStatus === 'DANG_GIAO' || oldStatus === 'DA_GIAO') {
                // Hủy sau khi đã xuất kho/giao hàng (Khách trả lại): Trả về Khả dụng, không động đến Tạm giữ nữa
                for (let item of order.Items) {
                    const sp = await SanPhamSon.findById(item.SanPham).session(session);
                    if (sp) {
                        const colorSKU = sp.DanhSachMaMau.find(m => m.MaMau === item.MaMau);
                        if (colorSKU) {
                            colorSKU.TonKhoKhaDung += item.SoLuong;
                            sp.SoLuongDaBan = Math.max(0, sp.SoLuongDaBan - item.SoLuong);
                            await sp.save({ session });
                        }
                    }
                }
            }
        }

        order.TrangThai = status;
        await order.save({ session });

        // AUTOMATIC TRACKING CREATION
        if (status === 'DANG_GIAO') {
            const existingTracking = await VanChuyen.findOne({ DonHang: order._id }).session(session);
            if (!existingTracking) {
                // Nếu chưa có tài xế chỉ định, tìm ngẫu nhiên từ phòng Kho / Logistic / Vận tải
                let finalTaiXeId = taiXeId;
                let finalSdtTaiXe = sdtTaiXe;

                if (!finalTaiXeId) {
                    const candidates = await NhanVien.find({
                        BoPhan: { $in: ['Kho', 'Logistic', 'Vận tải', 'Giao nhận'] },
                        TrangThai: 'Đang làm'
                    }).session(session);

                    if (candidates.length > 0) {
                        const randomDriver = candidates[Math.floor(Math.random() * candidates.length)];
                        finalTaiXeId = randomDriver._id;
                        finalSdtTaiXe = randomDriver.SDT;
                        console.log(`[Auto-Logistics] Assigned random driver: ${randomDriver.HoTen}`);
                    }
                }

                // Tạo mã vận chuyển
                const maVC = `DEL-${order.MaDonHang}-${Date.now().toString().slice(-4)}`;
                
                // Chuẩn bị dữ liệu lô hàng từ Items
                const mauSon = order.Items.length > 0 ? order.Items[0].MaMau : 'N/A';
                const soKien = order.Items.reduce((acc, current) => acc + current.SoLuong, 0);

                await VanChuyen.create([{
                    MaVanChuyen: maVC,
                    DonHang: order._id,
                    LoHang: {
                        SoKien: soKien,
                        KhoiLuong: order.TongDienTichSon ? Math.round(order.TongDienTichSon * 1.5) : 100,
                        MauSon: mauSon
                    },
                    VanChuyenInfo: {
                        NhanVien: finalTaiXeId || null, 
                        SDT: finalSdtTaiXe || '098.xxx.xxxx',
                        PhiVC: order.PhuPhi || 0
                    },
                    LoTrinh: [
                        { ThoiGian: new Date(), NoiDung: 'Đã xuất xưởng - Đang bắt đầu quá trình vận chuyển.', Status: 'COMPLETE', Icon: 'Package' }
                    ],
                    TrangThaiTongQuat: 'Đang giao hàng',
                    DuKienBanGiao: new Date(Date.now() + 2 * 60 * 60 * 1000)
                }], { session });
            }
        }

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        res.status(200).json({ success: true, message: `Cập nhật trạng thái thành ${status}`, data: order });
    } catch (error) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error('Update Status Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update Payment Status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        const order = await DonHang.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        order.TrangThaiThanhToan = paymentStatus;
        await order.save();

        res.status(200).json({ success: true, message: 'Cập nhật trạng thái thanh toán thành công', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update Deposit Amount
exports.updateDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        const order = await DonHang.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        order.DaCoc = amount;
        
        // Update payment status automatically based on amount
        if (order.DaCoc >= order.TongTien) {
            order.TrangThaiThanhToan = 'DA_THANH_TOAN';
        } else if (order.DaCoc > 0) {
            order.TrangThaiThanhToan = 'THANH_TOAN_MOT_PHAN';
        } else {
            order.TrangThaiThanhToan = 'CHUA_THANH_TOAN';
        }

        await order.save();
        res.status(200).json({ success: true, message: 'Cập nhật tiền cọc thành công', data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete order
exports.deleteOrder = async (req, res) => {
    try {
        await DonHang.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Đã xóa đơn hàng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
