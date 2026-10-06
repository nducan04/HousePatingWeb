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

// High-speed response compression (Gzip / Brotli)
const compression = require('compression');
app.use(compression({
  threshold: 1024, // Compress responses above 1KB
  level: 6,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Performance Tracking Middleware: Adds X-Response-Time header safely before sending headers
app.use((req, res, next) => {
  const start = process.hrtime();
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const diff = process.hrtime(start);
      const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      try {
        res.setHeader('X-Response-Time', `${timeInMs}ms`);
      } catch (e) {
        // Safely ignore if already sent
      }
    }
    return originalWriteHead.apply(res, args);
  };
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://house-painting-web.vercel.app',
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/chinh-sach', require('./routes/chinhSachRoutes'));

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
const danhMucSonRouter = require('./routes/danhMucSonRoutes');

app.use('/api/hieu-suat', hieuSuatRouter);
app.use('/api/performance', hieuSuatRouter);
app.use('/api/danh-muc-son', danhMucSonRouter);

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
const chatRouter = require('./routes/chatRoutes');
app.use('/api/chat', chatRouter);

app.get('/', (req, res) => {
  res.send('VTSC PaintPro Backend API is running...');
});

// Lightweight Health Check & Ping endpoint for uptime monitors & client warm-up
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'VTSC PaintPro Backend API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});

// Start Cron Jobs
const startRiskAlertJob = require('./jobs/riskAlertJob');
startRiskAlertJob();

// Auto Keep-Alive for Free Tier (Prevents Render spin-down by self-pinging every 12 mins)
const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL;
if (keepAliveUrl && !keepAliveUrl.includes('localhost')) {
  const https = require(keepAliveUrl.startsWith('https') ? 'https' : 'http');
  const PING_INTERVAL = 12 * 60 * 1000; // 12 minutes
  setInterval(() => {
    try {
      const pingEndpoint = `${keepAliveUrl.replace(/\/$/, '')}/api/health`;
      https.get(pingEndpoint, (res) => {
        console.log(`[Keep-Alive] Pinged ${pingEndpoint} - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log(`[Keep-Alive] Ping failed:`, err.message);
      });
    } catch (e) {
      console.log(`[Keep-Alive] Ping error:`, e.message);
    }
  }, PING_INTERVAL);
  console.log(`[Keep-Alive] Self-ping scheduled every 12 mins for: ${keepAliveUrl}`);
}

const PORT = process.env.PORT || 5000;

// Setup Socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected via socket:', socket.id);

  socket.on('join_chat', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { sessionId, senderId, senderRole, senderName, content } = data;
      const PhanHoiHoTro = require('./models/PhanHoiHoTro');
      
      let nguoiTraLoi = 'KhachHang';
      if (senderRole === 'Admin' || senderRole === 'NhanVien' || senderRole === 'Director') {
        nguoiTraLoi = 'NhanVien';
      }

      const newMsg = {
        NguoiTraLoi: nguoiTraLoi,
        NoiDung: content,
        ThoiGian: new Date()
      };

      await PhanHoiHoTro.findByIdAndUpdate(sessionId, {
        $push: { LichSuTraLoi: newMsg }
      });

      // Broadcast to the room using the format frontend expects
      const broadcastMsg = {
        senderId,
        senderRole,
        senderName,
        content,
        timestamp: newMsg.ThoiGian
      };
      
      io.to(sessionId).emit('receive_message', broadcastMsg);
    } catch (error) {
      console.error('Socket send_message error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

