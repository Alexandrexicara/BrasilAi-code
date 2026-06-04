const db = require('../database/db');
const crypto = require('crypto');

const ApiKey = {
  async generate(userId) {
    const key = 'sk-' + crypto.randomBytes(24).toString('hex');
    const result = await db.pool.query(
      'INSERT INTO api_keys (user_id, api_key) VALUES ($1, $2) RETURNING *',
      [userId, key]
    );
    return result.rows[0];
  },

  async findByKey(apiKey) {
    const result = await db.pool.query(
      'SELECT * FROM api_keys WHERE api_key = $1 AND active = TRUE',
      [apiKey]
    );
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await db.pool.query(
      'SELECT id, api_key, active FROM api_keys WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  },

  async deactivate(id) {
    await db.pool.query('UPDATE api_keys SET active = FALSE WHERE id = $1', [id]);
  }
};

module.exports = ApiKey;
