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

// @desc    Get financial records for logged in customer
// @route   GET /api/thanh-toan/my-payments
exports.getMyFinancialRecords = async (req, res) => {
    try {
        if (!req.user || !req.user.profile) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        
        const customerId = req.user.profile._id;

        const [orders, contracts] = await Promise.all([
            DonHang.find({ KhachHang: customerId }).populate('KhachHang', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 }),
            HopDong.find({ CustomerID: customerId }).populate('CustomerID', 'MaKH TenKhachHang PhanLoai').sort({ createdAt: -1 })
        ]);

        // Normalize Orders
        const normalizedOrders = orders.map(o => {
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
        const { type, id, amount } = req.body;

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
        const extraDataObj = { type, id, amount: Number(amount) };
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
            const { type, id, amount: paidVal } = decodedExtraData;

            console.log(`Payment confirmed! Type: ${type}, ID: ${id}, Amount: ${paidVal}`);

            if (type === 'ORDER') {
                const order = await DonHang.findById(id);
                if (order) {
                    order.TrangThaiThanhToan = 'DA_THANH_TOAN';
                    order.DaCoc = order.TongTien; // Xem như thanh toán đủ
                    await order.save();
                    console.log(`Order ${order.MaDonHang} status updated to paid.`);
                }
            } else if (type === 'CONTRACT') {
                const contract = await HopDong.findById(id);
                if (contract) {
                    contract.DaThanhToan = (contract.DaThanhToan || 0) + Number(paidVal);
                    if (contract.DaThanhToan >= contract.TongGiaTri) {
                        contract.DaThanhToan = contract.TongGiaTri;
                        if (contract.TrangThai === 'delivering') {
                            contract.TrangThai = 'completed';
                        }
                    }
                    await contract.save();
                    console.log(`Contract ${contract.MaHopDong} paid amount updated to ${contract.DaThanhToan}.`);
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
        const { type, id, amount: paidVal } = decodedExtraData;

        console.log(`[MoMo Confirm] Client-side confirm - Type: ${type}, ID: ${id}, Amount: ${paidVal}`);

        if (type === 'ORDER') {
            const order = await DonHang.findById(id);
            if (order && order.TrangThaiThanhToan !== 'DA_THANH_TOAN') {
                order.TrangThaiThanhToan = 'DA_THANH_TOAN';
                order.DaCoc = order.TongTien;
                await order.save();
                console.log(`[MoMo Confirm] Order ${order.MaDonHang} updated to DA_THANH_TOAN`);
            }
        } else if (type === 'CONTRACT') {
            const contract = await HopDong.findById(id);
            if (contract) {
                contract.DaThanhToan = (contract.DaThanhToan || 0) + Number(paidVal);
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
