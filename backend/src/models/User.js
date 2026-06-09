const db = require('../database/db');
const bcrypt = require('bcrypt');

const User = {
  async create(name, email, password, cpf_cnpj = null) {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.pool.query(
      'INSERT INTO users (name, email, password_hash, cpf_cnpj) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at',
      [name, email, hash, cpf_cnpj]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await db.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
};

module.exports = User;
