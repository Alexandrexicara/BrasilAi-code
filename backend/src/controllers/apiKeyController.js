const ApiKey = require('../models/ApiKey');

const apiKeyController = {
  async gerar(req, res) {
    try {
      const key = await ApiKey.generate(req.userId);
      res.status(201).json(key);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async listar(req, res) {
    try {
      const keys = await ApiKey.findByUser(req.userId);
      res.json(keys);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async revogar(req, res) {
    try {
      await ApiKey.deactivate(req.params.id);
      res.json({ message: 'Chave revogada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarIdioma(req, res) {
    try {
      const { language } = req.body;
      const idiomasValidos = ['pt-BR', 'en', 'es', 'fr', 'de', 'it', 'ja', 'zh'];
      if (!idiomasValidos.includes(language)) {
        return res.status(400).json({ error: `Idioma inválido. Opções: ${idiomasValidos.join(', ')}` });
      }
      const db = require('../database/db');
      if (db.temDatabase) {
        await db.pool.query(
          'UPDATE api_keys SET language = $1 WHERE id = $2 AND user_id = $3',
          [language, req.params.id, req.userId]
        );
      }
      res.json({ message: 'Idioma atualizado', language });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = apiKeyController;
