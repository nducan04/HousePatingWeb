const mongoose = require('mongoose');

const nguyenVatLieuSchema = new mongoose.Schema({
    MaNVL: { type: String, required: true, unique: true },
    TenNguyenVatLieu: { type: String, required: true },
    PhanLoai: { type: String, required: true, enum: ['Bột màu', 'Dung môi', 'Nhựa', 'Phụ gia', 'Phân dải', 'Khác'] },
    TonKho: { type: Number, default: 0, min: 0 },
    DonViTinh: { type: String, required: true, default: 'Thùng' },
    DonGia: { type: Number, default: 0 },
    NhaCungCap: { type: mongoose.Schema.Types.ObjectId, ref: 'NhaCungCap' },
    GiaNhapDinhMuc: { type: Number, default: 0 },
    GhiChu: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('NguyenVatLieu', nguyenVatLieuSchema, 'NguyenVatLieus');
