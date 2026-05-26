const mongoose = require("mongoose");
const SanPhamSon = require("../models/SanPhamSon");
const GiaoDichKho = require("../models/GiaoDichKho");
const PhieuKiemKho = require("../models/PhieuKiemKho");
const NguyenVatLieu = require("../models/NguyenVatLieu");
const PhieuNhapXuatKho = require("../models/PhieuNhapXuatKho");

/**
 * 1. Nhập Kho Nhanh (Thao tác trên 1 SKU cụ thể)
 * Sử dụng .save() để trigger pre('save') → TongTonKho tự cập nhật
 */
exports.nhapKho = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { MaSanPham, MaMau, SoLuongNhap, MaChungTu } = req.body;
    const nguoiThucHien = req.user ? req.user._id : null;

    if (!SoLuongNhap || SoLuongNhap <= 0) {
      throw new Error("Số lượng nhập kho phải lớn hơn 0");
    }
    if (!MaMau) {
      throw new Error("Phải chỉ định Mã Màu (SKU) cụ thể để nhập kho");
    }

    // Lấy document sản phẩm (dùng find + save, KHÔNG dùng $inc)
    const sanPham = await SanPhamSon.findById(MaSanPham).session(session);
    if (!sanPham) {
      throw new Error("Sản phẩm sơn không tồn tại trong hệ thống");
    }

    // Tìm đúng SKU trong mảng DanhSachMaMau
    const sku = sanPham.DanhSachMaMau.find(
      (m) => m.MaMau.toUpperCase() === MaMau.toUpperCase(),
    );
    if (!sku) {
      throw new Error(
        `Mã màu "${MaMau}" không tồn tại trong sản phẩm "${sanPham.TenDongSon}"`,
      );
    }

    // Cộng tồn kho cấp SKU
    sku.TonKhoKhaDung += SoLuongNhap;

    // .save() → trigger pre('save') → TongTonKho tự cập nhật
    await sanPham.save({ session });

    // Lưu lịch sử giao dịch
    const giaoDich = new GiaoDichKho({
      LoaiGiaoDich: "NHAP_HANG",
      MaSanPham: sanPham._id,
      SoLuongThayDoi: SoLuongNhap,
      TonKhoSauGiaoDich: sku.TonKhoKhaDung,
      MaChungTu: MaChungTu || "NHAP_NHANH",
      NguoiThucHien: nguoiThucHien,
      GhiChu: `Nhập nhanh | Mã màu: ${MaMau}`,
    });
    await giaoDich.save({ session });

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ success: true, message: "Nhập kho thành công!", data: sanPham });
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
      const NhanVien = require("../models/NhanVien");
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) {
        nguoiKiem = nv._id;
      }
    }

    // Sinh mã phiếu nếu không được gửi lên
    let phieuCode = MaPhieu;
    if (!phieuCode) {
      phieuCode = "PKK" + Date.now();
    }

    // Tính toán thông số lúc lưu — CẤP ĐỘ SKU (MaMau)
    const chiTietMoi = await Promise.all(
      ChiTiet.map(async (item) => {
        const sp = await SanPhamSon.findById(item.Sanpham);
        if (!sp) throw new Error(`Sản phẩm ${item.Sanpham} không tồn tại`);
        if (!item.MaMau)
          throw new Error("Phải chỉ định Mã Màu (SKU) cụ thể để kiểm kê");

        // Tìm đúng SKU trong DanhSachMaMau
        const sku = sp.DanhSachMaMau.find(
          (m) => m.MaMau.toUpperCase() === item.MaMau.toUpperCase(),
        );
        if (!sku)
          throw new Error(
            `Mã màu "${item.MaMau}" không tồn tại trong "${sp.TenDongSon}"`,
          );

        const donGia = sp.DonGiaCoSo || 0;
        const thucTe = Number(item.TonThucTe) || 0;
        const hc = sku.TonKhoKhaDung || 0; // ★ Lấy tồn kho cấp SKU
        const chenhLech = thucTe - hc;

        return {
          Sanpham: item.Sanpham,
          MaMau: sku.MaMau,
          TenMau: sku.TenMau || "",
          TonKhoHT: hc,
          TonThucTe: thucTe,
          ChenhLech: chenhLech,
          DonGia: donGia,
          ThanhTienChenhLech: chenhLech * donGia,
        };
      }),
    );

    let phieu = await PhieuKiemKho.findOne({ MaPhieu: phieuCode });

    if (phieu && phieu.TrangThai === "HOAN_THANH") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Phiếu này đã chốt, không thể thay đổi dữ liệu.",
        });
    }

    if (phieu) {
      phieu.ChiTiet = chiTietMoi;
      phieu.TongChenhLech = chiTietMoi.reduce(
        (sum, item) => sum + item.ChenhLech,
        0,
      );
      if (nguoiKiem) phieu.NguoiKiem = nguoiKiem;
    } else {
      phieu = new PhieuKiemKho({
        MaPhieu: phieuCode,
        TrangThai: "PHIEU_TAM",
        ChiTiet: chiTietMoi,
        TongChenhLech: chiTietMoi.reduce(
          (sum, item) => sum + item.ThanhTienChenhLech,
          0,
        ),
        NguoiKiem: nguoiKiem,
      });
    }

    await phieu.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Đã lưu nháp phiếu kiểm kho!",
        data: phieu,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. Hoàn Thành Phiếu Kiểm Kho (Duyệt Phiếu & Cân Bằng Lại Tồn DB)
 * ĐÃ NÂNG CẤP: Kiểm kê cấp SKU (MaMau) → ghi đè TonKhoKhaDung cho đúng mã màu
 * .save() trigger pre('save') → TongTonKho tự cập nhật
 */
