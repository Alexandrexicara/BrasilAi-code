// Webhooks de pagamento - Asaas.com
// Recebe confirmacoes automaticas de pagamento

const router = require('express').Router();
const db = require('../database/db');

// POST /webhooks/asaas - Recebe notificacoes do Asaas
router.post('/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body;

    console.log(`[Asaas Webhook] Evento: ${event}`, JSON.stringify(req.body, null, 2));

    // Eventos de pagamento confirmado
    const eventosPagos = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];

    if (eventosPagos.includes(event) && payment) {
      const paymentId = payment.id;
      const customerId = payment.customer;
      const valor = payment.value;
      const descricao = payment.description || '';

      // Extrai planId da descricao (formato: "Plano X - userId Y")
      const match = descricao.match(/userId\s+(\d+)/i);
      const planIdMatch = descricao.match(/planId\s+(\d+)/i);

      if (match && planIdMatch && db.temDatabase) {
        const userId = parseInt(match[1]);
        const planId = parseInt(planIdMatch[1]);

        // Busca dados do plano
        const planResult = await db.pool.query('SELECT * FROM plans WHERE id = $1', [planId]);
        const plan = planResult.rows[0];

        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + plan.days);

          // Desativa assinaturas anteriores e ativa nova
          await db.pool.query(
            'UPDATE subscriptions SET active = FALSE WHERE user_id = $1',
            [userId]
          );
          await db.pool.query(
            `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, active)
             VALUES ($1, $2, $3, $4, TRUE)`,
            [userId, planId, startDate, endDate]
          );

          console.log(`[Asaas] Assinatura ativada: user=${userId}, plan=${planId}, valor=${valor}`);
        }
      } else {
        console.log(`[Asaas] Webhook recebido mas nao foi possivel extrair userId/planId da descricao`);
      }
    }

    // Sempre responde 200 para o Asaas nao reenviar
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Asaas Webhook] Erro:', err.message);
    // Responde 200 mesmo com erro para nao ficar reenviando
    res.status(200).json({ received: true, error: err.message });
  }
});

module.exports = router;
