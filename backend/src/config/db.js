const mongoose = require('mongoose');
const dns = require('dns');

// If local DNS fails to resolve SRV records (e.g. 127.0.0.1 stub resolver returning ECONNREFUSED), set default servers to Google DNS
try {
  const currentServers = dns.getServers();
  if (currentServers.length === 0 || currentServers.includes('127.0.0.1') || currentServers.includes('::1')) {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  }
} catch (e) {
  // Ignore DNS setServers error if environment restricts it
}

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');
  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.name);
}

module.exports = connectDB;

