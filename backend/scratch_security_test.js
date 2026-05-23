const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const TaiKhoan = require('./src/models/TaiKhoan');
const khoRoutes = require('./src/routes/khoRoutes');
const congThucRoutes = require('./src/routes/congThucRoutes');
const rdRoutes = require('./src/routes/rdRoutes');
const taiKhoanRoutes = require('./src/routes/taiKhoanRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const productionRoutes = require('./src/routes/productionRoutes');
const packagingRoutes = require('./src/routes/packagingRoutes');

async function testSecurity() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Find a B2B or B2C customer
  let customer = await TaiKhoan.findOne({ VaiTro: 'KhachHangB2B' });
  if (!customer) {
    customer = await TaiKhoan.findOne({ VaiTro: 'KhachHangB2C' });
  }
  if (!customer) {
    customer = new TaiKhoan({
      TenDangNhap: 'test_customer_' + Date.now(),
      MatKhau: 'Password123',
      VaiTro: 'KhachHangB2B',
      TrangThai: true
    });
    await customer.save();
  }

  // Generate token
  const customerToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create local Express app
  const app = express();
  app.use(express.json());
  
  // Mount routes
  app.use('/api/kho', khoRoutes);
  app.use('/api/formulas', congThucRoutes);
  app.use('/api/rd-tracking', rdRoutes);
  app.use('/api/tai-khoan', taiKhoanRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/production', productionRoutes);
  app.use('/api/packaging', packagingRoutes);

  app.use((err, req, res, next) => {
    res.status(500).json({ success: false, error: err.message });
  });

  const server = app.listen(9876, async () => {
    console.log('Test server running on port 9876');
    const axios = require('axios');
    const client = axios.create({
      baseURL: 'http://localhost:9876/api',
      headers: { Authorization: `Bearer ${customerToken}` },
      validateStatus: () => true
    });

    console.log('\n--- TESTING KHO ENDPOINTS FOR CUSTOMER (EXPECTED: 403) ---');
    const tests = [
      { method: 'get', url: '/kho' },
      { method: 'get', url: '/kho/kiem-kho' },
      { method: 'get', url: '/kho/nguyen-vat-lieu' },
      { method: 'get', url: '/kho/nhap-xuat' },
      { method: 'post', url: '/kho/nhap-xuat', data: { MaPhieu: 'TEST-123', LoaiPhieu: 'XUAT', ChiTiet: [] } },
      { method: 'delete', url: '/kho/nguyen-vat-lieu/123456789012345678901234' }
    ];

    for (const t of tests) {
      const res = await client[t.method](t.url, t.data);
      console.log(`[${t.method.toUpperCase()} ${t.url}] Status: ${res.status}, Response:`, JSON.stringify(res.data));
    }

    console.log('\n--- TESTING FORMULA ENDPOINTS FOR CUSTOMER (EXPECTED: 403) ---');
    const formulaTests = [
      { method: 'get', url: '/formulas' },
      { method: 'post', url: '/formulas', data: { TenCongThuc: 'Fake Formula' } },
      { method: 'post', url: '/formulas/123456789012345678901234/calculate', data: { targetKg: 100 } }
    ];

    for (const t of formulaTests) {
      const res = await client[t.method](t.url, t.data);
      console.log(`[${t.method.toUpperCase()} ${t.url}] Status: ${res.status}, Response:`, JSON.stringify(res.data));
    }

    console.log('\n--- TESTING RD ENDPOINTS FOR CUSTOMER (EXPECTED: 403) ---');
    const rdTests = [
      { method: 'post', url: '/rd-tracking/123456789012345678901234/versions', data: { result: 'pass' } },
      { method: 'patch', url: '/rd-tracking/123456789012345678901234/sign-kcs' }
    ];

    for (const t of rdTests) {
      const res = await client[t.method](t.url, t.data);
      console.log(`[${t.method.toUpperCase()} ${t.url}] Status: ${res.status}, Response:`, JSON.stringify(res.data));
    }

    console.log('\n--- TESTING NEWLY PROTECTED ENDPOINTS FOR CUSTOMER (EXPECTED: 403) ---');
    const newTests = [
      { method: 'get', url: '/tai-khoan' },
      { method: 'get', url: '/dashboard/stats' },
      { method: 'get', url: '/reports/revenue' },
      { method: 'get', url: '/production' },
      { method: 'get', url: '/packaging' }
    ];

    for (const t of newTests) {
      const res = await client[t.method](t.url, t.data);
      console.log(`[${t.method.toUpperCase()} ${t.url}] Status: ${res.status}, Response:`, JSON.stringify(res.data));
    }

    server.close(() => {
      console.log('\nTest server closed. Exiting.');
      process.exit(0);
    });
  });
}

testSecurity().catch(err => {
  console.error(err);
  process.exit(1);
});
