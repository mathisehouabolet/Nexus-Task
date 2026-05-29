const path = require('path');
const express = require('express');
const cors = require('cors');

if (!process.env.VERCEL) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
}

function buildAllowedOrigins() {
  const origins = new Set();
  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL.trim());
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  const extra = process.env.CORS_ORIGINS || '';
  for (const o of extra.split(',')) {
    const trimmed = o.trim();
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
}

const app = express();
const allowedOrigins = buildAllowedOrigins();

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Nexus Task API' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'nexus-task-api' });
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/presence', require('./routes/presenceRoutes'));
app.use('/api/backoffice', require('./routes/backofficeRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));

module.exports = app;
