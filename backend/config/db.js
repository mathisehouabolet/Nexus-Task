const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is missing. Create backend/.env or set MONGODB_URI in the environment.');
    }

    const host = uri.includes('@')
      ? uri.split('@')[1].split('/')[0]
      : 'localhost';
    console.log(`Connecting to: ${host}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
