const jwt = require('jsonwebtoken');
const db = require('../database/db');

async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token obrigatório' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Admin apenas' });
    }

    req.userId = decoded.id;
    req.userRole = 'admin';
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = adminAuth;
