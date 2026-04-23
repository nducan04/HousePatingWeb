const mongoose = require('mongoose');

const phieuNhapXuatKhoSchema = new mongoose.Schema({
    MaPhieu: { type: String, required: true, unique: true },
    LoaiPhieu: { type: String, required: true, enum: ['NHAP', 'XUAT'] },
    LoaiHang: { type: String, required: true, enum: ['SAN_PHAM', 'NGUYEN_VAT_LIEU'] },
    ChiTiet: [{
        MaItem: String,
        TenItem: String,
        SoLuong: { type: Number, required: true, min: 1 },
        DonGia: { type: Number, default: 0 },
        ThanhTien: { type: Number, default: 0 },
        ItemId: { type: mongoose.Schema.Types.ObjectId }
    }],
    MoTa: { type: String },
    TongTien: { type: Number, default: 0 },
    GhiChu: { type: String },
    MaNhanVienPhuTrach: { type: String }, // Mã nhân viên hoặc Tên tự gõ
    NhaCungCapID: { type: mongoose.Schema.Types.ObjectId, ref: 'NhaCungCap' }, // Dành cho phiếu Nhập từ NCC
}, { timestamps: true });

module.exports = mongoose.model('PhieuNhapXuatKho', phieuNhapXuatKhoSchema, 'PhieuNhapXuatKhos');
