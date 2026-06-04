const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const logger = require('./utils/logger');
const { verificarSaude } = require('../../ai/api');
const { pool, inicializarTabelas } = require('./database/db');

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir frontend (build estático)
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Rota raiz - API info (apenas se for chamada via Accept: application/json)
app.get('/api/info', (req, res) => {
  res.json({
    nome: 'Brasil CodeAI API',
    versao: '1.0.0',
    status: 'online',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login'
      },
      api: {
        chat: 'POST /v1/chat/completions (x-api-key obrigatorio)',
        modelos: 'GET /v1/models (x-api-key obrigatorio)'
      },
      apiKeys: {
        gerar: 'POST /api-keys/gerar (JWT obrigatorio)',
        listar: 'GET /api-keys (JWT obrigatorio)',
        revogar: 'DELETE /api-keys/:id (JWT obrigatorio)'
      },
      saude: 'GET /health'
    }
  });
});

// Rotas
app.use('/', require('./routes/ai'));
app.use('/auth', require('./routes/auth'));
app.use('/api-keys', require('./routes/apiKeys'));
app.use('/subscriptions', require('./routes/subscriptions'));
app.use('/plans', require('./routes/plans'));

// Health check
app.get('/health', async (req, res) => {
  const ok = await verificarSaude();
  res.json({
    status: ok ? 'ok' : 'degraded',
    provider: ok ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// SPA fallback - qualquer rota não encontrada volta para o frontend
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      nome: 'Brasil CodeAI API',
      versao: '1.0.0',
      status: 'online',
      mensagem: 'Frontend não buildado. Rode: npm run build na raiz'
    });
  }
});

app.listen(PORT, '0.0.0.0', async () => {
  logger.info(`Servidor IA iniciado na porta ${PORT}`);

  if (process.env.DATABASE_URL) {
    try {
      await inicializarTabelas();
      logger.info('PostgreSQL conectado - tabelas inicializadas');
    } catch (err) {
      logger.warn('PostgreSQL offline - rodando sem banco', { erro: err.message });
    }
  } else {
    logger.info('DATABASE_URL não configurada - rodando sem banco');
  }

  logger.info('Endpoints:');
  logger.info('  POST /v1/chat/completions');
  logger.info('  GET  /v1/models');
  logger.info('  GET  /health');  
});
