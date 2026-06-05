import { Link } from 'react-router-dom';

const C = {
  orange: '#FF6600',
  orangeLight: '#FF8C33',
  orangeDark: '#CC5200',
  green: '#39FF14',
  greenDark: '#2ECC10',
  greenGlow: 'rgba(57, 255, 20, 0.15)',
  bg: '#1c1c1c',
  bgCard: '#2a2a2a',
  bgCardHover: '#333',
  text: '#e0e0e0',
  textMuted: '#999',
};

export default function Landing() {
  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h2 style={styles.logo}>⚡ Brasil Code AI</h2>
        <nav>
          <Link to="/login" style={styles.navLink}>Login</Link>
          <Link to="/register" style={styles.navButton}>Criar Conta</Link>
        </nav>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>Inteligência Artificial para Programação</h1>
        <p style={styles.subtitle}>
          API própria compatível com VS Code. Gere código, refatore e resolva bugs com IA em nuvem.
        </p>
        <div style={styles.heroButtons}>
          <Link to="/register" style={styles.cta}>Começar Agora</Link>
          <a href="#precos" style={styles.ctaSecondary}>Ver Planos</a>
        </div>
      </section>

      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>Funcionalidades</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <h3>🤖 Modelos de IA</h3>
            <p>Qwen 3, Llama 3.3, GPT OSS e muito mais. Troque de modelo sem mudar código.</p>
          </div>
          <div style={styles.featureCard}>
            <h3>🔌 API OpenAI-compatible</h3>
            <p>Use com Continue, Cline ou qualquer extensão que suporte API OpenAI.</p>
          </div>
          <div style={styles.featureCard}>
            <h3>🔑 API Keys</h3>
            <p>Gere chaves exclusivas para cada projeto. Revogue a qualquer momento.</p>
          </div>
          <div style={styles.featureCard}>
            <h3>☁️ Nuvem de Alta Performance</h3>
            <p>Respostas rápidas com infraestrutura escalável na nuvem.</p>
          </div>
        </div>
      </section>

      <section id="precos" style={styles.pricing}>
        <h2 style={styles.sectionTitle}>Planos</h2>
        <div style={styles.priceGrid}>
          <div style={styles.priceCard}>
            <h3>Quinzenal</h3>
            <p style={styles.price}>R$ 60,00</p>
            <p style={styles.textMuted}>15 dias de acesso</p>
            <ul style={styles.priceList}>
              <li><span style={styles.check}>✓</span> Todas as IAs</li>
              <li><span style={styles.check}>✓</span> API Keys ilimitadas</li>
              <li><span style={styles.check}>✓</span> Suporte</li>
            </ul>
            <Link to="/register" style={styles.ctaOutline}>Contratar</Link>
          </div>
          <div style={styles.priceCardHighlight}>
            <span style={styles.badge}>MAIS POPULAR</span>
            <h3>Mensal</h3>
            <p style={styles.price}>R$ 100,00</p>
            <p style={styles.textMuted}>30 dias de acesso</p>
            <ul style={styles.priceList}>
              <li><span style={styles.check}>✓</span> Todas as IAs</li>
              <li><span style={styles.check}>✓</span> API Keys ilimitadas</li>
              <li><span style={styles.check}>✓</span> Suporte prioritário</li>
            </ul>
            <Link to="/register" style={styles.cta}>Contratar</Link>
          </div>
        </div>
      </section>

      <section style={styles.howTo}>
        <h2 style={styles.sectionTitle}>Como usar no VS Code</h2>
        <div style={styles.steps}>
          {[
            { n: 1, t: 'Crie sua conta', d: 'Cadastre-se e escolha um plano' },
            { n: 2, t: 'Gere uma API Key', d: 'No painel, crie sua chave exclusiva' },
            { n: 3, t: 'Configure o VS Code', d: 'Na extensão Continue ou Cline, aponte para nossa API' },
            { n: 4, t: 'Pronto!', d: 'Use IA para programar direto no editor' },
          ].map((s) => (
            <div key={s.n} style={styles.step}>
              <span style={styles.stepNumber}>{s.n}</span>
              <h3>{s.t}</h3>
              <p style={styles.textMuted}>{s.d}</p>
            </div>
          ))}
        </div>
        <div style={styles.codeBlock}>
          <p style={{ margin: '0 0 8px', color: C.green }}>Configuração para Continue/Cline:</p>
          <code>{`{
  "provider": "openai",
  "apiBase": "https://brasil-codeai.onrender.com/v1",
  "model": "qwen/qwen3-32b",
  "apiKey": "sua_api_key"
}`}</code>
        </div>
      </section>

      <footer style={styles.footer}>
        <p>© 2025 Brasil Code AI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: 'system-ui, sans-serif', color: C.text, background: C.bg, minHeight: '100vh', maxWidth: '960px', margin: '0 auto', padding: '0 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: `2px solid ${C.green}` },
  logo: { fontSize: '20px', margin: 0, color: C.green },
  navLink: { marginRight: '16px', color: C.textMuted, textDecoration: 'none' },
  navButton: { padding: '8px 16px', background: C.green, color: '#000', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' },
  hero: { textAlign: 'center', padding: '80px 0 60px' },
  heroTitle: { color: '#fff' },
  subtitle: { fontSize: '18px', color: C.textMuted, maxWidth: '600px', margin: '16px auto 32px', lineHeight: '1.6' },
  heroButtons: { display: 'flex', gap: '12px', justifyContent: 'center' },
  cta: { padding: '12px 24px', background: C.green, color: '#000', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' },
  ctaSecondary: { padding: '12px 24px', border: `2px solid ${C.green}`, color: C.green, borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' },
  ctaOutline: { padding: '12px 24px', border: `2px solid ${C.green}`, color: C.green, borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' },
  sectionTitle: { color: C.green },
  features: { padding: '60px 0' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' },
  featureCard: { padding: '24px', background: C.bgCard, borderRadius: '8px', borderLeft: `4px solid ${C.green}` },
  pricing: { padding: '60px 0', textAlign: 'center' },
  priceGrid: { display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' },
  priceCard: { padding: '32px', background: C.bgCard, border: `1px solid ${C.green}`, borderRadius: '12px', minWidth: '260px', textAlign: 'center', color: C.text },
  priceCardHighlight: { padding: '32px', background: C.bgCard, border: `3px solid ${C.green}`, borderRadius: '12px', minWidth: '260px', textAlign: 'center', position: 'relative', boxShadow: `0 0 20px ${C.greenGlow}` },
  badge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: C.green, color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
  price: { fontSize: '36px', fontWeight: 'bold', margin: '8px 0', color: C.green },
  priceList: { listStyle: 'none', padding: 0, margin: '16px 0', lineHeight: '2' },
  check: { color: C.green, fontWeight: 'bold', marginRight: '6px' },
  textMuted: { color: C.textMuted },
  howTo: { padding: '60px 0' },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginTop: '24px' },
  step: { textAlign: 'center' },
  stepNumber: { display: 'inline-block', width: '40px', height: '40px', lineHeight: '40px', borderRadius: '50%', background: C.green, color: '#000', fontWeight: 'bold', marginBottom: '8px' },
  codeBlock: { marginTop: '24px', padding: '20px', background: '#111', color: '#e0e0e0', borderRadius: '8px', fontSize: '13px', whiteSpace: 'pre', border: `1px solid ${C.green}40` },
  footer: { textAlign: 'center', padding: '40px 0', color: C.textMuted, fontSize: '14px', borderTop: `2px solid ${C.green}40`, marginTop: '40px' },
};