exports.hoanThanhKiemKho = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { MaPhieu } = req.params;
    const phieu = await PhieuKiemKho.findOne({ MaPhieu }).session(session);

    if (!phieu) throw new Error("Không tìm thấy mã phiếu kiểm kho");
    if (phieu.TrangThai === "HOAN_THANH")
      throw new Error("Tuyệt đối không chạy lại phiếu đã hoàn thành");

    for (let item of phieu.ChiTiet) {
      const sp = await SanPhamSon.findById(item.Sanpham).session(session);
      if (!sp) continue;

      // ★ Tìm đúng SKU bằng MaMau
      const sku = sp.DanhSachMaMau.find(
        (m) => m.MaMau.toUpperCase() === item.MaMau.toUpperCase(),
      );
      if (!sku) {
        throw new Error(
          `Mã màu "${item.MaMau}" không tồn tại trong "${sp.TenDongSon}". ` +
            `Phiếu kiểm kê có thể đã lỗi thời.`,
        );
      }

      const tonGocTruocKiem = sku.TonKhoKhaDung || 0;
      const thucTeKiemDuoc = item.TonThucTe;
      const chenhLechCapNhat = thucTeKiemDuoc - tonGocTruocKiem;

      if (chenhLechCapNhat !== 0) {
        // ★ Ghi đè tồn kho cấp SKU
        sku.TonKhoKhaDung = thucTeKiemDuoc;

        // .save() → trigger pre('save') → TongTonKho tự tính lại từ tổng các SKU
        await sp.save({ session });

        const giaoDich = new GiaoDichKho({
          LoaiGiaoDich: "KIEM_KHO",
          MaSanPham: sp._id,
          SoLuongThayDoi: chenhLechCapNhat,
          TonKhoSauGiaoDich: thucTeKiemDuoc,
          MaChungTu: phieu.MaPhieu,
          NguoiThucHien: phieu.NguoiKiem,
          GhiChu: `Kiểm kê | Mã màu: ${item.MaMau} (${item.TenMau})`,
        });
        await giaoDich.save({ session });
      }
    }

    phieu.TrangThai = "HOAN_THANH";
    await phieu.save({ session });

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({
        success: true,
        message: "Đã Cân Bằng Kho và Hoàn thành Phiếu!",
        data: phieu,
      });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 4. Tự động trừ kho khi bán (Service nội bộ — gọi từ Order Controller)
 * Đã nâng cấp: Trừ kho cấp SKU (MaMau) + dùng .save() để trigger pre('save')
 *
 * @param {Array} items - Mảng [{ sanPhamId, maMau, soLuong }]
 * @param {String} MaDonHang - Mã đơn hàng làm chứng từ
 * @param {Session} session - MongoDB Transaction session
 * @param {ObjectId} nguoiThucHien - ID người thao tác
 */
