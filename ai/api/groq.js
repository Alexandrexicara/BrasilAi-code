const GROQ_URL = 'https://api.groq.com/openai/v1';
const LIMITE_TOKENS_PROMPT = 4500; // reservar tokens para resposta (limite free: 6000 TPM)

function obterApiKey() {
  return process.env.GROQ_API_KEY || '';
}

// Estimativa simples: ~4 caracteres por token (inglês/código)
function estimarTokens(texto) {
  if (!texto) return 0;
  return Math.ceil(texto.length / 4);
}

function truncarMensagens(mensagens, limiteTokens) {
  // Sempre mantém a primeira (system) e a última (user)
  if (mensagens.length <= 2) {
    // Se só tem 2 mensagens, trunca o conteúdo da primeira
    return mensagens.map((m, i) => {
      if (i === 0 && m.role === 'system') {
        const maxChars = limiteTokens * 4;
        if (m.content.length > maxChars) {
          return { ...m, content: m.content.substring(0, maxChars) + '\n[conteúdo truncado]' };
        }
      }
      return m;
    });
  }

  // Calcula tokens da última mensagem (sempre mantida)
  const ultima = mensagens[mensagens.length - 1];
  let tokensUsados = estimarTokens(ultima.content);
  const resultado = [ultima];

  // Adiciona mensagens anteriores de trás para frente
  for (let i = mensagens.length - 2; i >= 0; i--) {
    const msg = mensagens[i];
    const tokens = estimarTokens(msg.content);
    if (tokensUsados + tokens > limiteTokens) {
      // Se for system message, inclui truncada
      if (msg.role === 'system') {
        const restante = (limiteTokens - tokensUsados) * 4;
        if (restante > 200) {
          resultado.push({ ...msg, content: msg.content.substring(0, restante) + '\n[conteúdo truncado]' });
        }
      }
      break;
    }
    tokensUsados += tokens;
    resultado.push(msg);
  }

  // Reverte para ordem original (system primeiro)
  resultado.reverse();
  return resultado;
}

async function chatCompletion(modelo, mensagens, parametros = {}) {
  const apiKey = obterApiKey();
  if (!apiKey) throw new Error('GROQ_API_KEY não configurada');

  // Trunca mensagens se exceder limite de tokens do free tier
  const mensagensTratadas = truncarMensagens(mensagens, LIMITE_TOKENS_PROMPT);
  const maxTokensResposta = Math.min(parametros.max_tokens ?? 2048, 2048);

  const resposta = await fetch(`${GROQ_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages: mensagensTratadas,
      temperature: parametros.temperature ?? 0.2,
      max_tokens: maxTokensResposta,
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
    if (!apiKey) return { ok: false, erro: 'GROQ_API_KEY não configurada' };
    const resposta = await fetch(`${GROQ_URL}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!resposta.ok) {
      return { ok: false, erro: `Groq retornou status ${resposta.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

module.exports = { chatCompletion, listarModelos, verificarSaude };
