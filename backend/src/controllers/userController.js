// backend/src/controllers/userController.js
const userService = require('../services/userService');
const { UserRole } = require('../utils/constants');

const listUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    res.json(users);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    // req.user já é o usuário autenticado e formatado pelo authMiddleware
    // O authService.findUserById já omite o hash da senha.
    res.json(req.user);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.userId; // ID composto do usuário a ser atualizado (ex: "cliente_1")
    
    // Admin pode atualizar qualquer perfil, usuário normal só o seu.
    if (req.user.id !== userIdToUpdate && req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Acesso negado para atualizar este perfil.' });
    }

    const updatedUser = await userService.updateUserProfile(userIdToUpdate, req.body);
    res.json(updatedUser);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const changeUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params; // ID composto
    const { status } = req.body;
    if (!status || (status !== 'ativo' && status !== 'inativo')) {
        return res.status(400).json({ message: "Status inválido. Deve ser 'ativo' ou 'inativo'." });
    }
    const updatedUser = await userService.updateUserStatus(userId, status);
    res.json(updatedUser);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const createUserByAdmin = async (req, res, next) => {
    try {
        const { nome, email, senha, role } = req.body;
        if (!nome || !email || !senha || !role) { // Nome é opcional para admin/analista no schema, mas útil
            return res.status(400).json({ message: 'E-mail, senha e perfil (role) são obrigatórios.' });
        }
        if (role === UserRole.CLIENTE) {
            return res.status(400).json({message: 'Para criar clientes, use a rota de registro pública.'})
        }
        if (role !== UserRole.ADMIN && role !== UserRole.ANALISTA) {
            return res.status(400).json({message: 'Perfil (role) inválido para esta rota.'})
        }
        // O `nome` aqui pode ser o nome completo do admin/analista se desejado,
        // mas a tabela Usuario só tem email. O service usa email como nome.
        const newUser = await userService.createAdminOrAnalystUser({ nome, email, senha, role });
        res.status(201).json(newUser);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

module.exports = {
  listUsers,
  getUserProfile,
  updateUserProfile,
  changeUserStatus,
  createUserByAdmin,
};
