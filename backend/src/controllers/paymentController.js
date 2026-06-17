const DonHang = require('../models/DonHang');
const HopDong = require('../models/HopDong');
const GiaoDichThanhToan = require('../models/GiaoDichThanhToan');
const KhuyenMai = require('../models/KhuyenMai');

// Utility to apply voucher tracking
async function recordVoucherUsage(discountCode, discountAmount, targetId) {
    if (!discountCode) return;
    try {
        const voucher = await KhuyenMai.findOne({ MaKhuyenMai: { $regex: new RegExp(`^${discountCode}$`, 'i') } });
        if (voucher) {
            voucher.DanhSachApDung.push({
                MaKhachHang: targetId || 'Unknown',
                NgayApDung: new Date(),
                SoTienGiam: discountAmount || 0
            });
            await voucher.save();
        }
    } catch (err) {
        console.error('Lỗi khi ghi nhận mã khuyến mãi:', err);
    }
}

// Helper function to check and apply 10% late fee
const applyLatePenaltyToContracts = async (contracts) => {
    const now = new Date();
    for (let contract of contracts) {
        if (!contract.paymentTerms) continue;
        let isUpdated = false;
        let penaltyAmount = 0;

        for (let term of contract.paymentTerms) {
            // Overdue if paidAmount < amount and now > dueDate + 10 days
            if (!term.lateFeeApplied && (term.paidAmount || 0) < term.amount) {
                const dueDate = new Date(term.dueDate);
                const tenDaysInMs = 10 * 24 * 60 * 60 * 1000;
                if (now.getTime() > dueDate.getTime() + tenDaysInMs) {
                    const penalty = term.amount * 0.10; // 10% penalty
                    term.amount += penalty;
                    term.lateFeeApplied = true;
                    penaltyAmount += penalty;
                    isUpdated = true;
                }
            }
        }

        if (isUpdated) {
            contract.TongGiaTri += penaltyAmount;
            await contract.save();
        }
    }
};

