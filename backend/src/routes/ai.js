const router = require('express').Router();
const { executarChat, listarModelos, obterModeloAtivo } = require('../../../ai/api');
const logger = require('../utils/logger');
const { authApiKey } = require('../middleware/auth');

// Aplicar autenticacao por API Key em todas as rotas /v1/
router.use('/v1', authApiKey);

// POST /v1/chat/completions - Compatível com OpenAI
router.post('/v1/chat/completions', async (req, res) => {
  const inicio = performance.now();
  const { messages, model, temperature, max_tokens, tools, tool_choice } = req.body;

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

    // Formato OpenAI-compatible (com suporte a tool_calls)
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

    res.status(500).json({
      error: `Erro ao processar requisição: ${err.message}`,
      detail: err.message,
    });
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
