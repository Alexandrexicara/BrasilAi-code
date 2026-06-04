const Subscription = require('../models/Subscription');
const { planos } = require('../services/subscription');

const subscriptionController = {
  async contratar(req, res) {
    try {
      const { planIndex } = req.body;
      const plano = planos[planIndex];

      if (!plano) {
        return res.status(400).json({ error: 'Plano inválido' });
      }

      const sub = await Subscription.create(req.userId, planIndex + 1, plano.dias);
      res.status(201).json(sub);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async status(req, res) {
    try {
      const ativa = await Subscription.findActiveByUser(req.userId);
      res.json({ ativa: !!ativa, subscription: ativa || null });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = subscriptionController;
