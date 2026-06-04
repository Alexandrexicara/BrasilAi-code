const GROQ_URL = 'https://api.groq.com/openai/v1';

function obterApiKey() {
  return process.env.GROQ_API_KEY || '';
}

async function chatCompletion(modelo, mensagens, parametros = {}) {
  const apiKey = obterApiKey();
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada');

  const resposta = await fetch(`${GROQ_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages: mensagens,
      temperature: parametros.temperature ?? 0.2,
      max_tokens: parametros.max_tokens ?? 4096,
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Groq ${resposta.status}: ${erro}`);
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
}

async function listarModelos() {
  const apiKey = obterApiKey();
  if (!apiKey) return [];

  const resposta = await fetch(`${GROQ_URL}/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  const dados = await resposta.json();
  return dados.data || [];
}

async function verificarSaude() {
  try {
    const apiKey = obterApiKey();
    if (!apiKey) return false;
    const resposta = await fetch(`${GROQ_URL}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

module.exports = { chatCompletion, listarModelos, verificarSaude };
