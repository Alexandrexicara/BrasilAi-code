const { Pool } = require('pg');

const temDatabase = !!process.env.DATABASE_URL;

const pool = temDatabase
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon') || process.env.DATABASE_URL?.includes('render')
        ? { rejectUnauthorized: false }
        : false,
    })
  : null;

async function executarSQL(sql) {
  if (!pool) throw new Error('DATABASE_URL não configurada');
  const client = await pool.connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}

async function inicializarTabelas() {
  if (!pool) return;
  const fs = require('fs');
  const path = require('path');
  const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
  await pool.query(sql);
}

module.exports = { pool, temDatabase, executarSQL, inicializarTabelas };
