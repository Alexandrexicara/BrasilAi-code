const router = require('express').Router();
const { executarChat, listarModelos, obterModeloAtivo } = require('../../../ai/api');
const logger = require('../utils/logger');
const { authApiKey } = require('../middleware/auth');

// Aplicar autenticacao por API Key em todas as rotas /v1/
router.use('/v1', authApiKey);

// POST /v1/chat/completions - Compatível com OpenAI (suporta stream)
router.post('/v1/chat/completions', async (req, res) => {
  const inicio = performance.now();
  const { messages, model, temperature, max_tokens, tools, tool_choice, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo "messages" obrigatório' });
  }

  try {
    const modeloLimpo = (model || obterModeloAtivo()).trim();
    const resultado = await executarChat(messages, {
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
