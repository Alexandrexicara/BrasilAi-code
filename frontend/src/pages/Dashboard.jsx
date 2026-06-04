import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [sub, setSub] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/subscription/status')
      .then(({ data }) => setSub(data))
      .catch(() => navigate('/login'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <h2>Brasil Code AI</h2>
        <div>
          <Link to="/plans" style={styles.link}>Planos</Link>
          <Link to="/apikeys" style={styles.link}>API Keys</Link>
          <button onClick={handleLogout} style={styles.logout}>Sair</button>
        </div>
      </nav>
      <h1>Dashboard</h1>
      <div style={styles.card}>
        <h3>Status da Assinatura</h3>
        {sub ? (
          <p>{sub.ativa ? '✅ Ativa' : '❌ Inativa'}</p>
        ) : (
          <p>Carregando...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #FF6600', paddingBottom: '12px' },
  link: { marginRight: '16px', color: '#FF6600', textDecoration: 'none', fontWeight: 'bold' },
  logout: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  card: { padding: '20px', border: '1px solid #FF6600', borderRadius: '8px', marginBottom: '16px' },
};
