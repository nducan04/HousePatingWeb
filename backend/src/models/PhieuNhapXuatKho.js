const mongoose = require('mongoose');

/**
 * ═══════════════════════════════════════════════════════════════
 *  PHIẾU NHẬP / XUẤT KHO — CHUẨN ERP THU NHỎ (v2.0)
 * ═══════════════════════════════════════════════════════════════
 *
 *  [NGUYÊN TẮC VÀNG]:
 *   • Schema CHỈ chịu trách nhiệm định nghĩa cấu trúc + tính TongTien.
 *   • Mọi logic cộng/trừ tồn kho được xử lý ở Controller (duyetPhieu).
 *   • TUYỆT ĐỐI KHÔNG đặt post('save') để thay đổi bảng chéo (SanPhamSon).
 *
 *  Quy trình:
 *   1. NhanVien lập phiếu → TrangThai = 'CHO_DUYET'
 *   2. Admin duyệt phiếu → Controller validate tồn kho → cộng/trừ SKU → TrangThai = 'DA_DUYET'
 *   3. Admin từ chối      → TrangThai = 'TU_CHOI', ghi LyDoTuChoi
 * ═══════════════════════════════════════════════════════════════
 */

const chiTietPhieuSchema = new mongoose.Schema({
    // Liên kết đến Sản Phẩm hoặc Nguyên Vật Liệu
    ItemId: { type: mongoose.Schema.Types.ObjectId },
    MaItem: { type: String, trim: true },       // VD: "SP-INTERPON-001"
    TenItem: { type: String, trim: true },       // VD: "Sơn Interpon D2525"

    // ★ LIÊN KẾT SKU: Xác định chính xác MÃ MÀU nào bị ảnh hưởng
    MaMau: { type: String, trim: true, uppercase: true },  // VD: "INT-D2525"
    TenMau: { type: String, trim: true },                  // VD: "Silver Metallic"

    SoLuong: { type: Number, required: true, min: 0 },
    DonGia: { type: Number, default: 0, min: 0 },
    ThanhTien: { type: Number, default: 0 },
}, { _id: true });

const phieuNhapXuatKhoSchema = new mongoose.Schema({
    MaPhieu: { type: String, required: true, unique: true, trim: true },
    LoaiPhieu: { type: String, required: true, enum: ['NHAP', 'XUAT'] },
    LoaiHang: { type: String, required: true, enum: ['SAN_PHAM', 'NGUYEN_VAT_LIEU'] },

    ChiTiet: [chiTietPhieuSchema],

    MoTa: { type: String, trim: true },
    TongTien: { type: Number, default: 0 },
    GhiChu: { type: String, trim: true },

    // ═══ APPROVAL WORKFLOW ═══
    TrangThai: {
        type: String,
        enum: ['CHO_DUYET', 'DA_DUYET', 'TU_CHOI'],
        default: 'CHO_DUYET'
    },
    NguoiLapPhieu: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    TenNguoiLap: { type: String, trim: true },           // Lưu tên hiển thị để không cần populate

    NguoiDuyet: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    TenNguoiDuyet: { type: String, trim: true },
    NgayDuyet: { type: Date },
    LyDoTuChoi: { type: String, trim: true },

    // Nhà cung cấp (chỉ dành cho phiếu NHẬP từ NCC)
    NhaCungCapID: { type: mongoose.Schema.Types.ObjectId, ref: 'NhaCungCap' },

    // Tham chiếu đến Lệnh Đặt Hàng (nếu có)
    PhieuDatHangID: { type: mongoose.Schema.Types.ObjectId, ref: 'PhieuDatHangNCC' },
}, { timestamps: true });


// ──────────────────────────────────────────────
//  MIDDLEWARE: Tự tính TongTien trước khi lưu
//  (AN TOÀN — Chỉ tác động bảng chính mình)
// ──────────────────────────────────────────────
phieuNhapXuatKhoSchema.pre('save', function (next) {
    if (this.ChiTiet && this.ChiTiet.length > 0) {
        this.ChiTiet.forEach(item => {
            item.ThanhTien = (item.SoLuong || 0) * (item.DonGia || 0);
        });
        this.TongTien = this.ChiTiet.reduce((sum, item) => sum + item.ThanhTien, 0);
    }
    next();
});


module.exports = mongoose.model('PhieuNhapXuatKho', phieuNhapXuatKhoSchema, 'PhieuNhapXuatKhos');
