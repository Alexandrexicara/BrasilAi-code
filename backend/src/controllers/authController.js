const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const existente = await User.findByEmail(email);
      if (existente) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      const user = await User.create(name, email, password);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      res.status(201).json({ user, token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
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
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = authController;
