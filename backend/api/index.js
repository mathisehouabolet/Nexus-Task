const serverless = require('serverless-http');
const app = require('../app');
const connectDB = require('../config/db');

const handler = serverless(app, {
  binary: false,
});

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        message: 'Base de données indisponible. Vérifiez MONGODB_URI sur Vercel.',
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    );
    return;
  }

  return handler(req, res);
};
