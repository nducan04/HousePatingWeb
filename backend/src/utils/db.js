const mongoose = require('mongoose');

const VERIFIED_FALLBACK_URI = 'mongodb+srv://nducan08:Anh1322@cluster0.vrs1i55.mongodb.net/vtsc_db?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async (retryCount = 0, useFallback = false) => {
  const targetUri = useFallback 
    ? VERIFIED_FALLBACK_URI 
    : (process.env.MONGO_URI || VERIFIED_FALLBACK_URI);

  try {
    const mongoOptions = {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(targetUri, mongoOptions);
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host} ${useFallback ? '(via verified fallback credentials)' : ''}`);

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
    
    // If auth failed on custom env URI, immediately attempt fallback with latest verified credentials
    if (!useFallback && error.message && error.message.includes('authentication failed')) {
      console.warn('[Database Notice] Authentication failed with current MONGO_URI. Automatically switching to latest verified credentials...');
      return connectDB(0, true);
    }

    if (retryCount < 5) {
      console.log(`[Database Info] Retrying MongoDB connection in 6s (attempt ${retryCount + 1}/5)...`);
      setTimeout(() => connectDB(retryCount + 1, useFallback), 6000);
    }
  }
};

module.exports = connectDB;
