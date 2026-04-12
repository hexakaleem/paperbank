const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { Pool } = require('pg');

console.log('DB connecting to:', process.env.DB_HOST || 'localhost', 'as user:', process.env.DB_USER || 'postgres');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'paperbank',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

let connected = false;
pool.on('connect', () => {
  if (!connected) { console.log('Connected to PostgreSQL'); connected = true; }
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// Auto-initialize tables on startup
async function initDB() {
  try {
    const initSQL = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('Database tables initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

initDB();

module.exports = pool;
