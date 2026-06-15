const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ChinhSach = require('../models/ChinhSach');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const policiesData = [
  {
    LoaiChinhSach: 'MUA_HANG',
    NoiDung: `### Hướng dẫn mua hàng tại VTSC

Chào mừng quý khách đến với quy trình mua hàng tại VTSC. Dưới đây là các bước cơ bản để quý khách có thể đặt hàng nhanh chóng và dễ dàng.

**1. Tìm kiếm và chọn sản phẩm:**
- Quý khách có thể sử dụng thanh công cụ tìm kiếm hoặc duyệt qua danh mục sản phẩm trên website.
- Nhấp vào sản phẩm để xem chi tiết, thông số kỹ thuật và chọn màu sắc, số lượng mong muốn.

**2. Thêm vào giỏ hàng và thanh toán:**
- Nhấp "Thêm vào giỏ" sau khi đã chọn đủ thông tin sản phẩm.
- Truy cập biểu tượng Giỏ hàng ở góc phải trên cùng để kiểm tra lại các sản phẩm.
- Tiến hành thanh toán và điền thông tin địa chỉ giao hàng.

**3. Đối với Khách hàng Doanh nghiệp (B2B):**
- Quý khách cần tạo yêu cầu R&D hoặc lên hợp đồng theo khối lượng lớn. Vui lòng sử dụng tính năng "Gửi yêu cầu R&D" hoặc liên hệ bộ phận kinh doanh.
- Hệ thống hỗ trợ lên đơn hàng (Sale Order) trực tiếp sau khi hoàn tất đàm phán hợp đồng.

**Lưu ý:** Nếu quý khách có bất kỳ khó khăn nào trong quá trình đặt hàng, xin vui lòng gọi tới số Hotline để được hỗ trợ kịp thời.`
  },
  {
    LoaiChinhSach: 'THANH_TOAN',
    NoiDung: `### Chính sách Thanh toán

VTSC hỗ trợ nhiều hình thức thanh toán đa dạng nhằm mang lại sự tiện lợi tối đa cho quý khách hàng B2B và B2C.

**1. Hình thức thanh toán chuyển khoản (Bank Transfer):**
- Đây là hình thức ưu tiên và an toàn nhất. Khách hàng thực hiện chuyển khoản vào số tài khoản công ty VTSC theo nội dung được cung cấp ở bước thanh toán cuối cùng.
- **Tên tài khoản:** Công ty CP TMDV VOSCO (VTSC)
- **Số tài khoản:** 0123 4567 8999
- **Ngân hàng:** Vietcombank - Chi nhánh Hải Phòng

**2. Thanh toán khi nhận hàng (COD):**
- Áp dụng cho các đơn hàng bán lẻ trị giá dưới 5.000.000 VNĐ trong khu vực có hỗ trợ COD.
- Khách hàng kiểm tra hàng hoá trước khi thanh toán cho nhân viên giao hàng.

**3. Thanh toán công nợ (Dành cho B2B):**
- Dành cho các khách hàng doanh nghiệp có hợp đồng dài hạn với VTSC.
- Thời gian và hạn mức công nợ được thỏa thuận rõ ràng trong Phụ lục Hợp đồng.
- VTSC hỗ trợ xuất hóa đơn VAT điện tử ngay sau khi hoàn tất thủ tục giao nhận.

*Lưu ý:* Mọi giao dịch chuyển khoản vui lòng ghi rõ mã đơn hàng để kế toán chúng tôi dễ dàng xác nhận và xử lý nhanh chóng.`
  },
  {
    LoaiChinhSach: 'DOI_TRA',
    NoiDung: `### Chính sách Đổi trả Hàng hóa VTSC

**1. Điều kiện đổi trả:**
- Hàng hóa bị lỗi do nhà sản xuất (đông kết, vón cục bất thường, màu sắc sai lệch so với bảng màu tiêu chuẩn).
- Bao bì sản phẩm (thùng 20kg hoặc 25kg) phải còn nguyên vẹn, chưa qua sử dụng, hoặc chỉ mới khui hộp nghiệm thu không quá 5% khối lượng.
- Phải có hoá đơn mua hàng hợp lệ và xác nhận mã lô hàng (Batch Number) trên nắp thùng khớp với hệ thống.

**2. Thời gian áp dụng:**
- Khách hàng có quyền yêu cầu đổi/trả trong vòng **07 ngày làm việc** kể từ ngày nhận hàng được ghi nhận trên Phiếu Giao Hàng.

**3. Quy trình thực hiện:**
- **Bước 1**: Khách hàng tạo "Yêu cầu hỗ trợ" trên hệ thống Chatbot hoặc liên hệ NVKD. Cung cấp hình ảnh/video thực tế về tình trạng sản phẩm và mã lô sản xuất.
- **Bước 2**: Bộ phận KCS (Kiểm tra chất lượng) của VTSC sẽ đánh giá lỗi trong vòng 24 giờ.
- **Bước 3**: Nếu xác nhận lỗi do sản xuất, VTSC sẽ chịu toàn bộ chi phí vận chuyển thu hồi và giao lại lô hàng mới chậm nhất trong vòng 3 ngày làm việc.

**Lưu ý:** Chúng tôi KHÔNG chấp nhận đổi trả đối với các lỗi do bảo quản sai quy chuẩn từ phía khách hàng (để ngoài nắng, môi trường độ ẩm cao >60% làm ẩm bột sơn).`
  },
  {
    LoaiChinhSach: 'BAO_HANH',
    NoiDung: `### Chính sách Bảo hành Màng Sơn VTSC (AkzoNobel & International)

**1. Thời hạn bảo hành:**
- Đối với sơn tĩnh điện tiêu chuẩn (Interpon D1000): Bảo hành màng sơn **10 năm**.
- Đối với sơn tĩnh điện cao cấp (Interpon D2000, D3000): Bảo hành màng sơn từ **20 đến 30 năm**.
- Đối với sơn công nghiệp/tàu biển: Theo quy định từng dự án, thông thường bảo hành chống rỉ sét **5 năm**.

**2. Điều kiện được bảo hành:**
- Sản phẩm được thi công đúng quy trình chuẩn: Nhiệt độ đóng rắn 180°C - 200°C trong 10-15 phút. Độ dày màng sơn đạt 60-80 µm.
- Bề mặt kim loại trước khi sơn đã được xử lý hoá chất tẩy dầu mỡ và rỉ sét đạt tiêu chuẩn.
- Bề mặt sơn không bị bong tróc, phai màu vượt quá dung sai E < 5.0 (Theo tiêu chuẩn Qualicoat).

**3. Quy trình tiếp nhận bảo hành:**
- Khi công trình có dấu hiệu xuống cấp, khách hàng tạo "Yêu cầu bảo hành" qua Chatbot.
- Cử kỹ thuật viên của VTSC trực tiếp xuống công trình dùng máy đo quang phổ và máy đo độ dày màng sơn để kiểm tra thực tế trong vòng 48 giờ.
- Tiến hành báo cáo giám định và lên phương án khắc phục (cung cấp sơn dặm vá hoặc bồi thường theo tỷ lệ hư hỏng nếu lỗi thuộc về chất lượng bột sơn).`
  },
  {
    LoaiChinhSach: 'VAN_CHUYEN',
    NoiDung: `### Chính sách Vận chuyển & Giao nhận VTSC

**1. Phạm vi giao hàng:**
- Giao hàng toàn quốc cho mọi đối tác B2B, Đại lý và nhà thầu.
- Hỗ trợ giao tận chân công trình hoặc kho bãi của khách hàng.

**2. Chi phí vận chuyển:**
- **Miễn phí vận chuyển (Freeship)**:
  - Cho đơn hàng từ **500kg** trở lên khu vực Nội thành TP.HCM và các tỉnh lân cận (Bình Dương, Đồng Nai, Long An).
  - Cho đơn hàng từ **2.000kg** trở lên trên toàn quốc.
- Đối với đơn hàng nhỏ hơn định mức: Khách hàng sẽ chịu chi phí vận chuyển theo biểu phí của đối tác giao hàng (Viettel Post, Giao Hàng Nhanh) hoặc theo thoả thuận với nhà xe chành.

**3. Thời gian giao hàng dự kiến:**
- Khu vực Nội thành & Lân cận: Giao trong ngày (đối với hàng có sẵn) hoặc 24h.
- Khu vực Miền Trung & Miền Bắc: Giao hàng từ 3 đến 5 ngày làm việc.
- Hàng pha chế theo công thức riêng (R&D): Cộng thêm từ 3 đến 5 ngày sản xuất.

**4. Trách nhiệm trong quá trình vận chuyển:**
- VTSC chịu hoàn toàn trách nhiệm với rủi ro hỏng hóc, móp méo thùng sơn trong suốt quá trình vận chuyển từ kho của chúng tôi đến điểm giao nhận của khách hàng.`
  },
  {
    LoaiChinhSach: 'HAU_MAI',
    NoiDung: `### Chính sách Hậu mãi & Chăm sóc Khách hàng B2B

**1. Hỗ trợ kỹ thuật trọn đời (Life-time Technical Support):**
- Mọi khách hàng mua sơn tại VTSC đều được hưởng quyền lợi tư vấn kỹ thuật trực tuyến hoặc trực tiếp (tùy quy mô) trọn đời.
- Hỗ trợ thiết lập thông số lò sấy, buồng phun, điều chỉnh súng phun sơn tĩnh điện miễn phí nhằm đạt hiệu suất bám dính cao nhất.

**2. Chính sách Chiết khấu & Tích lũy (Loyalty Program):**
- **Chiết khấu sản lượng**: Đối với các xưởng sơn, nhà thầu đạt sản lượng tiêu thụ định mức hàng quý (> 5 Tấn/Quý), VTSC sẽ áp dụng mức chiết khấu bổ sung lên đến 5% vào trực tiếp giá trị hợp đồng tiếp theo.
- **Thưởng cuối năm**: Đối tác vàng và kim cương sẽ được tham gia chương trình vinh danh, tặng thiết bị súng phun tĩnh điện cao cấp hoặc chuyến du lịch tri ân.

**3. Dịch vụ R&D và Pha màu theo yêu cầu (Color Matching):**
- Ưu tiên hỗ trợ phòng R&D phân tích test mẫu và pha trộn công thức màu sắc đặc chủng miễn phí cho đối tác chiến lược.
- Giao các mẫu test thử (Panel) trong vòng 3 ngày làm việc kể từ khi nhận được yêu cầu trên hệ thống.

**4. Kênh tiếp nhận:**
- Hệ thống hỗ trợ HelpDesk & Chatbot hoạt động 24/7.
- Đội ngũ kỹ thuật túc trực xử lý sự cố khẩn cấp về dây chuyền sơn: Hotline kỹ thuật phản hồi dưới 2 giờ đồng hồ.`
  }
];

const seedPolicies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    for (const data of policiesData) {
      const existing = await ChinhSach.findOne({ LoaiChinhSach: data.LoaiChinhSach });
      if (existing) {
        existing.NoiDung = data.NoiDung;
        await existing.save();
        console.log("Updated policy: " + data.LoaiChinhSach);
      } else {
        await ChinhSach.create(data);
        console.log("Created policy: " + data.LoaiChinhSach);
      }
    }

    console.log('Database Seeding Policies Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding policies:', error);
    process.exit(1);
  }
};

seedPolicies();
