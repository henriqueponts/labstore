// backend/src/services/authService.js
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { UserRole } = require('../utils/constants');

const mapDbClienteToUser = (dbCliente) => {
  if (!dbCliente) return null;
  return {
    id: `cliente_${dbCliente.id_cliente}`,
    nome: dbCliente.nome,
    email: dbCliente.email,
    role: UserRole.CLIENTE,
    cpf_cnpj: dbCliente.cpf_cnpj,
    endereco: dbCliente.endereco,
    telefone: dbCliente.telefone,
    data_cadastro: dbCliente.data_cadastro,
    status: dbCliente.status,
  };
};

const mapDbUsuarioToUser = (dbUsuario) => {
  if (!dbUsuario) return null;
  return {
    id: `usuario_${dbUsuario.id_usuario}`,
    nome: dbUsuario.email, // Tabela Usuario não tem 'nome', usamos email
    email: dbUsuario.email,
    role: dbUsuario.tipo_perfil,
    data_cadastro: dbUsuario.data_cadastro,
    status: dbUsuario.status,
  };
};

const findUserByEmailForLogin = async (email) => {
  let [rows] = await pool.query('SELECT * FROM Cliente WHERE email = ?', [email]);
  if (rows.length > 0) {
    const cliente = rows[0];
    return { ...mapDbClienteToUser(cliente), passwordHash: cliente.senha_hash, db_id: cliente.id_cliente, type: 'cliente' };
  }

  [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
  if (rows.length > 0) {
    const usuario = rows[0];
    return { ...mapDbUsuarioToUser(usuario), passwordHash: usuario.senha_hash, db_id: usuario.id_usuario, type: 'usuario' };
  }
  return null;
};

const findUserById = async (compositeId) => {
    const [type, idStr] = compositeId.split('_');
    const id = parseInt(idStr, 10);

    if (type === 'cliente') {
        const [rows] = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [id]);
        return rows.length > 0 ? mapDbClienteToUser(rows[0]) : null;
    } else if (type === 'usuario') {
        const [rows] = await pool.query('SELECT * FROM Usuario WHERE id_usuario = ?', [id]);
        return rows.length > 0 ? mapDbUsuarioToUser(rows[0]) : null;
    }
    return null;
};

