const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoOptions = {
      maxPoolSize: 25,             // Maintain up to 25 socket connections for concurrent load
      minPoolSize: 5,              // Keep 5 warm connections ready
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      autoIndex: true,             // Build schema indexes automatically in development/production
    };

    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[Database Warning] MongoDB disconnected. Waiting for auto-reconnect...`);
    });

    mongoose.connection.on('reconnected', () => {
      console.log(`[Database Info] MongoDB reconnected successfully.`);
    });

  } catch (error) {
    console.error(`[Database Critical] Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
