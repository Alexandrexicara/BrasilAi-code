const jwt = require('jsonwebtoken');

const authJwt = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(401).json({ error: 'Token obrigatório' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { authJwt };
