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
  }
};

module.exports = apiKeyController;
