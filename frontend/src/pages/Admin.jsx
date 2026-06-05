import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Admin() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [keyName, setKeyName] = useState('');
  const [novaKey, setNovaKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    carregarDados();
  }, [tab]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (tab === 'dashboard') {
        const { data } = await api.get('/admin/dashboard', config);
        setDashboard(data);
      } else if (tab === 'usuarios') {
        const { data } = await api.get('/admin/usuarios', config);
        setUsuarios(data);
      } else if (tab === 'assinaturas') {
        const { data } = await api.get('/admin/assinaturas', config);
        setAssinaturas(data);
      } else if (tab === 'apikeys') {
        const { data } = await api.get('/admin/api-keys', config);
        setApiKeys(data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Acesso negado - Somente admin');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDesativar = async (userId) => {
    if (!confirm('Desativar este usuário?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.post('/admin/desativar', { userId }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Usuário desativado');
      carregarDados();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleGerarKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post('/admin/gerar-key', 
        { name: keyName || 'Key Admin Testes' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNovaKey(data.api_key);
      alert('API Key gerada com sucesso!');
      carregarDados();
    } catch (err) {
      alert('Erro: ' + (err.response?.data?.error || err.message));
    }
  };

  const copiarKey = () => {
    navigator.clipboard.writeText(novaKey);
    alert('API Key copiada!');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🔐 Painel Admin</h1>
        <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>← Dashboard</button>
      </header>

      <nav style={styles.nav}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'usuarios', label: '👥 Usuários' },
          { id: 'assinaturas', label: '💳 Assinaturas' },
          { id: 'apikeys', label: '🔑 API Keys' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={tab === t.id ? styles.tabActive : styles.tab}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p style={styles.loading}>Carregando...</p>
      ) : (
        <>
          {tab === 'dashboard' && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3>👥 Total Usuários</h3>
                <p style={styles.statNumber}>{dashboard.total_usuarios || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3>✅ Assinaturas Ativas</h3>
                <p style={styles.statNumber}>{dashboard.assinaturas_ativas || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3>🔑 API Keys Ativas</h3>
                <p style={styles.statNumber}>{dashboard.api_keys_ativas || 0}</p>
              </div>
              <div style={styles.statCardHighlight}>
                <h3>💰 Receita Mensal</h3>
                <p style={styles.statNumber}>R$ {Number(dashboard.receita_mensal || 0).toFixed(2)}</p>
              </div>
            </div>
          )}

          {tab === 'usuarios' && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Plano</th>
                  <th>Vencimento</th>
                  <th>API Keys</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.plano || '-'}</td>
                    <td>{u.vencimento ? new Date(u.vencimento).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>{u.api_keys}</td>
                    <td>
                      <button onClick={() => handleDesativar(u.id)} style={styles.btnDanger}>
                        Desativar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'assinaturas' && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Início</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assinaturas.map(a => (
                  <tr key={a.id}>
                    <td>{a.usuario}</td>
                    <td>{a.email}</td>
                    <td>{a.plano}</td>
                    <td>R$ {Number(a.price).toFixed(2)}</td>
                    <td>{new Date(a.start_date).toLocaleDateString('pt-BR')}</td>
                    <td>{new Date(a.end_date).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span style={styles.status(a.status)}>
                        {a.status === 'ativo' ? '✅ Ativo' : a.status === 'vence_logo' ? '⚠️ Vence logo' : '❌ Vencido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'apikeys' && (
            <div>
              <div style={styles.generateForm}>
                <h3>🔑 Gerar API Key para Admin (Testes)</h3>
                <input
                  type="text"
                  placeholder="Nome da Key (opcional)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  style={styles.input}
                />
                <button onClick={handleGerarKey} style={styles.btnGenerate}>
                  🔑 Gerar Minha API Key
                </button>
              </div>

              {novaKey && (
                <div style={styles.newKeyBox}>
                  <h4>✅ API Key Gerada:</h4>
                  <code style={styles.keyText}>{novaKey}</code>
                  <button onClick={copiarKey} style={styles.btnCopy}>📋 Copiar</button>
                </div>
              )}

              <h3 style={{ marginTop: '30px' }}>Todas as API Keys</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuário</th>
                    <th>Email</th>
                    <th>Nome</th>
                    <th>Key</th>
                    <th>Status</th>
                    <th>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(k => (
                    <tr key={k.id}>
                      <td>{k.id}</td>
                      <td>{k.usuario}</td>
                      <td>{k.email}</td>
                      <td>{k.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{k.api_key.substring(0, 20)}...</td>
                      <td>{k.active ? '✅ Ativa' : '❌ Inativa'}</td>
                      <td>{new Date(k.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: 'system-ui, sans-serif', background: '#1c1c1c', minHeight: '100vh', color: '#e0e0e0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: '3px solid #FF6600', background: '#2a2a2a' },
  backBtn: { padding: '8px 16px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  nav: { display: 'flex', gap: '8px', padding: '20px 30px', borderBottom: '1px solid #444' },
  tab: { padding: '10px 20px', background: 'transparent', color: '#999', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' },
  tabActive: { padding: '10px 20px', background: '#39FF14', color: '#000', border: '1px solid #39FF14', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  loading: { textAlign: 'center', padding: '40px', color: '#999' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '30px' },
  statCard: { padding: '24px', background: '#2a2a2a', borderRadius: '8px', borderLeft: '4px solid #FF6600' },
  statCardHighlight: { padding: '24px', background: '#2a2a2a', borderRadius: '8px', borderLeft: '4px solid #39FF14' },
  statNumber: { fontSize: '32px', fontWeight: 'bold', margin: '8px 0', color: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse', padding: '20px 30px' },
  btnDanger: { padding: '6px 12px', background: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  status: (status) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    background: status === 'ativo' ? '#1a4a1a' : status === 'vence_logo' ? '#4a3a1a' : '#4a1a1a',
    color: status === 'ativo' ? '#39FF14' : status === 'vence_logo' ? '#FF6600' : '#ff4444',
  }),
  generateForm: { padding: '30px', background: '#2a2a2a', margin: '20px 30px', borderRadius: '8px', border: '1px solid #FF6600' },
  input: { padding: '10px', margin: '8px', background: '#1c1c1c', color: '#e0e0e0', border: '1px solid #555', borderRadius: '6px', fontSize: '14px' },
  btnGenerate: { padding: '10px 20px', background: '#39FF14', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '8px' },
  newKeyBox: { padding: '20px', background: '#1a4a1a', margin: '20px 30px', borderRadius: '8px', border: '2px solid #39FF14' },
  keyText: { display: 'block', padding: '12px', background: '#000', color: '#39FF14', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', margin: '10px 0', wordBreak: 'break-all' },
  btnCopy: { padding: '8px 16px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
};
