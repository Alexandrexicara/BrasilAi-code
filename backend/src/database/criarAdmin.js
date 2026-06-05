const bcrypt = require('bcrypt');
const db = require('./db');

async function criarAdminPadrao() {
  if (!db.pool) {
    console.log('Sem banco de dados - pulando criação do admin');
    return;
  }
  
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL ou ADMIN_PASSWORD não configurados');
    return;
  }

  try {
    // Verifica se já existe admin
    const existente = await db.pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existente.rows.length > 0) {
      console.log(`Admin já existe: ${adminEmail}`);
      return;
    }

    // Cria o hash da senha
    const hash = await bcrypt.hash(adminPassword, 10);
    console.log('Hash gerado com sucesso');
    
    // Insere o admin
    const result = await db.pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      ['Admin', adminEmail, hash, 'admin']
    );
    
    console.log(`✅ Admin criado: ${result.rows[0].email} (ID: ${result.rows[0].id})`);
  } catch (err) {
    console.error('❌ Erro ao criar admin:', err.message);
    console.error('Stack:', err.stack);
  }
}

module.exports = criarAdminPadrao;
