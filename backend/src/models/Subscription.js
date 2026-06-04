const db = require('../database/db');

const Subscription = {
  async create(userId, planId, days) {
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const result = await db.pool.query(
      'INSERT INTO subscriptions (user_id, plan_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, planId, start, end]
    );
    return result.rows[0];
  },

  async findByUser(userId) {
    const result = await db.pool.query(
      `SELECT s.*, p.name as plan_name, p.days, p.price 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.id 
       WHERE s.user_id = $1 
       ORDER BY s.start_date DESC`,
      [userId]
    );
    return result.rows;
  },

  async findActiveByUser(userId) {
    const result = await db.pool.query(
      `SELECT s.*, p.name as plan_name, p.days, p.price 
       FROM subscriptions s 
       JOIN plans p ON s.plan_id = p.id 
       WHERE s.user_id = $1 AND s.active = TRUE AND s.end_date > NOW()`,
      [userId]
    );
    return result.rows[0];
  },

  async desativarExpiradas() {
    await db.pool.query(
      "UPDATE subscriptions SET active = FALSE WHERE active = TRUE AND end_date < NOW()"
    );
  }
};

module.exports = Subscription;
