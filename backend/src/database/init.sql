-- =========================================
-- FASE 1: Tabelas de logs e métricas da IA
-- =========================================

CREATE TABLE IF NOT EXISTS logs_requisicoes (
    id SERIAL PRIMARY KEY,
    modelo VARCHAR(100),
    endpoint VARCHAR(200),
    tempo_ms INTEGER,
    tokens_total INTEGER,
    tokens_prompt INTEGER,
    tokens_resposta INTEGER,
    status VARCHAR(20),
    erro TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_requisicoes(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_modelo ON logs_requisicoes(modelo);

-- =========================================
-- FUTURO: Tabelas do SaaS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150),
    email VARCHAR(255) UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    days INTEGER,
    price NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    plan_id INTEGER REFERENCES plans(id),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    api_key TEXT UNIQUE,
    name VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO plans (name, days, price) VALUES
    ('Quinzenal', 15, 60.00),
    ('Mensal', 30, 100.00)
ON CONFLICT (id) DO NOTHING;
