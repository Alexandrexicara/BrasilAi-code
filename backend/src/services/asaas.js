// Servico de pagamento Asaas.com
// Suporta: PIX, Cartao de credito, Boleto
// Webhook automatico para confirmacao de pagamento

const ASAAS_URL = 'https://api.asaas.com/v3';

function getToken() {
  return process.env.ASAAS_TOKEN;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'access_token': getToken(),
  };
}

// Cria ou busca cliente no Asaas
async function criarOuCriarCliente(nome, email, cpfCnpj) {
  // Primeiro busca se ja existe
  const busca = await fetch(`${ASAAS_URL}/customers?email=${encodeURIComponent(email)}`, {
    headers: headers(),
  });
  if (busca.ok) {
    const data = await busca.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
  }

  // Cria novo cliente
  const res = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: nome,
      email: email,
      cpfCnpj: cpfCnpj || '',
      mobilePhone: '',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas: erro ao criar cliente - ${err}`);
  }

  return res.json();
}

// Cria cobranca PIX
async function criarCobrancaPIX(customerId, valor, descricao, diasExpiracao = 1) {
  const res = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: customerId,
      billingType: 'PIX',
      value: valor,
      description: descricao,
      dueDate: new Date(Date.now() + diasExpiracao * 86400000).toISOString().split('T')[0],
      externalReference: `pix-${Date.now()}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas: erro ao criar PIX - ${err}`);
  }

  const payment = await res.json();

  // Busca QR Code PIX
  const pixRes = await fetch(`${ASAAS_URL}/payments/${payment.id}/pixQrCode`, {
    headers: headers(),
  });

  if (pixRes.ok) {
    const pixData = await pixRes.json();
    payment.pixQrCode = pixData;
  }

  return payment;
}

// Cria cobranca Cartao de Credito
async function criarCobrancaCartao(customerId, valor, descricao, cartaoInfo) {
  const res = await fetch(`${ASAAS_URL}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: valor,
      description: descricao,
      dueDate: new Date().toISOString().split('T')[0],
      creditCard: cartaoInfo.creditCard,
      creditCardHolderInfo: cartaoInfo.holderInfo,
      creditCardToken: cartaoInfo.token || undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas: erro ao processar cartao - ${err}`);
  }

  return res.json();
}

// Cria link de pagamento (checkout Asaas)
async function criarLinkPagamento(customerId, valor, descricao) {
  const res = await fetch(`${ASAAS_URL}/paymentLinks`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: descricao,
      description: descricao,
      endDateLimit: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      value: valor,
      billingTypes: ['PIX', 'CREDIT_CARD', 'BOLETO'],
      chargeType: 'DETACHED',
      dueDateLimitDays: 1,
      maxInstallmentCount: 1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Asaas: erro ao criar link - ${err}`);
  }

  return res.json();
}

// Busca status de pagamento
async function buscarPagamento(paymentId) {
  const res = await fetch(`${ASAAS_URL}/payments/${paymentId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    throw new Error(`Asaas: erro ao buscar pagamento`);
  }

  return res.json();
}

// Confirma se pagamento foi aprovado
function pagamentoAprovado(payment) {
  const statusAprovados = ['CONFIRMED', 'RECEIVED', 'SENT'];
  return statusAprovados.includes(payment.status);
}

module.exports = {
  criarOuCriarCliente,
  criarCobrancaPIX,
  criarCobrancaCartao,
  criarLinkPagamento,
  buscarPagamento,
  pagamentoAprovado,
};
