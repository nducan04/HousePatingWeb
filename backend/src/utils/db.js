const mongoose = require('mongoose');

const connectDB = async (retryCount = 0) => {
  if (!process.env.MONGO_URI) {
    console.error('[Database Warning] MONGO_URI is not set in environment variables.');
    return;
  }

  try {
    const mongoOptions = {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] MongoDB connection error:`, err.message || err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[Database Warning] MongoDB disconnected. Auto-reconnecting...`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`[Database Info] MongoDB reconnected successfully.`);
    });

  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    if (error.message && error.message.includes('authentication failed')) {
      console.error('[Database Critical] Authentication failed! Check the username, password and database user permissions in your Render Environment Variables (MONGO_URI).');
    }
    // Retry in background after 6 seconds instead of crashing process immediately,
    // so the HTTP server stays alive for Render health checks and does not boot loop
    if (retryCount < 5) {
      console.log(`[Database Info] Retrying MongoDB connection in 6s (attempt ${retryCount + 1}/5)...`);
      setTimeout(() => connectDB(retryCount + 1), 6000);
    }
  }
};

module.exports = connectDB;
