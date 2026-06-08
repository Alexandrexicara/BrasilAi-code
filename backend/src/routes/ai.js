const router = require('express').Router();
const { executarChat, listarModelos, obterModeloAtivo } = require('../../../ai/api');
const logger = require('../utils/logger');
const { authApiKey } = require('../middleware/auth');

// Aplicar autenticacao por API Key em todas as rotas /v1/
router.use('/v1', authApiKey);

// Idiomas suportados pelo sistema
const IDIOMAS = {
  'pt-BR': 'Voc\u00ea \u00e9 um assistente de programa\u00e7\u00e3o especializado. SEMPRE responda em portugu\u00eas brasileiro. Seja direto, objetivo e pr\u00e1tico. Quando gerar c\u00f3digo, comente em portugu\u00eas.',
  'en': 'You are a specialized programming assistant. ALWAYS respond in English. Be direct, objective and practical. When generating code, comment in English.',
  'es': 'Eres un asistente de programaci\u00f3n especializado. SIEMPRE responde en espa\u00f1ol. S\u00e9 directo, objetivo y pr\u00e1ctico. Cuando generes c\u00f3digo, comenta en espa\u00f1ol.',
  'fr': 'Vous \u00eates un assistant de programmation sp\u00e9cialis\u00e9. R\u00e9pondez TOUJOURS en fran\u00e7ais. Soyez direct, objectif et pratique. Lorsque vous g\u00e9n\u00e9rez du code, commentez en fran\u00e7ais.',
  'de': 'Sie sind ein spezialisierter Programmierassistent. Antworten Sie IMMER auf Deutsch. Seien Sie direkt, objektiv und praktisch. Wenn Sie Code generieren, kommentieren Sie auf Deutsch.',
  'it': 'Sei un assistente di programmazione specializzato. Rispondi SEMPRE in italiano. Sii diretto, obiettivo e pratico. Quando generi codice, commenta in italiano.',
  'ja': '\u3042\u306a\u305f\u306f\u5c02\u9580\u306e\u30d7\u30ed\u30b0\u30e9\u30df\u30f3\u30b0\u30a2\u30b7\u30b9\u30bf\u30f3\u30c8\u3067\u3059\u3002\u5e38\u306b\u65e5\u672c\u8a9e\u3067\u5fdc\u7b54\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u30b3\u30fc\u30c9\u3092\u751f\u6210\u3059\u308b\u969b\u306f\u3001\u65e5\u672c\u8a9e\u3067\u30b3\u30e1\u30f3\u30c8\u3057\u3066\u304f\u3060\u3055\u3044\u3002',
  'zh': '\u60a8\u662f\u4e13\u4e1a\u7684\u7f16\u7a0b\u52a9\u624b\u3002\u59cb\u7ec8\u7528\u4e2d\u6587\u56de\u7b54\u3002\u751f\u6210\u4ee3\u7801\u65f6\uff0c\u8bf7\u7528\u4e2d\u6587\u6ce8\u91ca\u3002',
};

// POST /v1/chat/completions - Compatível com OpenAI (suporta stream)
router.post('/v1/chat/completions', async (req, res) => {
  const inicio = performance.now();
  const { messages, model, temperature, max_tokens, tools, tool_choice, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo "messages" obrigatório' });
  }

  // Injeta system prompt de idioma baseado na preferencia do usuario
  const idioma = req.userLanguage || 'pt-BR';
  const systemPrompt = IDIOMAS[idioma] || IDIOMAS['pt-BR'];
  const mensagensComIdioma = [...messages];
  const temSystem = mensagensComIdioma.some(m => m.role === 'system');
  if (!temSystem) {
    mensagensComIdioma.unshift({ role: 'system', content: systemPrompt });
  } else {
    // Se ja tem system, adiciona instrucao de idioma ao final
    const idx = mensagensComIdioma.findIndex(m => m.role === 'system');
    mensagensComIdioma[idx] = {
      ...mensagensComIdioma[idx],
      content: mensagensComIdioma[idx].content + '\n\n' + systemPrompt,
    };
  }

  try {
    const modeloLimpo = (model || obterModeloAtivo()).trim();
    const resultado = await executarChat(mensagensComIdioma, {
      modelo: modeloLimpo,
      temperature: temperature ?? 0.2,
      max_tokens: max_tokens ?? 4096,
      tools: tools,
      tool_choice: tool_choice,
    });

    const tempoMs = Math.round(performance.now() - inicio);

    logger.logRequisicao({
      modelo: resultado.modelo,
      tempo_ms: tempoMs,
      tokens: resultado.tokens_total,
      status: 'ok',
    });

    // Modo STREAMING (SSE) - Continue e outros clients usam isso
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const chatId = `chatcmpl-${Date.now()}`;
      const conteudo = resultado.conteudo || '';

      // Envia content em chunks (simula streaming)
      const chunkSize = 20;
      for (let i = 0; i < conteudo.length; i += chunkSize) {
        const parte = conteudo.substring(i, i + chunkSize);
        const chunk = {
          id: chatId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: resultado.modelo,
          choices: [{
            index: 0,
            delta: { content: parte },
            finish_reason: null,
          }],
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      // Envia tool_calls se existir
      if (resultado.tool_calls) {
        const tcChunk = {
          id: chatId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: resultado.modelo,
          choices: [{
            index: 0,
            delta: { tool_calls: resultado.tool_calls },
            finish_reason: 'tool_calls',
          }],
        };
        res.write(`data: ${JSON.stringify(tcChunk)}\n\n`);
      }

      // Envia chunk final com finish_reason
      const finalChunk = {
        id: chatId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: resultado.modelo,
        choices: [{
          index: 0,
          delta: {},
          finish_reason: resultado.tool_calls ? 'tool_calls' : 'stop',
        }],
      };
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Modo NORMAL (non-streaming)
    const message = {
      role: 'assistant',
      content: resultado.conteudo,
    };
    if (resultado.tool_calls) {
      message.tool_calls = resultado.tool_calls;
    }

    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: resultado.modelo,
      choices: [
        {
          index: 0,
          message: message,
          finish_reason: resultado.tool_calls ? 'tool_calls' : 'stop',
        },
      ],
      usage: {
        prompt_tokens: resultado.tokens_prompt,
        completion_tokens: resultado.tokens_resposta,
        total_tokens: resultado.tokens_total,
      },
    });
  } catch (err) {
    const tempoMs = Math.round(performance.now() - inicio);
    logger.logRequisicao({
      modelo: model || obterModeloAtivo(),
      tempo_ms: tempoMs,
      status: 'error',
    });
    logger.error('Erro no chat completion', { erro: err.message });

    if (stream) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(500).json({
        error: `Erro ao processar requisição: ${err.message}`,
        detail: err.message,
      });
    }
  }
});

// GET /v1/models - Listar modelos
router.get('/v1/models', async (req, res) => {
  try {
    const modelos = await listarModelos();
    res.json({
      object: 'list',
      data: modelos.map(m => ({
        id: m.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'ollama',
      })),
    });
  } catch (err) {
    logger.error('Erro ao listar modelos', { erro: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
