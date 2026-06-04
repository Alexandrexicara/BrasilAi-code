const { executarChat } = require('../../../ai/api');
const db = require('../database/db');

const aiController = {
  async chatCompletions(req, res) {
    const { messages, model, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Campo "messages" obrigatório' });
    }

    try {
      const resultado = await executarChat(messages, {
        modelo: model,
        temperature: temperature ?? 0.2,
        max_tokens: max_tokens ?? 4096,
      });

      // Registrar uso no banco (se disponível)
      if (db.temDatabase) {
        db.pool.query(
          'INSERT INTO logs_requisicoes (modelo, endpoint, tokens_total, status) VALUES ($1, $2, $3, $4)',
          [resultado.modelo, '/v1/chat/completions', resultado.tokens_total, 'ok']
        ).catch(() => {});
      }

      res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: resultado.modelo,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: resultado.conteudo },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: resultado.tokens_prompt,
          completion_tokens: resultado.tokens_resposta,
          total_tokens: resultado.tokens_total,
        },
      });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao processar requisição', detail: err.message });
    }
  }
};

module.exports = aiController;
