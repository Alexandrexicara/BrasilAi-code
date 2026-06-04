const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'configuracoes', 'servidor.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const OLLAMA_URL = config.ollama.url_base;
const TIMEOUT = config.ollama.timeout_ms;

async function chatCompletion(modelo, mensagens, parametros = {}) {
  const url = `${OLLAMA_URL}/api/chat`;

  const corpo = {
    model: modelo,
    messages: mensagens,
    stream: false,
    options: {
      temperature: parametros.temperature || 0.2,
      top_p: parametros.top_p || 0.95,
      num_predict: parametros.max_tokens || 4096,
    },
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
      throw new Error(`Ollama respondeu ${resposta.status}: ${erro}`);
    }

    const dados = await resposta.json();
    return {
      conteudo: dados.message?.content || '',
      modelo: dados.model || modelo,
      tokens_total: dados.eval_count + dados.prompt_eval_count || 0,
      tokens_prompt: dados.prompt_eval_count || 0,
      tokens_resposta: dados.eval_count || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function listarModelos() {
  const resposta = await fetch(`${OLLAMA_URL}/api/tags`);
  const dados = await resposta.json();
  return dados.models || [];
}

async function verificarSaude() {
  try {
    const resposta = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return resposta.ok;
  } catch {
    return false;
  }
}

module.exports = { chatCompletion, listarModelos, verificarSaude };
