# 🏭 VTSC PaintPro - Hệ thống Quản lý Kinh doanh & ERP Sơn Tĩnh Điện

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.x-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success)

> **Đồ án Tốt nghiệp Kỹ sư Công nghệ Thông tin - Trường Đại học Hàng Hải Việt Nam**
> 
> *Đơn vị nghiên cứu thực tiễn: Công ty Cổ phần Thương mại và Dịch vụ VOSCO (VTSC).*

## 📖 Giới thiệu Dự án
**VTSC PaintPro** là một nền tảng quản trị doanh nghiệp (ERP) thu nhỏ áp dụng kiến trúc phân tán (Decoupled Architecture). Hệ thống được thiết kế chuyên biệt để số hóa toàn bộ vòng đời kinh doanh vật liệu phủ tĩnh điện: từ khâu phân phối bán lẻ (B2C), quản lý hợp đồng pha chế theo mẫu (B2B), kiểm soát tồn kho theo thời gian thực, cho đến việc giám sát hiệu suất nhân sự (KPI) và tích hợp hợp đồng điện tử trên chuỗi khối (Blockchain).

## ✨ Tính năng Cốt lõi (Key Features)

### 🔐 1. Xác thực & Phân quyền (Auth & RBAC)
* Phân quyền chặt chẽ 4 nhóm tác nhân: `Admin`, `Nhân viên`, `Khách hàng B2B`, và `Khách hàng B2C`.
* Bảo mật tối đa với cơ chế **Token Kép** (Access Token sống ngắn hạn & Refresh Token lưu trong HttpOnly Cookie).
* Bảo mật 2 lớp qua Middleware của Next.js (Frontend) và JWT Authorization của Node.js (Backend).

### 📦 2. Quản lý Sản phẩm & Kho hàng (WMS)
* Lưu trữ cơ sở dữ liệu phi quan hệ (NoSQL) với kỹ thuật **Embedded Document**, quản lý tồn kho đến từng biến thể màu sắc (SKU).
* Phân tách logic **Tồn kho khả dụng** và **Tồn kho tạm giữ** (Reserved Stock) để chống vượt hạn mức bán.
* Tự động cảnh báo khi tồn kho xuống dưới ngưỡng an toàn (Safety Stock).
* Tích hợp upload IPFS (Pinata) lưu trữ chứng từ và tự động sinh mã QR truy xuất nguồn gốc.

### 📈 3. Theo dõi Hiệu suất (Performance Tracking)
* Bảng điều khiển (Dashboard) trực quan hóa dữ liệu bằng Recharts (Radar, Bar, Pie charts).
* Tự động chấm điểm KPI nhân sự dựa trên: Số đơn hàng, số mẫu test R&D thành công, số chuyến vận chuyển và doanh thu mang lại.

### 🔗 4. Tích hợp Blockchain & Thanh toán
* Lưu trữ và mã băm (Hash) Hợp đồng nguyên tắc B2B lên mạng lưới phi tập trung (Sepolia Testnet).
* Tích hợp cổng thanh toán điện tử MoMo tự động sinh mã QR giao dịch.
* AI Chatbot hỗ trợ tư vấn khách hàng tự động.

## 🛠️ Công nghệ Sử dụng (Tech Stack)

### 💻 Frontend
* **Framework:** Next.js, React
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **State Management:** Zustand
* **Data Fetching/HTTP:** Axios (cấu hình Interceptors tự động renew token)
* **Charts:** Recharts

### ⚙️ Backend
* **Environment:** Node.js
* **Framework:** Express.js
* **Authentication:** JSON Web Tokens (JWT), Bcrypt
* **Database:** MongoDB (Mongoose ODM)
* **File Storage:** IPFS (via Pinata API)

### ⛓️ Blockchain
* **Smart Contracts:** Solidity
* **Network:** Ethereum (Sepolia Testnet)

## 📂 Cấu trúc Thư mục (Project Structure)

Dự án được cấu trúc theo mô hình Monorepo chứa các dịch vụ độc lập:

```text
📦 VTSC-PaintPro
 ┣ 📂 backend/       # API Server, Controllers, Models, Routes, Middlewares
 ┣ 📂 frontend/      # Next.js UI, Components, Pages, Stores, Utils
 ┣ 📂 blockchain/    # Solidity Smart Contracts & Deploy scripts
 ┣ 📂 plans/         # Tài liệu phân tích thiết kế, Database Schema (ERD), Data flow
 ┣ 📜 .gitattributes
 ┣ 📜 .gitignore
 ┣ 📜 implementation_plan.md
 ┣ 📜 task.md
 ┗ 📜 walkthrough.md
```

🚀 Hướng dẫn Cài đặt (Getting Started)
Yêu cầu hệ thống
Node.js >= 18.x

MongoDB Local hoặc MongoDB Atlas URI

Bước 1: Cài đặt Backend
Bash
cd backend
npm install
Tạo file .env dựa trên backend/.env.example và điền các thông số: PORT, MONGO_URI, JWT_SECRET, PINATA_API_KEY, MOMO_SECRET_KEY,...

Bash
npm run dev # Server chạy tại http://localhost:5000
Bước 2: Cài đặt Frontend
Bash
cd ../frontend
npm install
Tạo file .env cho Frontend:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

Bash
npm run dev # Giao diện chạy tại http://localhost:3000
👥 Nhóm Tác giả (Contributors)
Nguyễn Đức An - System Analyst, Database Architect & Backend Developer - @nducan04

Trần Hữu Phước - Blockchain, AI Chatbot & R&D Logic Module

Phí Minh Thành - Frontend UI/UX, B2C Workflow & Reporting Module

Dự án được xây dựng với mục đích học thuật và nghiên cứu thực tiễn tại VOSCO. Mọi tài nguyên thuộc bản quyền của Nhóm phát triển KPM63ĐH.
