const mongoose = require('mongoose');

/**
 * Collection: PhieuDatHangNCC (Phiếu đặt hàng nhà cung cấp)
 * Theo đặc tả: Lưu trữ lệnh đặt mua vật tư từ nhà cung cấp trước khi nhập kho chính thức.
 */
const phieuDatHangNCCSchema = new mongoose.Schema({
    MaPhieu: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    SupplierID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NhaCungCap',
        required: true
    },
    NgayDat: {
        type: Date,
        default: Date.now
    },
    ExpectedDate: {
        type: Date
    },
    ChiTiet: [{
        MaItem: String,
        TenItem: String,
        SoLuong: { type: Number, required: true },
        DonGia: { type: Number, default: 0 },
        ThanhTien: { type: Number, default: 0 }
    }],
    TongTien: {
        type: Number,
        default: 0
    },
    TrangThai: {
        type: String,
        enum: ['Mới', 'Đã đặt hàng', 'Đã về hàng', 'Đã hủy'],
        default: 'Mới'
    },
    GhiChu: {
        type: String
    },
    NguoiLap: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('PhieuDatHangNCC', phieuDatHangNCCSchema, 'PhieuDatHangNCCs');
