const Subscription = require('../models/Subscription');

const planos = [
  {
    nome: 'Quinzenal',
    dias: 15,
    valor: 60.00
  },
  {
    nome: 'Mensal',
    dias: 30,
    valor: 100.00
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
