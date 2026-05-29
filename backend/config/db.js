const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Set it in Vercel Environment Variables or backend/.env locally.'
    );
  }

  if (!cached.promise) {
    const host = uri.includes('@') ? uri.split('@')[1].split('/')[0] : 'localhost';
    console.log(`Connecting to MongoDB: ${host}`);

    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        bufferCommands: false,
      })
      .then((conn) => {
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB error: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
