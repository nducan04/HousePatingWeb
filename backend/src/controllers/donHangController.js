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
        const { sessionId, khachHangId, diaChiGiaoHang, discountCode, phuongThucThanhToan, ghiChu, selectedItemKeys } = req.body;

        // 1. Lấy giỏ hàng
        const cart = await GioHang.findOne({ SessionId: sessionId }).populate('Items.SanPham');
        if (!cart || cart.Items.length === 0) throw new Error('Giỏ hàng trống');

        let itemsToProcess = cart.Items;
        if (selectedItemKeys && Array.isArray(selectedItemKeys)) {
            itemsToProcess = cart.Items.filter(item => {
                const key = `${item.SanPham?._id || item.SanPham}_${item.MaMau || ""}`;
                return selectedItemKeys.includes(key);
            });
        }
        if (itemsToProcess.length === 0) throw new Error('Không có sản phẩm nào được chọn để thanh toán');

        // 2. Tính toán tiền và check kho
        let orderItems = [];
        let subtotal = 0;

        for (let item of itemsToProcess) {
            const sp = await SanPhamSon.findById(item.SanPham._id).session(session);
            if (!sp) throw new Error(`Sản phẩm ${item.SanPham.TenDongSon} không còn tồn tại`);
            
            const maMauUpper = item.MaMau ? item.MaMau.toUpperCase() : '';
            let colorItem = sp.DanhSachMaMau.find(m => m.MaMau.toUpperCase() === maMauUpper);
            if (!colorItem && sp.DanhSachMaMau && sp.DanhSachMaMau.length > 0) {
                colorItem = sp.DanhSachMaMau[0];
            }
            
            if (!colorItem) throw new Error(`Dòng sơn ${sp.TenDongSon} không có sẵn màu sắc nào để trừ kho`);
            
            if (colorItem.TonKhoKhaDung < item.SoLuong) {
                throw new Error(`Sản phẩm ${sp.TenDongSon} (Màu: ${colorItem.MaMau}) không đủ tồn kho (Còn: ${colorItem.TonKhoKhaDung})`);
            }

            // Trừ kho ở cấp độ mã màu
            colorItem.TonKhoKhaDung -= item.SoLuong;
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
        let appliedVoucherId = null;

        // 3.5 Lấy đúng ID KhachHang từ TaiKhoan ID (chuyển lên trên để dùng cho voucher tặng riêng)
        const KhachHangModel = require('../models/KhachHang');
        let realKhachHangId = khachHangId;
        let kh = null;
        if (khachHangId) {
            kh = await KhachHangModel.findOne({ $or: [{ AccountID: khachHangId }, { _id: khachHangId }] }).session(session);
            if (kh) {
                realKhachHangId = kh._id;
            }
        }

        if (discountCode) {
            const voucher = await KhuyenMai.findOne({ MaKhuyenMai: discountCode.toUpperCase() }).session(session);
            if (voucher && voucher.TrangThai === 'Đang diễn ra') {
                discountAmount = (subtotal * voucher.PhanTramGiam) / 100;
                
                // Ghi nhận lịch sử dùng
                voucher.DanhSachApDung.push({
                    MaKhachHang: realKhachHangId?.toString() || 'Unknown',
                    NgayApDung: new Date(),
                    SoTienGiam: discountAmount
                });
                await voucher.save({ session });
                appliedVoucherId = voucher._id;
            } else if (kh && kh.Vouchers) {
                // Thử kiểm tra voucher được tặng riêng
                const giftedVoucher = kh.Vouchers.find(v => v.VoucherCode.toUpperCase() === discountCode.toUpperCase());
                if (giftedVoucher && !giftedVoucher.IsUsed && new Date(giftedVoucher.ExpirationDate) >= new Date()) {
                    if (giftedVoucher.DiscountPercent > 0) {
                        discountAmount = (subtotal * giftedVoucher.DiscountPercent) / 100;
                    } else if (giftedVoucher.DiscountAmount > 0) {
                        discountAmount = giftedVoucher.DiscountAmount;
                    }
                    giftedVoucher.IsUsed = true;
                    await kh.save({ session });
                }
            }
        }

        // 4. Tạo đơn hàng
        const maDonHang = `DH${Date.now().toString().slice(-8)}`;
        const finalSubtotal = subtotal - discountAmount;
        const taxAmount = finalSubtotal >= 5000000 ? finalSubtotal * 0.08 : 0;
        const totalAmount = finalSubtotal + taxAmount;

        const donHang = new DonHang({
            MaDonHang: maDonHang,
            KhachHang: realKhachHangId,
            TenNguoiNhan: typeof kh !== 'undefined' && kh ? kh.TenKhachHang : '',
            SDTNguoiNhan: typeof kh !== 'undefined' && kh ? kh.SDT : '',
            Items: orderItems,
            TienThue: taxAmount,
            TongTien: totalAmount,
            GiamGia: discountAmount,
            KhuyenMai: appliedVoucherId,
            DaTruKho: true,
            TrangThai: 'CHO_XAC_NHAN',
            PhuongThucThanhToan: phuongThucThanhToan || 'TIEN_MAT',
            DiaChiGiaoHang: diaChiGiaoHang,
            GhiChu: ghiChu
        });

        await donHang.save({ session });

        // 5. Xóa giỏ hàng hoặc chỉ xóa các items đã đặt
        if (selectedItemKeys && Array.isArray(selectedItemKeys) && cart.Items.length > itemsToProcess.length) {
            const itemsToKeep = cart.Items.filter(item => {
                const key = `${item.SanPham?._id || item.SanPham}_${item.MaMau || ""}`;
                return !selectedItemKeys.includes(key);
            }).map(item => ({
                SanPham: item.SanPham?._id || item.SanPham,
                SoLuong: item.SoLuong,
                MaMau: item.MaMau
            }));
            
            cart.Items = itemsToKeep;
            await cart.save({ session });
        } else {
            await GioHang.findOneAndDelete({ SessionId: sessionId }).session(session);
        }

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
        const { status, customer } = req.query;
        let query = {};

        if (customer) {
            query.KhachHang = customer;
        }

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
            .populate('KhachHang', 'MaKH TenKhachHang DiaChi SDT PhanLoai')
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

        // Đồng bộ địa chỉ, thông tin khách hàng nếu thiếu hoặc để mặc định
        if (orderData.KhachHang) {
            const isMissingAddress = !orderData.DiaChiGiaoHang || orderData.DiaChiGiaoHang === "Địa chỉ mặc định" || orderData.DiaChiGiaoHang === "Chưa cập nhật";
            if (isMissingAddress || !orderData.TenNguoiNhan || !orderData.SDTNguoiNhan) {
                const KhachHang = require('../models/KhachHang');
                const kh = await KhachHang.findById(orderData.KhachHang);
                if (kh) {
                    if (isMissingAddress) orderData.DiaChiGiaoHang = kh.DiaChi;
                    if (!orderData.TenNguoiNhan) orderData.TenNguoiNhan = kh.TenKhachHang;
                    if (!orderData.SDTNguoiNhan) orderData.SDTNguoiNhan = kh.SDT;
                }
            }
        }

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

        // 1. Nếu đơn hàng được giao (DANG_GIAO hoặc DA_GIAO), trừ tồn kho tạm giữ nếu chưa trừ
        if ((status === 'DANG_GIAO' || status === 'DA_GIAO') && (oldStatus === 'CHO_XAC_NHAN' || oldStatus === 'DANG_XU_LY' || oldStatus === 'DA_XU_LY_XONG')) {
            if (!order.DaTruKho) {
                for (let item of order.Items) {
                    const sp = await SanPhamSon.findById(item.SanPham).session(session);
                    if (!sp) throw new Error(`Không tìm thấy sản phẩm ${item.TenSanPham}`);
                    
                    const maMauUpper = item.MaMau ? item.MaMau.toUpperCase() : '';
                    let colorItem = sp.DanhSachMaMau.find(m => m.MaMau.toUpperCase() === maMauUpper);
                    if (!colorItem && sp.DanhSachMaMau && sp.DanhSachMaMau.length > 0) {
                        colorItem = sp.DanhSachMaMau[0];
                    }
                    
                    if (!colorItem) throw new Error(`Dòng sơn ${sp.TenDongSon} không có sẵn màu sắc nào để trừ kho`);
                    
                    if (colorItem.TonKhoKhaDung < item.SoLuong) {
                        throw new Error(`Sản phẩm ${sp.TenDongSon} (Màu: ${colorItem.MaMau}) không đủ tồn kho (Cần: ${item.SoLuong}, Kho có: ${colorItem.TonKhoKhaDung})`);
                    }

                    colorItem.TonKhoKhaDung -= item.SoLuong;
                    sp.SoLuongDaBan += item.SoLuong;
                    await sp.save({ session });
                }
                order.DaTruKho = true;
            }
        }

        // Nếu HỦY mà trạng thái trước đó đã trừ kho thì phải HOÀN KHO
        if (status === 'DA_HUY' && order.DaTruKho) {
            for (let item of order.Items) {
                const sp = await SanPhamSon.findById(item.SanPham).session(session);
                if (sp) {
                    const maMauUpper = item.MaMau ? item.MaMau.toUpperCase() : '';
                    let colorItem = sp.DanhSachMaMau.find(m => m.MaMau.toUpperCase() === maMauUpper);
                    if (!colorItem && sp.DanhSachMaMau && sp.DanhSachMaMau.length > 0) {
                        colorItem = sp.DanhSachMaMau[0];
                    }
                    if (colorItem) {
                        colorItem.TonKhoKhaDung += item.SoLuong;
                    }
                    sp.SoLuongDaBan -= item.SoLuong;
                    await sp.save({ session });
                }
            }
            order.DaTruKho = false;
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
            } else {
                // Update existing tracking to 'Đang giao hàng'
                existingTracking.TrangThaiTongQuat = 'Đang giao hàng';
                existingTracking.LoTrinh.push({
                    ThoiGian: new Date(),
                    NoiDung: 'Bắt đầu giao hàng',
                    Status: 'PROCESSING',
                    Icon: 'Truck'
                });
                await existingTracking.save({ session });
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

// Update order info by customer (only allowed when pending)
exports.updateOrderInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenNguoiNhan, sdtNguoiNhan, DiaChiGiaoHang, PhuongThucThanhToan, discountCode, discountAmount } = req.body;

        const order = await DonHang.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        // Ensure only the owner or an admin/staff can update
        let realKhachHangId = order.KhachHang;
        if (req.user.VaiTro === 'KhachHangB2B' || req.user.VaiTro === 'KhachHangB2C') {
            const KhachHang = require('../models/KhachHang');
            const khProfile = await KhachHang.findOne({ AccountID: req.user._id });
            if (!khProfile || order.KhachHang.toString() !== khProfile._id.toString()) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đơn hàng này' });
            }
            realKhachHangId = khProfile._id;
            
            if (order.TrangThai !== 'CHO_XAC_NHAN' && order.TrangThai !== 'CHO_THANH_TOAN') {
                return res.status(400).json({ success: false, message: 'Chỉ có thể sửa thông tin khi đơn hàng chưa được xử lý' });
            }
        }

        if (DiaChiGiaoHang) order.DiaChiGiaoHang = DiaChiGiaoHang;
        if (tenNguoiNhan !== undefined) order.TenNguoiNhan = tenNguoiNhan;
        if (sdtNguoiNhan !== undefined) order.SDTNguoiNhan = sdtNguoiNhan;
        if (PhuongThucThanhToan !== undefined) order.PhuongThucThanhToan = PhuongThucThanhToan;

        // Apply voucher to existing order if not already applied
        if (discountCode && discountAmount) {
            const KhuyenMai = require('../models/KhuyenMai');
            const voucher = await KhuyenMai.findOne({ MaKhuyenMai: discountCode.toUpperCase() });
            
            // Check if voucher is valid and order hasn't already used a voucher
            if (voucher && voucher.TrangThai === 'Đang diễn ra' && !order.KhuyenMai) {
                // Determine remaining amount to pay
                const currentTotal = order.TongTien || 0;
                if (currentTotal > discountAmount) {
                    order.TongTien = currentTotal - discountAmount;
                    order.GiamGia = (order.GiamGia || 0) + discountAmount;
                    order.KhuyenMai = voucher._id;

                    // Record usage
                    voucher.DanhSachApDung.push({
                        MaKhachHang: realKhachHangId?.toString() || 'Unknown',
                        NgayApDung: new Date(),
                        SoTienGiam: discountAmount
                    });
                    await voucher.save();
                }
            }
        }

        await order.save();
        res.status(200).json({ success: true, message: 'Đã cập nhật thông tin đơn hàng thành công', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Customer cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await DonHang.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        if (req.user.VaiTro === 'KhachHangB2B' || req.user.VaiTro === 'KhachHangB2C') {
            const KhachHang = require('../models/KhachHang');
            const khProfile = await KhachHang.findOne({ AccountID: req.user._id });
            if (!khProfile || order.KhachHang.toString() !== khProfile._id.toString()) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' });
            }
        }

        if (order.TrangThai !== 'CHO_XAC_NHAN') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận' });
        }

        // Hoàn kho nếu đã trừ
        if (order.DaTruKho) {
            for (let item of order.Items) {
                const sp = await SanPhamSon.findById(item.SanPham);
                if (sp) {
                    const maMauUpper = item.MaMau ? item.MaMau.toUpperCase() : '';
                    let colorItem = sp.DanhSachMaMau.find(m => m.MaMau.toUpperCase() === maMauUpper);
                    if (!colorItem && sp.DanhSachMaMau && sp.DanhSachMaMau.length > 0) {
                        colorItem = sp.DanhSachMaMau[0];
                    }
                    if (colorItem) {
                        colorItem.TonKhoKhaDung += item.SoLuong;
                    }
                    sp.SoLuongDaBan -= item.SoLuong;
                    await sp.save();
                }
            }
            order.DaTruKho = false;
        }

        order.TrangThai = 'DA_HUY';
        await order.save();

        res.status(200).json({ success: true, message: 'Hủy đơn hàng thành công', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Customer rate order
exports.rateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { ChatLuongSanPham, ChatLuongDichVu, BinhLuan } = req.body;
        const order = await DonHang.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        // Only allow rating once
        if (order.DanhGia && order.DanhGia.NgayDanhGia) {
            return res.status(400).json({ success: false, message: 'Đơn hàng này đã được đánh giá' });
        }

        // Must be DA_GIAO
        if (order.TrangThai !== 'DA_GIAO') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể đánh giá đơn hàng đã giao thành công' });
        }

        order.DanhGia = {
            ChatLuongSanPham: ChatLuongSanPham,
            ChatLuongDichVu: ChatLuongDichVu,
            BinhLuan: BinhLuan,
            NgayDanhGia: new Date()
        };

        await order.save();

        // Update SanPhamSon rating
        if (ChatLuongSanPham && order.Items && order.Items.length > 0) {
            const SanPhamSon = require('../models/SanPhamSon');
            const KhachHang = require('../models/KhachHang');
            const khProfile = await KhachHang.findOne({ AccountID: req.user._id });
            const khTen = khProfile ? khProfile.HoTen : 'Khách hàng ẩn danh';

            for (const item of order.Items) {
                if (item.SanPham) {
                    await SanPhamSon.findByIdAndUpdate(item.SanPham, {
                        $push: {
                            DanhGia: {
                                KhachHang: khTen,
                                SoSao: ChatLuongSanPham,
                                BinhLuan: BinhLuan || '',
                                NgayDanhGia: new Date()
                            }
                        }
                    });
                }
            }
        }

        // Update NhanVien KPI
        if (ChatLuongDichVu && order.NhanVienPhuTrach) {
            const NhanVien = require('../models/NhanVien');
            const nv = await NhanVien.findById(order.NhanVienPhuTrach);
            if (nv) {
                // Convert 5 stars to 100 points
                const newScore = (ChatLuongDichVu / 5) * 100;
                // Simple moving average (assume 10 ratings if we don't know total count, just push it up/down)
                const currentScore = nv.HieuSuatKPI?.diemKPI || 85;
                const updatedScore = Math.round((currentScore * 9 + newScore) / 10);
                
                await NhanVien.findByIdAndUpdate(order.NhanVienPhuTrach, {
                    'HieuSuatKPI.diemKPI': updatedScore,
                    'HieuSuatKPI.diemDanhGia': updatedScore
                });
            }
        }

        res.status(200).json({ success: true, message: 'Đánh giá đơn hàng thành công', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