const registerCliente = async (userData) => {
  const { nome, email, senha, cpf_cnpj, endereco, telefone } = userData;

  const [existingByEmail] = await pool.query('SELECT id_cliente FROM Cliente WHERE email = ?', [email]);
  if (existingByEmail.length > 0) {
    const error = new Error('E-mail já cadastrado.');
    error.statusCode = 409;
    throw error;
  }
  const [existingByCpf] = await pool.query('SELECT id_cliente FROM Cliente WHERE cpf_cnpj = ?', [cpf_cnpj]);
  if (existingByCpf.length > 0) {
    const error = new Error('CPF/CNPJ já cadastrado.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = bcrypt.hashSync(senha, 8);
  
  const sql = 'INSERT INTO Cliente (nome, email, senha_hash, cpf_cnpj, endereco, telefone, data_cadastro, status) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)';
  const [result] = await pool.query(sql, [nome, email, passwordHash, cpf_cnpj, endereco || null, telefone || null, 'ativo']);
  
  const [newClienteRows] = await pool.query('SELECT * FROM Cliente WHERE id_cliente = ?', [result.insertId]);
  return mapDbClienteToUser(newClienteRows[0]);
};

const getAllUsersInternal = async () => {
    const [clientes] = await pool.query('SELECT id_cliente, nome, email, cpf_cnpj, endereco, telefone, data_cadastro, status FROM Cliente');
    const [usuarios] = await pool.query('SELECT id_usuario, email, tipo_perfil, data_cadastro, status FROM Usuario'); // Ajustado 'tipo_perfil'
    
    const mappedClientes = clientes.map(c => ({...mapDbClienteToUser(c)})); // mapDbClienteToUser já define a role
    const mappedUsuarios = usuarios.map(u => ({...mapDbUsuarioToUser(u)}));

    return [...mappedClientes, ...mappedUsuarios];
};

const updateUserStatusInternal = async (compositeId, status) => {
    const [type, idStr] = compositeId.split('_');
    const id = parseInt(idStr, 10);
    let tableName, idColumnName;

    if (type === 'cliente') {
        tableName = 'Cliente';
        idColumnName = 'id_cliente';
    } else if (type === 'usuario') {
        tableName = 'Usuario';
        idColumnName = 'id_usuario';
    } else {
        const error = new Error('Tipo de usuário inválido.');
        error.statusCode = 400;
        throw error;
    }

    const [result] = await pool.query(`UPDATE ${tableName} SET status = ? WHERE ${idColumnName} = ?`, [status, id]);
    if (result.affectedRows === 0) {
        const error = new Error('Usuário não encontrado.');
        error.statusCode = 404;
        throw error;
    }
    return findUserById(compositeId);
};

const createUserInternal = async (userData) => {
    const { nome, email, senha, role } = userData; 
    if (role === UserRole.CLIENTE) {
        const error = new Error('Para registrar clientes, use a rota de registro específica.');
        error.statusCode = 400;
        throw error;
    }

    const [existing] = await pool.query('SELECT id_usuario FROM Usuario WHERE email = ?', [email]);
    if (existing.length > 0) {
        const error = new Error('E-mail já cadastrado para administrador/analista.');
        error.statusCode = 409;
        throw error;
    }
    const passwordHash = bcrypt.hashSync(senha, 8);
    // Tabela Usuario espera 'tipo_perfil'
    const sql = 'INSERT INTO Usuario (email, senha_hash, tipo_perfil, data_cadastro, status) VALUES (?, ?, ?, NOW(), ?)';
    const [result] = await pool.query(sql, [email, passwordHash, role, 'ativo']);
    
    const [newUsuarioRows] = await pool.query('SELECT * FROM Usuario WHERE id_usuario = ?', [result.insertId]);
    return mapDbUsuarioToUser(newUsuarioRows[0]);
};

const updateUserProfileInternal = async (compositeId, profileData) => {
    const [type, idStr] = compositeId.split('_');
    const id = parseInt(idStr, 10);

    if (type === 'cliente') {
        const { nome, endereco, telefone } = profileData;
        const fieldsToUpdate = {};
        if (nome !== undefined) fieldsToUpdate.nome = nome;
        if (endereco !== undefined) fieldsToUpdate.endereco = endereco;
        if (telefone !== undefined) fieldsToUpdate.telefone = telefone;

        if (Object.keys(fieldsToUpdate).length === 0) {
            return findUserById(compositeId); 
        }
        
        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), id];
        
        const [result] = await pool.query(`UPDATE Cliente SET ${setClauses} WHERE id_cliente = ?`, values);
        if (result.affectedRows === 0) {
            const error = new Error('Cliente não encontrado.');
            error.statusCode = 404;
            throw error;
        }
    } else if (type === 'usuario') {
        // Admin/Analista: Tabela Usuario não tem nome, endereco, telefone.
        // Se for atualizar email ou status, precisaria de lógica específica.
        // Por enquanto, não há campos atualizáveis para Usuario via este endpoint.
    } else {
        const error = new Error('Tipo de usuário inválido para atualização de perfil.');
        error.statusCode = 400;
        throw error;
    }
    return findUserById(compositeId);
};

module.exports = {
  findUserByEmailForLogin,
  findUserById,
  registerCliente,
  getAllUsersInternal,
  updateUserStatusInternal,
  createUserInternal,
  updateUserProfileInternal,
  mapDbClienteToUser, // Exportado para outros services se necessário
  mapDbUsuarioToUser  // Exportado para outros services se necessário
};
