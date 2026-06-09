import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const IDIOMAS = [
  { code: 'pt-BR', label: '🇧🇷 Português' },
  { code: 'en', label: '🇺🇸 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'zh', label: '🇨🇳 中文' },
];

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixModal, setPixModal] = useState(null);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/plans').then(({ data }) => setPlans(data));
  }, []);

  const handlePayPIX = async (planIndex) => {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.post('/subscriptions/pay', { planIndex, method: 'pix' });
      setPixModal(data);
      // Inicia polling para verificar pagamento
      startPolling(data.paymentId);
    } catch (err) {
      setMessage('❌ Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePayLink = async (planIndex) => {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.post('/subscriptions/pay', { planIndex, method: 'link' });
      window.open(data.url, '_blank');
      setMessage('🔗 Link de pagamento aberto em nova aba!');
    } catch (err) {
      setMessage('❌ Erro: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (paymentId) => {
    setChecking(true);
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/subscriptions/payment/${paymentId}`);
        if (data.aprovado) {
          clearInterval(interval);
          setChecking(false);
          setPixModal(null);
          setMessage('✅ Pagamento confirmado! Redirecionando...');
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch {
        // ignora erro de polling
      }
    }, 5000);

    // Para polling apos 10 minutos
    setTimeout(() => {
      clearInterval(interval);
      setChecking(false);
    }, 600000);
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h2>Brasil Code AI</h2>
        <div>
          <Link to="/dashboard" style={styles.link}>← Voltar</Link>
        </div>
      </nav>

      <h1 style={styles.title}>Escolha seu Plano</h1>
      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.grid}>
        {(plans.length > 0 ? plans : [
          { name: 'Quinzenal', days: 15, price: 60 },
          { name: 'Mensal', days: 30, price: 100 },
        ]).map((plan, index) => (
          <div key={index} style={index === 1 ? styles.cardHighlight : styles.card}>
            {index === 1 && <span style={styles.badge}>⭐ Mais Popular</span>}
            <h3>{plan.name || plan.nome}</h3>
            <p style={styles.days}>{plan.days || plan.dias} dias de acesso</p>
            <p style={styles.price}>R$ {(plan.price || plan.valor || 60).toFixed(2)}</p>
            <p style={styles.priceUSD}>${(plan.valorUSD || plan.price || 60).toFixed(2)} USD</p>

            <div style={styles.buttons}>
              <button
                onClick={() => handlePayPIX(index)}
                style={styles.btnPix}
                disabled={loading}
              >
                ⚡ PIX
              </button>
              <button
                onClick={() => handlePayLink(index)}
                style={styles.btnCard}
                disabled={loading}
              >
                💳 Cartão / Boleto
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal PIX */}
      {pixModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>⚡ Pagamento via PIX</h3>
            <p style={styles.modalValue}>Valor: <strong>R$ {pixModal.value?.toFixed(2)}</strong></p>
            {pixModal.pixQrCode?.encodedImage && (
              <img
                src={`data:image/png;base64,${pixModal.pixQrCode.encodedImage}`}
                alt="QR Code PIX"
                style={styles.qrCode}
              />
            )}
            {pixModal.pixQrCode?.payload && (
              <div style={styles.pixCode}>
                <p style={styles.pixCodeLabel}>Ou copie o código PIX:</p>
                <code style={styles.pixCodeText}>{pixModal.pixQrCode.payload}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(pixModal.pixQrCode.payload)}
                  style={styles.btnCopy}
                >
                  📋 Copiar Código
                </button>
              </div>
            )}
            <p style={styles.checking}>
              {checking ? '⏳ Aguardando pagamento...' : 'Escaneie o QR Code com seu app do banco'}
            </p>
            <button onClick={() => { setPixModal(null); setChecking(false); }} style={styles.btnClose}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif', background: '#1c1c1c', minHeight: '100vh', color: '#e0e0e0' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #FF6600', paddingBottom: '12px' },
  link: { color: '#FF6600', textDecoration: 'none', fontWeight: 'bold' },
  title: { textAlign: 'center', marginBottom: '30px', color: '#FF6600' },
  message: { textAlign: 'center', padding: '12px', background: '#2a2a2a', borderRadius: '8px', marginBottom: '16px' },
  grid: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  card: { padding: '30px', background: '#2a2a2a', border: '1px solid #555', borderRadius: '12px', textAlign: 'center', minWidth: '280px', maxWidth: '350px' },
  cardHighlight: { padding: '30px', background: '#2a2a2a', border: '3px solid #FF6600', borderRadius: '12px', textAlign: 'center', minWidth: '280px', maxWidth: '350px', position: 'relative' },
  badge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#FF6600', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  days: { color: '#999', margin: '8px 0' },
  price: { fontSize: '32px', fontWeight: 'bold', color: '#39FF14', margin: '12px 0 4px' },
  priceUSD: { fontSize: '16px', color: '#999', margin: '0 0 16px' },
  buttons: { display: 'flex', gap: '8px', marginTop: '16px' },
  btnPix: { flex: 1, padding: '12px', background: '#39FF14', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  btnCard: { flex: 1, padding: '12px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#2a2a2a', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '2px solid #39FF14' },
  modalValue: { fontSize: '18px', marginBottom: '16px' },
  qrCode: { maxWidth: '200px', width: '100%', borderRadius: '8px', margin: '12px auto', display: 'block' },
  pixCode: { background: '#1a1a1a', borderRadius: '6px', padding: '12px', marginTop: '16px' },
  pixCodeLabel: { fontSize: '13px', color: '#999', marginBottom: '8px' },
  pixCodeText: { display: 'block', fontSize: '11px', color: '#39FF14', wordBreak: 'break-all', padding: '8px', background: '#000', borderRadius: '4px' },
  btnCopy: { marginTop: '8px', padding: '8px 16px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  checking: { color: '#FF6600', marginTop: '16px', fontSize: '14px' },
  btnClose: { marginTop: '16px', padding: '10px 24px', background: '#555', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};
