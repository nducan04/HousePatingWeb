const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./utils/db');
// Trigger nodemon restart after port 5000 release

// Load env vars
dotenv.config({ override: true });

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://house-pating-web.vercel.app',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
const authRouter = require('./routes/authRoutes');
app.use('/api/auth', authRouter);

// ═══════════════════════════════════════
// Routes — Module 2: Danh mục & Hỗ trợ
// ═══════════════════════════════════════
const sanPhamSonRouter = require('./routes/sanPhamSonRoutes');
app.use('/api/san-pham-son', sanPhamSonRouter);
app.use('/api/products', sanPhamSonRouter);

const khoRouter = require('./routes/khoRoutes');
app.use('/api/kho', khoRouter);
app.use('/api/inventory', khoRouter);

const khachHangRouter = require('./routes/khachHangRoutes');
app.use('/api/khach-hang', khachHangRouter);
app.use('/api/partners', khachHangRouter);

const nhanVienRouter = require('./routes/nhanVienRoutes');
app.use('/api/nhan-vien', nhanVienRouter);
app.use('/api/staff', nhanVienRouter);

const nhaCungCapRouter = require('./routes/nhaCungCapRoutes');
app.use('/api/nha-cung-cap', nhaCungCapRouter);
app.use('/api/suppliers', nhaCungCapRouter);

app.use('/api/chatbot', require('./routes/chatbotRoutes'));

const taiKhoanRouter = require('./routes/taiKhoanRoutes');
app.use('/api/tai-khoan', taiKhoanRouter);
app.use('/api/accounts', taiKhoanRouter);

// ═══════════════════════════════════════
// Routes — Module 3: Kinh doanh & Hợp đồng
// ═══════════════════════════════════════
app.use('/api/contracts', require('./routes/contractRoutes'));

const tinTucRouter = require('./routes/tinTucRoutes');
app.use('/api/tin-tuc', tinTucRouter);
app.use('/api/news', tinTucRouter);

const donHangRouter = require('./routes/donHangRoutes');
app.use('/api/don-hang', donHangRouter);
app.use('/api/orders', donHangRouter);

const khuyenMaiRouter = require('./routes/khuyenMaiRoutes');
app.use('/api/khuyen-mai', khuyenMaiRouter);
app.use('/api/promotions', khuyenMaiRouter);

const gioHangRouter = require('./routes/gioHangRoutes');
app.use('/api/gio-hang', gioHangRouter);
app.use('/api/cart', gioHangRouter);

const paymentRouter = require('./routes/paymentRoutes');
app.use('/api/thanh-toan', paymentRouter);
app.use('/api/payments', paymentRouter);

const vanChuyenRouter = require('./routes/vanChuyenRoutes');
app.use('/api/van-chuyen', vanChuyenRouter);
app.use('/api/shipping', vanChuyenRouter);

const hieuSuatRouter = require('./routes/hieuSuatRoutes');
app.use('/api/hieu-suat', hieuSuatRouter);
app.use('/api/performance', hieuSuatRouter);

const doiTraRouter = require('./routes/doiTraRoutes');
app.use('/api/doi-tra', doiTraRouter);
app.use('/api/returns', doiTraRouter);

const baoHanhRouter = require('./routes/baoHanhRoutes');
app.use('/api/bao-hanh', baoHanhRouter);
app.use('/api/warranties', baoHanhRouter);

app.use('/api/dashboard', require('./routes/dashboardRoutes'));

const reportRouter = require('./routes/reportRoutes');
app.use('/api/reports', reportRouter);
app.use('/api/bao-cao', reportRouter);

const rdRouter = require('./routes/rdRoutes');
app.use('/api/rd-tracking', rdRouter);

const congThucRouter = require('./routes/congThucRoutes');
app.use('/api/formulas', congThucRouter);

const packagingRouter = require('./routes/packagingRoutes');
app.use('/api/packaging', packagingRouter);

const productionRouter = require('./routes/productionRoutes');
app.use('/api/production', productionRouter);

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
