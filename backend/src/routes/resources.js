const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// GET /api/resources — List with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { search, type, university, exam_type, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT r.*, u.display_name as uploader_name
      FROM resources r
      JOIN users u ON r.uploader_id = u.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) FROM resources r WHERE 1=1`;
    const params = [];
    const countParams = [];
    let paramIndex = 1;
    let countParamIndex = 1;

    if (search) {
      query += ` AND (r.title ILIKE $${paramIndex} OR r.course_name ILIKE $${paramIndex})`;
      countQuery += ` AND (r.title ILIKE $${countParamIndex} OR r.course_name ILIKE $${countParamIndex})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramIndex++;
      countParamIndex++;
    }

    if (type) {
      query += ` AND r.type = $${paramIndex}`;
      countQuery += ` AND r.type = $${countParamIndex}`;
      params.push(type);
      countParams.push(type);
      paramIndex++;
      countParamIndex++;
    }

    if (university) {
      query += ` AND r.university = $${paramIndex}`;
      countQuery += ` AND r.university = $${countParamIndex}`;
      params.push(university);
      countParams.push(university);
      paramIndex++;
      countParamIndex++;
    }

    if (exam_type) {
      query += ` AND r.exam_type = $${paramIndex}`;
      countQuery += ` AND r.exam_type = $${countParamIndex}`;
      params.push(exam_type);
      countParams.push(exam_type);
      paramIndex++;
      countParamIndex++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const [resourcesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
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
    console.error('List resources error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /api/resources/universities
router.get('/universities', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT university FROM resources ORDER BY university');
    res.json(result.rows.map(r => r.university));
  } catch (err) {
    console.error('Universities error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /api/resources/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.display_name as uploader_name
       FROM resources r
       JOIN users u ON r.uploader_id = u.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get resource error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /api/resources — Upload
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, type, course_name, university, semester_year, exam_type } = req.body;

    if (!title || !type || !course_name || !university || !semester_year) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'All required fields must be filled' } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'File is required' } });
    }

    if (type === 'past_paper' && !exam_type) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Exam type is required for past papers' } });
    }

    const result = await pool.query(
      `INSERT INTO resources (uploader_id, title, type, course_name, university, semester_year, exam_type, file_path, file_name, file_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id, title, type, course_name, university, semester_year,
        type === 'past_paper' ? exam_type : null,
        req.file.filename, req.file.originalname, req.file.size
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// DELETE /api/resources/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resource = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);

    if (resource.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    }

    if (resource.rows[0].uploader_id !== req.user.id) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own resources' } });
    }

    const filePath = path.join(__dirname, '../../uploads', resource.rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM resources WHERE id = $1', [req.params.id]);

    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// GET /api/resources/:id/download
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM resources WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    }

    const resource = result.rows[0];
    const filePath = path.join(__dirname, '../../uploads', resource.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'File not found on server' } });
    }

    await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [req.params.id]);

    res.download(filePath, resource.file_name);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 10 MB limit' } });
    }
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
  }
  if (err.message === 'File type not supported') {
    return res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: 'File type not supported. Allowed: PDF, DOCX, PPTX, JPG, PNG' } });
  }
  next(err);
});

module.exports = router;