// @desc    Get all financial records (Orders + Contracts) for payment management
// @route   GET /api/thanh-toan/all
exports.getAllFinancialRecords = async (req, res) => {
    try {
        const [orders, contracts] = await Promise.all([
            DonHang.find({}).populate('KhachHang', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 }),
            HopDong.find({}).populate('CustomerID', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 })
        ]);

        await applyLatePenaltyToContracts(contracts);

        // Normalize Orders (filter out B2B orders since they are tracked under Contracts)
        const normalizedOrders = orders
            .filter(o => o.KhachHang?.PhanLoai !== 'B2B')
            .map(o => {
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

// @desc    Get financial records for logged in customer
// @route   GET /api/thanh-toan/my-payments
exports.getMyFinancialRecords = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        const KhachHang = require('../models/KhachHang');
        const khProfile = await KhachHang.findOne({ AccountID: req.user._id });
        if (!khProfile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng' });
        }

        const customerId = khProfile._id;

        const [orders, contracts] = await Promise.all([
            DonHang.find({ KhachHang: customerId }).populate('KhachHang', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 }),
            HopDong.find({ CustomerID: customerId }).populate('CustomerID', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 })
        ]);

        await applyLatePenaltyToContracts(contracts);

        // Normalize Orders (filter out B2B orders since they are tracked under Contracts)
        const normalizedOrders = orders
            .filter(o => o.KhachHang?.PhanLoai !== 'B2B')
            .map(o => {
                const total = o.TongTien || 0;
                const paid = o.TrangThaiThanhToan === 'DA_THANH_TOAN' ? total : (o.DaCoc || 0);
                return {
                    _id: o._id,
                    type: 'ORDER',
                    code: o.MaDonHang,
                    totalAmount: total,
                    paidAmount: paid,
                    debtAmount: total - paid,
                    status: o.TrangThaiThanhToan,
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
                totalAmount: total,
                paidAmount: paid,
                debtAmount: total - paid,
                status: c.TrangThai === 'completed' ? 'DA_THANH_TOAN' : (paid > 0 ? 'CALLED_PARTIAL' : 'CHUA_THANH_TOAN'),
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

// @desc    Create MoMo payment URL
// @route   POST /api/thanh-toan/momo/create
exports.createMomoPayment = async (req, res) => {
    try {
        const { type, id, amount, discountCode, discountAmount } = req.body;

        if (!type || !id || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin loại thanh toán, ID hoặc số tiền' });
        }

        let referenceCode = '';
        let orderInfo = '';

        if (type === 'ORDER') {
            const order = await DonHang.findById(id);
            if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
            referenceCode = order.MaDonHang;
            orderInfo = `Thanh toan don hang VTSC #${referenceCode}`;
        } else if (type === 'CONTRACT') {
            const contract = await HopDong.findById(id);
            if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });
            referenceCode = contract.MaHopDong;
            orderInfo = `Thanh toan hop dong VTSC #${referenceCode}`;
        } else {
            return res.status(400).json({ success: false, message: 'Loại thanh toán không hợp lệ' });
        }

        const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
        const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
        const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const apiEndpoint = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';

        const requestId = `REQ-${Date.now()}`;
        const orderId = `VTSC-${type}-${id}-${Date.now()}`;
        
        // redirectUrl - Quay lại trang frontend sau khi thanh toán xong
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/thanh-toan/momo-redirect`;
        
        // ipnUrl - Webhook nhận kết quả từ MoMo (cần link HTTPS thật từ Render/ngrok)
        const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const ipnUrl = `${backendUrl}/api/thanh-toan/momo/ipn`;

        // encode extraData
        const extraDataObj = { type, id, amount: Number(amount), discountCode, discountAmount: Number(discountAmount || 0) };
        const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString('base64');

        const requestType = 'captureWallet';

        // Tạo chuỗi ký tự thô theo đúng thứ tự bảng chữ cái của khóa
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const crypto = require('crypto');
        const axios = require('axios');

        // Ký số HMAC-SHA256
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Gửi request tới MoMo
        const response = await axios.post(apiEndpoint, {
            partnerCode,
            partnerName: 'VTSC PaintPro',
            storeId: 'VTSC Store',
            requestId,
            amount: Number(amount),
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            requestType,
            extraData,
            lang: 'vi',
            signature
        });

        if (response.data && response.data.resultCode === 0) {
            return res.status(200).json({
                success: true,
                payUrl: response.data.payUrl,
                qrCodeUrl: response.data.qrCodeUrl,
                orderId
            });
        } else {
            console.error('MoMo Gateway Error Response:', response.data);
            return res.status(400).json({
                success: false,
                message: response.data.message || 'Lỗi kết nối cổng thanh toán MoMo'
            });
        }
    } catch (error) {
        console.error('MoMo Create Error:', error.response?.data || error.message);
        
        let errorMessage = 'Không thể kết nối đến cổng thanh toán MoMo';
        let detail = error.message;

        if (error.response) {
            // MoMo returned a non-2xx status code
            const responseData = error.response.data;
            detail = typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData);
            if (responseData && responseData.message) {
                errorMessage = `Cổng thanh toán MoMo báo lỗi: ${responseData.message} (Mã kết quả: ${responseData.resultCode || 'N/A'})`;
            } else {
                errorMessage = `Cổng thanh toán MoMo từ chối yêu cầu (HTTP ${error.response.status})`;
            }
        } else if (error.request) {
            // Request was made but no response was received
            errorMessage = 'Không thể kết nối đến máy chủ MoMo. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.';
        } else {
            errorMessage = `Lỗi hệ thống khi khởi tạo MoMo: ${error.message}`;
        }

        return res.status(400).json({
            success: false,
            message: errorMessage,
            detail: detail
        });
    }
};

// @desc    MoMo IPN Webhook callback
// @route   POST /api/thanh-toan/momo/ipn
exports.momoIPN = async (req, res) => {
    try {
        console.log('--- RECEIVED MOMO IPN WEBHOOK ---');
        console.log(req.body);

        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature: receivedSignature
        } = req.body;

        const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';

        // Xác thực chữ ký từ MoMo
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const crypto = require('crypto');
        const verifiedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        if (verifiedSignature !== receivedSignature) {
            console.error('MoMo IPN signature mismatch! Verification failed.');
            return res.status(400).json({ success: false, message: 'Chữ ký không hợp lệ' });
        }

        // Nếu thanh toán thành công (resultCode === 0)
        if (resultCode === 0) {
            // Giải mã extraData
            const decodedExtraData = JSON.parse(Buffer.from(extraData, 'base64').toString('ascii'));
            const { type, id, amount: paidVal, discountCode, discountAmount } = decodedExtraData;
            
            // Số tiền thực trả cộng số tiền khuyến mãi bằng số tiền được ghi nhận hoàn thành
            const effectivePaidVal = Number(paidVal) + Number(discountAmount || 0);

            console.log(`Payment confirmed! Type: ${type}, ID: ${id}, Amount: ${paidVal}`);

            if (type === 'ORDER') {
                const order = await DonHang.findById(id);
                if (order) {
                    order.TrangThaiThanhToan = 'DA_THANH_TOAN';
                    order.DaCoc = order.TongTien; // Xem như thanh toán đủ
                    await order.save();
                    console.log(`Order ${order.MaDonHang} status updated to paid.`);
                }
            } else if (type === 'CONTRACT' || type === 'CONTRACT_INSTALLMENT') {
                let contractId = id;
                let termId = null;
                if (type === 'CONTRACT_INSTALLMENT') {
                    const parts = id.split('_');
                    contractId = parts[0];
                    termId = parts[1];
                }

                const contract = await HopDong.findById(contractId);
                if (contract) {
                    if (termId && contract.paymentTerms && contract.paymentTerms.length > 0) {
                        const term = contract.paymentTerms.id(termId);
                        if (term) {
                            term.paidAmount = (term.paidAmount || 0) + effectivePaidVal;
                            term.paidDate = new Date();
                        }
                    }

                    contract.DaThanhToan = (contract.DaThanhToan || 0) + effectivePaidVal;
                    
                    // Recalculate based on terms to be safe
                    if (contract.paymentTerms && contract.paymentTerms.length > 0) {
                        contract.DaThanhToan = contract.paymentTerms.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
                    }

                    if (contract.DaThanhToan >= contract.TongGiaTri) {
                        contract.DaThanhToan = contract.TongGiaTri;
                        if (contract.TrangThai === 'delivering') {
                            contract.TrangThai = 'completed';
                        }
                    }
                    await contract.save();
                    console.log(`Contract ${contract.MaHopDong} paid amount updated to ${contract.DaThanhToan}.`);

                    // Record voucher usage
                    if (discountCode) {
                        await recordVoucherUsage(discountCode, discountAmount, contract.CustomerID?.toString() || contractId);
                    }
                }
            }
        } else {
            console.log(`Payment failed or cancelled for OrderId: ${orderId}, ResultCode: ${resultCode}`);
        }

        // MoMo yêu cầu phản hồi HTTP 204 No Content hoặc 200 OK với body phù hợp
        return res.status(204).send();
    } catch (error) {
        console.error('MoMo IPN Handling Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Client-side payment confirmation (fallback when IPN can't reach localhost)
// @route   POST /api/thanh-toan/momo/confirm
exports.momoConfirm = async (req, res) => {
    try {
        const { resultCode, extraData } = req.body;

        if (resultCode !== 0 && resultCode !== '0') {
            return res.status(200).json({ success: false, message: 'Giao dịch không thành công' });
        }

        if (!extraData) {
            return res.status(400).json({ success: false, message: 'Thiếu extraData' });
        }

        // Giải mã extraData
        const decodedExtraData = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
        const { type, id, amount: paidVal, discountCode, discountAmount } = decodedExtraData;

        const effectivePaidVal = Number(paidVal) + Number(discountAmount || 0);

        console.log(`[MoMo Confirm] Client-side confirm - Type: ${type}, ID: ${id}, Amount: ${paidVal}`);

        if (type === 'ORDER') {
            const order = await DonHang.findById(id);
            if (order && order.TrangThaiThanhToan !== 'DA_THANH_TOAN') {
                order.TrangThaiThanhToan = 'DA_THANH_TOAN';
                order.DaCoc = order.TongTien;
                await order.save();
                console.log(`[MoMo Confirm] Order ${order.MaDonHang} updated to DA_THANH_TOAN`);
            }
        } else if (type === 'CONTRACT' || type === 'CONTRACT_INSTALLMENT') {
            let contractId = id;
            let termId = null;
            if (type === 'CONTRACT_INSTALLMENT') {
                const parts = id.split('_');
                contractId = parts[0];
                termId = parts[1];
            }

            const contract = await HopDong.findById(contractId);
            if (contract) {
                if (termId && contract.paymentTerms && contract.paymentTerms.length > 0) {
                    const term = contract.paymentTerms.id(termId);
                    if (term) {
                        term.paidAmount = (term.paidAmount || 0) + effectivePaidVal;
                        term.paidDate = new Date();
                    }
                }

                contract.DaThanhToan = (contract.DaThanhToan || 0) + effectivePaidVal;
                
                // Recalculate based on terms to be safe
                if (contract.paymentTerms && contract.paymentTerms.length > 0) {
                    contract.DaThanhToan = contract.paymentTerms.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
                }

                if (contract.DaThanhToan >= contract.TongGiaTri) {
                    contract.DaThanhToan = contract.TongGiaTri;
                    if (contract.TrangThai === 'delivering') {
                        contract.TrangThai = 'completed';
                    }
                }
                await contract.save();
                console.log(`[MoMo Confirm] Contract ${contract.MaHopDong} paid amount updated to ${contract.DaThanhToan}`);
            }
        }

        return res.status(200).json({ success: true, message: 'Cập nhật thanh toán thành công' });
    } catch (error) {
        console.error('MoMo Confirm Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get contract debt info
// @route   GET /api/thanh-toan/contracts/:id/debt
exports.getContractDebt = async (req, res) => {
    try {
        const contractId = req.params.id;
        const contract = await HopDong.findById(contractId);
        if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng' });

        const payments = await GiaoDichThanhToan.find({ HopDong: contractId, TrangThai: 'SUCCESS' }).sort({ createdAt: -1 });

        const totalPaid = payments.reduce((sum, p) => sum + p.SoTien, 0);
        const totalValue = contract.TongGiaTri || 0;
        const remainingDebt = Math.max(totalValue - totalPaid, 0);

        return res.status(200).json({
            success: true,
            tong_gia_tri: totalValue,
            da_thanh_toan: totalPaid,
            cong_no_con_lai: remainingDebt,
            lich_su: payments
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new manual payment transaction
// @route   POST /api/thanh-toan
exports.createPayment = async (req, res) => {
    try {
        const { Hopdong_id, so_tien, phuong_thuc_thanh_toan } = req.body;
        
        const contract = await HopDong.findById(Hopdong_id);
        if (!contract) return res.status(404).json({ success: false, message: 'Hợp đồng không tồn tại' });

        // Tạo giao dịch
        const payment = new GiaoDichThanhToan({
            MaGiaoDich: `TXN_${Date.now()}`,
            HopDong: Hopdong_id,
            SoTien: so_tien,
            PhuongThucThanhToan: phuong_thuc_thanh_toan,
            TrangThai: 'SUCCESS' // Duyệt ngay cho demo
        });
        await payment.save();

        // Cập nhật hợp đồng
        const payments = await GiaoDichThanhToan.find({ HopDong: Hopdong_id, TrangThai: 'SUCCESS' });
        const totalPaidSum = payments.reduce((sum, p) => sum + p.SoTien, 0);
        
        contract.DaThanhToan = totalPaidSum;
        const newDebt = (contract.TongGiaTri || 0) - totalPaidSum;

        if (newDebt <= 0) {
            contract.TrangThai = 'completed';
        } else if (contract.contractType === 'pha-che' && contract.TrangThai === 'draft') {
            contract.TrangThai = 'delivering'; // Kích hoạt khi có cọc
        }
        await contract.save();

        return res.status(201).json({ success: true, data: payment, cong_no_moi: Math.max(newDebt, 0) });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Verify Blockchain Transaction
// @route   PUT /api/thanh-toan/verify-blockchain
exports.verifyBlockchain = async (req, res) => {
    try {
        const { Hopdong_id, transaction_hash, chu_ky_vtsc } = req.body;
        
        const contract = await HopDong.findById(Hopdong_id);
        if (!contract) return res.status(404).json({ success: false, message: 'Hợp đồng không tồn tại' });

        contract.TransactionHash = transaction_hash;
        contract.vtscSignature = chu_ky_vtsc;
        await contract.save();

        return res.status(200).json({ success: true, message: 'Đã lưu chứng từ blockchain' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Handle Card Payment logic directly
// @route   POST /api/thanh-toan/card-payment
exports.cardPayment = async (req, res) => {
    try {
        const { id, type, amount, contractId, termId, discountCode, discountAmount } = req.body;
        
        // Compatible with older param `contractId`
        const targetId = id || contractId;
        const targetType = type || 'CONTRACT';

        if (!targetId || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đối tượng hoặc số tiền' });
        }

        if (targetType === 'ORDER') {
            const order = await DonHang.findById(targetId);
            if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
            
            order.TrangThaiThanhToan = 'DA_THANH_TOAN';
            // Mark full payment, DaCoc or whatever fields needed
            if (typeof order.DaCoc !== 'undefined') order.DaCoc = amount;
            await order.save();

            // Create transaction history
            await GiaoDichThanhToan.create({
                MaGiaoDich: `CARD_${Date.now()}`,
                DonHang: targetId,
                SoTien: amount,
                PhuongThucThanhToan: 'CARD',
                TrangThai: 'SUCCESS'
            });

            return res.status(200).json({ success: true, message: 'Thanh toán đơn hàng thành công' });
        } else {
            const contract = await HopDong.findById(targetId);
            if (!contract) return res.status(404).json({ success: false, message: 'Hợp đồng không tồn tại' });

            // Apply late penalty just in case before paying
            await applyLatePenaltyToContracts([contract]);

            // The actual value applied to debt is amount + discountAmount
            const effectivePaidVal = Number(amount) + Number(discountAmount || 0);

            // Update exact term
            if (termId && contract.paymentTerms && contract.paymentTerms.length > 0) {
                const term = contract.paymentTerms.id(termId);
                if (term) {
                    term.paidAmount = (term.paidAmount || 0) + effectivePaidVal;
                    term.paidDate = new Date();
                }
            } else {
                // Determine which term to pay or update the overall contract paid amount
                let remainingAmount = effectivePaidVal;
                if (contract.paymentTerms && contract.paymentTerms.length > 0) {
                    for (let term of contract.paymentTerms) {
                        const unpaid = term.amount - (term.paidAmount || 0);
                        if (unpaid > 0 && remainingAmount > 0) {
                            const pay = Math.min(unpaid, remainingAmount);
                            term.paidAmount = (term.paidAmount || 0) + pay;
                            term.paidDate = new Date();
                            remainingAmount -= pay;
                        }
                    }
                }
                contract.DaThanhToan = (contract.DaThanhToan || 0) + effectivePaidVal;
            }

            // Recalculate global DaThanhToan
            if (contract.paymentTerms && contract.paymentTerms.length > 0) {
                contract.DaThanhToan = contract.paymentTerms.reduce((sum, t) => sum + (t.paidAmount || 0), 0);
            }

            if (contract.DaThanhToan >= contract.TongGiaTri) {
                contract.DaThanhToan = contract.TongGiaTri;
                if (contract.TrangThai === 'delivering') {
                    contract.TrangThai = 'completed';
                }
            }
            await contract.save();

            // Create transaction history
            await GiaoDichThanhToan.create({
                MaGiaoDich: `CARD_${Date.now()}`,
                HopDong: targetId,
                SoTien: amount,
                PhuongThucThanhToan: 'CARD',
                TrangThai: 'SUCCESS'
            });

            return res.status(200).json({ success: true, message: 'Thanh toán thẻ hợp đồng thành công', contract });
        }
    } catch (error) {
        console.error('Card Payment Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
