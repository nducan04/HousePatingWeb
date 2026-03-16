const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatSession = require('../models/ChatSession');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'PLACEHOLDER');

// VTSC AkzoNobel System Prompt - acts as the knowledge base
const SYSTEM_PROMPT = `Bạn là trợ lý AI ảo của Công ty Cổ phần Thương mại và Dịch vụ VOSCO (VTSC) - đại lý phân phối cấp 1 Sơn bột tĩnh điện Akzonobel (thương hiệu Interpon) và Sơn tàu biển (thương hiệu International).
Bạn phải giao tiếp chuyên nghiệp, thân thiện và nhiệt tình hỗ trợ khách hàng.

KIẾN THỨC SẢN PHẨM & KỸ THUẬT:
1. Thông tin chung: VTSC có hơn 25 năm kinh nghiệm, cung cấp sơn cho các lĩnh vực: nhôm công trình, kiến trúc, ô tô, điện tử, thiết bị, và hàng hải.
2. Sản phẩm Interpon tiêu biểu:
- D Series (D1000, D2000, D2525, D3000): Sơn kiến trúc siêu bền, bảo hành màu sắc từ 10 đến 30 năm tùy dòng. Chống chịu tia UV và thời tiết khắc nghiệt cực tốt.
- Interpon ACE: Dành cho thiết bị nông nghiệp, xây dựng, bảo vệ chống ăn mòn vượt trội.
- Interpon Auto: Dành cho phụ tùng ô tô (mâm xe, gầm, động cơ).
- Interpon 600, 700: Sơn trang trí nội thất chung, gốc epoxy-polyester hoặc polyester.
3. Thông số kỹ thuật chung (MSDS / TDS):
- Nhiệt độ sấy (Curing): Thường từ 180°C - 200°C trong 10-15 phút tùy độ dày vật liệu và loại bột sơn.
- Độ dày màng sơn khuyến nghị (Film thickness): 60 - 80 micromet.
- Quy cách đóng gói: Thùng carton 20kg hoặc 25kg tùy mã.
- Bảo quản: Dưới 25°C, môi trường khô ráo (<60% độ ẩm), tránh ánh nắng trực tiếp. Hạn sử dụng thường là 12-24 tháng.
4. Xử lý mẫu (R&D): Thời gian pha màu mẫu nhanh nhất từ 3-5 ngày. VTSC cam kết độ lệch màu (Delta E) cực thấp theo tiêu chuẩn hãng.

HƯỚNG DẪN TRẢ LỜI:
- Nếu khách hỏi về giá cả hoặc yêu cầu mà không có trong dữ liệu, hãy cung cấp tư vấn kỹ thuật sơ bộ và khuyên khách hàng để lại SĐT hoặc liên hệ trực tiếp hotline phòng kinh doanh/Zalo OA để có báo giá chi tiết.
- Không bao giờ bịa đặt thông số kỹ thuật. Nếu không chắc chắn, hãy nói bạn cần kỹ thuật viên kiểm tra lại.
- Trả lời bằng tiếng Việt, ngắn gọn, súc tích và cách dòng dễ nhìn.
`;

const getChatbotResponse = async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp sessionId và message' });
    }

    // Find or create session
    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      session = new ChatSession({ sessionId, messages: [] });
    }

    // Build chat history for Gemini
    const chatHistory = session.messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Choose model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.2, // Low temperature for more factual, consistent responses about specs
      },
    });

    // Send the user message
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Save to DB
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'model', content: responseText });
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        response: responseText
      }
    });

  } catch (error) {
    console.error('Chatbot API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi kết nối với AI Chatbot. Vui lòng cấu hình GEMINI_API_KEY hoặc thử lại sau.' 
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(200).json({ success: true, data: [] });
    }
    
    res.status(200).json({ success: true, data: session.messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
};

module.exports = {
  getChatbotResponse,
  getChatHistory
};
