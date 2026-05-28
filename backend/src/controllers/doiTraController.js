const DoiTra = require('../models/DoiTra');
const NhanVien = require('../models/NhanVien');

// @desc    Lấy danh sách đổi trả
exports.getReturns = async (req, res) => {
    try {
        let query = {};
        if (req.user && (req.user.VaiTro === 'KhachHangB2B' || req.user.VaiTro === 'KhachHangB2C')) {
            const KhachHang = require('../models/KhachHang');
            const kh = await KhachHang.findOne({ AccountID: req.user._id });
            if (kh) query.KhachHang = kh._id;
        }

        const data = await DoiTra.find(query)
            .populate('DonHang', 'MaDonHang')
            .populate('KhachHang', 'MaKH TenKhachHang')
            .populate('NhanVienPhuTrach', 'MaNV HoTen')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tạo lệnh đổi trả thủ công
exports.createReturn = async (req, res) => {
    try {
        const { MaDoiTra, DonHang, KhachHang, LyDo, LoaiYeuCau, DuKienDenHang, GiaTriTru, NhanVienPhuTrach, HinhAnh } = req.body;

        let nvPhuTrach = NhanVienPhuTrach;
        if (!nvPhuTrach && req.user) {
            const nv = await NhanVien.findOne({ AccountID: req.user._id });
            if (nv) nvPhuTrach = nv._id;
        }

        const newReturn = new DoiTra({
            MaDoiTra: MaDoiTra || ('RET' + Date.now().toString().slice(-4)),
            DonHang,
            KhachHang,
            LyDo,
            LoaiYeuCau: LoaiYeuCau || 'Đổi trả',
            DuKienDenHang,
            GiaTriTru,
            NhanVienPhuTrach: nvPhuTrach,
            HinhAnh: HinhAnh || []
        });

        await newReturn.save();
        res.status(201).json({ success: true, data: newReturn });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Lấy chi tiết 1 yêu cầu đổi trả
exports.getReturnById = async (req, res) => {
    try {
        const item = await DoiTra.findById(req.params.id)
            .populate({
                path: 'DonHang',
                populate: { path: 'Items.SanPham', select: 'MaSanPham TenDongSon' }
            })
            .populate('KhachHang')
            .populate('NhanVienPhuTrach', 'MaNV HoTen');

        if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu' });
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Cập nhật trạng thái đổi trả
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, phuongAn, assignedTo, KhachHangDanhGia } = req.body;

        const updateData = {};
        if (status) updateData.TrangThai = status;
        if (phuongAn) updateData.PhuongAnGiaiQuyet = phuongAn;
        if (assignedTo) updateData.NhanVienPhuTrach = assignedTo;
        if (KhachHangDanhGia) updateData.KhachHangDanhGia = KhachHangDanhGia;

        const item = await DoiTra.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu' });
        
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
