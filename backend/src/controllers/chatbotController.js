const ChatSession = require('../models/ChatSession');
const PhanHoiHoTro = require('../models/PhanHoiHoTro');
const SanPhamSon = require('../models/SanPhamSon');

// Gemini AI — mock fallback khi chưa có API key
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'PLACEHOLDER') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  console.log('[Chatbot] @google/generative-ai not installed, using mock mode');
}

// System Prompt cho Gemini
const SYSTEM_PROMPT = `Bạn là trợ lý AI ảo của Công ty Cổ phần Thương mại và Dịch vụ VOSCO (VTSC) - đại lý phân phối cấp 1 Sơn bột tĩnh điện Akzonobel (thương hiệu Interpon) và Sơn tàu biển (thương hiệu International).

KIẾN THỨC SẢN PHẨM & KỸ THUẬT:
1. VTSC có hơn 25 năm kinh nghiệm, cung cấp sơn cho: nhôm công trình, kiến trúc, ô tô, điện tử, thiết bị, hàng hải.
2. Sản phẩm Interpon tiêu biểu:
- D Series (D1000, D2000, D2525, D3000): Kiến trúc siêu bền, bảo hành 10-30 năm.
- Interpon ACE: Thiết bị nông nghiệp, xây dựng.
- Interpon Auto: Phụ tùng ô tô.
- Interpon 600, 700: Trang trí nội thất.
3. Thông số kỹ thuật (MSDS/TDS):
- Nhiệt độ sấy: 180°C-200°C / 10-15 phút
- Độ dày màng sơn: 60-80 micromet
- Đóng gói: 20kg hoặc 25kg
- Bảo quản: <25°C, độ ẩm <60%, hạn sử dụng 12-24 tháng

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, ngắn gọn, chuyên nghiệp.
- Không bịa đặt thông số. Nếu không chắc → nói cần kiểm tra.
- Nếu hỏi giá → khuyên liên hệ hotline PKDS.
- Nếu khiếu nại/yêu cầu phức tạp → thông báo sẽ tạo ticket hỗ trợ.

DỮ LIỆU SẢN PHẨM LIVE (nếu có):
{{PRODUCT_CONTEXT}}`;

/**
 * Phân loại intent từ tin nhắn người dùng
 */
const classifyIntent = (message) => {
  const lower = message.toLowerCase();
  if (/(khiếu nại|complaint|lỗi|hỏng|bảo hành|không hài lòng)/.test(lower)) return 'khieu_nai';
  if (/(giá|báo giá|bao nhiêu tiền|cost|price|chiết khấu)/.test(lower)) return 'hoi_gia';
  if (/(msds|tds|thông số|kỹ thuật|nhiệt độ|độ dày|bảo quản|curing)/.test(lower)) return 'ky_thuat';
  if (/(mã màu|color|hex|màu sắc|interpon|d1000|d2000|d3000)/.test(lower)) return 'tu_van_mau';
  if (/(gặp nhân viên|nói chuyện|hỗ trợ trực tiếp|tư vấn viên)/.test(lower)) return 'chuyen_tiep';
  return 'chung';
};

/**
 * RAG đơn giản: Truy vấn DB sản phẩm để enrich context cho AI
 */
const getProductContext = async (message) => {
  try {
    const keywords = message.match(/[A-Za-z]\d{3,4}/gi) || []; // VD: D1000, D2525
    if (keywords.length === 0) return '';

    const products = await SanPhamSon.find({
      $or: [
        { MaSanPham: { $in: keywords.map(k => new RegExp(k, 'i')) } },
        { TenDongSon: { $in: keywords.map(k => new RegExp(k, 'i')) } },
        { 'DanhSachMaMau.MaMau': { $in: keywords.map(k => new RegExp(k, 'i')) } },
      ]
    }).limit(3);

    if (products.length === 0) return '';

    return products.map(p => 
      `[${p.MaSanPham}] ${p.TenDongSon} - ${p.ThuongHieu} | Giá: ${p.DonGiaCoSo?.toLocaleString()}đ/kg | Màu: ${p.DanhSachMaMau?.map(m => m.MaMau).join(', ') || 'N/A'}`
    ).join('\n');
  } catch (e) {
    return '';
  }
};

/**
 * Tạo ticket CSKH khi intent = khiếu nại hoặc yêu cầu chuyển tiếp
 */
