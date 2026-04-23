const mongoose = require('mongoose');
const SanPhamSon = require('../models/SanPhamSon');
const GiaoDichKho = require('../models/GiaoDichKho');
const PhieuKiemKho = require('../models/PhieuKiemKho');
const NguyenVatLieu = require('../models/NguyenVatLieu');
const PhieuNhapXuatKho = require('../models/PhieuNhapXuatKho');

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
        let nguoiKiem = null;
        if (req.user) {
            const NhanVien = require('../models/NhanVien');
            const nv = await NhanVien.findOne({ AccountID: req.user._id });
            if (nv) {
                nguoiKiem = nv._id;
            }
        }

        // Sinh mã phiếu nếu không được gửi lên
        let phieuCode = MaPhieu;
        if (!phieuCode) {
            phieuCode = 'PKK' + Date.now();
        }

        // Tính toán thông số lúc lưu
        const chiTietMoi = await Promise.all(ChiTiet.map(async (item) => {
            const sp = await SanPhamSon.findById(item.Sanpham);
            const donGia = sp ? sp.DonGiaCoSo : 0;
            const thucTe = Number(item.TonThucTe) || 0;
            const hc = sp ? sp.TonKho : 0;
            const chenhLech = thucTe - hc;

            return {
                Sanpham: item.Sanpham,
                TonKhoHT: hc,
                TonThucTe: thucTe,
                ChenhLech: chenhLech,
                DonGia: donGia,
                ThanhTienChenhLech: chenhLech * donGia
            };
        }));

        let phieu = await PhieuKiemKho.findOne({ MaPhieu: phieuCode });

        if (phieu && phieu.TrangThai === 'HOAN_THANH') {
            return res.status(400).json({ success: false, message: 'Phiếu này đã chốt, không thể thay đổi dữ liệu.' });
        }

        if (phieu) {
            phieu.ChiTiet = chiTietMoi;
            phieu.TongChenhLech = chiTietMoi.reduce((sum, item) => sum + item.ChenhLech, 0);
            if (nguoiKiem) phieu.NguoiKiem = nguoiKiem;
        } else {
            phieu = new PhieuKiemKho({
                MaPhieu: phieuCode,
                TrangThai: 'PHIEU_TAM',
                ChiTiet: chiTietMoi,
                TongChenhLech: chiTietMoi.reduce((sum, item) => sum + item.ThanhTienChenhLech, 0),
                NguoiKiem: nguoiKiem
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

/**
 * 6. Lấy Danh Sách Phiếu Kiểm Kho
 */
exports.getDanhSachPhieu = async (req, res) => {
    try {
        const phieuList = await PhieuKiemKho.find()
            .populate('NguoiKiem', 'MaNV HoTen')
            .populate('ChiTiet.Sanpham', 'MaSanPham TenDongSon DonGiaCoSo')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: phieuList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- QUẢN LÝ NGUYÊN VẬT LIÊU ---

exports.getNguyenVatLieu = async (req, res) => {
    try {
        const data = await NguyenVatLieu.find().populate('NhaCungCap', 'MaNCC TenNCC').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createNguyenVatLieu = async (req, res) => {
    try {
        const item = new NguyenVatLieu(req.body);
        await item.save();
        res.status(201).json({ success: true, message: 'Đã thêm nguyên vật liệu', data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateNguyenVatLieu = async (req, res) => {
    try {
        const item = await NguyenVatLieu.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteNguyenVatLieu = async (req, res) => {
    try {
        await NguyenVatLieu.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Đã xóa nguyên vật liệu' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- QUẢN LÝ PHIẾU NHẬP XUẤT KHO ---

exports.getPhieuNhapXuat = async (req, res) => {
    try {
        const data = await PhieuNhapXuatKho.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getReceiptsBySupplier = async (req, res) => {
    try {
        const data = await PhieuNhapXuatKho.find({ NhaCungCapID: req.params.supplierId, LoaiPhieu: 'NHAP' })
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPhieuNhapXuat = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { MaPhieu, LoaiPhieu, LoaiHang, ChiTiet, MoTa, TongTien, GhiChu } = req.body;

        let nvPhuTrach = 'ADMIN';
        if (req.user) {
            const NhanVien = require('../models/NhanVien');
            const nv = await NhanVien.findOne({ AccountID: req.user._id });
            if (nv) {
                nvPhuTrach = `${nv.MaNV} - ${nv.HoTen}`;
            }
        }
        
        let phieuCode = MaPhieu || ((LoaiPhieu === 'NHAP' ? 'PN' : 'PX') + Date.now().toString().slice(-4));

        const newPhieu = new PhieuNhapXuatKho({
            MaPhieu: phieuCode,
            LoaiPhieu,
            LoaiHang,
            ChiTiet,
            MoTa,
            TongTien,
            GhiChu,
            MaNhanVienPhuTrach: nvPhuTrach
        });
        await newPhieu.save({ session });

        // Cập nhật tồn kho tự động (Tăng nếu NHẬP, Giảm nếu XUẤT)
        const multiplier = LoaiPhieu === 'NHAP' ? 1 : -1;

        if (ChiTiet && ChiTiet.length > 0) {
            for (let item of ChiTiet) {
                if (!item.ItemId) continue;

                if (LoaiHang === 'SAN_PHAM') {
                    await SanPhamSon.findByIdAndUpdate(
                        item.ItemId,
                        { $inc: { TonKho: item.SoLuong * multiplier } },
                        { session }
                    );
                } else if (LoaiHang === 'NGUYEN_VAT_LIEU') {
                    await NguyenVatLieu.findByIdAndUpdate(
                        item.ItemId,
                        { $inc: { TonKho: item.SoLuong * multiplier } },
                        { session }
                    );
                }
            }
        }

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: 'Đã lập phiếu thành công', data: newPhieu });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updatePhieuNhapXuat = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const oldPhieu = await PhieuNhapXuatKho.findById(req.params.id).session(session);
        if (!oldPhieu) throw new Error('Không tìm thấy phiếu');

        // 1. Hoàn lại tồn kho cũ (Reverse old stock)
        const oldMultiplier = oldPhieu.LoaiPhieu === 'NHAP' ? -1 : 1;
        for (let item of oldPhieu.ChiTiet) {
            if (!item.ItemId) continue;
            const model = oldPhieu.LoaiHang === 'SAN_PHAM' ? SanPhamSon : NguyenVatLieu;
            await model.findByIdAndUpdate(item.ItemId, { $inc: { TonKho: item.SoLuong * oldMultiplier } }, { session });
        }

        // 2. Cập nhật dữ liệu mới
        const { LoaiPhieu, LoaiHang, ChiTiet, MoTa, TongTien, GhiChu, MaNhanVienPhuTrach, NhaCungCapID } = req.body;
        oldPhieu.LoaiPhieu = LoaiPhieu || oldPhieu.LoaiPhieu;
        oldPhieu.LoaiHang = LoaiHang || oldPhieu.LoaiHang;
        oldPhieu.ChiTiet = ChiTiet || oldPhieu.ChiTiet;
        oldPhieu.MoTa = MoTa || oldPhieu.MoTa;
        oldPhieu.TongTien = TongTien || oldPhieu.TongTien;
        oldPhieu.GhiChu = GhiChu || oldPhieu.GhiChu;

        if (req.user) {
            const NhanVien = require('../models/NhanVien');
            const nv = await NhanVien.findOne({ AccountID: req.user._id });
            if (nv) {
                oldPhieu.MaNhanVienPhuTrach = `${nv.MaNV} - ${nv.HoTen}`;
            }
        }

        oldPhieu.NhaCungCapID = NhaCungCapID || oldPhieu.NhaCungCapID;

        await oldPhieu.save({ session });

        // 3. Áp dụng tồn kho mới
        const newMultiplier = oldPhieu.LoaiPhieu === 'NHAP' ? 1 : -1;
        for (let item of oldPhieu.ChiTiet) {
            if (!item.ItemId) continue;
            const model = oldPhieu.LoaiHang === 'SAN_PHAM' ? SanPhamSon : NguyenVatLieu;
            await model.findByIdAndUpdate(item.ItemId, { $inc: { TonKho: item.SoLuong * newMultiplier } }, { session });
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: 'Cập nhật phiếu thành công', data: oldPhieu });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deletePhieuNhapXuat = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const phieu = await PhieuNhapXuatKho.findById(req.params.id).session(session);
        if (!phieu) throw new Error('Không tìm thấy phiếu');

        // Hoàn lại tồn kho
        const multiplier = phieu.LoaiPhieu === 'NHAP' ? -1 : 1;
        for (let item of phieu.ChiTiet) {
            if (!item.ItemId) continue;
            const model = phieu.LoaiHang === 'SAN_PHAM' ? SanPhamSon : NguyenVatLieu;
            await model.findByIdAndUpdate(item.ItemId, { $inc: { TonKho: item.SoLuong * multiplier } }, { session });
        }

        await PhieuNhapXuatKho.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ success: true, message: 'Đã xóa phiếu và hoàn tồn kho' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};
