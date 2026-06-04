const { planos } = require('../services/subscription');

const plansController = {
  listar(req, res) {
    res.json(planos);
  }
};

module.exports = plansController;
