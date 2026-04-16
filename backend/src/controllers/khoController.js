const mongoose = require('mongoose');
const SanPhamSon = require('../models/SanPhamSon');
const GiaoDichKho = require('../models/GiaoDichKho');
const PhieuKiemKho = require('../models/PhieuKiemKho');

/**
 * 1. Nhập Kho
 * Tạo giao dịch (Transaction) để cộng TonKho và lưu vào bảng GiaoDichKho
 */
exports.nhapKho = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { MaSanPham, SoLuongNhap, MaChungTu } = req.body;
        const nguoiThucHien = req.user ? req.user._id : null;

        if (!SoLuongNhap || SoLuongNhap <= 0) {
            throw new Error('Số lượng nhập kho phải lớn hơn 0');
        }

        // Cập nhật tồn kho an toàn bằng hàm $inc của MongoDB
        const sanPham = await SanPhamSon.findByIdAndUpdate(
            MaSanPham,
            { $inc: { TonKho: SoLuongNhap } },
            { new: true, session }
        );

        if (!sanPham) {
            throw new Error('Sản phẩm sơn không tồn tại trong hệ thống');
        }

        // Lưu lịch sử giao dịch (Nhập hàng)
        const giaoDich = new GiaoDichKho({
            LoaiGiaoDich: 'NHAP_HANG',
            MaSanPham: sanPham._id,
            SoLuongThayDoi: SoLuongNhap,
            TonKhoSauGiaoDich: sanPham.TonKho,
            MaChungTu: MaChungTu || 'NHAP_NHANH',
            NguoiThucHien: nguoiThucHien
        });
        await giaoDich.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, message: 'Nhập kho thành công!', data: sanPham });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * 2. Lưu Nháp Phiếu Kiểm Kho (Save Draft)
 */
exports.luuPhieuKiemKho = async (req, res) => {
    try {
        const { MaPhieu, ChiTiet } = req.body;
        const nguoiKiem = req.user ? req.user._id : null;

        // Sinh mã phiếu nếu không được gửi lên
        let phieuCode = MaPhieu;
        if (!phieuCode) {
            phieuCode = 'PKK' + Date.now();
        }

        // Tính toán thông số lúc lưu
        const chiTietMoi = await Promise.all(ChiTiet.map(async (item) => {
            const sp = await SanPhamSon.findById(item.Sanpham);
            return {
                Sanpham: item.Sanpham,
                TonKhoHT: sp ? sp.TonKho : 0,
                TonThucTe: item.TonThucTe,
                ChenhLech: item.TonThucTe - (sp ? sp.TonKho : 0)
            };
        }));

        let phieu = await PhieuKiemKho.findOne({ MaPhieu: phieuCode });

        if (phieu && phieu.TrangThai === 'HOAN_THANH') {
            return res.status(400).json({ success: false, message: 'Phiếu này đã chốt, không thể thay đổi dữ liệu.' });
        }

        if (phieu) {
            phieu.ChiTiet = chiTietMoi;
            phieu.TongChenhLech = chiTietMoi.reduce((sum, item) => sum + item.ChenhLech, 0);
        } else {
            phieu = new PhieuKiemKho({
                MaPhieu: phieuCode,
                TrangThai: 'PHIEU_TAM',
                ChiTiet: chiTietMoi,
                TongChenhLech: chiTietMoi.reduce((sum, item) => sum + item.ChenhLech, 0),
                NguoiKiem
            });
        }

        await phieu.save();
        res.status(200).json({ success: true, message: 'Đã lưu nháp phiếu kiểm kho!', data: phieu });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 3. Hoàn Thành Phiếu Kiểm Kho (Duyệt Phiếu & Cân Bằng Lại Tồn DB)
 */
exports.hoanThanhKiemKho = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { MaPhieu } = req.params;
        const phieu = await PhieuKiemKho.findOne({ MaPhieu }).session(session);

        if (!phieu) throw new Error('Không tìm thấy mã phiếu kiểm kho');
        if (phieu.TrangThai === 'HOAN_THANH') throw new Error('Tuyệt đối không chạy lại phiếu đã hoàn thành');

        for (let item of phieu.ChiTiet) {
            // Lấy lại tồn hiện tại ở Database tránh đụng độ (Race Condition)
            const sp = await SanPhamSon.findById(item.Sanpham).session(session);
            if (!sp) continue;

            const tonGocTruocKiem = sp.TonKho;
            const thucTeKiemDuoc = item.TonThucTe;
            const chenhLechCapNhat = thucTeKiemDuoc - tonGocTruocKiem;

            if (chenhLechCapNhat !== 0) {
                // Đè tồn kho thành lượng thực tế đã quét
                sp.TonKho = thucTeKiemDuoc;
                await sp.save({ session });

                // Sinh biến động kho để giải trình sau này
                const giaoDich = new GiaoDichKho({
                    LoaiGiaoDich: 'KIEM_KHO',
                    MaSanPham: sp._id,
                    SoLuongThayDoi: chenhLechCapNhat,
                    TonKhoSauGiaoDich: thucTeKiemDuoc,
                    MaChungTu: phieu.MaPhieu,
                    NguoiThucHien: phieu.NguoiKiem
                });
                await giaoDich.save({ session });
            }
        }

        // Cập nhật trạng thái phiếu
        phieu.TrangThai = 'HOAN_THANH';
        await phieu.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, message: 'Đã Cân Bằng Kho và Hoàn thành Phiếu!', data: phieu });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * 4. Tự động trừ kho khi bán 
 * Lưu ý: Đây KHÔNG phải là End-point API public, đây là Service nội bộ
 * Được gọi ra ở trong controller Hợp đồng đơn hàng (Order Controller)
 */
exports.truKhoKhiXuatBan = async (MasanPhams, SoLuongs, MaDonHang, session, nguoiThucHien) => {
    // Được bọc trong MongoDB Transaction chung của tạo Hợp Đồng
    for (let i = 0; i < MasanPhams.length; i++) {
        const idSP = MasanPhams[i];
        const qty = SoLuongs[i];

        // Atomically query và trừ: điều kiện là TonKho >= qty (An toàn khi mua song song)
        const sp = await SanPhamSon.findOneAndUpdate(
            { _id: idSP, TonKho: { $gte: qty } },
            { $inc: { TonKho: -qty } },
            { new: true, session }
        );

        if (!sp) {
            throw new Error(`Sản phẩm ${idSP} không thể xuất bán. Hàng trong kho không đủ (Dưới ${qty})`);
        }

        // Ghi lại biến động lịch sử kho
        const giaoDich = new GiaoDichKho({
            LoaiGiaoDich: 'XUAT_BAN',
            MaSanPham: sp._id,
            SoLuongThayDoi: -qty,
            TonKhoSauGiaoDich: sp.TonKho,
            MaChungTu: MaDonHang,
            NguoiThucHien: nguoiThucHien
        });
        await giaoDich.save({ session });
    }
};

/**
 * 5. Lấy Danh Sách Tồn Kho 
 */
exports.getTonKho = async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        let filter = {};
        if (keyword) {
            filter = { $text: { $search: keyword } };
        }

        const danhSachSP = await SanPhamSon.find(filter)
            .select('MaSanPham TenDongSon TonKho DonGiaCoSo PhanLoai')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: danhSachSP });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
