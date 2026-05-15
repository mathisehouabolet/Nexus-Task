const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const host = process.env.MONGODB_URI.includes('@') 
      ? process.env.MONGODB_URI.split('@')[1].split('/')[0] 
      : 'Localhost';
    console.log(`Connecting to: ${host}`);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
