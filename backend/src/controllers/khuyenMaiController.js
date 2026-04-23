const KhuyenMai = require('../models/KhuyenMai');

// @desc    Get all promotions
// @route   GET /api/khuyen-mai
exports.getAllVouchers = async (req, res) => {
    try {
        const vouchers = await KhuyenMai.find().populate('NhanVienTao', 'HoTen').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: vouchers.length, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new voucher
// @route   POST /api/khuyen-mai
exports.createVoucher = async (req, res) => {
    try {
        const voucher = await KhuyenMai.create({
            ...req.body,
            NhanVienTao: req.user.id
        });
        res.status(201).json({ success: true, data: voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update voucher
// @route   PUT /api/khuyen-mai/:id
exports.updateVoucher = async (req, res) => {
    try {
        const voucher = await KhuyenMai.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
        res.status(200).json({ success: true, data: voucher });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete voucher
// @route   DELETE /api/khuyen-mai/:id
exports.deleteVoucher = async (req, res) => {
    try {
        const voucher = await KhuyenMai.findByIdAndDelete(req.params.id);
        if (!voucher) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
        res.status(200).json({ success: true, message: 'Đã xóa mã giảm giá' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Validate voucher and calculate discount
// @route   POST /api/khuyen-mai/validate
exports.validateVoucher = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const voucher = await KhuyenMai.findOne({ MaVoucher: code.toUpperCase() });

        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
        }

        const now = new Date();
        if (voucher.NgayHetHan < now) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
        }

        if (voucher.NgayBatDau > now) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá chưa đến thời gian sử dụng' });
        }

        if (voucher.SoLuongDaDung >= voucher.SoLuongToiDa) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        if (cartTotal < voucher.DonHangToiThieu) {
            return res.status(400).json({ 
                success: false, 
                message: `Đơn hàng tối thiểu để dùng mã này là ${voucher.DonHangToiThieu.toLocaleString()} ₫` 
            });
        }

        let discountAmount = 0;
        if (voucher.LoaiGiamGia === 'PHAN_TRAM') {
            discountAmount = (cartTotal * voucher.MucGiam) / 100;
            if (voucher.GiamToiDa > 0 && discountAmount > voucher.GiamToiDa) {
                discountAmount = voucher.GiamToiDa;
            }
        } else if (voucher.LoaiGiamGia === 'GIAM_THANG') {
            discountAmount = voucher.MucGiam;
        }

        res.status(200).json({ 
            success: true, 
            data: {
                _id: voucher._id,
                MaVoucher: voucher.MaVoucher,
                LoaiGiamGia: voucher.LoaiGiamGia,
                DiscountAmount: discountAmount,
                Message: 'Áp dụng mã thành công!'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
