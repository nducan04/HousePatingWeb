const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow any localhost or 127.0.0.1 origins for development
    if (
      allowedOrigins.includes(origin) || 
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from 'uploads' directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ═══════════════════════════════════════
// Routes — Module 1: Hệ thống & Xác thực
// ═══════════════════════════════════════
app.use('/api/auth', require('./routes/authRoutes'));

// ═══════════════════════════════════════
// Routes — Module 2: Danh mục & Hỗ trợ
// ═══════════════════════════════════════
app.use('/api/san-pham-son', require('./routes/sanPhamSonRoutes'));
app.use('/api/kho', require('./routes/khoRoutes'));
app.use('/api/khach-hang', require('./routes/khachHangRoutes'));
app.use('/api/nhan-vien', require('./routes/nhanVienRoutes'));
app.use('/api/nha-cung-cap', require('./routes/nhaCungCapRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/tai-khoan', require('./routes/taiKhoanRoutes'));

// ═══════════════════════════════════════
// Routes — Module 3: Kinh doanh & Hợp đồng
// ═══════════════════════════════════════
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/tin-tuc', require('./routes/tinTucRoutes'));
app.use('/api/don-hang', require('./routes/donHangRoutes'));
app.use('/api/khuyen-mai', require('./routes/khuyenMaiRoutes'));
app.use('/api/gio-hang', require('./routes/gioHangRoutes'));
app.use('/api/thanh-toan', require('./routes/paymentRoutes'));
app.use('/api/van-chuyen', require('./routes/vanChuyenRoutes'));
app.use('/api/hieu-suat', require('./routes/hieuSuatRoutes'));
app.use('/api/doi-tra', require('./routes/doiTraRoutes'));
app.use('/api/bao-hanh', require('./routes/baoHanhRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/rd-tracking', require('./routes/rdRoutes'));
app.use('/api/formulas', require('./routes/congThucRoutes'));
app.use('/api/packaging', require('./routes/packagingRoutes'));
app.use('/api/production', require('./routes/productionRoutes'));

// ═══════════════════════════════════════
// Routes — Legacy (giữ lại cho tương thích)
// ═══════════════════════════════════════
app.use('/api/ipfs', require('./routes/ipfsRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));

app.get('/', (req, res) => {
  res.send('VTSC PaintPro Backend API is running...');
});

// Start Cron Jobs
const startRiskAlertJob = require('./jobs/riskAlertJob');
startRiskAlertJob();

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));