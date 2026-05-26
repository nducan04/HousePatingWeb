const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');

// @desc    Get all financial records (Orders + Contracts) for payment management
// @route   GET /api/thanh-toan/all
exports.getAllFinancialRecords = async (req, res) => {
    try {
        const [orders, contracts] = await Promise.all([
            DonHang.find({}).populate('KhachHang', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 }),
            HopDong.find({}).populate('CustomerID', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 })
        ]);

        // Normalize Orders
        const normalizedOrders = orders.map(o => {
            const total = o.TongTien || 0;
            const paid = o.TrangThaiThanhToan === 'DA_THANH_TOAN' ? total : 0;
            return {
                _id: o._id,
                type: 'ORDER',
                code: o.MaDonHang,
                customer: o.KhachHang ? {
                    name: o.KhachHang.TenKhachHang,
                    code: o.KhachHang.MaKH,
                    segment: o.KhachHang.PhanLoai
                } : { name: 'Khách lẻ', code: 'KL' },
                totalAmount: total,
                paidAmount: paid,
                debtAmount: total - paid,
                status: o.TrangThaiThanhToan,
                orderStatus: o.TrangThai,
                date: o.createdAt
            };
        });

        // Normalize Contracts
        const normalizedContracts = contracts.map(c => {
            const total = c.TongGiaTri || 0;
            const paid = c.DaThanhToan || 0;
            return {
                _id: c._id,
                type: 'CONTRACT',
                code: c.MaHopDong,
                customer: c.CustomerID ? {
                    name: c.CustomerID.TenKhachHang,
                    code: c.CustomerID.MaKH,
                    segment: c.CustomerID.PhanLoai
                } : null,
                totalAmount: total,
                paidAmount: paid,
                debtAmount: total - paid,
                status: c.TrangThai === 'completed' ? 'DA_THANH_TOAN' : (paid > 0 ? 'CALLED_PARTIAL' : 'CHUA_THANH_TOAN'),
                contractStatus: c.TrangThai,
                date: c.createdAt
            };
        });

        const allRecords = [...normalizedOrders, ...normalizedContracts].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            count: allRecords.length,
            data: allRecords
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update paid amount for a contract
// @route   PATCH /api/thanh-toan/contract/:id
exports.updateContractPayment = async (req, res) => {
    try {
        const { paidAmount } = req.body;
        const contract = await HopDong.findById(req.params.id);
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });

        contract.DaThanhToan = paidAmount;
        // Tự động chuyển trạng thái nếu đã trả đủ và đang ở trạng thái phù hợp
        if (contract.DaThanhToan >= contract.TongGiaTri && contract.TrangThai === 'delivering') {
            contract.TrangThai = 'completed';
        }
        
        await contract.save();
        res.status(200).json({ success: true, data: contract });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
