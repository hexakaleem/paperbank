require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (Nginx in front on EC2)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/mcq-sets', require('./routes/mcq'));

// GET /api/my/uploads — Current user's uploads
app.get('/api/my/uploads', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [resourcesResult, countResult] = await Promise.all([
      pool.query(
        `SELECT r.*, u.display_name as uploader_name
         FROM resources r
         JOIN users u ON r.uploader_id = u.id
         WHERE r.uploader_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, parseInt(limit), offset]
      ),
      pool.query('SELECT COUNT(*) FROM resources WHERE uploader_id = $1', [req.user.id])
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      resources: resourcesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('My uploads error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Paper Bank API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
