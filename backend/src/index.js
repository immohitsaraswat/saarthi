require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Route imports
const authRoutes      = require('./routes/auth');
const projectRoutes   = require('./routes/projects');
const taskRoutes      = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes        = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 8000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile/curl) or matching origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', app: 'Saarthi API', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/projects/:id/tasks', taskRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai',        aiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'An unexpected error occurred.', error: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Saarthi API running on port ${PORT}`);
});

module.exports = app;
