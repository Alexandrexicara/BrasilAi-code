import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/plans').then(({ data }) => setPlans(data));
  }, []);

  const handleSubscribe = async (index) => {
    try {
      await api.post('/subscription/contratar', { planIndex: index });
      setMessage('✅ Plano contratado!');
    } catch {
      setMessage('❌ Erro ao contratar');
    }
  };

  return (
    <div style={styles.container}>
      <Link to="/dashboard" style={styles.back}>← Voltar</Link>
      <h1>Planos</h1>
      {message && <p>{message}</p>}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Quinzenal</h3>
          <p>15 dias</p>
          <p style={styles.price}>R$ 60,00</p>
          <button onClick={() => handleSubscribe(0)} style={styles.button}>Contratar</button>
        </div>
        <div style={{...styles.card, border: '3px solid #FF6600'}}>
          <h3>Mensal</h3>
          <p>30 dias</p>
          <p style={styles.price}>R$ 100,00</p>
          <button onClick={() => handleSubscribe(1)} style={styles.button}>Contratar</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  back: { color: '#FF6600', textDecoration: 'none' },
  grid: { display: 'flex', gap: '16px', marginTop: '20px' },
  card: { padding: '20px', border: '1px solid #FF6600', borderRadius: '8px', textAlign: 'center', minWidth: '200px' },
  price: { fontSize: '24px', fontWeight: 'bold', margin: '12px 0', color: '#FF6600' },
  button: { padding: '10px 20px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
};
