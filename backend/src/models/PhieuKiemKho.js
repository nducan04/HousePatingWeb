const mongoose = require('mongoose');

const phieuKiemKhoSchema = new mongoose.Schema({
    MaPhieu: { type: String, unique: true },
    TrangThai: { type: String, enum: ['PHIEU_TAM', 'HOAN_THANH', 'DA_HUY'], default: 'HOAN_THANH' },
    ChiTiet: [{
        Sanpham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPhamSon' },
        TonKhoHT: { type: Number, default: 0 }, // Tồn trên hệ thống
        TonThucTe: { type: Number, required: true }, // Nhân viên nhập vào
        ChenhLech: { type: Number, default: 0 }, // TonThucTe - TonKhoHT
        DonGia: { type: Number, default: 0 }, // Lấy từ SanPhamSon
        ThanhTienChenhLech: { type: Number, default: 0 }, // ChenhLech * DonGia
    }],
    TongChenhLech: { type: Number, default: 0 },
    NguoiKiem: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' } // Sửa TaiKhoan -> NhanVien cho khớp logic frontend Mã NV
}, { timestamps: true });

module.exports = mongoose.model('PhieuKiemKho', phieuKiemKhoSchema, 'PhieuKiemKho');
