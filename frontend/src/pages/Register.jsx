import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch {
      setError('Erro ao cadastrar');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Cadastro</h1>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Cadastrar</button>
      </form>
      <p>Já tem conta? <Link to="/login">Entrar</Link></p>
    </div>
  );
}

const styles = {
  container: { padding: '40px', maxWidth: '400px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '6px', border: '2px solid #FF6600' },
  button: { padding: '12px', background: '#FF6600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  error: { color: 'red', marginBottom: '12px' },
};