const createTicket = async (sessionId, message, intent) => {
  try {
    const ticketId = `TK-${Date.now().toString(36).toUpperCase()}`;
    const phanLoai = intent === 'khieu_nai' ? 'Khiếu nại' : 
                     intent === 'hoi_gia' ? 'Tư vấn màu' : 'Hỗ trợ kỹ thuật';

    const ticket = await PhanHoiHoTro.create({
      MaPhanHoi: ticketId,
      PhanLoai: phanLoai,
      NoiDungYeuCau: message,
      TrangThai: 'Đang mở',
      LichSuTraLoi: [
        { NguoiTraLoi: 'KhachHang', NoiDung: message },
        { NguoiTraLoi: 'AI', NoiDung: `Ticket #${ticketId} đã được tạo. Nhân viên CSKH sẽ liên hệ trong thời gian sớm nhất.` },
      ],
    });

    return ticket;
  } catch (e) {
    console.error('Lỗi tạo ticket:', e.message);
    return null;
  }
};

/**
 * Mock response khi chưa có Gemini API key
 */
const getMockResponse = (message, intent) => {
  const responses = {
    tu_van_mau: 'Hiện tại VTSC đang phân phối đầy đủ các dòng sơn Interpon của AkzoNobel. Để biết chi tiết về mã màu và stock hiện tại, vui lòng liên hệ hotline PKDS: 0901.234.567 hoặc Zalo OA "VTSC PaintPro".',
    ky_thuat: 'Thông số kỹ thuật cơ bản cho sơn tĩnh điện Interpon:\n• Nhiệt độ sấy: 180-200°C / 10-15 phút\n• Độ dày màng: 60-80 micromet\n• Bảo quản: <25°C, độ ẩm <60%\n• Hạn sử dụng: 12-24 tháng\n\nĐể có MSDS/TDS chi tiết theo từng mã sơn, vui lòng liên hệ bộ phận kỹ thuật VTSC.',
    hoi_gia: 'Cảm ơn bạn đã quan tâm! Giá sơn tĩnh điện phụ thuộc vào dòng sản phẩm, khối lượng đặt hàng và chính sách chiết khấu. Để nhận báo giá chi tiết, vui lòng liên hệ trực tiếp Phòng Kinh doanh Sơn VTSC qua hotline: 0901.234.567.',
    khieu_nai: 'Chúng tôi rất tiếc về sự bất tiện này. Yêu cầu của bạn đã được ghi nhận và sẽ có nhân viên CSKH liên hệ trong thời gian sớm nhất.',
    chuyen_tiep: 'Yêu cầu của bạn đã được chuyển đến nhân viên tư vấn. Nhân viên sẽ phản hồi trong giờ hành chính (8:00 - 17:00, T2-T6).',
    chung: 'Cảm ơn bạn đã liên hệ VTSC! Chúng tôi là đại lý cấp 1 sơn tĩnh điện AkzoNobel (Interpon) với hơn 25 năm kinh nghiệm. Bạn muốn tìm hiểu về sản phẩm, mã màu, hay thông số kỹ thuật?',
  };
  return responses[intent] || responses.chung;
};

// === API ENDPOINTS ===

// @desc    Gửi tin nhắn cho Chatbot
// @route   POST /api/chatbot/message
const getChatbotResponse = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp sessionId và message' });
    }

    // Phân loại intent
    const intent = classifyIntent(message);
    let ticketCreated = null;

    // Tạo ticket nếu khiếu nại hoặc yêu cầu chuyển tiếp
    if (intent === 'khieu_nai' || intent === 'chuyen_tiep') {
      ticketCreated = await createTicket(sessionId, message, intent);
    }

    // Load/create session
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = new ChatSession({ sessionId, messages: [] });
    }

    let responseText;

    if (genAI) {
      // === REAL GEMINI AI ===
      const productContext = await getProductContext(message);
      const enrichedPrompt = SYSTEM_PROMPT.replace('{{PRODUCT_CONTEXT}}', productContext || 'Không có dữ liệu sản phẩm live');

      const chatHistory = session.messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: enrichedPrompt,
      });

      const chat = model.startChat({
        history: chatHistory,
        generationConfig: { maxOutputTokens: 1000, temperature: 0.2 },
      });

      const result = await chat.sendMessage(message);
      responseText = result.response.text();
    } else {
      // === MOCK FALLBACK ===
      responseText = getMockResponse(message, intent);
    }

    // Thêm ticket info vào response nếu có
    if (ticketCreated) {
      responseText += `\n\n📋 **Ticket #${ticketCreated.MaPhanHoi}** đã được tạo thành công.`;
    }

    // Lưu vào DB
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'model', content: responseText });
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        response: responseText,
        intent,
        ticket: ticketCreated ? { id: ticketCreated.MaPhanHoi, status: ticketCreated.TrangThai } : null,
      },
    });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi chatbot. Vui lòng thử lại sau.',
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
