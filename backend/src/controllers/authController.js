const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Validação de entrada
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }
      if (password.length < 4) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
      }

      // Verificar conexão com banco
      if (!db.temDatabase) {
        return res.status(500).json({ error: 'Banco de dados não configurado. Contate o administrador.' });
      }

      const existente = await User.findByEmail(email);
      if (existente) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const user = await User.create(name.trim(), email.toLowerCase().trim(), password);
      
      // Primeiro usuário vira admin automaticamente
      const userCount = await db.pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCount.rows[0].count) === 1) {
        await db.pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id]);
        user.role = 'admin';
      }
      
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      res.status(201).json({ user, token });
    } catch (err) {
      console.error('Erro no registro:', err);
      res.status(500).json({ error: `Erro interno ao cadastrar: ${err.message}` });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validação de entrada
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Verificar conexão com banco
      if (!db.temDatabase) {
        return res.status(500).json({ error: 'Banco de dados não configurado. Contate o administrador.' });
      }

      const user = await User.findByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
    } catch (err) {
      console.error('Erro no login:', err);
      res.status(500).json({ error: `Erro interno ao fazer login: ${err.message}` });
    }
  }
};

module.exports = authController;
