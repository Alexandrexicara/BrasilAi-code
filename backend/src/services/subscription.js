const Subscription = require('../models/Subscription');

const planos = [
  {
    id: 1,
    nome: 'Quinzenal',
    dias: 15,
    valor: 60.00,        // R$ para Brasil
    valorUSD: 60.00,     // USD para internacional
  },
  {
    id: 2,
    nome: 'Mensal',
    dias: 30,
    valor: 100.00,       // R$ para Brasil
    valorUSD: 100.00,    // USD para internacional
  }
];

function assinaturaAtiva(dataFim) {
  return new Date(dataFim) > new Date();
}

async function verificarAssinatura(userId) {
  const sub = await Subscription.findActiveByUser(userId);
  if (!sub) return false;
  return assinaturaAtiva(sub.end_date);
}

module.exports = { planos, assinaturaAtiva, verificarAssinatura };