exports.truKhoKhiXuatBan = async (items, MaDonHang, session, nguoiThucHien) => {
  for (const item of items) {
    const { sanPhamId, maMau, soLuong } = item;

    const sp = await SanPhamSon.findById(sanPhamId).session(session);
    if (!sp) {
      throw new Error(`Sản phẩm ${sanPhamId} không tồn tại trong hệ thống`);
    }

    const sku = sp.DanhSachMaMau.find(
      (m) => m.MaMau.toUpperCase() === maMau.toUpperCase(),
    );
    if (!sku) {
      throw new Error(
        `Mã màu "${maMau}" không tồn tại trong "${sp.TenDongSon}"`,
      );
    }

    // Chống bán khống
    if (sku.TonKhoKhaDung < soLuong) {
      throw new Error(
        `⛔ "${sku.TenMau} (${sku.MaMau})" chỉ còn ${sku.TonKhoKhaDung} ${sp.DonViTinh}, ` +
          `không thể xuất ${soLuong} ${sp.DonViTinh}.`,
      );
    }

    sku.TonKhoKhaDung -= soLuong;

    // .save() → trigger pre('save') → TongTonKho tự cập nhật
    await sp.save({ session });

    const giaoDich = new GiaoDichKho({
      LoaiGiaoDich: "XUAT_BAN",
      MaSanPham: sp._id,
      SoLuongThayDoi: -soLuong,
      TonKhoSauGiaoDich: sku.TonKhoKhaDung,
      MaChungTu: MaDonHang,
      NguoiThucHien: nguoiThucHien,
      GhiChu: `Xuất bán | Mã màu: ${maMau}`,
    });
    await giaoDich.save({ session });
  }
};

/**
 * 5. Lấy Danh Sách Tồn Kho
 */
exports.getTonKho = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    let filter = {};
    if (keyword) {
      filter = { $text: { $search: keyword } };
    }

    const danhSachSP = await SanPhamSon.find(filter)
      .select(
        "MaSanPham TenDongSon TongTonKho DonGiaCoSo PhanLoai DonViTinh DanhSachMaMau",
      )
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
      .populate("NguoiKiem", "MaNV HoTen")
      .populate("ChiTiet.Sanpham", "MaSanPham TenDongSon DonGiaCoSo")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: phieuList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- QUẢN LÝ NGUYÊN VẬT LIÊU ---

