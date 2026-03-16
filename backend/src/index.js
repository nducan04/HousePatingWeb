const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./utils/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/rd', require('./routes/rdRoutes'));
app.use('/api/ipfs', require('./routes/ipfsRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/targets', require('./routes/targetRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
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
