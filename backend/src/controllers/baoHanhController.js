const BaoHanh = require('../models/BaoHanh');
const NhanVien = require('../models/NhanVien');

// @desc    Lấy danh sách ticket bảo hành
exports.getTickets = async (req, res) => {
    try {
        const data = await BaoHanh.find()
            .populate('KhachHang', 'MaKH TenKhachHang')
            .populate('KyThuatKCS', 'MaNV HoTen')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Tạo log bảo hành mới
exports.createTicket = async (req, res) => {
    try {
        const { MaBaoHanh, KhachHang, SanPham, NoiDungLoi, KyThuatKCS, HanBaoHanh, NgayMua } = req.body;

        let ktvPhuTrach = KyThuatKCS;
        // Nếu không gửi KTV lên, thử tự gán nếu người đang login là KTV
        if (!ktvPhuTrach && req.user) {
            const nv = await NhanVien.findOne({ AccountID: req.user._id });
            if (nv) ktvPhuTrach = nv._id;
        }

        const newTicket = new BaoHanh({
            MaBaoHanh: MaBaoHanh || ('WAR-' + Date.now().toString().slice(-4)),
            KhachHang,
            SanPham,
            NoiDungLoi,
            KyThuatKCS: ktvPhuTrach,
            HanBaoHanh: HanBaoHanh || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // Mặc định 5 năm
            NgayMua
        });

        await newTicket.save();
        res.status(201).json({ success: true, data: newTicket });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Lấy chi tiết ticket bảo hành
exports.getTicketById = async (req, res) => {
    try {
        const item = await BaoHanh.findById(req.params.id)
            .populate('KhachHang')
            .populate('KyThuatKCS', 'MaNV HoTen BoPhan ChucVu');

        if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy ticket' });
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// @desc    Cập nhật trạng thái bảo hành
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, phuongAn, assignedTo } = req.body;

        const updateData = { TrangThai: status };
        if (phuongAn) updateData.PhuongAnGiaiQuyet = phuongAn;
        if (assignedTo) updateData.KyThuatKCS = assignedTo;

        const item = await BaoHanh.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy ticket' });
        
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