exports.getNguyenVatLieu = async (req, res) => {
  try {
    const data = await NguyenVatLieu.find()
      .populate("NhaCungCap", "MaNCC TenNCC")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNguyenVatLieu = async (req, res) => {
  try {
    const item = new NguyenVatLieu(req.body);
    await item.save();
    res
      .status(201)
      .json({ success: true, message: "Đã thêm nguyên vật liệu", data: item });
  } catch (error) {
    // Bắt chính xác lỗi trùng lặp mã của MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Lỗi: Mã "${req.body.MaNVL}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác!`,
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateNguyenVatLieu = async (req, res) => {
  try {
    const item = await NguyenVatLieu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res
      .status(200)
      .json({ success: true, message: "Cập nhật thành công", data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteNguyenVatLieu = async (req, res) => {
  try {
    await NguyenVatLieu.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Đã xóa nguyên vật liệu" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════
//  QUẢN LÝ PHIẾU NHẬP / XUẤT KHO — APPROVAL WORKFLOW v2.0
// ═══════════════════════════════════════════════════════════════
//
//  [QUY TẮC AN TOÀN]:
//   1. createPhieuNhapXuat  → CHỈ lưu phiếu, TrangThai = 'CHO_DUYET'. KHÔNG đụng kho.
//   2. duyetPhieuNhapXuat   → Validate tồn kho → Cộng/Trừ SKU (MaMau) → .save() → trigger pre('save') SanPhamSon.
//   3. tuChoiPhieu          → Ghi lý do, TrangThai = 'TU_CHOI'.
//   4. updatePhieuNhapXuat  → Chỉ cho phép sửa khi TrangThai = 'CHO_DUYET'.
//   5. deletePhieuNhapXuat  → Chỉ cho phép xóa khi TrangThai = 'CHO_DUYET'.
// ═══════════════════════════════════════════════════════════════

/**
 * Lấy danh sách phiếu nhập/xuất kho (kèm filter trạng thái nếu có)
 */
exports.getPhieuNhapXuat = async (req, res) => {
  try {
    const filter = {};
    if (req.query.trangThai) filter.TrangThai = req.query.trangThai;
    if (req.query.loaiPhieu) filter.LoaiPhieu = req.query.loaiPhieu;

    const data = await PhieuNhapXuatKho.find(filter)
      .populate("NhaCungCapID", "MaNCC TenNCC")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy phiếu theo nhà cung cấp
 */
exports.getReceiptsBySupplier = async (req, res) => {
  try {
    const data = await PhieuNhapXuatKho.find({
      NhaCungCapID: req.params.supplierId,
      LoaiPhieu: "NHAP",
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ══════════════════════════════════════════════════
 *  BƯỚC 1: LẬP PHIẾU (Chỉ ghi nhận, KHÔNG đụng kho)
 * ══════════════════════════════════════════════════
 */
exports.createPhieuNhapXuat = async (req, res) => {
  try {
    const {
      MaPhieu,
      LoaiPhieu,
      LoaiHang,
      ChiTiet,
      MoTa,
      GhiChu,
      NhaCungCapID,
    } = req.body;

    // Tự sinh mã phiếu nếu không truyền
    const phieuCode =
      MaPhieu ||
      (LoaiPhieu === "NHAP" ? "PN-" : "PX-") + Date.now().toString().slice(-8);

    // Xác định người lập phiếu
    let nguoiLapId = req.user ? req.user._id : null;
    let tenNguoiLap = "ADMIN";
    if (req.user) {
      const NhanVien = require("../models/NhanVien");
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      if (nv) {
        tenNguoiLap = `${nv.MaNV} - ${nv.HoTen}`;
      }
    }

    const newPhieu = new PhieuNhapXuatKho({
      MaPhieu: phieuCode,
      LoaiPhieu,
      LoaiHang,
      ChiTiet,
      MoTa,
      GhiChu,
      NhaCungCapID: NhaCungCapID || null,
      // ★ Approval Workflow: Phiếu mới luôn ở trạng thái CHỜ DUYỆT
      TrangThai: "CHO_DUYET",
      NguoiLapPhieu: nguoiLapId,
      TenNguoiLap: tenNguoiLap,
    });

    // pre('save') sẽ tự tính ThanhTien + TongTien
    await newPhieu.save();

    // Cộng công nợ của nhà cung cấp nếu là phiếu NHẬP hàng từ NCC
    if (LoaiPhieu === "NHAP" && NhaCungCapID) {
      const NhaCungCap = require("../models/NhaCungCap");
      await NhaCungCap.findByIdAndUpdate(NhaCungCapID, {
        $inc: { CongNo: newPhieu.TongTien || 0 },
      });
    }

    res.status(201).json({
      success: true,
      message: `Đã lập phiếu ${phieuCode} — Đang chờ duyệt.`,
      data: newPhieu,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ══════════════════════════════════════════════════════════
 *  BƯỚC 2: DUYỆT PHIẾU (★ Trái tim của hệ thống kho ★)
 * ══════════════════════════════════════════════════════════
 *  Logic:
 *   1. Tìm Phiếu → kiểm tra TrangThai phải là 'CHO_DUYET'
 *   2. Lặp qua từng dòng ChiTiet:
 *      a. Tìm SanPhamSon bằng ItemId
 *      b. Tìm đúng MaMau trong DanhSachMaMau
 *      c. NHẬP → Cộng TonKhoKhaDung
 *         XUẤT → Kiểm tra TonKhoKhaDung >= SoLuong → Trừ TonKhoKhaDung
 *      d. Gọi sanPham.save() → trigger pre('save') → tự cập nhật TongTonKho
 *   3. Đánh dấu phiếu 'DA_DUYET', ghi NguoiDuyet + NgayDuyet
 */
exports.duyetPhieuNhapXuat = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const phieu = await PhieuNhapXuatKho.findById(req.params.id).session(
      session,
    );
    if (!phieu) throw new Error("Không tìm thấy phiếu");
    if (phieu.TrangThai !== "CHO_DUYET") {
      throw new Error(
        `Phiếu này đã ở trạng thái "${phieu.TrangThai}", không thể duyệt lại.`,
      );
    }

    // ════════════════════════════════════════════
    //  XỬ LÝ TỪNG DÒNG SẢN PHẨM TRONG PHIẾU
    // ════════════════════════════════════════════
    if (phieu.LoaiHang === "SAN_PHAM" && phieu.ChiTiet.length > 0) {
      for (const item of phieu.ChiTiet) {
        if (!item.ItemId || !item.MaMau) {
          throw new Error(
            `Dòng "${item.TenItem || item.MaItem}" thiếu thông tin ItemId hoặc MaMau.`,
          );
        }

        // Lấy document sản phẩm (PHẢI dùng find + save, KHÔNG dùng $inc)
        const sanPham = await SanPhamSon.findById(item.ItemId).session(session);
        if (!sanPham) {
          throw new Error(
            `Không tìm thấy sản phẩm "${item.TenItem}" (ID: ${item.ItemId})`,
          );
        }

        // Tìm đúng SKU (mã màu) trong mảng DanhSachMaMau
        let sku = sanPham.DanhSachMaMau.find(
          (m) => m.MaMau.toUpperCase() === item.MaMau.toUpperCase(),
        );
        if (!sku) {
          if (phieu.LoaiPhieu === "NHAP") {
            sanPham.DanhSachMaMau.push({
              MaMau: item.MaMau.toUpperCase(),
              TenMau: item.TenMau || `Màu ${item.MaMau.toUpperCase()}`,
              TonKhoKhaDung: 0,
              TonKhoTamGiu: 0,
              NguongCanhBao: 10,
              TrangThai: true,
            });
            sku = sanPham.DanhSachMaMau.find(
              (m) => m.MaMau.toUpperCase() === item.MaMau.toUpperCase(),
            );
          } else {
            throw new Error(
              `Mã màu "${item.MaMau}" không tồn tại trong sản phẩm "${sanPham.TenDongSon}". ` +
                `Các mã có sẵn: ${sanPham.DanhSachMaMau.map((m) => m.MaMau).join(", ")}`,
            );
          }
        }

        if (phieu.LoaiPhieu === "NHAP") {
          // ═══ NHẬP KHO: Cộng tồn ═══
          sku.TonKhoKhaDung += item.SoLuong;
        } else if (phieu.LoaiPhieu === "XUAT") {
          // ═══ XUẤT KHO: Kiểm tra rồi mới trừ (Chống bán khống!) ═══
          if (sku.TonKhoKhaDung < item.SoLuong) {
            throw new Error(
              `⛔ KHO KHÔNG ĐỦ: Mã màu "${sku.TenMau} (${sku.MaMau})" ` +
                `của sản phẩm "${sanPham.TenDongSon}" chỉ còn ${sku.TonKhoKhaDung} ${sanPham.DonViTinh}, ` +
                `nhưng phiếu yêu cầu xuất ${item.SoLuong} ${sanPham.DonViTinh}.`,
            );
          }
          sku.TonKhoKhaDung -= item.SoLuong;
        }

        // ★ GỌI .save() → trigger pre('save') → TongTonKho tự cập nhật!
        await sanPham.save({ session });

        // Ghi lịch sử biến động kho
        const giaoDich = new GiaoDichKho({
          LoaiGiaoDich: phieu.LoaiPhieu === "NHAP" ? "NHAP_HANG" : "XUAT_BAN",
          MaSanPham: sanPham._id,
          SoLuongThayDoi:
            phieu.LoaiPhieu === "NHAP" ? item.SoLuong : -item.SoLuong,
          TonKhoSauGiaoDich: sku.TonKhoKhaDung,
          MaChungTu: phieu.MaPhieu,
          NguoiThucHien: req.user ? req.user._id : null,
          GhiChu: `${phieu.LoaiPhieu} | Mã màu: ${item.MaMau} | Phiếu: ${phieu.MaPhieu}`,
        });
        await giaoDich.save({ session });
      }
    }

    // Xử lý Nguyên Vật Liệu (đơn giản hơn — không có SKU)
    if (phieu.LoaiHang === "NGUYEN_VAT_LIEU" && phieu.ChiTiet.length > 0) {
      for (const item of phieu.ChiTiet) {
        if (!item.ItemId) continue;
        const multiplier = phieu.LoaiPhieu === "NHAP" ? 1 : -1;

        if (phieu.LoaiPhieu === "XUAT") {
          const nvl = await NguyenVatLieu.findById(item.ItemId).session(
            session,
          );
          if (!nvl)
            throw new Error(`Nguyên vật liệu "${item.TenItem}" không tồn tại`);
          if ((nvl.TonKho || 0) < item.SoLuong) {
            throw new Error(
              `NVL "${nvl.TenNVL}" chỉ còn ${nvl.TonKho}, không thể xuất ${item.SoLuong}`,
            );
          }
        }

        await NguyenVatLieu.findByIdAndUpdate(
          item.ItemId,
          { $inc: { TonKho: item.SoLuong * multiplier } },
          { session },
        );
      }
    }

    // ═══ CẬP NHẬT TRẠNG THÁI PHIẾU ═══
    phieu.TrangThai = "DA_DUYET";
    phieu.NguoiDuyet = req.user ? req.user._id : null;
    phieu.NgayDuyet = new Date();

    // Lấy tên người duyệt
    if (req.user) {
      const NhanVien = require("../models/NhanVien");
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      phieu.TenNguoiDuyet = nv ? `${nv.MaNV} - ${nv.HoTen}` : "Admin";
    }

    await phieu.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `✅ Phiếu ${phieu.MaPhieu} đã được duyệt. Tồn kho đã cập nhật.`,
      data: phieu,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ══════════════════════════════════════════════════
 *  BƯỚC 2b: TỪ CHỐI PHIẾU
 * ══════════════════════════════════════════════════
 */
exports.tuChoiPhieu = async (req, res) => {
  try {
    const phieu = await PhieuNhapXuatKho.findById(req.params.id);
    if (!phieu)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiếu" });
    if (phieu.TrangThai !== "CHO_DUYET") {
      return res
        .status(400)
        .json({
          success: false,
          message: `Phiếu đã ở trạng thái "${phieu.TrangThai}"`,
        });
    }

    phieu.TrangThai = "TU_CHOI";
    phieu.LyDoTuChoi = req.body.lyDo || "Không đạt yêu cầu";
    phieu.NguoiDuyet = req.user ? req.user._id : null;
    phieu.NgayDuyet = new Date();

    if (req.user) {
      const NhanVien = require("../models/NhanVien");
      const nv = await NhanVien.findOne({ AccountID: req.user._id });
      phieu.TenNguoiDuyet = nv ? `${nv.MaNV} - ${nv.HoTen}` : "Admin";
    }

    await phieu.save();

    // Hoàn trả (trừ) công nợ của nhà cung cấp nếu là phiếu NHẬP
    if (phieu.LoaiPhieu === "NHAP" && phieu.NhaCungCapID) {
      const NhaCungCap = require("../models/NhaCungCap");
      await NhaCungCap.findByIdAndUpdate(phieu.NhaCungCapID, {
        $inc: { CongNo: -(phieu.TongTien || 0) },
      });
    }

    res.status(200).json({
      success: true,
      message: `Phiếu ${phieu.MaPhieu} đã bị từ chối.`,
      data: phieu,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Sửa phiếu (CHỈ khi TrangThai = 'CHO_DUYET')
 */
exports.updatePhieuNhapXuat = async (req, res) => {
  try {
    const phieu = await PhieuNhapXuatKho.findById(req.params.id);
    if (!phieu)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiếu" });

    if (phieu.TrangThai !== "CHO_DUYET") {
      return res.status(400).json({
        success: false,
        message: `Không thể sửa phiếu đã "${phieu.TrangThai}". Chỉ phiếu "CHO_DUYET" mới được phép chỉnh sửa.`,
      });
    }

    // Lưu thông tin cũ để cập nhật lại công nợ
    const oldSupplierID = phieu.NhaCungCapID;
    const oldTongTien = phieu.TongTien || 0;
    const oldLoaiPhieu = phieu.LoaiPhieu;

    const { LoaiPhieu, LoaiHang, ChiTiet, MoTa, GhiChu, NhaCungCapID } =
      req.body;
    if (LoaiPhieu) phieu.LoaiPhieu = LoaiPhieu;
    if (LoaiHang) phieu.LoaiHang = LoaiHang;
    if (ChiTiet) phieu.ChiTiet = ChiTiet;
    if (MoTa !== undefined) phieu.MoTa = MoTa;
    if (GhiChu !== undefined) phieu.GhiChu = GhiChu;
    if (NhaCungCapID !== undefined) phieu.NhaCungCapID = NhaCungCapID || null;

    // pre('save') sẽ tự tính lại TongTien
    await phieu.save();

    // Cập nhật lại công nợ
    const NhaCungCap = require("../models/NhaCungCap");
    // 1. Hoàn trả công nợ cũ (trừ công nợ)
    if (oldLoaiPhieu === "NHAP" && oldSupplierID) {
      await NhaCungCap.findByIdAndUpdate(oldSupplierID, {
        $inc: { CongNo: -oldTongTien },
      });
    }
    // 2. Cộng công nợ mới
    if (phieu.LoaiPhieu === "NHAP" && phieu.NhaCungCapID) {
      await NhaCungCap.findByIdAndUpdate(phieu.NhaCungCapID, {
        $inc: { CongNo: phieu.TongTien || 0 },
      });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Cập nhật phiếu thành công",
        data: phieu,
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Xóa phiếu (CHỈ khi TrangThai = 'CHO_DUYET')
 */
exports.deletePhieuNhapXuat = async (req, res) => {
  try {
    const phieu = await PhieuNhapXuatKho.findById(req.params.id);
    if (!phieu)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiếu" });

    if (phieu.TrangThai !== "CHO_DUYET") {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa phiếu đã "${phieu.TrangThai}". Phiếu đã duyệt là chứng từ kế toán, không được phép hủy.`,
      });
    }

    await PhieuNhapXuatKho.findByIdAndDelete(req.params.id);

    // Hoàn trả (trừ) công nợ của nhà cung cấp nếu là phiếu NHẬP
    if (phieu.LoaiPhieu === "NHAP" && phieu.NhaCungCapID) {
      const NhaCungCap = require("../models/NhaCungCap");
      await NhaCungCap.findByIdAndUpdate(phieu.NhaCungCapID, {
        $inc: { CongNo: -(phieu.TongTien || 0) },
      });
    }

    res
      .status(200)
      .json({ success: true, message: `Đã xóa phiếu ${phieu.MaPhieu}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
