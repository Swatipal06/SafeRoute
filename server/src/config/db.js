const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Configure public DNS servers to prevent querySrv ECONNREFUSED issues on Windows / local ISPs
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('⚠️ Could not set custom DNS servers:', dnsErr.message);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('⚠️ Note: Server is running with degraded database functionality. Please check your MongoDB Atlas cluster status, Network Access, or DNS configuration.');
  }
};

module.exports = connectDB;

