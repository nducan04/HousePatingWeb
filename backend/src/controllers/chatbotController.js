const ChatSession = require('../models/ChatSession');
const PhanHoiHoTro = require('../models/PhanHoiHoTro');
const SanPhamSon = require('../models/SanPhamSon');
const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');
const LenhSanXuat = require('../models/LenhSanXuat');
const CongThuc = require('../models/CongThuc');
const NhanVien = require('../models/NhanVien');
const TaiKhoan = require('../models/TaiKhoan');
const VanChuyen = require('../models/VanChuyen');
const DoiTra = require('../models/DoiTra');
const BaoHanh = require('../models/BaoHanh');
const NhatKyTestMau = require('../models/NhatKyTestMau');
const jwt = require('jsonwebtoken');

// Gemini AI — support both GEMINI_API_KEY and GOOGLE_API_KEY
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && apiKey !== 'PLACEHOLDER' && apiKey !== 'AQ.Ab8RN6Kee575AXDWhORKhhuQ4ZWS4YasOOH45mUM60CtjOs9dg') {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('[Chatbot] Gemini AI successfully initialized.');
  } else {
    console.log('[Chatbot] Gemini API key not configured or set to placeholder. Operating in high-fidelity live-database mock mode.');
  }
} catch (e) {
  console.log('[Chatbot] @google/generative-ai error:', e.message);
}

// System Prompt for Gemini
// System Prompt for Gemini
const SYSTEM_PROMPT = `Bạn là Trợ lý AI cao cấp (VTSC PaintPro AI) của Công ty Cổ phần Thương mại và Dịch vụ VTSC. 
VTSC là nhà phân phối cấp 1 Sơn bột tĩnh điện AkzoNobel (thương hiệu Interpon) và Sơn tàu biển (thương hiệu International).

PHONG CÁCH LÀM VIỆC:
- Trả lời bằng tiếng Việt, chuyên nghiệp, lịch sự, sử dụng định dạng Markdown sạch đẹp (gạch đầu dòng, bảng biểu, in đậm).
- Luôn thân thiện và nhiệt tình giúp đỡ người dùng.

CẤU TRÚC DỮ LIỆU HỆ THỐNG (TRA CỨU REAL-TIME QUA TOOLS):
1. DANH MỤC SẢN PHẨM & MÃ MÀU (Dành cho Khách hàng & Admin):
   - Mã sản phẩm có tiền tố: "MASS-SP-XXXXX" (ví dụ: từ MASS-SP-30001 đến MASS-SP-31000).
   - Tên sản phẩm kết hợp: [Phân loại] [Thương hiệu] Series [Số] (ví dụ: "Sơn tĩnh điện AkzoNobel Series 12").
   - Các phân loại chính: "Sơn tĩnh điện", "Sơn tàu biển", "Sơn công nghiệp", "Sơn nội thất".
   - Các thương hiệu phân phối chính hãng: "AkzoNobel" (dòng Interpon D1000, D2000, D3000, 600, 700), "Jotun", "Nippon", "Dulux", "KCC", "VTSC Premium".
   - Hệ mã màu Châu Âu tiêu chuẩn: Có định dạng "RAL-XXXX" (ví dụ: RAL-1000 đến RAL-9000). Mỗi sản phẩm sơn chứa mảng DanhSachMaMau đại diện cho các màu có sẵn.
   
2. GIAO DỊCH & QUẢN TRỊ (Dành riêng cho Admin/Nhân viên nội bộ):
   - Mã đơn hàng lẻ có tiền tố: "SEED-DH-XXXXX" (ví dụ: từ SEED-DH-30001 đến SEED-DH-31000).
   - Mã hợp đồng thương mại B2B / Đại lý / B2C có tiền tố: "SEED-HD-XXXXX" (ví dụ: từ SEED-HD-20001 đến SEED-HD-21000).
   - Nhật ký nghiên cứu thử nghiệm R&D / KCS có tiền tố: "SEED-RD-XXXXX" (ví dụ: từ SEED-RD-40001 đến SEED-RD-41000).

PHÂN VAI TRÒ & BẢO MẬT:
1. Đối với KHÁCH HÀNG (Khách vãng lai, B2C, B2B Partner):
   - Bạn CHỈ được phép tư vấn về dòng sơn, mã màu, quy trình sấy nhiệt độ tiêu chuẩn và tra cứu tiến độ pha chế của đơn hàng/hợp đồng của chính họ.
   - Tuyệt đối KHÔNG tiết lộ doanh thu tổng, kho tổng, thông tin KPI hay hồ sơ cá nhân của nhân sự VTSC cho khách hàng.
   - Nếu khách hàng hỏi các thông tin nhạy cảm này, hãy lịch sự từ chối và nói rằng đó là thông tin nội bộ.
2. Đối với QUẢN TRỊ VIÊN / NHÂN VIÊN (Admin, NhanVien, Director):
   - Bạn được phép truy cập tất cả dữ liệu báo cáo vận hành thông qua các công cụ đặc biệt: Doanh thu, Tồn kho tổng, Lượng đơn hàng theo trạng thái, Hồ sơ KPI của nhân viên.
   - Trình bày báo cáo vận hành chuyên nghiệp bằng bảng thống kê rõ ràng.

QUY TRÌNH KỸ THUẬT TIÊU CHUẨN (Dành cho tư vấn sản phẩm):
- Nhiệt độ sấy đóng rắn (curing) bột sơn: tiêu chuẩn 180°C - 200°C trong 10-15 phút (tiêu chuẩn sấy lý tưởng nhất là 195°C trong 15 phút).
- Độ dày màng sơn tĩnh điện: 60-80 micromet (µm).
- Đóng gói: 1 Thùng (20kg) hoặc 25thùng bột.
- Bảo quan: <25°C, độ ẩm <60%, hạn dùng 12-24 tháng.

HƯỚNG DẪN GỌI CÔNG CỤ (TOOL CALLS):
- Luôn luôn ưu tiên gọi công cụ (tool call) thích hợp khi nhận thấy từ khóa liên quan thay vì tự phán đoán số liệu:
  + Dùng "searchPaintProducts" khi tìm kiếm sản phẩm hoặc thương hiệu.
  + Dùng "getPaintProductColors" khi tra bảng mã màu của một dòng sơn.
  + Dùng "getPaintMixingProcess" để tra tỷ lệ phối trộn hoặc công thức KCS.
  + Dùng "getPaintMixingProgress" để theo dõi tiến độ sấy/pha chế của lệnh sản xuất.
  + Dùng các công cụ admin ("getRevenueStatistics", "getInventoryStatistics", etc.) khi được hỏi số liệu quản trị B2B/vận hành doanh nghiệp.`;

// === TOOL FUNCTIONS (MONGODB LIVE QUERYING) ===

