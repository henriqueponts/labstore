// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const { generateToken } = require('../utils/tokenUtils');
const { UserRole } = require('../utils/constants');

const register = async (req, res, next) => {
  try {
    const { nome, email, senha, cpf_cnpj, endereco, telefone } = req.body;
    // Validação básica
    if (!nome || !email || !senha || !cpf_cnpj) {
        return res.status(400).json({ message: 'Nome, e-mail, senha e CPF/CNPJ são obrigatórios para clientes.' });
    }

    // Role é sempre CLIENTE para esta rota de registro público
    const userPayload = { nome, email, senha, cpf_cnpj, endereco, telefone };
    const newCliente = await authService.registerCliente(userPayload);
    
    // O ID do newCliente já estará no formato "cliente_DBID"
    const token = generateToken({ id: newCliente.id, role: newCliente.role });

    res.status(201).json({ user: newCliente, token });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500; // Default a 500 se não especificado
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }
    // findUserByEmailForLogin retorna o usuário com passwordHash e type
    const userWithPassword = await authService.findUserByEmailForLogin(email);

    if (!userWithPassword || !bcrypt.compareSync(senha, userWithPassword.passwordHash)) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    if (userWithPassword.status === 'inativo') {
        return res.status(403).json({ message: 'Esta conta está inativa.' });
    }

    // O ID já está no formato correto (ex: "cliente_1" ou "usuario_1")
    const token = generateToken({ id: userWithPassword.id, role: userWithPassword.role });
    
    // Remove passwordHash antes de enviar a resposta
    const { passwordHash, db_id, type, ...userToReturn } = userWithPassword;

    res.json({ user: userToReturn, token });
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const logout = (req, res) => {
  res.status(200).json({ message: 'Logout bem-sucedido.' });
};


module.exports = { register, login, logout };
