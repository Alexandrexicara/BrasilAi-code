const bcrypt = require('bcrypt');
const db = require('./db');

async function criarAdminPadrao() {
  if (!db.pool) return;
  
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) return;

  try {
    // Verifica se já existe admin
    const existente = await db.pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existente.rows.length > 0) {
      console.log('Admin já existe');
      return;
    }

    // Cria o admin
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      ['Admin', adminEmail, hash, 'admin']
    );
    console.log(`Admin criado: ${adminEmail}`);
  } catch (err) {
    console.error('Erro ao criar admin:', err.message);
  }
}

module.exports = criarAdminPadrao;