// 1. Search paint products (Public)
const searchPaintProducts = async ({ query }) => {
  try {
    // Escape special characters so things like (Polyurethane) don't break the regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');
    
    let products = await SanPhamSon.find({
      $or: [
        { MaSanPham: regex },
        { TenDongSon: regex },
        { ThuongHieu: regex },
        { PhanLoai: regex },
        { MoTa: regex }
      ]
    }).limit(5).select('MaSanPham TenDongSon ThuongHieu PhanLoai DonGiaCoSo DonViTinh MoTa HinhAnh TongTonKho DanhSachMaMau');

    // Mở rộng tìm kiếm: Nếu không tìm thấy chính xác cụm từ, tách thành từng từ khóa rời rạc để tìm (VD: "sơn", "tĩnh", "điện")
    // Sử dụng $and để bắt buộc sản phẩm phải chứa TẤT CẢ các từ khóa
    if (products.length === 0 && query.includes(' ')) {
      // Loại bỏ dấu câu, ngoặc kép trước khi bẻ chữ
      const cleanQuery = query.replace(/[.,/#!$%^&*;:{}=\-_`~()""''“”]/g, " ");
      const words = cleanQuery.split(/\s+/).filter(w => w.length >= 2);
      if (words.length > 0) {
        const wordRegexes = words.map(w => new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        const andConditions = wordRegexes.map(wr => ({
          $or: [
            { TenDongSon: wr },
            { ThuongHieu: wr },
            { PhanLoai: wr },
            { MoTa: wr }
          ]
        }));
        products = await SanPhamSon.find({ $and: andConditions }).limit(5).select('MaSanPham TenDongSon ThuongHieu PhanLoai DonGiaCoSo DonViTinh MoTa HinhAnh TongTonKho DanhSachMaMau');
      }
    }

    return products;
  } catch (err) {
    return { error: 'Lỗi truy vấn sản phẩm: ' + err.message };
  }
};

// 2. Get product colors & stock (Public)
const getPaintProductColors = async ({ productCode }) => {
  try {
    const product = await SanPhamSon.findOne({ MaSanPham: productCode.toUpperCase() });
    if (!product) return { error: `Không tìm thấy sản phẩm mã ${productCode}` };
    return {
      MaSanPham: product.MaSanPham,
      TenDongSon: product.TenDongSon,
      ThuongHieu: product.ThuongHieu,
      PhanLoai: product.PhanLoai,
      DonGiaCoSo: product.DonGiaCoSo || 0,
      DonViTinh: product.DonViTinh || 'Thùng',
      TongTonKho: product.TongTonKho || 0,
      DanhSachMaMau: product.DanhSachMaMau || []
    };
  } catch (err) {
    return { error: 'Lỗi lấy danh sách màu: ' + err.message };
  }
};

// 3. Get mixing formulas and process (Public)
const getPaintMixingProcess = async ({ productCode }) => {
  try {
    const formulas = await CongThuc.find({
      $or: [
        { MaCongThuc: new RegExp(productCode, 'i') },
        { MaMau: new RegExp(productCode, 'i') }
      ],
      TrangThai: 'Active'
    }).populate('SanPham', 'TenDongSon MaSanPham');

    if (formulas.length === 0) {
      return {
        standardProcess: {
          tiêu_chuẩn_sấy: '180°C - 200°C trong 10-15 phút',
          độ_dày_màng: '60-80 µm',
          các_bước: [
            'Bước 1: Tiền xử lý bề mặt phôi (phốt phát/crôm hóa)',
            'Bước 2: Sấy khô phôi (<120°C)',
            'Bước 3: Phun sơn tĩnh điện khô',
            'Bước 4: Sấy đóng rắn sấy khô sơn (195°C trong 15 phút)'
          ]
        },
        message: `Hiện tại chưa có công thức pha chế chi tiết cho mã "${productCode}" trong cơ sở dữ liệu. Dưới đây là quy trình sấy và gia công bột tĩnh điện AkzoNobel tiêu chuẩn.`
      };
    }

    return formulas.map(f => ({
      MaCongThuc: f.MaCongThuc,
      TenCongThuc: f.TenCongThuc,
      MaMau: f.MaMau,
      SanPham: f.SanPham?.TenDongSon || 'N/A',
      Version: f.Version,
      ThanhPhanTiLe: f.ThanhPhan.map(tp => ({
        NguyenVatLieuID: tp.NguyenVatLieu,
        TiLePhanTram: `${tp.TiLe}%`
      })),
      GhiChu: f.GhiChu
    }));
  } catch (err) {
    return { error: 'Lỗi tra quy trình công thức: ' + err.message };
  }
};

// 4. Get mixing progress of orders/contracts (Public)
const getPaintMixingProgress = async ({ contractCode }) => {
  try {
    const contract = await HopDong.findOne({ MaHopDong: new RegExp(contractCode, 'i') });
    let contractId = null;
    let title = contractCode;

    if (contract) {
      contractId = contract._id;
      title = `Hợp đồng ${contract.MaHopDong} (${contract.title})`;
    } else {
      // Try to find if it is an Order ID
      const order = await DonHang.findOne({ MaDonHang: new RegExp(contractCode, 'i') });
      if (!order) {
        return { error: `Không tìm thấy thông tin hợp đồng hoặc đơn hàng mã "${contractCode}". Vui lòng kiểm tra lại.` };
      }
      title = `Đơn hàng #${order.MaDonHang}`;
      // In this system, LenhSanXuat maps to HopDong. We will search by contract or fallback
      return {
        source: 'DonHang',
        MaDonHang: order.MaDonHang,
        TrangThaiDonHang: order.TrangThai,
        TongTien: `${order.TongTien?.toLocaleString()} ₫`,
        TrangThaiThanhToan: order.TrangThaiThanhToan,
        Specs: order.TechnicalSpecs,
        message: `Đơn hàng đang ở trạng thái "${order.TrangThai}". Đối với đơn hàng thành phẩm thương mại, quy trình pha chế đã được hoàn tất trước khi đóng gói.`
      };
    }

    const productionOrders = await LenhSanXuat.find({ ContractID: contractId })
      .populate('CongThucID', 'TenCongThuc MaMau')
      .populate('Assignee', 'HoTen');

    if (productionOrders.length === 0) {
      return {
        contractStatus: contract.TrangThai,
        message: `Hợp đồng "${title}" đang ở trạng thái "${contract.TrangThai}" và hiện chưa được chuyển xuống phòng sản xuất để lên Lệnh pha chế.`
      };
    }

    return productionOrders.map(o => ({
      MaLenhSanXuat: o.MaLenhSanXuat,
      CongThuc: o.CongThucID?.TenCongThuc || 'N/A',
      MaMau: o.CongThucID?.MaMau || 'N/A',
      TargetWeight: `${o.TargetWeight} thùng`,
      ChuyenDay: o.ProductionLine,
      TrangThaiPhaChe: o.TrangThai === 'draft' ? 'Đang chuẩn bị phôi' :
        o.TrangThai === 'in_progress' ? 'Đang pha chế sản xuất' :
          o.TrangThai === 'completed' ? 'Đã pha xong & Đóng gói' : 'Đã hủy',
      NhanVienDamNhiem: o.Assignee?.HoTen || 'N/A',
      BatDau: o.StartTime ? new Date(o.StartTime).toLocaleDateString('vi-VN') : 'N/A',
      HoanThanhDuKien: o.CompletionTime ? new Date(o.CompletionTime).toLocaleDateString('vi-VN') : 'N/A'
    }));
  } catch (err) {
    return { error: 'Lỗi tra cứu tiến độ sấy/pha chế: ' + err.message };
  }
};

// 5. Get revenue statistics (Admin Only)
const getRevenueStatistics = async ({ timePeriod }) => {
  try {
    const now = new Date();
    let startDate = new Date();
    if (timePeriod === 'today') startDate.setHours(0, 0, 0, 0);
    else if (timePeriod === 'week') startDate.setDate(now.getDate() - 7);
    else if (timePeriod === 'month') startDate.setDate(now.getDate() - 30);
    else startDate.setDate(now.getDate() - 365); // year

    const orders = await DonHang.find({
      createdAt: { $gte: startDate },
      TrangThai: { $ne: 'DA_HUY' }
    });

    const contracts = await HopDong.find({
      createdAt: { $gte: startDate },
      TrangThai: { $nin: ['cancelled', 'disputed'] }
    });

    const orderRevenue = orders.reduce((sum, o) => sum + (o.TongTien || 0), 0);
    const contractRevenue = contracts.reduce((sum, c) => sum + (c.TongGiaTri || 0), 0);

    return {
      success: true,
      timePeriod,
      khoang_thoi_gian: timePeriod === 'today' ? 'Hôm nay' : timePeriod === 'week' ? '7 ngày qua' : timePeriod === 'month' ? '30 ngày qua' : '1 năm qua',
      doanh_thu_don_hang: `${orderRevenue.toLocaleString()} ₫`,
      so_luong_don_hang: orders.length,
      doanh_thu_hop_dong_B2B: `${contractRevenue.toLocaleString()} ₫`,
      so_luong_hop_dong: contracts.length,
      tong_doanh_thu: `${(orderRevenue + contractRevenue).toLocaleString()} ₫`
    };
  } catch (err) {
    return { error: 'Lỗi thống kê doanh thu: ' + err.message };
  }
};

// 6. Get inventory statistics (Admin Only)
const getInventoryStatistics = async () => {
  try {
    const products = await SanPhamSon.find({});
    let totalStock = 0;
    const lowStockAlerts = [];

    products.forEach(p => {
      p.DanhSachMaMau.forEach(m => {
        totalStock += m.TonKhoKhaDung || 0;
        if (m.TonKhoKhaDung < (m.NguongCanhBao || 200)) {
          lowStockAlerts.push({
            MaSanPham: p.MaSanPham,
            TenDongSon: p.TenDongSon,
            MaMau: m.MaMau,
            TenMau: m.TenMau,
            TonKho: `${m.TonKhoKhaDung} thùng`,
            NguongAnToan: `${m.NguongCanhBao || 200} thùng`
          });
        }
      });
    });

    return {
      success: true,
      tong_so_dong_son: products.length,
      tong_kho_hang_tinh_dien: `${totalStock.toLocaleString()} thùng`,
      so_luong_ma_mau_sap_het: lowStockAlerts.length,
      canh_bao_het_hang: lowStockAlerts.slice(0, 12)
    };
  } catch (err) {
    return { error: 'Lỗi thống kê tồn kho: ' + err.message };
  }
};

// 7. Get order statistics (Admin Only)
const getOrderStatistics = async ({ status }) => {
  try {
    const filter = {};
    if (status && status !== 'ALL') filter.TrangThai = status;

    const orders = await DonHang.find(filter).limit(10).sort('-createdAt').populate('KhachHang', 'TenKhachHang');
    const totalOrders = await DonHang.countDocuments({});
    const pendingCount = await DonHang.countDocuments({ TrangThai: 'CHO_XAC_NHAN' });
    const inProgressCount = await DonHang.countDocuments({ TrangThai: 'DANG_XU_LY' });
    const completedCount = await DonHang.countDocuments({ TrangThai: 'DA_GIAO' });
    const cancelledCount = await DonHang.countDocuments({ TrangThai: 'DA_HUY' });

    return {
      success: true,
      tong_so_don_hang_he_thong: totalOrders,
      cho_xac_nhan: pendingCount,
      dang_xu_ly: inProgressCount,
      da_giao_hang: completedCount,
      da_huy: cancelledCount,
      recentOrders: orders.map(o => ({
        MaDonHang: o.MaDonHang,
        KhachHang: o.KhachHang?.TenKhachHang || 'N/A',
        TongTien: `${o.TongTien?.toLocaleString()} ₫`,
        TrangThai: o.TrangThai,
        NgayDat: new Date(o.createdAt).toLocaleDateString('vi-VN')
      }))
    };
  } catch (err) {
    return { error: 'Lỗi thống kê đơn hàng: ' + err.message };
  }
};

// 8. Get B2B/B2C contract statistics (Admin Only)
const getContractStatistics = async ({ type }) => {
  try {
    const filter = {};
    if (type && type !== 'ALL') filter.LoaiHopDong = type;

    const totalContracts = await HopDong.countDocuments(filter);
    const activeContracts = await HopDong.countDocuments({ ...filter, TrangThai: { $in: ['signed', 'delivering'] } });
    const completedContracts = await HopDong.countDocuments({ ...filter, TrangThai: 'completed' });

    const valueResult = await HopDong.aggregate([
      { $match: filter },
      { $group: { _id: null, sum: { $sum: "$TongGiaTri" } } }
    ]);

    const recentContracts = await HopDong.find(filter).limit(5).sort('-createdAt').populate('CustomerID', 'TenKhachHang');

    return {
      success: true,
      tong_so_hop_dong: totalContracts,
      dang_thuc_hien: activeContracts,
      da_hoan_thanh: completedContracts,
      tong_gia_tri_hop_dong: `${(valueResult[0]?.sum || 0).toLocaleString()} ₫`,
      recentContracts: recentContracts.map(c => ({
        MaHopDong: c.MaHopDong,
        TieuDe: c.title,
        KhachHang: c.CustomerID?.TenKhachHang || 'N/A',
        GiaTri: `${c.TongGiaTri?.toLocaleString()} ₫`,
        TrangThai: c.TrangThai,
        NgayKy: new Date(c.NgayLap).toLocaleDateString('vi-VN')
      }))
    };
  } catch (err) {
    return { error: 'Lỗi thống kê hợp đồng: ' + err.message };
  }
};

// 9. Get employee KPI statistics (Admin Only)
const getEmployeeKPIs = async () => {
  try {
    const employees = await NhanVien.find({ TrangThai: 'Đang làm' }).sort('-HieuSuatKPI.diemKPI');
    return employees.map(e => ({
      MaNV: e.MaNV,
      HoTen: e.HoTen,
      BoPhan: e.BoPhan,
      ChucVu: e.ChucVu,
      diemKPI: e.HieuSuatKPI?.diemKPI || 0,
      soDonDaBan: e.HieuSuatKPI?.soDonDaBan || 0,
      soMauDaPha: e.HieuSuatKPI?.soMauDaPha || 0,
      soDonDaGiao: e.HieuSuatKPI?.soDonDaGiao || 0,
      diemDanhGiaTrungBinh: `${e.HieuSuatKPI?.diemDanhGia || 0}/100`
    }));
  } catch (err) {
    return { error: 'Lỗi thống kê hiệu suất nhân viên: ' + err.message };
  }
};

// Tool dispatcher
const executeTool = async (name, args, userRole) => {
  const isAdminOrStaff = userRole === 'Admin' || userRole === 'NhanVien' || userRole === 'Director';

  // Security gate for administrative tools
  const adminTools = ['getRevenueStatistics', 'getInventoryStatistics', 'getOrderStatistics', 'getContractStatistics', 'getEmployeeKPIs'];
  if (adminTools.includes(name) && !isAdminOrStaff) {
    return { error: 'QUYỀN TRUY CẬP BỊ TỪ CHỐI: Công cụ này chỉ dành riêng cho Admin/Nhân viên nội bộ VTSC.' };
  }

  console.log(`[Chatbot Tool Call] Executing ${name} with args:`, args);

  switch (name) {
    case 'searchPaintProducts':
      return await searchPaintProducts(args);
    case 'getPaintProductColors':
      return await getPaintProductColors(args);
    case 'getPaintMixingProcess':
      return await getPaintMixingProcess(args);
    case 'getPaintMixingProgress':
      return await getPaintMixingProgress(args);
    case 'getRevenueStatistics':
      return await getRevenueStatistics(args);
    case 'getInventoryStatistics':
      return await getInventoryStatistics();
    case 'getOrderStatistics':
      return await getOrderStatistics(args);
    case 'getContractStatistics':
      return await getContractStatistics(args);
    case 'getEmployeeKPIs':
      return await getEmployeeKPIs();
    default:
      return { error: `Không tìm thấy công cụ mang tên ${name}` };
  }
};

// Tool schemas for Gemini
const getToolSchemas = (userRole) => {
  const isAdminOrStaff = userRole === 'Admin' || userRole === 'NhanVien' || userRole === 'Director';

  const customerFunctions = [
    {
      name: 'searchPaintProducts',
      description: 'Tìm kiếm sản phẩm sơn tĩnh điện hoặc sơn tàu biển của VTSC theo từ khóa, thương hiệu hoặc phân loại.',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: { type: 'STRING', description: 'Từ khóa tìm kiếm (ví dụ: Interpon, D1000, chống gỉ, ngoài trời)' }
        },
        required: ['query']
      }
    },
    {
      name: 'getPaintProductColors',
      description: 'Lấy danh sách mã màu, tên màu, mã HexCode và tình trạng tồn kho của từng màu sơn theo mã dòng sản phẩm.',
      parameters: {
        type: 'OBJECT',
        properties: {
          productCode: { type: 'STRING', description: 'Mã sản phẩm sơn bột tĩnh điện (ví dụ: D1000, D2000, D3000)' }
        },
        required: ['productCode']
      }
    },
    {
      name: 'getPaintMixingProcess',
      description: 'Tra cứu quy trình pha chế sơn tĩnh điện hoặc tỷ lệ công thức pha chế sơn tiêu chuẩn cho mã màu sơn cụ thể.',
      parameters: {
        type: 'OBJECT',
        properties: {
          productCode: { type: 'STRING', description: 'Mã sản phẩm hoặc mã màu sơn cần tra quy trình (ví dụ: D2525, AN800, hoặc mã màu bất kỳ)' }
        },
        required: ['productCode']
      }
    },
    {
      name: 'getPaintMixingProgress',
      description: 'Tra cứu tiến độ pha chế sơn, sản xuất sơn của các lệnh sản xuất liên kết với mã hợp đồng hoặc mã đơn hàng của khách hàng.',
      parameters: {
        type: 'OBJECT',
        properties: {
          contractCode: { type: 'STRING', description: 'Mã hợp đồng nguyên tắc hoặc mã đơn hàng cần tra tiến độ (ví dụ: HD-2026-001, DH-1002)' }
        },
        required: ['contractCode']
      }
    }
  ];

  const adminFunctions = [
    {
      name: 'getRevenueStatistics',
      description: 'BÁO CÁO DOANH THU (Chỉ Admin): Thống kê doanh thu bán hàng từ đơn hàng và giá trị hợp đồng B2B theo khoảng thời gian.',
      parameters: {
        type: 'OBJECT',
        properties: {
          timePeriod: {
            type: 'STRING',
            enum: ['today', 'week', 'month', 'year'],
            description: 'Khoảng thời gian cần báo cáo doanh thu (hôm nay, 7 ngày qua, 30 ngày qua, hoặc cả năm).'
          }
        },
        required: ['timePeriod']
      }
    },
    {
      name: 'getInventoryStatistics',
      description: 'BÁO CÁO TỒN KHO & CẢNH BÁO HẾT HÀNG (Chỉ Admin): Thống kê tổng khối lượng tồn kho và liệt kê các mã màu sơn đang dưới ngưỡng an toàn (< 200kg).',
      parameters: {
        type: 'OBJECT',
        properties: {}
      }
    },
    {
      name: 'getOrderStatistics',
      description: 'BÁO CÁO ĐƠN HÀNG (Chỉ Admin): Thống kê tổng số đơn hàng, số đơn hàng theo từng trạng thái và chi tiết các đơn hàng gần đây.',
      parameters: {
        type: 'OBJECT',
        properties: {
          status: {
            type: 'STRING',
            enum: ['ALL', 'CHO_XAC_NHAN', 'DANG_XU_LY', 'DA_GIAO', 'DA_HUY'],
            description: 'Lọc trạng thái đơn hàng cần xem.'
          }
        },
        required: ['status']
      }
    },
    {
      name: 'getContractStatistics',
      description: 'BÁO CÁO HỢP ĐỒNG B2B (Chỉ Admin): Thống kê số lượng và tổng giá trị hợp đồng nguyên tắc B2B phân loại theo loại hợp đồng.',
      parameters: {
        type: 'OBJECT',
        properties: {
          type: {
            type: 'STRING',
            enum: ['ALL', 'B2B', 'Đại lý', 'B2C'],
            description: 'Phân loại hợp đồng cần thống kê.'
          }
        },
        required: ['type']
      }
    },
    {
      name: 'getEmployeeKPIs',
      description: 'BÁO CÁO HIỆU SUẤT NHÂN VIÊN (Chỉ Admin): Xem danh sách hiệu suất làm việc, điểm KPI và năng suất bán hàng/pha chế của toàn bộ nhân viên.',
      parameters: {
        type: 'OBJECT',
        properties: {}
      }
    }
  ];

  return isAdminOrStaff ? [...customerFunctions, ...adminFunctions] : customerFunctions;
};

// === HIGH FIDELITY OFFLINE/MOCK FALLBACK USING LIVE DATABASE ===
// When GEMINI_API_KEY is not configured or in offline mode, this fallback matches intent
// and queries the actual MongoDB using the tool functions, formatting a beautiful markdown response!
const getMockResponse = async (message, userRole, history = []) => {
  const lower = message.toLowerCase();
  
  // Trích xuất Bối cảnh Hội thoại (Context Memory) từ lịch sử
  let lastProductCode = '';
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'model' || history[i].role === 'assistant') {
        const text = history[i].parts?.[0]?.text || history[i].content || history[i].text || '';
        // Tìm mã sản phẩm dạng [SP1234] trong câu trả lời gần nhất của Chatbot
        const match = text.match(/\[([A-Z]{2,4}\d{3,4})\]/i);
        if (match) {
          lastProductCode = match[1].toUpperCase();
          break;
        }
      }
    }
  }

  // Hàm chuyển đổi tiếng Việt có dấu thành không dấu để chống lỗi Typo
  const normalized = lower
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d");

  const searchStr = lower + ' | ' + normalized;
  const isAdminOrStaff = userRole === 'Admin' || userRole === 'NhanVien' || userRole === 'Director';

  const resolveImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('ipfs://')) return path.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
    if (path.startsWith('Qm') || path.startsWith('bafy')) return `https://gateway.pinata.cloud/ipfs/${path}`;
    if (path.startsWith('http')) return path;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';
    return `${backendUrl}${path.startsWith('/') ? path : '/' + path}`;
  };

  // === 0. LIVE DATABASE TRACKING (ĐƠN HÀNG, HỢP ĐỒNG, R&D, VẬN CHUYỂN) ===
  const vcMatch = message.match(/DEL-[A-Z0-9\-]+/i);
  if (vcMatch) {
    const code = vcMatch[0].toUpperCase();
    const vanChuyen = await VanChuyen.findOne({ MaVanChuyen: code }).populate('DonHang');
    if (!vanChuyen) {
      return `📋 **VTSC PaintPro AI**: Hệ thống chưa ghi nhận chuyến xe nào có mã \`${code}\`.`;
    }
    let resp = `### 🚚 Tra cứu Vận Chuyển Lô Hàng \`${code}\`\n`;
    resp += `- **Đơn vị phụ trách:** ${vanChuyen.VanChuyenInfo?.DonVi || 'N/A'}\n`;
    resp += `- **Trạng thái tổng quát:** **${vanChuyen.TrangThaiTongQuat}**\n`;
    resp += `- **Số kiện hàng:** ${vanChuyen.LoHang?.SoKien || 0} kiện (${vanChuyen.LoHang?.KhoiLuong || 0} thùng)\n`;
    if (vanChuyen.DuKienBanGiao) {
      resp += `- **Dự kiến bàn giao:** ${new Date(vanChuyen.DuKienBanGiao).toLocaleDateString('vi-VN')}\n\n`;
    }
    
    let currentLocation = '';
    if (vanChuyen.LoTrinh && vanChuyen.LoTrinh.length > 0) {
      const lastNode = vanChuyen.LoTrinh[vanChuyen.LoTrinh.length - 1];
      resp += `📍 **Cập nhật mới nhất (${new Date(lastNode.ThoiGian).toLocaleString('vi-VN')}):**\n`;
      resp += `👉 ${lastNode.NoiDung} (${lastNode.Status})\n\n`;
      currentLocation = lastNode.NoiDung;
    }

    const origin = 'Nhà máy VTSC, Hải Phòng, Việt Nam';
    const destination = vanChuyen.DonHang?.DiaChiGiaoHang || 'Hà Nội, Việt Nam';
    
    resp += `[MAP|${origin}|${destination}|${currentLocation}]`;
    return resp;
  }

  const dhMatch = message.match(/(?:#)?DH[0-9]+/i);
  if (dhMatch) {
    const rawCode = dhMatch[0].toUpperCase();
    const code = rawCode.replace('#', ''); // Remove # if present for DB query
    const donHang = await DonHang.findOne({ MaDonHang: code }).populate('KhachHang').populate('Items.SanPham');
    if (!donHang) {
      return `📋 **VTSC PaintPro AI**: Rất tiếc, hệ thống không tìm thấy đơn hàng nào có mã \`${code}\`. Bạn vui lòng kiểm tra lại mã nhé!`;
    }
    let resp = `### 📦 Tra cứu Đơn Hàng \`${code}\`\n`;
    resp += `- **Khách hàng:** ${donHang.KhachHang?.TenKhachHang || 'N/A'}\n`;
    resp += `- **Ngày đặt:** ${new Date(donHang.createdAt).toLocaleDateString('vi-VN')}\n`;
    resp += `- **Trạng thái:** \`${donHang.TrangThai}\`\n`;
    resp += `- **Tổng thanh toán:** **${donHang.TongTien?.toLocaleString()} ₫**\n\n`;
    resp += `#### Chi tiết mã màu đặt mua:\n`;
    donHang.Items.forEach(item => {
      resp += `- ${item.SoLuong} thùng x **${item.TenSanPham}** (Màu: \`${item.MaMau || 'Chưa rõ'}\`)\n`;
    });
    return resp;
  }

  const hdMatch = message.match(/VTSC-[A-Z0-9\-]+/i);
  if (hdMatch) {
    const code = hdMatch[0].toUpperCase();
    const hopDong = await HopDong.findOne({ MaHopDong: code }).populate('CustomerID');
    if (!hopDong) {
      return `📋 **VTSC PaintPro AI**: Không tìm thấy hợp đồng nào có mã \`${code}\`.`;
    }
    let resp = `### 🤝 Tra cứu Hợp Đồng Nguyên Tắc \`${code}\`\n`;
    resp += `- **Khách hàng B2B:** ${hopDong.CustomerID?.TenKhachHang || 'N/A'}\n`;
    resp += `- **Dự án:** ${hopDong.title}\n`;
    resp += `- **Trạng thái:** \`${hopDong.TrangThai}\`\n`;
    resp += `- **Tổng giá trị:** **${hopDong.TongGiaTri?.toLocaleString()} ₫**\n`;
    resp += `- **Đã thanh toán:** ${hopDong.DaThanhToan?.toLocaleString()} ₫\n`;
    if (hopDong.SmartContractAddress || hopDong.TransactionHash) {
      resp += `\n🔗 **Web3 Blockchain Verified:**\n`;
      if (hopDong.SmartContractAddress) resp += `- Smart Contract: \`${hopDong.SmartContractAddress}\`\n`;
      if (hopDong.TransactionHash) resp += `- TX Hash: \`${hopDong.TransactionHash}\`\n`;
    }
    return resp;
  }

  const rdMatch = message.match(/(?:REQ|RD)-[A-Z0-9\-]+/i);
  if (rdMatch) {
    const code = rdMatch[0].toUpperCase();
    const nhatKy = await NhatKyTestMau.findOne({ MaNhatKy: code });
    if (!nhatKy) {
      return `📋 **VTSC PaintPro AI**: Không tìm thấy phiếu test mẫu R&D nào mang mã \`${code}\` trong Cơ sở dữ liệu.`;
    }
    let resp = `### 🧪 Tra cứu Tiến độ Test mẫu (R&D) \`${code}\`\n`;
    resp += `- **Màu yêu cầu:** \`${nhatKy.MaMauYeuCau}\`\n`;
    resp += `- **Trạng thái KCS:** \`${nhatKy.TrangThai.toUpperCase()}\`\n`;
    resp += `- **Số mẻ đã test:** ${nhatKy.LichSuPhienBan?.length || 0} lần\n\n`;
    if (nhatKy.LichSuPhienBan && nhatKy.LichSuPhienBan.length > 0) {
      const lastTest = nhatKy.LichSuPhienBan[nhatKy.LichSuPhienBan.length - 1];
      resp += `#### Kết quả mẻ test mới nhất (${lastTest.version}):\n`;
      resp += `- **Đánh giá:** ${lastTest.result === 'pass' ? '✅ ĐẠT (Pass)' : lastTest.result === 'fail' ? '❌ KHÔNG ĐẠT (Fail)' : '⏳ ĐANG CHỜ'}\n`;
      resp += `- **Người test:** ${lastTest.tester} (${lastTest.testerCode})\n`;
      resp += `- **Ghi chú:** ${lastTest.feedback || 'Không có ghi chú'}\n`;
    }
    return resp;
  }



  // 1. Check Revenue (Admin Only)
  if (/(doanh thu|revenue|bán được bao nhiêu|tiền bán sơn|ban duoc bao nhieu|tien ban son)/i.test(searchStr)) {
    if (!isAdminOrStaff) {
      return '📋 **VTSC PaintPro AI**: Rất tiếc, thông tin doanh thu và tài chính là dữ liệu bảo mật nội bộ. Bạn vui lòng sử dụng tài khoản Admin hoặc liên hệ bộ phận Kế toán để tra cứu.';
    }
    const period = /hôm nay/i.test(lower) ? 'today' : /tuần/i.test(lower) ? 'week' : /năm/i.test(lower) ? 'year' : 'month';
    const stats = await getRevenueStatistics({ timePeriod: period });
    return `### 📊 Báo Cáo Doanh Thu Vận Hành VTSC (${stats.khoang_thoi_gian})
- **Doanh thu đơn hàng lẻ:** ${stats.doanh_thu_don_hang} (${stats.so_luong_don_hang} đơn)
- **Doanh thu hợp đồng B2B:** ${stats.doanh_thu_hop_dong_B2B} (${stats.so_luong_hop_dong} hợp đồng)
- **Tổng doanh thu gộp:** **${stats.tong_doanh_thu}**

*Số liệu được truy xuất trực tiếp thời gian thực từ cơ sở dữ liệu.*`;
  }

  // 2. Check Inventory & Low Stock warnings (Admin Only)
  if (/(tồn kho|kho sơn|sắp hết|cảnh báo|inventory|hết hàng|ton kho|kho son|sap het|canh bao|het hang)/i.test(searchStr)) {
    if (!isAdminOrStaff) {
      return '📋 **VTSC PaintPro AI**: Rất tiếc, thông tin tồn kho chi tiết là dữ liệu bảo mật nội bộ. Bạn vui lòng liên hệ Thủ kho hoặc bộ phận Kinh doanh để được hỗ trợ.';
    }
    const inv = await getInventoryStatistics();
    let resp = `### 🏭 Thống kê Tồn kho VTSC PaintPro
- **Tổng số dòng sản phẩm:** ${inv.tong_so_dong_son} dòng sơn bột tĩnh điện
- **Tổng khối lượng kho sơn tĩnh điện:** **${inv.tong_kho_hang_tinh_dien}**
- **Số mã màu sơn sắp chạm ngưỡng cảnh báo (< 200kg):** ${inv.so_luong_ma_mau_sap_het} mã màu

`;
    if (inv.so_luong_ma_mau_sap_het > 0) {
      resp += `#### 🚨 Các sản phẩm cần pha chế/sản xuất thêm ngay lập tức:
| Dòng sơn | Mã màu | Tên màu | Tồn kho thực tế | Ngưỡng an toàn |
| :--- | :--- | :--- | :--- | :--- |
${inv.canh_bao_het_hang.map(x => `| ${x.TenDongSon} | \`${x.MaMau}\` | ${x.TenMau} | **${x.TonKho}** | ${x.NguongAnToan} |`).join('\n')}`;
    } else {
      resp += `✅ **Tất cả các dòng sơn đều nằm trong ngưỡng tồn kho an toàn.**`;
    }
    return resp;
  }

  // 3. Employee KPIs (Admin Only)
  if (/(kpi nhân viên|hiệu suất|tiến độ nhân viên|kpi|kpi nhan vien|hieu suat|tien do nhan vien)/i.test(searchStr)) {
    if (!isAdminOrStaff) {
      return '📋 **VTSC PaintPro AI**: Rất tiếc, thông tin đánh giá KPI và hiệu suất nhân sự là dữ liệu nội bộ bảo mật của VTSC.';
    }
    const kpis = await getEmployeeKPIs();
    return `### 👥 Bảng Hiệu Suất & Đánh giá KPI Nhân Sự VTSC
| Mã NV | Họ Tên | Bộ phận | Chức vụ | Điểm KPI | Đơn đã bán | Mẫu đã pha | Điểm đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${kpis.map(e => `| \`${e.MaNV}\` | **${e.HoTen}** | ${e.BoPhan} | ${e.ChucVu} | **${e.diemKPI}** | ${e.soDonDaBan} | ${e.soMauDaPha} | ${e.diemDanhGiaTrungBinh} |`).join('\n')}`;
  }

  // 4. Contract Statistics (Admin Only)
  if (/(hợp đồng mua bán|thống kê hợp đồng|hợp đồng b2b|hop dong mua ban|thong ke hop dong|hop dong b2b)/i.test(searchStr)) {
    if (!isAdminOrStaff) {
      return '📋 **VTSC PaintPro AI**: Rất tiếc, thông tin hợp đồng thương mại thuộc diện bảo mật. Bạn vui lòng sử dụng tài khoản nội bộ để tra cứu.';
    }
    const stats = await getContractStatistics({ type: 'ALL' });
    return `### 📝 Thống kê Hợp đồng Nguyên Tắc B2B VTSC
- **Tổng số hợp đồng thương mại:** ${stats.tong_so_hop_dong} hợp đồng
- **Đang thực thi vận chuyển:** ${stats.dang_thuc_hien} hợp đồng
- **Đã hoàn thành bàn giao:** ${stats.da_hoan_thanh} hợp đồng
- **Tổng giá trị ký kết:** **${stats.tong_gia_tri_hop_dong}**

#### Danh sách hợp đồng ký kết gần đây:
| Mã Hợp Đồng | Tiêu đề dự án | Khách hàng B2B | Giá trị ký kết | Trạng thái | Ngày ký |
| :--- | :--- | :--- | :--- | :--- | :--- |
${stats.recentContracts.map(c => `| \`${c.MaHopDong}\` | ${c.TieuDe} | ${c.KhachHang} | **${c.GiaTri}** | \`${c.TrangThai}\` | ${c.NgayKy} |`).join('\n')}`;
  }

  // 5. Order stats (Admin Only)
  if (/(thống kê đơn hàng|tổng số đơn hàng|đơn hàng mới|thong ke don hang|tong so don hang|don hang moi)/i.test(searchStr)) {
    if (!isAdminOrStaff) {
      return '📋 **VTSC PaintPro AI**: Rất tiếc, báo cáo tổng thể đơn hàng là dữ liệu quản trị nội bộ.';
    }
    const stats = await getOrderStatistics({ status: 'ALL' });
    return `### 📋 Thống kê Đơn hàng bán lẻ VTSC
- **Tổng số đơn hàng:** ${stats.tong_so_don_hang_he_thong} đơn
- **Chờ xác nhận duyệt:** ${stats.cho_xac_nhan} đơn
- **Đang đóng gói sấy/giao hàng:** ${stats.dang_xu_ly} đơn
- **Đã giao hàng thành công:** ${stats.da_giao_hang} đơn
- **Đã hủy đơn:** ${stats.da_huy} đơn

#### Danh sách đơn hàng mới cập nhật:
| Mã Đơn | Khách hàng | Tổng thanh toán | Trạng thái giao | Ngày đặt |
| :--- | :--- | :--- | :--- | :--- |
${stats.recentOrders.map(o => `| \`${o.MaDonHang}\` | ${o.KhachHang} | **${o.TongTien}** | \`${o.TrangThai}\` | ${o.NgayDat} |`).join('\n')}`;
  }

  // 6. Paint Mixing Process & Formula (Public)
  if (/(rd tracking|yêu cầu rd|quy trình pha chế|công thức pha chế|pha chế sơn|công thức pha|pha sơn|yeu cau rd|quy trinh pha che|cong thuc pha che|pha che son|cong thuc pha|pha son)/i.test(searchStr)) {
    let code = '';
    const matchCode = message.match(/[A-Z]{2,4}\d{3,4}/i);
    
    if (matchCode) {
      code = matchCode[0];
    } else if (lastProductCode && /(này|đó|trên|vừa rồi|nay|do|tren|vua roi)/i.test(searchStr)) {
      code = lastProductCode;
    }
    
    // Giải thích quy trình tổng quát nếu khách hàng không nhập mã sản phẩm
    if (!code) {
      return `### 🔬 Hướng dẫn Quy trình R&D & Pha chế sơn tại VTSC
Để gửi yêu cầu nghiên cứu phát triển (R&D) mã màu mới hoặc tìm hiểu quy trình, bạn vui lòng tham khảo các bước sau:

**1. Gửi Yêu cầu RD Tracking:**
- Khách hàng hoặc NV Kinh doanh truy cập vào trang **RD Tracking** để tạo yêu cầu (bao gồm: Mã màu, Độ bóng, Hiệu ứng bề mặt, Môi trường ứng dụng...).
- Hệ thống sẽ tạo một mã phiếu theo dõi R&D và chuyển trực tiếp xuống phòng Lab/KCS.

**2. Quy trình KCS và Pha chế tại Lab:**
- **Môi trường:** Quá trình pha chế diễn ra trong môi trường kiểm soát chặt chẽ (Nhiệt độ: 22-25°C, Độ ẩm: < 60%).
- **Cân đo tỷ lệ:** Kỹ sư sử dụng công thức nhựa (Epoxy/Polyester) kết hợp bột màu và phụ gia theo tỷ lệ % chuẩn xác.
- **Trộn & Đùn ép:** Hỗn hợp được đưa qua máy đùn nhiệt độ cao để nóng chảy và đồng nhất.
- **Nghiền bột:** Làm lạnh khối sơn và nghiền vi mảnh thành hạt bột tĩnh điện có kích thước hạt tiêu chuẩn (thường từ 30-50 µm).

**3. Sấy & Đóng rắn màng sơn (Curing Process):**
- Bột sơn được phun điện dung lên phôi kim loại.
- Chuyền sấy gia nhiệt ở nhiệt độ tiêu chuẩn **195°C trong 15 phút** (hoặc dao động 180°C - 200°C trong 10-15 phút tùy độ dày phôi).
- KCS kiểm tra độ bám dính, độ va đập và đối chiếu sắc sai (Delta E) trước khi phê duyệt sản xuất hàng loạt.

*Mẹo: Nếu bạn muốn xem công thức pha chế chi tiết của một mã sơn cụ thể, hãy nhập câu hỏi kèm mã (Ví dụ: "Công thức pha sơn mã SP6524").*`;
    }

    const formulas = await getPaintMixingProcess({ productCode: code });

    if (formulas.standardProcess) {
      return `### 🔬 Quy trình Pha chế & Sấy Bột tĩnh điện tiêu chuẩn VTSC (AkzoNobel)
Mã sơn \`${code}\` hiện tại đang áp dụng quy trình gia công sấy đóng rắn tiêu chuẩn quốc tế:
1. **Tiền xử lý bề mặt phôi:** Tẩy dầu mỡ, gỉ sét và phốt phát hóa phôi sắt thép hoặc cromat hóa phôi nhôm.
2. **Sấy khô phôi:** Ở nhiệt độ sấy buồng sấy dưới 120°C.
3. **Phun bột tĩnh điện:** Sử dụng súng phun sương điện áp cao để phủ đều lớp bột với độ dày màng sơn đạt **60-80 µm**.
4. **Sấy đóng rắn bột sơn (Curing process):** Đưa phôi vào buồng sấy nhiệt độ tiêu chuẩn **195°C trong vòng 15 phút** (hoặc 180°C - 200°C trong 10-15 phút tùy độ dày của phôi thép).
5. **Làm mát:** Để phôi nguội tự nhiên và đóng gói.`;
    }

    return `### 🔬 Công thức & Tỷ lệ pha chế dòng sơn bột tĩnh điện \`${code}\`
Đây là công thức pha chế/KCS bột tĩnh điện được phê duyệt:
${formulas.map(f => `
- **Mã Công Thức:** \`${f.MaCongThuc}\`
- **Mã màu sơn:** \`${f.MaMau}\` (Dòng: ${f.SanPham})
- **Thành phần tỷ lệ định mức:**
${f.ThanhPhanTiLe.map(tp => `  + Thành phần nguyên liệu ID [${tp.NguyenVatLieuID}]: **${tp.TiLePhanTram}**`).join('\n')}
- **Ghi chú kỹ thuật:** ${f.GhiChu || 'Không có ghi chú đặc biệt.'}
`).join('\n')}`;
  }

  // 7. Paint Mixing / Production Progress for Customer (Public)
  if (/(tiến độ pha chế|tiến độ sản xuất|sản xuất sơn|tiến độ hợp đồng|tiến độ sơn|tien do pha che|tien do san xuat|san xuat son|tien do hop dong|tien do son)/i.test(searchStr)) {
    const matchCode = message.match(/(HD|DH)-\d{4}-\d{3,4}/i) || message.match(/HD-\d+|DH-\d+|session_\d+/i);
    if (!matchCode) {
      return `📋 **VTSC PaintPro AI**: Để kiểm tra tiến độ pha chế và sản xuất sơn bột tĩnh điện cho công trình, bạn vui lòng cung cấp **Mã hợp đồng** (ví dụ: \`HD-2026-001\`) hoặc **Mã đơn hàng** (ví dụ: \`DH-1002\`).`;
    }
    const code = matchCode[0];
    const progress = await getPaintMixingProgress({ contractCode: code });
    if (progress.error) return `❌ **Lỗi tra cứu:** ${progress.error}`;

    if (progress.source === 'DonHang') {
      return `### 📦 Tiến độ Đơn hàng Bán lẻ: #${progress.MaDonHang}
- **Trạng thái vận hành:** \`${progress.TrangThaiDonHang}\`
- **Tổng thanh toán:** ${progress.TongTien}
- **Trạng thái thanh toán:** \`${progress.TrangThaiThanhToan}\`
- **Thông số kỹ thuật sản xuất:**
  + Loại bột: ${progress.Specs?.LoaiBot || 'N/A'}
  + Nhiệt độ sấy tiêu chuẩn: ${progress.Specs?.NhietDoSay || 'N/A'}
  + Độ dày màng sơn: ${progress.Specs?.DoDayLopPhu || 'N/A'}

*Hàng hóa thành phẩm thương mại có sẵn quy trình sấy và đóng gói tiêu chuẩn từ nhà máy AkzoNobel.*`;
    }

    if (progress.contractStatus) {
      return `### 📝 Tiến độ sản xuất Hợp đồng B2B: ${code}
- **Trạng thái pháp lý:** \`${progress.contractStatus}\`
- **Thông tin:** ${progress.message}`;
    }

    return `### 🏭 Tiến độ Lệnh sản xuất & Pha chế sơn HĐ: ${code}
Các lệnh sản xuất bột tĩnh điện đang chạy trên chuyền:
${progress.map(o => `
- **Lệnh sản xuất:** \`${o.MaLenhSanXuat}\`
- **Dòng sơn:** ${o.CongThuc} (Mã màu sấy: \`${o.MaMau}\`)
- **Khối lượng sản xuất định mức:** **${o.TargetWeight}**
- **Trạng thái chuyền sấy:** \`${o.TrangThaiPhaChe}\` (Chuyền đảm nhận: \`${o.ChuyenDay}\`)
- **KCS Kỹ sư phụ trách:** ${o.NhanVienDamNhiem}
- **Ngày bắt đầu sấy/pha:** ${o.BatDau} | **Dự kiến hoàn thành:** ${o.HoanThanhDuKien}
`).join('\n')}`;
  }

  // 7.5. Check specific product color list (Public)
  if (/(màu sắc|mã màu|màu gì|tìm màu|sơn màu|những màu nào|bảng màu|mau sac|ma mau|mau gi|tim mau|son mau|nhung mau nao|bang mau)/i.test(searchStr)) {
    let code = '';
    const matchCode = message.match(/[A-Z]{2,4}\d{3,4}/i);
    
    if (matchCode) {
      code = matchCode[0];
    } else if (lastProductCode && /(này|đó|trên|vừa rồi|nay|do|tren|vua roi)/i.test(searchStr)) {
      code = lastProductCode;
    } else {
      // Lọc bỏ các từ khóa thừa để trích xuất tên sản phẩm
      let query = lower.replace(/(sản phẩm này|loại này|dòng này|sản phẩm|này|đó|trên|vừa rồi|nay|do|tren|vua roi|mã màu của|có những màu sắc nào|những màu sắc nào|các màu sắc|màu sắc nào|màu sắc|có những mã màu nào|những mã màu nào|có những màu gì|mã màu|có màu|màu gì|tìm màu|những màu nào|cho hỏi|tư vấn|có những|\?)/gi, '').trim();
      if (query.length > 2) {
        const products = await searchPaintProducts({ query });
        if (products && products.length > 0) {
          code = products[0].MaSanPham;
        }
      }
    }

    if (code) {
      const info = await getPaintProductColors({ productCode: code });
      if (info.error) return `❌ **Không tìm thấy:** ${info.error}`;
      
      let resp = `### 🎨 Danh sách mã màu & Tồn kho dòng sơn \`${info.MaSanPham}\`
