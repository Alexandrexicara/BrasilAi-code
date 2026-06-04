const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', '..', 'ai', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(level, mensagem, dados = {}) {
  const timestamp = new Date().toISOString();
  const entrada = {
    timestamp,
    level,
    mensagem,
    ...dados,
  };

  const linha = JSON.stringify(entrada);

  if (level === 'error') {
    console.error(`[${timestamp}] ${level.toUpperCase()}: ${mensagem}`);
  } else {
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${mensagem}`);
  }

  const arquivo = path.join(LOG_DIR, `api-${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFileSync(arquivo, linha + '\n');
}

function info(msg, dados) { log('info', msg, dados); }
function warn(msg, dados) { log('warn', msg, dados); }
function error(msg, dados) { log('error', msg, dados); }

function logRequisicao(dados) {
  const entrada = {
    tipo: 'requisicao',
    data: new Date().toISOString(),
    modelo: dados.modelo || 'desconhecido',
    tempo_ms: dados.tempo_ms || 0,
    tokens: dados.tokens || 0,
    status: dados.status || 'ok',
    endpoint: dados.endpoint || '/v1/chat/completions',
  };

  const linha = JSON.stringify(entrada);
  console.log(`[API] ${entrada.status.toUpperCase()} | modelo=${entrada.modelo} | ${entrada.tempo_ms}ms | ${entrada.tokens} tokens`);

  const arquivo = path.join(LOG_DIR, `requisicoes-${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFileSync(arquivo, linha + '\n');

  // Salvar no PostgreSQL (assíncrono, não bloqueia)
  try {
    const { pool } = require('../database/db');
    pool.query(
      'INSERT INTO logs_requisicoes (modelo, endpoint, tempo_ms, tokens_total, status, erro) VALUES ($1,$2,$3,$4,$5,$6)',
      [dados.modelo, dados.endpoint, dados.tempo_ms, dados.tokens, dados.status, dados.erro || null]
    ).catch(() => {});
  } catch {}
}

module.exports = { info, warn, error, logRequisicao, log };
