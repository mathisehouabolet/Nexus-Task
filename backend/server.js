const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { isSandboxFromAddress } = require('./utils/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/backoffice', require('./routes/backofficeRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('Server is running');
});

async function start() {
  await connectDB();
  const resendFrom = process.env.RESEND_FROM || 'Nexus Task <onboarding@resend.dev>';
  if (process.env.RESEND_API_KEY && isSandboxFromAddress(resendFrom)) {
    console.warn(
      '⚠️ [Resend] Mode test actif (onboarding@resend.dev) : les invitations ne partent que vers l\'email du compte Resend. Définissez RESEND_FROM avec un domaine vérifié pour inviter n\'importe qui.'
    );
  }
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start();