**Tên dòng:** ${info.TenDongSon} (${info.ThuongHieu})
- **Đơn giá:** **${info.DonGiaCoSo?.toLocaleString()}đ/${info.DonViTinh}**
- **Tổng tồn kho:** ${info.TongTonKho || 0} ${info.DonViTinh || 'Thùng'}

#### Danh sách các màu khả dụng:
| Hình Ảnh | Tên Màu | Mã Màu | Mã Hex | Tồn Kho |
| :---: | :---: | :---: | :---: | :---: |
`;
      if (info.DanhSachMaMau && info.DanhSachMaMau.length > 0) {
        info.DanhSachMaMau.forEach(m => {
          let imgTag = '';
          if (m.HinhAnh) {
            imgTag = `![${m.MaMau}](${resolveImageUrl(m.HinhAnh)})`;
          } else if (m.HexCode) {
            const hexNoHash = m.HexCode.replace('#', '');
            imgTag = `![${m.MaMau}](https://placehold.co/40x40/${hexNoHash}/${hexNoHash}.png)`;
          } else {
            imgTag = `![Chưa có ảnh](https://placehold.co/40x40/F1F5F9/94A3B8.png?text=?)`;
          }
          const hexDisplay = m.HexCode ? `\`${m.HexCode}\`` : '-';
          resp += `| ${imgTag} | **${m.TenMau}** | \`${m.MaMau}\` | ${hexDisplay} | **${m.TonKhoKhaDung || m.TonKho || 0} ${info.DonViTinh || 'Thùng'}** |\n`;
        });
      } else {
        resp += `| - | - | - | - | - |\n\n*Hiện tại chưa có mã màu nào được cấu hình cho dòng sơn này.*`;
      }
      resp += `\n\n🔗 **[Đăng ký Yêu cầu mẫu thử sơn miễn phí tại đây](/rd-tracking/new)**`;
      return resp;
    } else {
      let queryFallback = lower.replace(/(mã màu của|có những màu sắc nào|những màu sắc nào|các màu sắc|màu sắc nào|màu sắc|có những mã màu nào|những mã màu nào|có những màu gì|mã màu|có màu|màu gì|tìm màu|những màu nào|cho hỏi|tư vấn|sản phẩm|có những|\?)/gi, '').trim();
      const fallbackProducts = await searchPaintProducts({ query: queryFallback });
      if (fallbackProducts && fallbackProducts.length > 0) {
        let resp = `📋 **VTSC PaintPro AI**: Xin lỗi, tôi không tìm thấy cụm từ chính xác để tra cứu màu. Nhưng dựa trên các từ khóa của bạn (như "${queryFallback}"), tôi tìm thấy các sản phẩm liên quan dưới đây:\n\n---\n\n`;
        fallbackProducts.forEach(p => {
          resp += `**[${p.MaSanPham}] ${p.TenDongSon}**\n`;
          if (p.HinhAnh && p.HinhAnh.length > 0) resp += `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})\n`;
          resp += `🔹 **Phân loại:** ${p.PhanLoai}\n`;
          if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
             const colors = p.DanhSachMaMau.map(c => `\`${c.MaMau}\``).join(', ');
             resp += `🔹 **Các mã màu có sẵn:** ${colors}\n`;
          }
          resp += `\n---\n\n`;
        });
        return resp;
      } else {
        return `📋 **VTSC PaintPro AI**: Xin lỗi, tôi không tìm thấy dòng sơn nào khớp với từ khóa của bạn để tra cứu màu. Bạn vui lòng cung cấp mã sản phẩm (ví dụ: SP6524) hoặc tên dòng sơn chính xác hơn nhé!`;
      }
    }
  }

  // 7.6. Xem chi tiết thông số kỹ thuật của 1 mã màu cụ thể
  if (/(chi tiết màu|thông số kỹ thuật.*màu|thuộc tính.*màu|chi tiết mã màu|chi tiết.*màu này|thông tin.*màu)/i.test(searchStr) || /^[a-z]{2,4}-?[a-z0-9]{3,5}$/i.test(message.trim())) {
    let colorQuery = lower.replace(/(chi tiết màu|thông số kỹ thuật.*màu|thuộc tính.*màu|chi tiết mã màu|chi tiết.*màu này|thông tin.*màu|chi tiết|cho tôi|hỏi|tư vấn|về|\?)/gi, '').trim();
    
    const allProducts = await SanPhamSon.find({});
    let targetColor = null;
    let parentProduct = null;
    
    const matchCode = message.match(/[A-Z]{2,4}-?[A-Z0-9]{3,5}/i);
    if (matchCode) {
      colorQuery = matchCode[0].toUpperCase();
    }
    
    for (const p of allProducts) {
      if (p.DanhSachMaMau) {
        const found = p.DanhSachMaMau.find(m => 
          (matchCode && m.MaMau.toUpperCase().includes(colorQuery)) || 
          (!matchCode && colorQuery.length > 2 && (m.MaMau.toLowerCase().includes(colorQuery) || m.TenMau.toLowerCase().includes(colorQuery)))
        );
        if (found) {
          targetColor = found;
          parentProduct = p;
          break;
        }
      }
    }
    
    if (targetColor) {
      const ts = targetColor.ThongSoKyThuat || {};
      const hexNoHash = targetColor.HexCode ? targetColor.HexCode.replace('#', '') : 'F1F5F9';
      let imgTag = targetColor.HinhAnh ? `![${targetColor.TenMau}](${resolveImageUrl(targetColor.HinhAnh)})` : `![${targetColor.TenMau}](https://placehold.co/400x150/${hexNoHash}/${hexNoHash}.png)`;
      
      let resp = `### 🔍 Chi tiết Thông số kỹ thuật Màu \`${targetColor.MaMau}\`
**Tên màu:** ${targetColor.TenMau}
**Dòng sơn:** ${parentProduct.TenDongSon}

${imgTag}

| Thuộc tính | Giá trị chi tiết |
| :--- | :--- |
| **Mã Màu** | \`${targetColor.MaMau}\` |
| **HEX Code** | \`${targetColor.HexCode || '-'}\` |
| **Danh mục** | ${ts.DanhMuc || 'Tiêu chuẩn'} |
| **Độ bóng** | ${ts.DoBong || '25% Super Matt'} |
| **Bề mặt** | ${ts.BeMat || 'Nhôm, Sắt'} |
| **Ứng dụng** | ${ts.UngDung || 'Nội/Ngoại thất'} |
| **Độ phủ lý thuyết** | ${ts.DoPhuLyThuyet || '8 - 10 m²/thùng'} |
| **Quy cách đóng gói** | ${ts.QuyCachDongGoi || '1 Thùng (20kg)'} |
| **Quy trình pha chế** | ${ts.QuyTrinhPhaChe || 'Khuấy đều 5 phút trước khi phun (Không pha dung môi)'} |

✨ *Màu sắc thực tế có thể thay đổi nhẹ tùy thuộc vào điều kiện ánh sáng và chất liệu bề mặt phôi.*

🔗 **[Yêu cầu mẫu thử màu này miễn phí tại đây](/rd-tracking/new)**`;
      return resp;
    } else {
      return `📋 **VTSC PaintPro AI**: Xin lỗi, tôi không tìm thấy thông tin chi tiết cho mã màu "${colorQuery || 'này'}". Bạn vui lòng kiểm tra lại tên màu hoặc mã màu (vd: INT-T7001) nhé!`;
    }
  }

  // 7.9. Theo dõi Đơn hàng & Vận chuyển (Order & Shipping Tracking)
  if (/(đơn hàng|vận chuyển|lộ trình|vận đơn|bao giờ giao|tình trạng đơn|kiểm tra đơn|đơn DH|đơn hàng DH)/i.test(searchStr)) {
    const matchDH = message.match(/DH\d{3,5}/i);
    if (matchDH) {
      const maDon = matchDH[0].toUpperCase();
      
      const dh = await DonHang.findOne({ MaDonHang: maDon }).populate('KhachHang').lean();
      if (!dh) {
        return `❌ **Không tìm thấy đơn hàng:** Hệ thống không ghi nhận đơn hàng nào có mã \`${maDon}\`.`;
      }

      let resp = `### 📦 Thông tin Đơn hàng \`${dh.MaDonHang}\`\n`;
      resp += `**Khách hàng:** ${dh.KhachHang?.TenKhachHang || 'Khách lẻ'}\n`;
      resp += `**Trạng thái đơn:** \`${dh.TrangThai}\`\n`;
      resp += `**Tổng tiền:** ${dh.TongTien?.toLocaleString()}đ (Thanh toán: ${dh.PhuongThucThanhToan || 'Tiền mặt'})\n\n`;
      
      resp += `**Sản phẩm đã đặt:**\n`;
      if (dh.Items && dh.Items.length > 0) {
        dh.Items.forEach(item => {
          resp += `- ${item.SoLuong} ${item.TenSanPham} (Màu: \`${item.MaMau}\`)\n`;
        });
      }

      // Fetch Shipping Info
      const vc = await VanChuyen.findOne({ DonHang: dh._id }).lean();
      if (vc) {
        resp += `\n---\n### 🚚 Trạng thái Vận chuyển (\`${vc.MaVanChuyen}\`)\n`;
        resp += `**Đơn vị:** ${vc.VanChuyenInfo?.DonVi || 'VTSC Logistics'} (SĐT: ${vc.VanChuyenInfo?.SDT || 'N/A'})\n`;
        resp += `**Dự kiến bàn giao:** ${vc.DuKienBanGiao ? new Date(vc.DuKienBanGiao).toLocaleDateString('vi-VN') : 'Đang cập nhật'}\n\n`;
        resp += `**Lộ trình chi tiết:**\n`;
        if (vc.LoTrinh && vc.LoTrinh.length > 0) {
          vc.LoTrinh.forEach(lt => {
            const icon = lt.Status === 'COMPLETE' ? '✅' : (lt.Status === 'PROCESSING' ? '🚚' : '⏳');
            resp += `${icon} **${new Date(lt.ThoiGian).toLocaleString('vi-VN')}**: ${lt.NoiDung}\n`;
          });
        }
      } else {
        resp += `\n---\n*Đơn hàng này chưa có thông tin vận chuyển. Kho đang tiến hành xử lý xuất kho.*`;
      }
      return resp;
    }
  }

  // 7.10. Tra cứu Hậu mãi: Khiếu nại, Đổi trả, Bảo hành
  if (/(khiếu nại|phản hồi|đổi trả|bảo hành|ticket|hỗ trợ mã|phiếu)/i.test(searchStr)) {
    const matchTicket = message.match(/(PH|DT|BH)\d{3,5}/i);
    if (matchTicket) {
      const maTicket = matchTicket[0].toUpperCase();
      
      if (maTicket.startsWith('PH')) {
        const ph = await PhanHoiHoTro.findOne({ MaPhanHoi: maTicket }).lean();
        if (!ph) return `❌ Không tìm thấy phiếu khiếu nại/hỗ trợ \`${maTicket}\`.`;
        
        let resp = `### 🎫 Chi tiết Phiếu Hỗ trợ \`${ph.MaPhanHoi}\`\n`;
        resp += `**Phân loại:** ${ph.PhanLoai}\n`;
        resp += `**Trạng thái:** \`${ph.TrangThai}\`\n`;
        resp += `**Nội dung phản ánh:** ${ph.NoiDungYeuCau}\n\n`;
        resp += `**Lịch sử xử lý:**\n`;
        if (ph.LichSuTraLoi && ph.LichSuTraLoi.length > 0) {
          ph.LichSuTraLoi.forEach(ls => {
            const role = ls.NguoiTraLoi === 'KhachHang' ? '👤 Khách hàng' : '🎧 CSKH VTSC';
            resp += `- **${role}** (${new Date(ls.ThoiGian).toLocaleString('vi-VN')}): ${ls.NoiDung}\n`;
          });
        }
        return resp;
      }
      
      if (maTicket.startsWith('DT')) {
        const dt = await DoiTra.findOne({ MaDoiTra: maTicket }).lean();
        if (!dt) return `❌ Không tìm thấy phiếu yêu cầu đổi trả \`${maTicket}\`.`;
        
        return `### 🔄 Chi tiết Yêu cầu Đổi trả \`${dt.MaDoiTra}\`\n**Trạng thái:** \`${dt.TrangThai}\`\n**Lý do đổi trả:** ${dt.LyDo}\n\n*Vui lòng đóng gói hàng hóa cẩn thận, nhân viên VTSC Logistics sẽ đến thu hồi trong vòng 24h làm việc.*`;
      }
      
      if (maTicket.startsWith('BH')) {
        const bh = await BaoHanh.findOne({ MaBaoHanh: maTicket }).lean();
        if (!bh) return `❌ Không tìm thấy thẻ bảo hành \`${maTicket}\`.`;
        
        return `### 🛡 Thông tin Bảo hành Điện tử \`${bh.MaBaoHanh}\`\n**Trạng thái:** \`${bh.TrangThai}\`\n**Thời hạn bảo hành đến:** ${new Date(bh.ThoiHanBaoHanh).toLocaleDateString('vi-VN')}\n**Điều kiện áp dụng:** ${bh.DieuKienBaoHanh}`;
      }
    }
  }

  // 7.8. How to use / Application Guide (Public)
  if (/(hướng dẫn sử dụng|cách sơn|cách dùng|cách phun|xử lý bề mặt|sử dụng.*như thế nào|cách thi công|trước khi sơn|bám dính tốt|quy trình sơn|quy trình sấy|nhiệt độ sấy|thời gian sấy|lò sấy|quy trình|huong dan su dung|cach son|cach dung|cach phun|xu ly be mat|su dung.*nhu the nao|cach thi cong|truoc khi son|bam dinh tot|quy trinh son|quy trinh say|nhiet do say|thoi gian say|lo say|quy trinh)/i.test(searchStr)) {
    return `### 🛠 Hướng dẫn Thi công & Phun Sơn Bột Tĩnh Điện Tiêu Chuẩn

Để đạt được màng sơn tĩnh điện có độ bám dính tốt, bề mặt nhẵn mịn và độ bền cao, bạn cần tuân thủ quy trình 3 bước chuẩn của VTSC:

**1. Tiền xử lý bề mặt phôi (Quan trọng nhất):**
- Bề mặt kim loại (sắt, thép, nhôm) phải được làm sạch hoàn toàn dầu mỡ, gỉ sét và bụi bẩn.
- **Sắt/Thép:** Cần trải qua hệ thống nhúng dung dịch Phốt phát hóa (Phosphating) để tạo lớp màng bám dính chống gỉ.
- **Nhôm:** Cần trải qua hệ thống Cromat hóa (Chromating).
- Sấy khô phôi hoàn toàn ở nhiệt độ dưới 120°C trước khi đưa vào buồng phun.

**2. Quá trình phun sơn tĩnh điện:**
- Phôi được treo trên băng tải tiếp mát (nối đất) thật tốt.
- Sử dụng súng phun sơn tĩnh điện tĩnh điện cầm tay hoặc tự động (Điện áp súng phun từ **60kV - 100kV**).
- Khí nén cung cấp cho súng phải khô và sạch hoàn toàn (sử dụng máy sấy khí).
- Phun phủ đều lên bề mặt phôi cho đến khi đạt độ dày màng sơn yêu cầu (Tiêu chuẩn thường từ **60 µm - 80 µm**).

**3. Sấy đóng rắn màng sơn (Curing):**
- Đưa phôi đã bám bột sơn vào buồng sấy (lò sấy).
- Chế độ sấy tiêu chuẩn cho đa số các dòng sơn bột tĩnh điện VTSC là: **195°C đến 200°C** giữ trong **10 đến 15 phút** (tính từ lúc phôi đạt đủ nhiệt độ, không tính thời gian gia nhiệt).
- Sau khi sấy xong, đưa phôi ra ngoài làm mát tự nhiên ở nhiệt độ phòng, tiến hành kiểm tra KCS (độ bám dính, độ bóng, sắc sai) và đóng gói.

    *Nếu bạn cần thông số kỹ thuật chi tiết của một mã sơn cụ thể, vui lòng gửi mã sản phẩm (Ví dụ: "Tư vấn sản phẩm SP6524").*`;
  }

  // 7.85. Reverse Material Query (Paint Type -> Surfaces)
  if (/(tĩnh điện|epoxy|tàu biển|chịu nhiệt|sơn pu|sơn gỗ|sơn nước|chống thấm|nội thất|ngoại thất|công nghiệp).*(sơn lên|sơn được|sơn trên|dùng cho|phù hợp|ứng dụng).*(bề mặt|vật liệu|chất liệu|đâu|cái gì|của)/i.test(lower) || /(bề mặt|vật liệu|chất liệu|đâu|cái gì|ứng dụng).*(sơn lên|sơn được|sơn trên|dùng cho|phù hợp|của).*(tĩnh điện|epoxy|tàu biển|chịu nhiệt|sơn pu|sơn gỗ|sơn nước|chống thấm|nội thất|ngoại thất|công nghiệp)/i.test(lower)) {
    
    let paintType = 'general';
    if (/(tĩnh điện)/i.test(lower)) paintType = 'tinh_dien';
    else if (/(epoxy|tàu biển)/i.test(lower)) paintType = 'epoxy';
    else if (/(chịu nhiệt)/i.test(lower)) paintType = 'chiu_nhiet';
    else if (/(sơn pu|sơn gỗ)/i.test(lower)) paintType = 'pu';
    else if (/(chống thấm)/i.test(lower)) paintType = 'chong_tham';
    else if (/(nội thất|ngoại thất|sơn nước)/i.test(lower)) paintType = 'son_nuoc';
    else if (/(công nghiệp)/i.test(lower)) paintType = 'cong_nghiep';

    switch (paintType) {
      case 'tinh_dien':
        return `### 💡 Tư vấn Ứng dụng: Sơn Bột Tĩnh Điện (Theo tiêu chuẩn AkzoNobel & Jotun)
Sơn bột tĩnh điện yêu cầu khắt khe về vật liệu do nguyên lý bám hút tĩnh điện và đóng rắn ở nhiệt độ cao (180°C - 200°C).

✅ **CÁC BỀ MẶT SƠN ĐƯỢC:**
- **Thép đen, Sắt hộp:** Rất tốt (Cần xử lý nhúng phốt phát trước).
- **Thép mạ kẽm:** Tốt (Cần xử lý phốt phát kẽm hoặc phun cát tạo nhám).
- **Nhôm (Aluminium):** Rất xuất sắc (Cần xử lý nhúng Cromat hóa).
- **Inox, Đồng:** Sơn được (Nhưng cần tạo nhám bề mặt kỹ càng vì rất trơn).

🚫 **TUYỆT ĐỐI KHÔNG SƠN ĐƯỢC:**
- **Gỗ, Nhựa, Xi măng, Bê tông:** Vật liệu không dẫn điện và sẽ bị cháy/chảy/nứt khi đưa vào lò sấy 200°C.`;
      
      case 'epoxy':
        return `### 💡 Tư vấn Ứng dụng: Sơn Epoxy / Sơn Tàu Biển (Theo tiêu chuẩn Jotun & Nippon)
Hệ sơn 2 thành phần (Base + Hardener) cực kỳ bền bỉ, chống mài mòn và chịu hóa chất mặn.

✅ **CÁC BỀ MẶT SƠN ĐƯỢC:**
- **Sàn Bê tông, Xi măng:** Rất xuất sắc (Dùng sơn sàn Epoxy cho nhà xưởng, tầng hầm).
- **Sắt thép, Thép mạ kẽm:** Tuyệt vời (Làm lớp lót chống ăn mòn cực tốt cho tàu biển, giàn khoan).
- **Nhôm, Inox:** Sơn được (Cần lót Epoxy bám kẽm chuyên dụng).
- **Composite, Sợi thủy tinh:** Tốt (Thường dùng sơn sửa vỏ tàu thuyền nhựa).

🚫 **KHÔNG PHÙ HỢP CHO:**
- **Nhựa dẻo, Gỗ nội thất thông thường:** Màng sơn quá cứng có thể gây nứt nẻ mặt gỗ khi co ngót.
- **Ngoài trời không có sơn phủ:** Epoxy sẽ bị phấn hóa (ngả màu) nếu tiếp xúc trực tiếp tia UV, bắt buộc phải phủ thêm lớp PU (Polyurethane) ngoài trời.`;
      
      case 'pu':
        return `### 💡 Tư vấn Ứng dụng: Sơn PU (Polyurethane)
Dòng sơn mang lại độ bóng cực cao, bền màu và chịu tia UV rất tốt.

✅ **CÁC BỀ MẶT SƠN ĐƯỢC:**
- **Gỗ tự nhiên, Gỗ công nghiệp (MDF):** Rất xuất sắc (Bảo vệ vân gỗ, chống xước nội/ngoại thất).
- **Nhựa (ABS, Composite):** Rất tốt (Dùng sơn vỏ xe máy, linh kiện nhựa).
- **Sắt thép, Nhôm:** Tốt (Thường dùng làm lớp phủ ngoài trời trên cùng, sau khi đã lót Epoxy để chống ngả màu).`;
      
      case 'chiu_nhiet':
        return `### 💡 Tư vấn Ứng dụng: Sơn Chịu Nhiệt (Silicone/Acrylic)
Chuyên dùng cho các chi tiết phát sinh nhiệt độ cực cao (200°C - 600°C).

✅ **CÁC BỀ MẶT SƠN ĐƯỢC:**
- **Thép đen, Gang:** Ống xả ô tô/xe máy, lò đốt rác, ống khói nhà máy, lốc máy.
- **Inox, Thép mạ:** Khung sườn máy móc tỏa nhiệt.
*(Bắt buộc phải phun/quét trực tiếp lên bề mặt kim loại đã làm sạch, không được sơn chồng lên lớp lót thường vì lót thường sẽ cháy).*`;

      case 'son_nuoc':
      case 'chong_tham':
        return `### 💡 Tư vấn Ứng dụng: Sơn Nước / Sơn Chống Thấm (Dulux, Jotun, Kova)
Dòng sơn thông dụng gốc nước Acrylic.

✅ **CÁC BỀ MẶT SƠN ĐƯỢC:**
- **Xi măng, Bê tông, Tường gạch:** Rất xuất sắc (Lăn trực tiếp trên bột trét/lót kiềm).
- **Thạch cao:** Tuyệt vời (Làm trần/vách ngăn).

🚫 **KHÔNG PHÙ HỢP CHO:**
- **Kim loại, Nhựa:** Sơn nước không thể bám dính trên bề mặt trơn nhẵn bóng của kim loại.`;

      case 'cong_nghiep':
        return `### 💡 Tư vấn Ứng dụng: Sơn Công Nghiệp (Alkyd / Epoxy / PU)
Sơn công nghiệp là nhóm sơn màng phim dày, khô nhanh, chuyên dùng để bảo vệ máy móc, kết cấu thép và nhà xưởng.

✅ **CÁC BỀ MẶT SƠN ĐƯỢC:**
- **Sắt, Thép đen, Khung kèo thép:** Rất xuất sắc (Bảo vệ tuyệt đối khỏi rỉ sét trong môi trường bình thường hoặc ăn mòn).
- **Thép mạ kẽm, Inox, Nhôm:** Tốt (Bắt buộc phải sử dụng dòng Sơn lót kẽm Epoxy 2 thành phần hoặc Wash Primer).
- **Sàn bê tông nhà xưởng:** Tốt (Sử dụng dòng sơn công nghiệp Epoxy hệ lăn hoặc hệ tự san phẳng).
- **Gỗ công nghiệp, nhựa:** Tốt (Nếu sử dụng hệ sơn công nghiệp PU).

🚫 **KHÔNG PHÙ HỢP CHO:**
- **Tường nhà dân dụng:** Gây lãng phí và màng sơn quá cứng, dễ bong tróc do tường xi măng co giãn.`;

      default:
        return `### 💡 Tư vấn Ứng dụng Sơn
Mỗi dòng sơn được thiết kế riêng cho các bề mặt khác nhau. Để được tư vấn chính xác, bạn vui lòng cho biết **Loại sơn bạn đang quan tâm** và **Vật liệu bạn muốn sơn** (Ví dụ: "Sơn tĩnh điện có sơn được lên nhựa không?").`;
    }
  }

  // 7.9. Material Consultation / Surface Application (Public)
  if (/(sơn lên|sơn cho|sơn trên|sơn.*gỗ|sơn.*nhựa|sơn.*sắt|sơn.*thép|sơn.*nhôm|sơn.*kẽm|sơn.*xi măng|sơn.*bê tông|bề mặt|mẫu nhôm|mẫu sắt|vật liệu|chất liệu|dùng cho|phù hợp với)/i.test(lower)) {
    let materialType = 'general';
    if (/(nhôm|kẽm|mạ kẽm|\bnhom\b|\bkem\b|\bma kem\b)/i.test(searchStr)) materialType = 'nhom_kem';
    else if (/(sắt|thép|kim loại|\bsat\b|\bthep\b|\bkim loai\b)/i.test(searchStr)) materialType = 'sat_thep';
    else if (/(nhựa|gỗ|\bnhua\b|\bgo\b)/i.test(searchStr)) materialType = 'nhua_go';
    else if (/(xi măng|bê tông|\bxi mang\b|\bbe tong\b)/i.test(searchStr)) materialType = 'xi_mang';
    
    if (materialType === 'nhom_kem') {
      const nhomProducts = await SanPhamSon.find({
        $or: [
          { PhanLoai: /Tĩnh điện|Polyester|Epoxy/i },
          { ThuongHieu: /AkzoNobel/i }
        ]
      }).sort({ SoLuongDaBan: -1 }).limit(2).lean();
      
      let resp = `### 💡 Tư vấn Hệ Sơn cho Bề mặt Nhôm / Mạ Kẽm
Nhôm và Thép mạ kẽm là những bề mặt có độ trơn bóng cao, rất khó bám dính nếu không xử lý đúng cách.

**Quy trình chuẩn VTSC khuyến nghị:**
1. **Tiền xử lý:** BẮT BUỘC phải tẩy sạch dầu mỡ và trải qua bể nhúng **Cromat hóa** (với Nhôm) hoặc **Phốt phát hóa kẽm** (với Thép mạ kẽm) để tạo lớp màng mỏng tạo chân bám cho sơn.
2. **Lựa chọn Sơn:** 
   - Nếu sấy được ở nhiệt độ cao (195°C): Nên dùng **Sơn bột tĩnh điện hệ Polyester (Dòng AkzoNobel Interpon D1000/D2000)** để đảm bảo khả năng chịu thời tiết ngoài trời.
   - Nếu không thể sấy nhiệt: Sử dụng **Sơn Epoxy 2 thành phần** hoặc **Sơn tàu biển chuyên dụng** sơn lót trước khi phủ màu.\n\n`;

      if (nhomProducts && nhomProducts.length > 0) {
        resp += `### 🌟 Các Sản Phẩm Phù Hợp Cho Bề Mặt Nhôm/Mạ Kẽm Tại VTSC:\n\n---\n`;
        nhomProducts.forEach(p => {
          resp += `**[${p.MaSanPham}] ${p.TenDongSon}**\n`;
          if (p.HinhAnh && p.HinhAnh.length > 0) resp += `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})\n`;
          resp += `🔹 **Thương hiệu:** ${p.ThuongHieu} | **Phân loại:** ${p.PhanLoai}\n`;
          resp += `🔹 **Đơn giá:** **${p.DonGiaCoSo?.toLocaleString()}đ/${p.DonViTinh || 'Thùng'}**\n`;
          if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
            resp += `🔹 **Màu sắc tiêu biểu:**\n  ${p.DanhSachMaMau.slice(0, 3).map(m => `- \`${m.MaMau}\` (${m.TenMau})`).join('\n  ')}\n`;
          }
          resp += `\n---\n`;
        });
        resp += `\n🔗 **[Vào trang Cửa hàng để xem toàn bộ danh mục & Thêm vào giỏ hàng](/shop)**`;
      } else {
        resp += `👉 *Bạn có muốn tìm mã sản phẩm Sơn tĩnh điện AkzoNobel cho nhôm không? Hãy nhắn "Tìm sơn tĩnh điện AkzoNobel".*`;
      }
      return resp;
    } 
    else if (materialType === 'nhua_go') {
      const goProducts = await SanPhamSon.find({
        $or: [
          { PhanLoai: /Nội thất|Sơn gỗ|PU|Dầu thơm/i },
          { TenDongSon: /Nội thất|PU/i }
        ]
      }).sort({ SoLuongDaBan: -1 }).limit(2).lean();

      let resp = `### 💡 Tư vấn Hệ Sơn cho Bề mặt Nhựa / Gỗ
⚠️ **CẢNH BÁO QUAN TRỌNG:** Bạn **KHÔNG THỂ** sử dụng Sơn bột tĩnh điện cho bề mặt Nhựa hoặc Gỗ!
Lý do: Sơn bột tĩnh điện yêu cầu vật liệu phải dẫn điện tốt (để hút bột sơn) và phải chịu được nhiệt độ sấy rất cao trong lò sấy (**180°C - 200°C**). Nhựa sẽ bị nung chảy và gỗ sẽ bị cháy khét ở nhiệt độ này.

**Khuyến nghị từ VTSC:**
- Đối với **Gỗ**: Vui lòng sử dụng hệ Sơn PU, Sơn dầu thơm (NC) hoặc Sơn nước chuyên dụng cho gỗ.
- Đối với **Nhựa**: Cần sử dụng Sơn lót bám nhựa chuyên dụng trước, sau đó phủ Sơn PU 2 thành phần (sơn tự khô hoặc sấy nhiệt độ rất thấp <60°C).\n\n`;

      if (goProducts && goProducts.length > 0) {
        resp += `### 🌟 Các Sản Phẩm Phù Hợp Cho Bề Mặt Gỗ/Nhựa Tại VTSC:\n\n---\n`;
        goProducts.forEach(p => {
          resp += `**[${p.MaSanPham}] ${p.TenDongSon}**\n`;
          if (p.HinhAnh && p.HinhAnh.length > 0) resp += `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})\n`;
          resp += `🔹 **Thương hiệu:** ${p.ThuongHieu} | **Phân loại:** ${p.PhanLoai}\n`;
          resp += `🔹 **Đơn giá:** **${p.DonGiaCoSo?.toLocaleString()}đ/${p.DonViTinh || 'Thùng'}**\n`;
          if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
            resp += `🔹 **Màu sắc tiêu biểu:**\n  ${p.DanhSachMaMau.slice(0, 3).map(m => `- \`${m.MaMau}\` (${m.TenMau})`).join('\n  ')}\n`;
          }
          resp += `\n---\n`;
        });
        resp += `\n🔗 **[Vào trang Cửa hàng để xem toàn bộ danh mục & Thêm vào giỏ hàng](/shop)**`;
      } else {
        resp += `👉 *Hệ thống của VTSC hiện tại chuyên cung cấp sơn tĩnh điện kim loại, sơn tàu biển và sơn công nghiệp màng phim dày.*`;
      }
      return resp;
    }
    else if (materialType === 'sat_thep') {
      const satProducts = await SanPhamSon.find({
        $or: [
          { PhanLoai: /Tĩnh điện|Công nghiệp|Tàu biển|Epoxy/i }
        ]
      }).sort({ SoLuongDaBan: -1 }).limit(2).lean();

      let resp = `### 💡 Tư vấn Hệ Sơn cho Bề mặt Sắt / Thép
Sắt/Thép là vật liệu cực kỳ lý tưởng để ứng dụng công nghệ sơn. Tuy nhiên, rủi ro lớn nhất là **Bị rỉ sét** theo thời gian.

**Khuyến nghị từ VTSC:**
1. **Sơn Bột Tĩnh Điện (Khuyên dùng nhất):** Độ bền cực cao, chống xước, chống rỉ sét tốt, màu sắc đa dạng. Yêu cầu phôi sắt phải được xử lý Phốt phát hóa, phun bột sơn và nung trong lò sấy 195°C.
2. **Sơn Công Nghiệp Dầu Thơm / Sơn Chịu Nhiệt:** Phù hợp để quét/phun trực tiếp lên các kết cấu sắt thép ngoài trời không thể cho vào lò sấy.
3. **Sơn Tàu Biển (Hệ Epoxy 2 TP):** Dành cho kết cấu sắt thép ngâm dưới nước hoặc trong môi trường ăn mòn hóa chất cực mạnh.\n\n`;

      if (satProducts && satProducts.length > 0) {
        resp += `### 🌟 Các Sản Phẩm Phù Hợp Cho Bề Mặt Sắt/Thép Tại VTSC:\n\n---\n`;
        satProducts.forEach(p => {
          resp += `**[${p.MaSanPham}] ${p.TenDongSon}**\n`;
          if (p.HinhAnh && p.HinhAnh.length > 0) resp += `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})\n`;
          resp += `🔹 **Thương hiệu:** ${p.ThuongHieu} | **Phân loại:** ${p.PhanLoai}\n`;
          resp += `🔹 **Đơn giá:** **${p.DonGiaCoSo?.toLocaleString()}đ/${p.DonViTinh || 'Thùng'}**\n`;
          if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
            resp += `🔹 **Màu sắc tiêu biểu:**\n  ${p.DanhSachMaMau.slice(0, 3).map(m => `- \`${m.MaMau}\` (${m.TenMau})`).join('\n  ')}\n`;
          }
          resp += `\n---\n`;
        });
        resp += `\n🔗 **[Vào trang Cửa hàng để xem toàn bộ danh mục & Thêm vào giỏ hàng](/shop)**`;
      } else {
        resp += `👉 *VTSC hiện có đủ cả 3 dòng sơn trên. Bạn đang muốn tìm dòng sơn nào cho công trình sắt thép của mình?*`;
      }
      return resp;
    }
    else if (materialType === 'xi_mang') {
      const cementProducts = await SanPhamSon.find({
        $or: [
          { PhanLoai: /Nội thất|Ngoại thất|Epoxy|Chống thấm/i },
          { TenDongSon: /Nội thất|Ngoại thất|Epoxy|Chống thấm/i }
        ]
      }).sort({ SoLuongDaBan: -1 }).limit(2).lean();

      let resp = `### 💡 Tư vấn Hệ Sơn cho Bề mặt Xi măng / Bê tông
Bề mặt xi măng, tường gạch hoặc bê tông thường có tính kiềm rất cao và dễ bị ngấm nước.

**Khuyến nghị từ VTSC:**
1. **Tuyệt đối KHÔNG dùng sơn bột tĩnh điện:** Bê tông không dẫn điện và không thể đưa vào buồng sấy 200°C.
2. **Sơn chống thấm chuyên dụng:** Sử dụng sơn chống thấm gốc xi măng, Sika hoặc Kova để bảo vệ bề mặt ngoài trời.
3. **Sơn lót kháng kiềm & Sơn nước:** Nếu muốn tính thẩm mỹ cao, bắt buộc phải lăn một lớp sơn lót kháng kiềm trước khi lăn sơn màu nội/ngoại thất.
4. **Sơn sàn Epoxy:** Đối với sàn bê tông nhà xưởng, sử dụng hệ Sơn Epoxy 2 thành phần hệ nước/hệ dung môi để chống mài mòn, chịu tải trọng lớn.\n\n`;

      if (cementProducts && cementProducts.length > 0) {
        resp += `### 🌟 Các Sản Phẩm Phù Hợp Cho Bề Mặt Xi Măng/Bê Tông Tại VTSC:\n\n---\n`;
        cementProducts.forEach(p => {
          resp += `**[${p.MaSanPham}] ${p.TenDongSon}**\n`;
          if (p.HinhAnh && p.HinhAnh.length > 0) resp += `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})\n`;
          resp += `🔹 **Thương hiệu:** ${p.ThuongHieu} | **Phân loại:** ${p.PhanLoai}\n`;
          resp += `🔹 **Đơn giá:** **${p.DonGiaCoSo?.toLocaleString()}đ/${p.DonViTinh || 'Thùng'}**\n`;
          if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
            resp += `🔹 **Màu sắc tiêu biểu:**\n  ${p.DanhSachMaMau.slice(0, 3).map(m => `- \`${m.MaMau}\` (${m.TenMau})`).join('\n  ')}\n`;
          }
          resp += `\n---\n`;
        });
        resp += `\n🔗 **[Vào trang Cửa hàng để xem toàn bộ danh mục & Thêm vào giỏ hàng](/shop)**`;
      } else {
        resp += `👉 *VTSC chuyên cung cấp các giải pháp Sơn sàn Epoxy và Sơn chống rỉ chịu tải trọng cao.*`;
      }
      return resp;
    }
    else {
      return `### 💡 Tư vấn Lựa chọn Sơn theo Bề mặt Vật liệu
Mỗi loại vật liệu sẽ có đặc tính vật lý và hóa học khác nhau, do đó cần một loại sơn và quy trình xử lý riêng biệt:

- 🪟 **Nhôm / Thép mạ kẽm:** Bề mặt trơn, cần hóa chất Cromat hóa tạo nhám trước khi sơn tĩnh điện.
- 🧲 **Sắt / Thép đen:** Rất dễ rỉ sét. Cực kỳ phù hợp với Sơn bột tĩnh điện (cần xử lý Phốt phát) hoặc Sơn chống rỉ Tàu biển (Epoxy 2TP).
- 🪵 **Gỗ / Nhựa:** Tuyệt đối KHÔNG sử dụng Sơn bột tĩnh điện (do không chịu được nhiệt độ sấy 200°C). Phải dùng Sơn PU hoặc Sơn tự khô.
- 🧱 **Xi măng / Bê tông:** Bề mặt kiềm cao, dễ ngấm nước. Phải sử dụng Sơn Epoxy 2 thành phần, sơn chống thấm hoặc lót kháng kiềm. TUYỆT ĐỐI không dùng sơn tĩnh điện.

*Bạn đang có nhu cầu sơn lên vật liệu gì? (Ví dụ: "Tư vấn cho tôi sơn lên nhôm").*`;
    }
  }

  // 7.10. Troubleshooting (Xử lý lỗi / Sự cố)
  if (/(bị lỗi|rỗ khí|da cam|bong tróc|ngả vàng|ố vàng|vàng sơn|không hút bột|khong hut bot|trào ngược|bị rỗ|bị bong|bi loi|ro khi|bong troc|nga vang|o vang|vang son|trao nguoc|bi ro|bi bong|sự cố|su co)/i.test(searchStr)) {
    return `### 🔧 Cẩm nang Xử lý Sự cố Kỹ thuật Sơn Bột Tĩnh Điện
Dưới đây là chẩn đoán và cách khắc phục cho các lỗi phổ biến nhất trong xưởng sơn:

1. **Lỗi Ngả vàng / Ố vàng màng sơn (Đặc biệt với màu trắng):**
   - *Nguyên nhân:* Nhiệt độ buồng sấy quá cao (vượt mức 200°C) hoặc thời gian lưu lò quá lâu khiến nhựa bị cháy.
   - *Khắc phục:* Kiểm tra lại đồng hồ đo nhiệt thực tế của lò sấy. Giảm nhiệt độ xuống 190°C và sấy đúng 15 phút.

2. **Lỗi Da cam (Orange Peel) / Màng sơn không nhẵn:**
   - *Nguyên nhân:* Phun sơn quá dày, hoặc bột sơn bị ẩm/vón cục, hoặc súng phun để áp lực khí quá cao.
   - *Khắc phục:* Duy trì độ dày màng sơn chuẩn 60-80 µm. Hạ áp lực khí nén ở súng phun, kiểm tra lại rây bột sơn.

3. **Lỗi Rỗ khí (Pinholes) / Châm kim:**
   - *Nguyên nhân:* Bề mặt phôi chưa sạch dầu mỡ, hoặc phôi nhôm đúc có bọt khí ngầm, hoặc khí nén có lẫn hơi nước.
   - *Khắc phục:* Phải sấy khô phôi trước khi sơn (gia nhiệt trước để đẩy bọt khí ngầm). Chạy máy sấy khí để lọc sạch hơi nước trong máy nén khí.

4. **Súng phun không hút bột / Bám dính kém (Low Transfer Efficiency):**
   - *Nguyên nhân:* Móc treo phôi bị bám màng sơn cũ gây mất tiếp mát (mất mass), hoặc điện áp súng phun quá thấp.
   - *Khắc phục:* Vệ sinh (đốt/tẩy) móc treo để phôi dẫn điện tốt nhất. Chỉnh điện áp tĩnh điện lên 60kV - 80kV.

*Bạn đang gặp sự cố nào khác? Hãy mô tả chi tiết để tôi bắt bệnh nhé!*`;
  }

  // 7.11. Coverage Calculation (Tính định mức)
  if (/(định mức|tiêu hao|bao nhiêu mét|bao nhieu met|1thùng sơn|1 thùng sơn|1 thùng son|1 thùng son|bao nhiêu thùng|bao nhieu thùng|tính sơn|tinh son)/i.test(searchStr)) {
    return `### 📐 Bảng Tính Định Mức / Tiêu Hao Sơn Bột Tĩnh Điện
Để lập dự toán vật tư chính xác, VTSC cung cấp công thức định mức tiêu chuẩn (với độ dày màng sơn đạt 60-80 µm):

- **Định mức lý thuyết:** 1 thùng bột sơn tĩnh điện phủ được **8 - 10 m²** bề mặt phẳng.
- **Định mức thực tế (Đã trừ hao hụt rơi vãi):** 1 thùng phủ được **6 - 7 m²** (nếu xưởng có hệ thống thu hồi bột tốt).
- **Trọng lượng đóng gói chuẩn:** Thùng 20 thùng hoặc 25 thùng (Tùy nhà sản xuất AkzoNobel / Jotun).

💡 **Ví dụ Dự toán nhanh:**
Nếu bạn có công trình diện tích bề mặt nhôm/sắt là **1000 m²**:
👉 Khối lượng bột cần mua = 1000 / 120 = **~8.3 thùng** (Khoảng 7-8 thùng).

*Lưu ý: Đối với sơn sắt hộp, hoa văn phức tạp (cổng rào, lưới), mức độ hao hụt (bay ra ngoài) sẽ cao hơn, 1 thùng thực tế chỉ sơn được khoảng 4-5 m². Bạn cần tính định mức cho dự án nào?*`;
  }

  // 7.12. Storage & Shelf-life (Bảo quản & Hạn dùng)
  if (/(bảo quản|bao quan|vón cục|von cuc|hạn dùng|han dung|hạn sử dụng|han su dung|bị vón|bi von|để được bao lâu|de duoc bao lau)/i.test(searchStr)) {
    return `### 📦 Hướng dẫn Bảo Quản & Hạn Sử Dụng Sơn Tĩnh Điện
Bột sơn tĩnh điện bản chất là hạt nhựa (Epoxy/Polyester) pha trộn phụ gia, rất nhạy cảm với nhiệt độ và độ ẩm.

**1. Hạn sử dụng (Shelf-life):**
- Trung bình từ **12 đến 24 tháng** kể từ ngày sản xuất (tùy dòng sơn).
- Sau thời gian này, sơn vẫn có thể dùng được nhưng tỷ lệ bám dính tĩnh điện sẽ suy giảm.

**2. Điều kiện Kho bãi (Storage):**
- 🌡️ **Nhiệt độ:** Bắt buộc duy trì **< 25°C** (Kho mát/điều hòa). Nếu để nhiệt độ >30°C, nhựa sẽ mềm ra và dính chặt vào nhau gây vón cục (Caking).
- 💧 **Độ ẩm:** Bắt buộc **< 60%** (Tránh kho bãi ẩm thấp, mưa dột). Bột hút ẩm sẽ gây lỗi rỗ khí châm kim khi sấy.
- Tránh ánh nắng mặt trời chiếu trực tiếp vào thùng carton.

**3. Xử lý sơn bị vón cục:**
- Nếu chỉ vón cục nhẹ (dùng tay bóp vỡ dễ dàng): Có thể cho qua lưới rây rung tự động rồi trộn với sơn mới (tỷ lệ 20% cũ - 80% mới) để phun.
- Nếu vón thành tảng cứng đơ: Bột đã chết, bắt buộc phải hủy bỏ, không được cho vào súng phun gây nghẹt vòi.`;
  }

  // 7.13. HSE (An toàn Lao động & Môi trường)
  if (/(độc hại|doc hai|an toàn|an toan|hít phải|hit phai|bảo hộ|bao ho|môi trường|moi truong|bụi sơn|bui son)/i.test(searchStr)) {
    return `### 🦺 An Toàn Lao Động & Môi Trường (HSE) xưởng sơn
Công nghệ Sơn bột tĩnh điện tự hào là công nghệ sơn **Xanh & Sạch nhất** hiện nay trên thế giới!

**1. Mức độ Độc hại:**
- ✅ **KHÔNG chứa dung môi bay hơi (Zero VOC):** Không sinh ra khí thải độc hại, không có mùi hôi dung môi như sơn dầu/PU.
- ✅ **KHÔNG chứa kim loại nặng độc hại** (như Chì, Thủy ngân).
- ⚠️ Rủi ro duy nhất: Bột sơn là hạt bụi mịn (kích thước 30-50 micron), nếu hít phải nhiều sẽ gây cản trở hô hấp (bụi phổi).

**2. Khuyến nghị Bảo hộ lao động (PPE):**
- Bắt buộc thợ sơn phải đeo **Mặt nạ phòng độc/chống bụi mịn 3M**.
- Mặc quần áo bảo hộ dài tay (loại chống tĩnh điện càng tốt), đeo kính bảo hộ và găng tay.
- Môi trường xưởng phải gắn **Hệ thống Quạt hút & Filter thu hồi bột** để hút sạch bụi lơ lửng, giữ không khí trong lành.

*Sơn tĩnh điện cực kỳ an toàn nếu bạn tuân thủ đúng quy tắc đeo mặt nạ và làm vệ sinh buồng phun thường xuyên!*`;
  }

  // 7.14. B2B Policies (Đại lý & Giao hàng)
  if (/(đại lý|dai ly|giao hàng|giao hang|chiết khấu|chiet khau|vận chuyển|van chuyen|phân phối|phan phoi|giá sỉ|gia si)/i.test(searchStr)) {
    return `### 🤝 Chính sách Đại lý & Vận chuyển B2B VTSC
Chúng tôi luôn chào đón các xưởng gia công, nhà máy sản xuất kim loại và đại lý phân phối gia nhập hệ sinh thái VTSC PaintPro!

**1. Chính sách Giá & Chiết khấu:**
- Cung cấp **Bảng giá sỉ (B2B)** cực kỳ ưu đãi cho xưởng gia công có sản lượng từ **25 thùng/tháng** trở lên.
- Hỗ trợ công nợ (Credit term) 30-45 ngày cho các đối tác ký hợp đồng nguyên tắc.

**2. Chính sách Vận chuyển / Giao hàng:**
- 🚚 **Miễn phí giao hàng (Free Shipping):** Áp dụng cho đơn hàng từ **5 thùng** trở lên khu vực Nội thành.
- Hỗ trợ gửi chành xe/đơn vị vận chuyển đối với khách hàng ở Tỉnh xa (Chi phí thương lượng).

**3. Hỗ trợ Kỹ thuật & Chuyển giao công nghệ:**
- Tặng kèm tài liệu quy trình sấy và phối trộn KCS.
- Cử kỹ sư VTSC xuống tận xưởng hỗ trợ setup buồng phun, điều chỉnh nhiệt độ lò sấy và đào tạo thợ sơn miễn phí cho đại lý mới.

*Bạn là chủ xưởng gia công hay đang có dự án cần báo giá sỉ? Hãy để lại số điện thoại hoặc liên hệ Hotline: 1900-xxxx để Giám đốc Kinh doanh VTSC gọi lại nhé!*`;
  }

  // 7.15. Paint System Comparison (Polyester vs Epoxy vs Hybrid)
  if (/(so sánh|so sanh|khác nhau|khac nhau|nên dùng|nen dung|polyester|epoxy ngoài trời|epoxy ngoai troi|sơn ngoài trời|son ngoai troi|hybrid)/i.test(searchStr) && !/(tàu biển|tau bien)/i.test(searchStr)) {
    return `### ⚖️ So sánh Các Hệ Sơn Tĩnh Điện (Polyester vs Epoxy vs Hybrid)
Lựa chọn sai hệ sơn sẽ khiến sản phẩm nhanh chóng bị bong tróc, phai màu hoặc tốn kém chi phí không cần thiết.

**1. Hệ sơn Polyester (Chuyên dùng Ngoài trời):**
- **Đặc tính:** Kháng tia cực tím (UV) cực tốt, chịu được thời tiết khắc nghiệt, giữ màu và độ bóng bền bỉ trên 10 năm.
- **Ứng dụng:** Cửa nhôm kính, cổng rào ngoài trời, biển báo giao thông, khung xe máy/ô tô.
- **Giá thành:** Cao nhất.

**2. Hệ sơn Epoxy (Chuyên dùng Trong nhà / Chống ăn mòn):**
- **Đặc tính:** Siêu cứng, chống trầy xước và chịu hóa chất cực mạnh. Tuy nhiên, yếu điểm chí mạng là **bị phấn hóa (ngả vàng, mất bóng)** khi tiếp xúc tia UV.
- **Ứng dụng:** Phủ gầm xe máy, đường ống ngầm, van công nghiệp, hoặc làm lớp lót (Primer) chống rỉ trước khi phủ Polyester.
- **Giá thành:** Trung bình.

**3. Hệ sơn Hybrid (Epoxy-Polyester / Trong nhà):**
- **Đặc tính:** Lai giữa Epoxy và Polyester, tạo ra bề mặt đẹp, nhẵn mịn, giá thành rẻ. Kháng UV kém.
- **Ứng dụng:** Vỏ tủ điện, đồ gia dụng (tủ lạnh, máy giặt), kệ siêu thị, nội thất thép.
- **Giá thành:** Rẻ nhất.

*Dự án của bạn là sản phẩm để ngoài trời hay trong nhà?*`;
  }

  // 7.16. Overspray Recovery (Thu hồi bột sơn)
  if (/(thu hồi|thu hoi|tái sử dụng|tai su dung|tỷ lệ pha|ty le pha|sơn cũ|son cu|bột rơi vãi|bot roi vai)/i.test(searchStr)) {
    return `### ♻️ Thu hồi và Tái sử dụng Sơn bột tĩnh điện
Điểm ưu việt tuyệt đối của Sơn bột tĩnh điện so với Sơn nước/Sơn dầu là khả năng **tái sử dụng lên tới 95%**.

**1. Nguyên lý thu hồi:**
Bột sơn không bám vào phôi (Overspray) sẽ rơi xuống phễu thu hồi hoặc được quạt hút vào hệ thống Filter/Cyclone, sau đó đánh tơi và đưa trở lại thùng chứa bột.

**2. Tỷ lệ pha trộn tiêu chuẩn (KCS):**
Tuyệt đối không sử dụng 100% bột sơn thu hồi để phun lại vì hạt bột đã mất một phần tĩnh điện và lẫn bụi bẩn.
👉 **Công thức Vàng:** Pha **20% đến tối đa 30%** bột sơn thu hồi + **70% đến 80%** bột sơn mới.

**3. Lưu ý sống còn:**
- Bắt buộc phải cho bột sơn thu hồi đi qua rây rung tự động để lọc mạt nhôm/sắt bụi bẩn.
- Nếu không rây, màng sơn sấy xong sẽ bị lỗi rỗ khí (châm kim) hoặc có hạt cát li ti trên bề mặt.`;
  }

  // 7.17. Certifications (Tiêu chuẩn & Chứng chỉ)
  if (/(chứng chỉ|chung chi|chứng nhận|chung nhan|tiêu chuẩn|tieu chuan|qualicoat|rohs|aama|chất lượng|chat luong)/i.test(searchStr)) {
    return `### 📄 Tiêu chuẩn & Chứng chỉ Sơn Tĩnh Điện Quốc Tế
Tất cả các dòng sơn bột tĩnh điện cao cấp (đặc biệt là AkzoNobel Interpon và Jotun) do VTSC phân phối đều đạt các chứng chỉ khắt khe nhất thế giới để xuất khẩu:

**1. Qualicoat (Châu Âu):**
- Chứng chỉ danh giá nhất về chất lượng sơn trên nhôm kiến trúc.
- Đảm bảo độ bền màu, chống phấn hóa và bong tróc lên tới **10 - 25 năm** (Với các dòng Interpon D1000, D2000, D3000).

**2. Tiêu chuẩn AAMA (Mỹ):**
- AAMA 2603: Sơn ngoài trời thông thường (Bảo hành 1 năm Florida).
- AAMA 2604: Sơn siêu bền (Super Durable - Bảo hành 5 năm Florida).
- AAMA 2605: Sơn Fluoropolymer cực bền (Bảo hành 10 năm Florida).

**3. Tiêu chuẩn RoHS & REACH:**
- Đảm bảo **100% Không chứa hóa chất độc hại** (Không chì, không thủy ngân, không Cadmium). Đủ tiêu chuẩn xuất khẩu đồ nội thất/vật tư vào thị trường Châu Âu và Mỹ.

*Bạn cần xin cấp chứng chỉ Qualicoat cho lô hàng sắp tới phải không? Vui lòng liên hệ Hotline để VTSC xuất hồ sơ CO/CQ nhé!*`;
  }

  // 8. Search paint products (Public)
  if (/(tìm sơn|sơn tĩnh điện|tĩnh điện|công nghiệp|tàu biển|sản phẩm sơn|các loại sơn|loại sơn|mua sơn|interpon|akzonobel|d1000|d2000|d3000|tư vấn|những màu|loại màu|mã màu nào|tim son|son tinh dien|tinh dien|cong nghiep|tau bien|san pham son|cac loai son|loai son|mua son|tu van|nhung mau|loai mau|ma mau nao|sơn|son|chống rỉ|chong ri|vân gỗ|van go)/i.test(searchStr)) {
    // Try to extract a specific code, else use a broader keyword
    const matchCode = message.match(/[A-Z]{2,4}\d{3,4}/i);
    let query = matchCode ? matchCode[0] : '';

    if (!query) {
      // Loại bỏ các từ khóa nhiễu để trích xuất lõi từ khóa tìm kiếm
      let queryFallback = lower.replace(/(tìm kiếm|tìm|mua|của|tư vấn|cho tôi|nhé|với|hỏi|dạ|xin|chút|nào|sản phẩm|các loại|loại|tim kiem|tim|mua|cua|tu van|cho toi|nhe|voi|hoi|da|xin|chut|nao|san pham|cac loai|loai|\?)/gi, '').trim();
      
      if (queryFallback.length > 2) {
        query = queryFallback;
      } else {
        if (searchStr.includes('akzonobel')) query = 'AkzoNobel';
        else if (searchStr.includes('tĩnh điện') || searchStr.includes('tinh dien')) query = 'tĩnh điện';
        else if (searchStr.includes('công nghiệp') || searchStr.includes('cong nghiep')) query = 'công nghiệp';
        else if (searchStr.includes('tàu biển') || searchStr.includes('tau bien')) query = 'tàu biển';
        else if (searchStr.includes('chịu nhiệt') || searchStr.includes('chiu nhiet')) query = 'chịu nhiệt';
        else query = 'sơn';
      }
    }

    const products = await searchPaintProducts({ query });
    if (products.error || products.length === 0) {
      if (/(nhà|nội thất|ngoại thất|chống nóng|chống thấm|tường|nha|noi that|ngoai that|chong nong|chong tham|tuong)/i.test(searchStr)) {
        return `### 🏠 Tư vấn Sơn Xây Dựng (Nội/Ngoại thất, Chống thấm)
Cảm ơn bạn đã quan tâm! Tuy nhiên, hệ thống **VTSC PaintPro** hiện đang chuyên biệt về **Sơn Công Nghiệp (Sơn bột tĩnh điện, Sơn tàu biển, Sơn chịu nhiệt, Sơn kết cấu thép)**.

Đối với nhu cầu sơn tường nhà (sơn nước kiến trúc), chống nóng và chống thấm, VTSC xin gợi ý các thương hiệu nổi tiếng trên thị trường mà bạn có thể tham khảo mua ngoài:
- 🛡️ **Sơn chống thấm / Chống nóng:** Kova, Sika, Dulux Aquatech.
- 🎨 **Sơn nội thất / Ngoại thất cao cấp:** Jotun Majestic, Dulux EasyClean, Nippon Paint.

*Nếu bạn có nhu cầu sơn cho các chi tiết kim loại (như cửa nhôm kính, hàng rào sắt, mái tôn), hãy cho tôi biết nhé! Khâu đó chính là thế mạnh của VTSC.*`;
      }
      if (/(tôi muốn mua sơn|mua sơn|tư vấn sơn|sơn tĩnh điện|bán sơn|các loại sơn)/i.test(lower)) {
        const topProducts = await SanPhamSon.find({}).sort({ SoLuongDaBan: -1 }).limit(3).lean();
        
        let resp = `### 🌟 Các Dòng Sơn Bán Chạy Nhất Tại VTSC PaintPro
Hiện tại tôi chưa rõ bạn đang tìm dòng sơn cụ thể nào. Tuy nhiên, VTSC đang cung cấp các dòng sơn công nghiệp và tĩnh điện chất lượng cao. Dưới đây là các sản phẩm **Bán chạy nhất (Best Sellers)** của chúng tôi:\n\n---\n`;

        topProducts.forEach(p => {
          resp += `**[${p.MaSanPham}] ${p.TenDongSon}**\n`;
          if (p.HinhAnh && p.HinhAnh.length > 0) resp += `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})\n`;
          resp += `🔹 **Thương hiệu:** ${p.ThuongHieu} | **Phân loại:** ${p.PhanLoai}\n`;
          resp += `🔹 **Đơn giá:** **${p.DonGiaCoSo?.toLocaleString()}đ/${p.DonViTinh || 'Thùng'}**\n`;
          if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
            resp += `🔹 **Màu sắc tiêu biểu:**\n  ${p.DanhSachMaMau.slice(0, 4).map(m => `- \`${m.MaMau}\` (${m.TenMau})`).join('\n  ')}\n`;
          }
          resp += `\n---\n`;
        });
        
        resp += `\n🔗 **[Vào trang Cửa hàng để xem toàn bộ danh mục & Thêm vào giỏ hàng](/shop)**`;
        return resp;
      }
      return `📋 **VTSC PaintPro AI**: Hiện tại tôi chưa tìm thấy dòng sơn nào khớp chính xác với từ khóa "${query}". Hệ thống của chúng tôi hiện đang cung cấp các dòng Sơn tĩnh điện AkzoNobel, Sơn chịu nhiệt, Sơn tàu biển Nippon, v.v. Bạn có thể thử tìm với từ khóa khác như "AkzoNobel" hoặc "Sơn tĩnh điện" nhé!`;
    }

    return `### 📦 KẾT QUẢ TÌM KIẾM SẢN PHẨM:
---
${products.map(p => `
**[${p.MaSanPham}] ${p.TenDongSon}**
${p.HinhAnh && p.HinhAnh.length > 0 ? `![Ảnh sản phẩm](${resolveImageUrl(p.HinhAnh[0])})` : ''}

🔹 **Thương hiệu:** ${p.ThuongHieu}
🔹 **Phân loại:** ${p.PhanLoai}
🔹 **Đơn giá:** **${p.DonGiaCoSo?.toLocaleString()}đ/${p.DonViTinh || 'Thùng'}**
🔹 **Tồn kho:** ${p.TongTonKho || 0} ${p.DonViTinh || 'Thùng'}
${p.DanhSachMaMau && p.DanhSachMaMau.length > 0 ? `🔹 **Các mã màu có sẵn:**\n  ${p.DanhSachMaMau.slice(0, 5).map(m => `- \`${m.MaMau}\` (${m.TenMau})${m.HinhAnh ? `\n    ![Màu ${m.MaMau}](${resolveImageUrl(m.HinhAnh)})` : ''}`).join('\n  ')}${p.DanhSachMaMau.length > 5 ? '\n  - ...' : ''}` : ''}

📝 **Mô tả:** 
${p.MoTa ? p.MoTa.substring(0, 150) + '...' : 'Không có mô tả.'}

---`).join('\n')}

🔗 **[Vào trang Cửa hàng để Đặt hàng & Mua sắm](/shop)**`;
  }

  // 9. Standard greetings/help (Public)
  return `Xin chào! Tôi là **VTSC PaintPro AI** - Trợ lý ảo thời gian thực của bạn. 

Tôi được kết nối trực tiếp với hệ thống cơ sở dữ liệu VTSC để hỗ trợ bạn:
- **Tư vấn sản phẩm:** Tìm kiếm mã sơn tĩnh điện (\`D1000\`, \`D2000\`), thông tin mã màu, thông số sấy đóng rắn màng sơn.
- **Quy trình sấy & Công thức:** Hỏi *"công thức pha chế"* hoặc *"quy trình sấy sơn"* để xem tỷ lệ KCS và nhiệt độ buồng sấy.
- **Tiến độ sản xuất B2B:** Tra cứu *"tiến độ pha chế hợp đồng"* để theo dõi các lệnh sản xuất đang chạy.

*Mẹo: Nếu bạn là **Quản trị viên**, bạn có thể hỏi về "doanh thu tháng", "tồn kho tổng", "kpi nhân viên", hoặc "thống kê hợp đồng" để tôi kết nối công cụ phân tích dữ liệu cho bạn!*`;
};

// === API ENDPOINTS ===

// @desc    Gửi tin nhắn cho Chatbot (Gemini Tools & Live Fallback Supported)
// @route   POST /api/chatbot/message
const getChatbotResponse = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp sessionId và message' });
    }

    // 1. Detect optional JWT authentication for Role-Based Access Control (RBAC)
    let userRole = 'Guest';
    let userDetails = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vtsc_super_secret_key_2024');
        const user = await TaiKhoan.findById(decoded.id);
        if (user && user.TrangThai) {
          userRole = user.VaiTro; // 'Admin', 'NhanVien', 'KhachHangB2B', 'KhachHangB2C', 'Director'
          userDetails = user;
          console.log(`[Chatbot Session] Authenticated user: ${user.username} with role: ${userRole}`);
        }
      } catch (err) {
        console.log('[Chatbot Session] Optional token verification skipped or invalid token.');
      }
    }

    // 2. Load/create Chat session in MongoDB
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = new ChatSession({ sessionId, messages: [] });
    }

    let responseText;

    if (genAI) {
      // === REAL GEMINI AI INTEGRATION WITH LIVE FUNCTION CALLING (TOOLS) ===
      try {
        const schemas = getToolSchemas(userRole);

        // Map messages into Gemini's expected format
        const chatHistory = session.messages.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        // Instantiating model with system instructions & tools
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          tools: schemas.length > 0 ? [{ functionDeclarations: schemas }] : undefined,
          systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({
          history: chatHistory,
          generationConfig: { maxOutputTokens: 1200, temperature: 0.2 },
        });

        console.log(`[Chatbot] Sending user query to Gemini: "${message}"`);
        let result = await chat.sendMessage(message);
        let response = result.response;

        // Multi-turn Gemini Tool Call execution loop (max depth 3 to avoid infinite loops)
        let loopCount = 0;
        while (response.functionCalls && loopCount < 3) {
          loopCount++;
          const functionCalls = response.functionCalls;
          console.log(`[Gemini Tool Request - Loop ${loopCount}] Gemini wants to execute function:`, functionCalls.map(c => c.name));

          const functionResponses = [];
          for (const call of functionCalls) {
            const toolResult = await executeTool(call.name, call.args, userRole);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { result: toolResult }
              }
            });
          }

          // Feed function result back to Gemini
          console.log(`[Chatbot] Sending tool response back to Gemini...`);
          const followUpResult = await chat.sendMessage(functionResponses);
          response = followUpResult.response;
        }

        responseText = response.text();
      } catch (geminiError) {
        console.error('[Gemini AI Core Error] Fallback to high-fidelity mock mode. Error details:', geminiError.message);
        responseText = await getMockResponse(message, userRole, session.messages);
      }
    } else {
      // === HIGH FIDELITY MOCK FALLBACK (QUERIES DATABASE LIVE) ===
      responseText = await getMockResponse(message, userRole, session.messages);
    }

    // Save Chat messages to Mongo session
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'model', content: responseText });
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        response: responseText,
        role: userRole
      },
    });
  } catch (error) {
    console.error('[Chatbot Controller Critical Error]:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi bộ xử lý Chatbot AI. Vui lòng kiểm tra kết nối mạng và thử lại sau.',
    });
  }
};

