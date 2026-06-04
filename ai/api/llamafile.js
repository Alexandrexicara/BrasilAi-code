const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'configuracoes', 'servidor.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const LLAMAFILE_URL = config.llamafile.url_base;
const TIMEOUT = config.llamafile.timeout_ms;

async function chatCompletion(modelo, mensagens, parametros = {}) {
  const url = `${LLAMAFILE_URL}/v1/chat/completions`;

  const corpo = {
    model: modelo,
    messages: mensagens,
    temperature: parametros.temperature || 0.2,
    top_p: parametros.top_p || 0.95,
    max_tokens: parametros.max_tokens || 4096,
    stream: false,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: controller.signal,
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new Error(`Llamafile respondeu ${resposta.status}: ${erro}`);
    }

    const dados = await resposta.json();
    const choice = dados.choices?.[0];

    return {
      conteudo: choice?.message?.content || '',
      modelo: dados.model || modelo,
      tokens_total: dados.usage?.total_tokens || 0,
      tokens_prompt: dados.usage?.prompt_tokens || 0,
      tokens_resposta: dados.usage?.completion_tokens || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function listarModelos() {
  const resposta = await fetch(`${LLAMAFILE_URL}/v1/models`);
  const dados = await resposta.json();
  return dados.data || [];
}

async function verificarSaude() {
  try {
    const resposta = await fetch(`${LLAMAFILE_URL}/v1/models`, {
      signal: AbortSignal.timeout(5000),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

module.exports = { chatCompletion, listarModelos, verificarSaude };
