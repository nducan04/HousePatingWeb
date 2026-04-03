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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ═══════════════════════════════════════
// Routes — Module 1: Hệ thống & Xác thực
// ═══════════════════════════════════════
app.use('/api/auth', require('./routes/authRoutes'));

// ═══════════════════════════════════════
// Routes — Module 2: Danh mục & Hỗ trợ
// ═══════════════════════════════════════
app.use('/api/san-pham-son', require('./routes/sanPhamSonRoutes'));
app.use('/api/khach-hang', require('./routes/khachHangRoutes'));
app.use('/api/nhan-vien', require('./routes/nhanVienRoutes'));
app.use('/api/nha-cung-cap', require('./routes/nhaCungCapRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));

// ═══════════════════════════════════════
// Routes — Module 3: Kinh doanh & Hợp đồng
// ═══════════════════════════════════════
app.use('/api/contracts', require('./routes/contractRoutes'));

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
