import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [sub, setSub] = useState(null);
  const [copied, setCopied] = useState('');
  const navigate = useNavigate();

  const configYaml = `name: Brasil CodeAI
version: 1.0.0
schema: v1
models:
  - name: Brasil CodeAI
    provider: openai
    model: meta-llama/llama-4-scout-17b-16e-instruct
    apiBase: https://brasil-codeai.onrender.com/v1
    apiKey: COLE_SUA_API_KEY_AQUI
    requestOptions:
      timeout: 120000`;

  const clineConfig = `Base URL: https://brasil-codeai.onrender.com/v1
API Key: COLE_SUA_API_KEY_AQUI
Model ID: meta-llama/llama-4-scout-17b-16e-instruct`;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

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
          <Link to="/admin" style={styles.adminLink}>🔐 Admin</Link>
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

      <div style={styles.card}>
        <h3>⚡ Configurar no VSCode com Continue (Chat e Autocomplete)</h3>
        <ol style={styles.steps}>
          <li>Instale a extensão <strong>Continue</strong> no VSCode (Ctrl+Shift+X → busque "Continue")</li>
          <li>Pressione <strong>Ctrl+Shift+P</strong> → digite <strong>Continue: Open Config</strong></li>
          <li>Apague tudo e cole o config abaixo</li>
          <li>Substitua <strong>COLE_SUA_API_KEY_AQUI</strong> pela sua API Key (vá em <Link to="/apikeys" style={styles.link}>API Keys</Link>)</li>
          <li>Salve (Ctrl+S) e recarregue o VSCode (Ctrl+Shift+P → Reload Window)</li>
        </ol>
        <div style={styles.codeBlock}>
          <div style={styles.codeHeader}>
            <span>config.yaml</span>
            <button onClick={() => handleCopy(configYaml, 'continue')} style={styles.copyBtn}>
              {copied === 'continue' ? '✅ Copiado!' : '📋 Copiar'}
            </button>
          </div>
          <pre style={styles.code}>{configYaml}</pre>
        </div>
      </div>

      <div style={styles.card}>
        <h3>🤖 Configurar no VSCode com Cline (Agente Autônomo)</h3>
        <ol style={styles.steps}>
          <li>Instale a extensão <strong>Cline</strong> no VSCode (Ctrl+Shift+X → busque "Cline")</li>
          <li>Abra o Cline e clique na <strong>engrenagem</strong> (⚙️)</li>
          <li>Em <strong>API Provider</strong> selecione: <strong>OpenAI Compatible</strong></li>
          <li>Preencha os campos abaixo:</li>
        </ol>
        <div style={styles.codeBlock}>
          <div style={styles.codeHeader}>
            <span>Configuração Cline</span>
            <button onClick={() => handleCopy(clineConfig, 'cline')} style={styles.copyBtn}>
              {copied === 'cline' ? '✅ Copiado!' : '📋 Copiar'}
            </button>
          </div>
          <pre style={styles.code}>{clineConfig}</pre>
        </div>
        <p style={styles.note}>⚠️ O Cline é um agente autônomo: lê arquivos, edita código e executa comandos. Escolha o idioma da sua API Key na página <Link to="/apikeys" style={styles.link}>API Keys</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', fontFamily: 'system-ui, sans-serif', background: '#1c1c1c', minHeight: '100vh', color: '#e0e0e0' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #FF6600', paddingBottom: '12px' },
  link: { marginRight: '16px', color: '#FF6600', textDecoration: 'none', fontWeight: 'bold' },
  adminLink: { marginRight: '16px', color: '#39FF14', textDecoration: 'none', fontWeight: 'bold' },
  logout: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },
  card: { padding: '20px', background: '#2a2a2a', border: '1px solid #FF6600', borderRadius: '8px', marginBottom: '16px' },
  steps: { lineHeight: '2', paddingLeft: '20px' },
  codeBlock: { background: '#1a1a1a', borderRadius: '6px', border: '1px solid #444', marginTop: '12px', overflow: 'hidden' },
  codeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#333', borderBottom: '1px solid #444' },
  copyBtn: { background: '#FF6600', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  code: { padding: '12px', margin: 0, fontSize: '13px', overflowX: 'auto', whiteSpace: 'pre', color: '#39FF14' },
  note: { marginTop: '12px', fontSize: '13px', color: '#FF6600', fontStyle: 'italic' },
};
