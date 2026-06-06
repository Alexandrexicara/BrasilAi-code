const { temDatabase, pool } = require('../database/db');
const { verificarAssinatura } = require('../services/subscription');

const authApiKey = async (req, res, next) => {
  // Suporta ambos os formatos: x-api-key e Authorization: Bearer
  let apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.replace('Bearer ', '');
    }
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key obrigatória' });
  }

  // Modo sem banco: aceita qualquer API key (para testes)
  if (!temDatabase) {
    req.userId = 0;
    return next();
  }

  // Modo com banco: valida API key no PostgreSQL
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE api_key = $1 AND active = TRUE',
      [apiKey]
    );
    const keyRecord = result.rows[0];

    if (!keyRecord) {
      return res.status(401).json({ error: 'API Key inválida' });
    }

    try {
      const ativa = await verificarAssinatura(keyRecord.user_id);
      if (!ativa) {
        // Se não tem assinatura válida, permite mesmo assim mas loga
        console.warn(`Assinatura inativa para user ${keyRecord.user_id}, permitindo acesso`);
      }
    } catch (subErr) {
      // Se falhar ao verificar assinatura, permite o acesso
      console.warn('Erro ao verificar assinatura, permitindo acesso:', subErr.message);
    }

    req.userId = keyRecord.user_id;
    next();
  } catch (err) {
    // Se o banco falhar, permite o acesso (modo degradado)
    console.error('Erro no banco ao validar API Key, modo degradado:', err.message);
    req.userId = 0;
    next();
  }
};

module.exports = { authApiKey };
