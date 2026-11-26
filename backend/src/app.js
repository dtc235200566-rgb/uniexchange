const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./config/db');
const { uploadDir } = require('./middleware/upload');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const postRoutes = require('./routes/posts');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGIN || '';
  const allowedOrigins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0) {
    return { origin: true, credentials: true };
  }

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  };
}

function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadDir));

  app.get('/api/health', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
      res.status(503).json({ status: 'degraded', database: 'disconnected', error: error.message });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/listings', postRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/upload', uploadRoutes);

  // 404 handler for unknown API endpoints
  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API endpoint không tồn tại.' });
  });

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Dung lượng ảnh vượt quá giới hạn 5MB.' });
      }
      return res.status(400).json({ message: `Lỗi tải ảnh: ${err.message}` });
    }

    const status = err.statusCode || (err.message?.includes('CORS') ? 403 : 500);
    if (status >= 500) {
      console.error('[Server Error]', err);
    }

    return res.status(status).json({
      message: err.message || 'Đã xảy ra lỗi hệ thống.',
      ...(err.details ? { errors: err.details } : {}),
    });
  });

  return app;
}

module.exports = { createApp };
