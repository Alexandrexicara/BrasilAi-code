const db = require('../database/db');

const adminController = {
  // Dashboard com resumo geral
  async dashboard(req, res) {
    try {
      const stats = await db.pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_usuarios,
          (SELECT COUNT(*) FROM subscriptions WHERE active = true) as assinaturas_ativas,
          (SELECT COUNT(*) FROM api_keys WHERE active = true) as api_keys_ativas,
          (SELECT COALESCE(SUM(pl.price), 0) FROM subscriptions sub JOIN plans pl ON sub.plan_id = pl.id WHERE sub.active = true) as receita_mensal
      `);
      
      res.json(stats.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Listar todos os usuários
  async usuarios(req, res) {
    try {
      const result = await db.pool.query(`
        SELECT 
          u.id, u.name, u.email, u.role, u.created_at,
          s.end_date as vencimento,
          p.name as plano,
          (SELECT COUNT(*) FROM api_keys WHERE user_id = u.id AND active = true) as api_keys
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.active = true
        LEFT JOIN plans p ON s.plan_id = p.id
        ORDER BY u.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Listar assinaturas
  async assinaturas(req, res) {
    try {
      const result = await db.pool.query(`
        SELECT 
          s.id, s.start_date, s.end_date, s.active,
          u.name as usuario, u.email,
          p.name as plano, p.price,
          CASE 
            WHEN s.end_date < NOW() THEN 'vencido'
            WHEN s.end_date < NOW() + INTERVAL '7 days' THEN 'vence_logo'
            ELSE 'ativo'
          END as status
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        JOIN plans p ON s.plan_id = p.id
        ORDER BY s.end_date ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Logs de requisições IA
  async logs(req, res) {
    try {
      const result = await db.pool.query(`
        SELECT * FROM logs_requisicoes 
        ORDER BY created_at DESC 
        LIMIT 100
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Atualizar role de usuário
  async atualizarRole(req, res) {
    try {
      const { userId, role } = req.body;
      await db.pool.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [role, userId]
      );
      res.json({ message: 'Role atualizado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Desativar usuário
  async desativarUsuario(req, res) {
    try {
      const { userId } = req.body;
      await db.pool.query('UPDATE users SET role = $1 WHERE id = $2', ['banned', userId]);
      await db.pool.query('UPDATE subscriptions SET active = false WHERE user_id = $1', [userId]);
      await db.pool.query('UPDATE api_keys SET active = false WHERE user_id = $1', [userId]);
      res.json({ message: 'Usuário desativado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Listar todas as API Keys
  async listarApiKeys(req, res) {
    try {
      const result = await db.pool.query(`
        SELECT 
          ak.id, ak.api_key, ak.name, ak.active, ak.created_at,
          u.name as usuario, u.email
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        ORDER BY ak.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Gerar API Key para usuário
  async gerarApiKey(req, res) {
    try {
      const { userId, name } = req.body;
      
      // Verifica se usuário existe
      const user = await db.pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (!user.rows[0]) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Gera a key
      const apiKey = 'sk-' + require('crypto').randomBytes(32).toString('hex');
      const result = await db.pool.query(
        'INSERT INTO api_keys (user_id, api_key, name) VALUES ($1, $2, $3) RETURNING *',
        [userId, apiKey, name || 'Key Admin']
      );
      res.json({ api_key: result.rows[0].api_key });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = adminController;
