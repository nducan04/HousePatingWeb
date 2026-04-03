# CHIẾN LƯỢC TOÀN DIỆN: HỆ THỐNG QUẢN TRỊ KINH DOANH SƠN TĨNH ĐIỆN VTSC

## 1. Tầm nhìn và Mục tiêu Chiến lược

Hệ thống VTSC không đơn thuần là một công cụ quản lý bán hàng (CRM/ERP), mà là một **Hệ sinh thái Số hóa Toàn diện** được thiết kế để giải quyết các "nỗi đau" (Pain Points) kinh niên của ngành sơn tĩnh điện.

### Các mục tiêu cốt lõi:

- **Minh bạch hóa Pháp lý (Web3):** Loại bỏ rủi ro gian lận hoặc sửa đổi hợp đồng sỉ thông qua công nghệ lưu trữ bất biến.
- **Tối ưu hóa R&D (Version Control):** Giảm thiểu chi phí thử mẫu bằng cách số hóa mọi phiên bản thử nghiệm, giúp tra soát và kế thừa công thức pha chế.
- **Giám sát Chủ động (Real-time Analytics):** Hệ thống cảnh báo sớm giúp PKDS duy trì vị thế đại lý cấp 1 trước các áp lực Target khắc nghiệt từ hãng AkzoNobel.

---

## 2. Kiến trúc Công nghệ Multilayer

Hệ thống được xây dựng trên nền tảng **MERN Stack** tích hợp **Web3**, tạo ra một hạ tầng lai giữa Web2 truyền thống và Web3 phi tập trung:

### Lớp Trải nghiệm (Frontend - Next.js/TypeScript)

- Sử dụng **Next.js App Router** để tối ưu hóa SEO cho các mã màu sơn và cung cấp trải nghiệm mượt mà cho cả hai luồng B2B/B2C.
- **TypeScript** đảm bảo tính toàn vẹn của dữ liệu từ khâu nhập mã màu đến khâu ký số ví MetaMask.

### Lớp Dịch vụ & Xử lý (Backend - Node.js/Express)

- Kiến trúc Stateless với **JWT (JSON Web Token)** cấp phát qua HttpOnly Cookie, đảm bảo an ninh cao nhất cho dữ liệu khách hàng dự án.
- Tích hợp **Chatbot AI** dựa trên dữ liệu kỹ thuật thực tế, hỗ trợ tư vấn thông số MSDS 24/7.

### Lớp Dữ liệu & Lưu trữ (Persistence Layer)

- **MongoDB (NoSQL):** Lưu trữ theo mô hình Document-based. Ưu thế lớn nhất là khả năng nhúng (Embedding) Chi tiết đơn hàng và Nhật ký test mẫu vào cùng một Document, giúp giảm thiểu độ trễ truy vấn (Query latency) so với SQL truyền thống.
- **IPFS (Pinata):** Lưu trữ file PDF hợp đồng gốc. Mỗi file trả về một CID (Content Identifier) duy nhất, đảm bảo nếu nội dung thay đổi, mã băm sẽ thay đổi theo.
- **Ethereum (Sepolia Testnet):** Smart Contract đóng vai trò là "Sổ cái điện tử", ghi nhận Proof-of-Signing (Bằng chứng ký kết) giữa VTSC và khách hàng.

---

## 3. Phân tích Sâu các Module Nghiệp vụ

### 3.1. Phân hệ R&D và Kiểm soát chất lượng (Module 4.0)

Đây là "Trung tâm R&D" của VTSC. Thay vì ghi chép tay, kỹ thuật viên thực hiện:

1.  **Versioning:** Mỗi lần pha mẻ (Iteration) được đánh số Version (1.0, 1.1...).
2.  **Evidence-based:** Hình ảnh mẫu thực tế được đẩy lên Cloud, URL lưu trực tiếp trong mảng `LichSuPhienBan`.
3.  **KCS Gate:** Chốt nghiệm thu kỹ thuật bằng chữ ký điện tử nội bộ trước khi chuyển sang pha thương mại.

### 3.2. Kinh doanh B2B & Hợp đồng Web3 (Module 3.0B)

Quy trình ký kết đột phá:

- **Bước 1:** Soạn thảo điều khoản sỉ trên Web2.
- **Bước 2:** Metadata hợp đồng (Hash) được gửi lên IPFS.
- **Bước 3:** MetaMask gọi hàm `signContract` trên Smart Contract.
- **Bước 4:** Giao dịch hoàn tất, hợp đồng trở thành bằng chứng thép trên Blockchain.

### 3.3. Dashboard Phân tích và Cảnh báo Target (Module 5.0)

Đây là "Bộ não" hỗ trợ ra quyết định cho Trưởng phòng Phí Bình Minh:

- **Công nghệ:** Sử dụng **Aggregation Pipeline** của MongoDB để tính toán Real-time sản lượng tiêu thụ từ Kho D3.
- **Cơ chế Check-and-Alert:** Quản trị viên chủ động kích hoạt lệnh kiểm tra. Nếu tiến độ đạt target của 6 khách hàng trọng điểm (NCC, VPIC...) rơi vào vùng nguy hiểm (< 80%), hệ thống tự động sinh PDF báo cáo sự cố để đội Sale can thiệp kịp thời.

---

## 4. Critique - Đánh giá Chuyên môn

**Điểm mạnh:**

- Sử dụng **Embedding** trong MongoDB cho các dữ liệu có tính phụ thuộc cao (Order Items, Test Logs) là cực kỳ chính xác cho hiệu năng MERN.
- Việc tách biệt **B2C (Mockup payment)** và **B2B (Web3 payment/sign)** giúp tập trung nguồn lực vào giá trị cốt lõi (Khách hàng dự án).
- Cơ chế **Human-in-the-loop** của Chatbot AI đảm bảo tính tin cậy tuyệt đối trong tư vấn kỹ thuật.

**Khuyến nghị cải tiến:**

- **Hàng tồn kho:** Cần tích hợp thêm logic **FIFO (First In, First Out)** trong Module 5.5 để quản lý hạn sử dụng của bột sơn tĩnh điện (tránh ẩm mốc/vón cục).
- **Công nợ:** Hiện tại đang theo dõi thủ công. Trong tương lai, nên bổ sung trạng thái **Escrow** (Thanh toán đảm bảo) vào Smart Contract cho các kỳ thanh toán B2B để tăng tính tự động hóa.

---

## 5. Kế hoạch Triển khai (Todo List)

### Giai đoạn 1: Thiết lập Nền tảng (Infrastructure)

- [ ] Cấu hình MongoDB Schema với các ràng buộc Reference/Embedding theo đặc tả.
- [ ] Triển khai Smart Contract VTSCEscrow trên Sepolia Testnet.
- [ ] Kết nối API Pinata phục vụ lưu trữ IPFS.

### Giai đoạn 2: Phát triển Luồng Nghiệp vụ Cốt lõi

- [ ] Hoàn thiện Module 4 (R&D Tracking) với logic Versioning.
- [ ] Tích hợp MetaMask vào luồng ký kết Hợp đồng B2B (Module 3B).
- [ ] Xây dựng Chatbot AI với Knowledge Base về 7000 mã màu AkzoNobel.

### Giai đoạn 3: Analytics & Analytics Layer

- [ ] Phát triển Aggregation Pipeline cho Dashboard 5.0.
- [ ] Hoàn thiện hệ thống Cảnh báo Target tự động.
- [ ] Kiểm thử toàn diện luồng dữ liệu (E2E Testing).
