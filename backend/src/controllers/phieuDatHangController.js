const PhieuDatHangNCC = require('../models/PhieuDatHangNCC');

// @desc    Lấy danh sách phiếu đặt cho 1 nhà cung cấp
exports.getBySupplier = async (req, res) => {
    try {
        const data = await PhieuDatHangNCC.find({ SupplierID: req.params.supplierId })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Lấy tất cả phiếu đặt hàng (Quản lý chung)
exports.getAll = async (req,res) => {
    try {
        const data = await PhieuDatHangNCC.find().populate('SupplierID', 'TenNCC MaNCC').sort('-createdAt');
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tạo phiếu mới
exports.create = async (req, res) => {
    try {
        const supplierId = req.params.supplierId || req.body.SupplierID;
        if (!supplierId) {
            return res.status(400).json({ success: false, error: 'Thiếu SupplierID' });
        }

        if (!req.body.MaPhieu) {
            req.body.MaPhieu = 'PDH' + Date.now().toString().slice(-6);
        }

        const orderData = {
            ...req.body,
            SupplierID: supplierId
        };

        const item = await PhieuDatHangNCC.create(orderData);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
