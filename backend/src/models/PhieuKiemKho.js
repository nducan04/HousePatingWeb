const mongoose = require('mongoose');

const phieuKiemKhoSchema = new mongoose.Schema({
    MaPhieu: { type: String, unique: true },
    TrangThai: { type: String, enum: ['PHIEU_TAM', 'HOAN_THANH', 'DA_HUY'] },
    ChiTiet: [{
        Sanpham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPhamSon' },
        TonKhoHT: { type: Number }, // Tồn trên hệ thống
        TonThucTe: { type: Number }, // Nhân viên nhập vào
        ChenhLech: { type: Number }, // TonThucTe - TonKhoHT
    }],
    TongChenhLech: { type: Number },
    NguoiKiem: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' }
}, { timestamps: true });

module.exports = mongoose.model('PhieuKiemKho', phieuKiemKhoSchema, 'PhieuKiemKho');
