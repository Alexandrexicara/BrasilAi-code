const Subscription = require('../models/Subscription');
const { planos } = require('../services/subscription');
const asaas = require('../services/asaas');
const db = require('../database/db');

const subscriptionController = {
  // Endpoint antigo - contratacao direta (mantido para compatibilidade)
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

  // NOVO: Criar pagamento via Asaas
  async pagar(req, res) {
    try {
      const { planIndex, method } = req.body; // method: 'pix', 'link', 'card'
      const plano = planos[planIndex];

      if (!plano) {
        return res.status(400).json({ error: 'Plano inválido' });
      }

      // Verifica se token Asaas esta configurado
      if (!process.env.ASAAS_TOKEN) {
        return res.status(500).json({ error: 'Gateway de pagamento não configurado (ASAAS_TOKEN)' });
      }

      // Busca dados do usuario
      let user;
      try {
        const userResult = await db.pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
        user = userResult.rows[0];
      } catch (dbErr) {
        return res.status(500).json({ error: `Erro no banco: ${dbErr.message}` });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Cria ou busca cliente no Asaas
      const cliente = await asaas.criarOuCriarCliente(user.name, user.email);
      const descricao = `Plano ${plano.nome} - planId ${plano.id} userId ${req.userId}`;

      if (method === 'pix') {
        // Cria cobranca PIX
        const payment = await asaas.criarCobrancaPIX(cliente.id, plano.valor, descricao);
        return res.json({
          method: 'pix',
          paymentId: payment.id,
          value: plano.valor,
          pixQrCode: payment.pixQrCode,
          status: payment.status,
        });
      }

      if (method === 'card') {
        // Cria link de pagamento (checkout Asaas com cartao + PIX + boleto)
        const link = await asaas.criarLinkPagamento(cliente.id, plano.valor, descricao);
        return res.json({
          method: 'link',
          url: link.url,
          value: plano.valor,
        });
      }

      // Default: link de pagamento (aceita PIX, cartao e boleto)
      const link = await asaas.criarLinkPagamento(cliente.id, plano.valor, descricao);
      return res.json({
        method: 'link',
        url: link.url,
        value: plano.valor,
      });

    } catch (err) {
      console.error('[Payment] Erro:', err.message);
      res.status(500).json({ error: `Erro ao criar pagamento: ${err.message}` });
    }
  },

  // Verifica status de um pagamento
  async verificarPagamento(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await asaas.buscarPagamento(paymentId);

      const aprovado = asaas.pagamentoAprovado(payment);

      res.json({
        paymentId: payment.id,
        status: payment.status,
        aprovado,
        value: payment.value,
      });
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