// @desc    Lấy lịch sử chat
// @route   GET /api/chatbot/history/:sessionId
const getChatHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
    res.status(200).json({ success: true, data: session?.messages || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Lấy danh sách ticket CSKH
// @route   GET /api/chatbot/tickets
const getTickets = async (req, res) => {
  try {
    const { page = 1, limit = 20, trangThai } = req.query;
    const filter = {};
    if (trangThai) filter.TrangThai = trangThai;

    const total = await PhanHoiHoTro.countDocuments(filter);
    const data = await PhanHoiHoTro.find(filter)
      .populate('CustomerID', 'TenKhachHang MaKH')
      .populate('AssignedTo', 'HoTen MaNV')
      .sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ success: true, count: data.length, total, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

// @desc    Nhân viên CSKH trả lời ticket (Human-in-the-loop)
// @route   POST /api/chatbot/tickets/:ticketId/reply
const replyTicket = async (req, res) => {
  try {
    const { noiDung } = req.body;
    const ticket = await PhanHoiHoTro.findOne({ MaPhanHoi: req.params.ticketId });
    if (!ticket) return res.status(404).json({ success: false, error: 'Không tìm thấy ticket' });

    ticket.LichSuTraLoi.push({
      NguoiTraLoi: 'NhanVien',
      NoiDung: noiDung,
    });
    ticket.TrangThai = 'Đang xử lý';
    if (req.user) ticket.AssignedTo = req.user._id;
    await ticket.save();

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { getChatbotResponse, getChatHistory, getTickets, replyTicket };
