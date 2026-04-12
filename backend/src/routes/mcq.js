const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/mcq-sets — List all MCQ sets
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT ms.*, u.display_name as creator_name,
        (SELECT COUNT(*) FROM mcq_questions mq WHERE mq.mcq_set_id = ms.id) as question_count
      FROM mcq_sets ms
      JOIN users u ON ms.creator_id = u.id
      WHERE 1=1
    `;
    let countQuery = `SELECT COUNT(*) FROM mcq_sets ms WHERE 1=1`;
    const params = [];
    const countParams = [];
    let paramIndex = 1;
    let countParamIndex = 1;

    if (search) {
      query += ` AND (ms.title ILIKE $${paramIndex} OR ms.course_name ILIKE $${paramIndex})`;
      countQuery += ` AND (ms.title ILIKE $${countParamIndex} OR ms.course_name ILIKE $${countParamIndex})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramIndex++;
      countParamIndex++;
    }

    query += ` ORDER BY ms.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const [setsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      mcqSets: setsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('List MCQ sets error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /api/mcq-sets — Create MCQ set with questions
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, course_name, questions } = req.body;

    if (!title || !course_name) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Title and course name are required' } });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'At least one question is required' } });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: `All fields are required for Question ${i + 1}` }
        });
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: `Invalid correct answer for Question ${i + 1}` }
        });
      }
    }

    await client.query('BEGIN');

    const setResult = await client.query(
      'INSERT INTO mcq_sets (creator_id, title, course_name) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, title, course_name]
    );

    const mcqSet = setResult.rows[0];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await client.query(
        `INSERT INTO mcq_questions (mcq_set_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [mcqSet.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, i]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ ...mcqSet, question_count: questions.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create MCQ set error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  } finally {
    client.release();
  }
});

// GET /api/mcq-sets/:id — Get MCQ set with questions
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const setResult = await pool.query(
      `SELECT ms.*, u.display_name as creator_name
       FROM mcq_sets ms
       JOIN users u ON ms.creator_id = u.id
       WHERE ms.id = $1`,
      [req.params.id]
    );

    if (setResult.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'MCQ set not found' } });
    }

    const questionsResult = await pool.query(
      'SELECT id, question_text, option_a, option_b, option_c, option_d, order_index FROM mcq_questions WHERE mcq_set_id = $1 ORDER BY order_index',
      [req.params.id]
    );

    res.json({
      ...setResult.rows[0],
      questions: questionsResult.rows
    });
  } catch (err) {
    console.error('Get MCQ set error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

// POST /api/mcq-sets/:id/attempt — Submit quiz attempt
router.post('/:id/attempt', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Answers are required' } });
    }

    const questionsResult = await pool.query(
      'SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_index FROM mcq_questions WHERE mcq_set_id = $1 ORDER BY order_index',
      [req.params.id]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'MCQ set not found' } });
    }

    const questions = questionsResult.rows;
    let score = 0;
    const breakdown = questions.map(q => {
      const userAnswer = answers[q.id] || null;
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score++;
      return {
        question_id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        user_answer: userAnswer,
        is_correct: isCorrect
      };
    });

    await pool.query(
      'INSERT INTO quiz_attempts (user_id, mcq_set_id, score, total, answers) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, req.params.id, score, questions.length, JSON.stringify(answers)]
    );

    res.json({
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      breakdown
    });
  } catch (err) {
    console.error('Submit attempt error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
