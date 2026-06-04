import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function APIKeys() {
  const [keys, setKeys] = useState([]);
  const [message, setMessage] = useState('');

  const fetchKeys = () => {
    api.get('/apikeys').then(({ data }) => setKeys(data));
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleGenerate = async () => {
    try {
      await api.post('/apikeys/gerar');
      setMessage('✅ Nova chave gerada!');
      fetchKeys();
    } catch {
      setMessage('❌ Erro ao gerar');
    }
  };

  const handleRevoke = async (id) => {
    await api.delete(`/apikeys/${id}`);
    fetchKeys();
  };

  return (
    <div style={styles.container}>
      <Link to="/dashboard" style={styles.back}>← Voltar</Link>
      <h1>API Keys</h1>
      {message && <p>{message}</p>}
      <button onClick={handleGenerate} style={styles.button}>Gerar Nova Chave</button>
      <div style={styles.list}>
        {keys.map((key) => (
          <div key={key.id} style={styles.card}>
            <code style={styles.code}>{key.api_key}</code>
            <span>{key.active ? '✅ Ativa' : '❌ Revogada'}</span>
            <button onClick={() => handleRevoke(key.id)} style={styles.revoke}>Revogar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif' },
  back: { color: '#FF6600', textDecoration: 'none' },
  button: { padding: '10px 20px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '16px', fontWeight: 'bold' },
  list: { marginTop: '16px' },
  card: { padding: '12px', border: '1px solid #FF6600', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' },
  code: { flex: 1, fontSize: '12px', color: '#333' },
  revoke: { padding: '6px 12px', background: '#CC0000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};
