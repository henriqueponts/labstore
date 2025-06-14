// backend/src/middlewares/authMiddleware.js
const { verifyToken } = require('../utils/tokenUtils');
const authService = require('../services/authService');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const decoded = verifyToken(token); // decoded deve conter { id: "type_dbId", role: "..." }
  if (!decoded || !decoded.id) {
    return res.status(403).json({ message: 'Token inválido ou expirado.' });
  }
  
  try {
    // decoded.id já é o ID composto (ex: "cliente_1" ou "usuario_1")
    const user = await authService.findUserById(decoded.id); 
    if (!user) {
        return res.status(403).json({ message: 'Usuário do token não encontrado.' });
    }
    if (user.status === 'inativo') {
        return res.status(403).json({ message: 'Usuário do token está inativo.' });
    }
    req.user = user; // Anexa o objeto User formatado (sem hash de senha)
    next();
  } catch (error) {
     return res.status(500).json({ message: 'Erro ao verificar usuário do token.' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
