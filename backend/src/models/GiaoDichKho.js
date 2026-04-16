const mongoose = require('mongoose');

const giaoDichKhoSchema = new mongoose.Schema({
    LoaiGiaoDich: { type: String, enum: ['NHAP_HANG', 'XUAT_BAN', 'KIEM_KHO', 'TRA_HANG'] },
    MaSanPham: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPhamSon' },
    SoLuongThayDoi: { type: Number }, // VD: +50 (Nhập), -10 (Xuất bán)
    TonKhoSauGiaoDich: { type: Number },
    MaChungTu: { type: String }, // Mã đơn hàng / Hợp đồng / Phiếu kiểm
    NguoiThucHien: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' }
}, { timestamps: true });

module.exports = mongoose.model('GiaoDichKho', giaoDichKhoSchema, 'GiaoDichKho');
