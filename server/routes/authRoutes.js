import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router()

// Login Unificado - Detecta automaticamente se é cliente ou funcionário
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const db = await connectToDatabase()
        
        // Primeiro, verifica se é um funcionário
        const [funcionarioRows] = await db.query('SELECT * FROM Usuario WHERE email = ? AND status = "ativo"', [email])
        
        if (funcionarioRows.length > 0) {
            // É um funcionário
            const funcionario = funcionarioRows[0];
            const isMatch = await bcrypt.compare(senha, funcionario.senha_hash)
            if (!isMatch) {
                return res.status(401).json({ message: 'Senha incorreta!' })
            }

            const token = jwt.sign({ 
                id: funcionario.id_usuario, 
                tipo: 'funcionario',
                perfil: funcionario.tipo_perfil,
                email: funcionario.email 
            }, process.env.JWT_SECRET, { expiresIn: '3h' })

            return res.status(200).json({ 
                token: token,
                usuario: {
                    id: funcionario.id_usuario,
                    email: funcionario.email,
                    tipo_perfil: funcionario.tipo_perfil,
                    tipo: 'funcionario'
                }
            })
        }
        
        // Se não é funcionário, verifica se é cliente
        const [clienteRows] = await db.query('SELECT * FROM Cliente WHERE email = ? AND status = "ativo"', [email])
        
        if (clienteRows.length > 0) {
            // É um cliente
            const cliente = clienteRows[0];
            const isMatch = await bcrypt.compare(senha, cliente.senha_hash)
            if (!isMatch) {
                return res.status(401).json({ message: 'Senha incorreta!' })
            }

            const token = jwt.sign({ 
                id: cliente.id_cliente, 
                tipo: 'cliente',
                email: cliente.email 
            }, process.env.JWT_SECRET, { expiresIn: '3h' })

            return res.status(200).json({ 
                token: token,
                usuario: {
                    id: cliente.id_cliente,
                    nome: cliente.nome,
                    email: cliente.email,
                    tipo: 'cliente'
                }
            })
        }
        
        // Usuário não encontrado em nenhuma das tabelas
        return res.status(404).json({ message: 'Email não encontrado!' })
        
    } catch (err) {
        console.error('Erro no login:', err)
        return res.status(500).json({ message: 'Erro interno do servidor' })
    }
})

// Cadastro de Cliente
router.post('/registro/cliente', async (req, res) => {
    const { nome, email, senha, cpf_cnpj, endereco, telefone } = req.body;
    try {
        const db = await connectToDatabase()
        
        // Verificar se email já existe
        const [emailExists] = await db.query('SELECT * FROM Cliente WHERE email = ?', [email])
        if (emailExists.length > 0) {
            return res.status(400).json({ message: 'Este email já está em uso!' })
        }

        // Verificar se CPF/CNPJ já existe
        const [cpfExists] = await db.query('SELECT * FROM Cliente WHERE cpf_cnpj = ?', [cpf_cnpj])
        if (cpfExists.length > 0) {
            return res.status(400).json({ message: 'Este CPF/CNPJ já está em uso!' })
        }

        const hashPassword = await bcrypt.hash(senha, 10)
        await db.query(
            'INSERT INTO Cliente (nome, email, senha_hash, cpf_cnpj, endereco, telefone) VALUES (?, ?, ?, ?, ?, ?)', 
            [nome, email, hashPassword, cpf_cnpj, endereco, telefone]
        )
        
        res.status(201).json({ message: 'Cliente registrado com sucesso!' })
    } catch (err) {
        console.error('Erro ao registrar cliente:', err)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
})

// Cadastro de Funcionário (Admin/Técnico)
router.post('/registro/funcionario', async (req, res) => {
    const { email, senha, tipo_perfil } = req.body;
    
    // Validar tipo de perfil
    if (!['admin', 'analista'].includes(tipo_perfil)) {
        return res.status(400).json({ message: 'Tipo de perfil inválido!' })
    }

    try {
        const db = await connectToDatabase()
        
        // Verificar se email já existe
        const [emailExists] = await db.query('SELECT * FROM Usuario WHERE email = ?', [email])
        if (emailExists.length > 0) {
            return res.status(400).json({ message: 'Este email já está em uso!' })
        }

        const hashPassword = await bcrypt.hash(senha, 10)
        await db.query(
            'INSERT INTO Usuario (email, senha_hash, tipo_perfil) VALUES (?, ?, ?)', 
            [email, hashPassword, tipo_perfil]
        )
        
        res.status(201).json({ message: 'Funcionário registrado com sucesso!' })
    } catch (err) {
        console.error('Erro ao registrar funcionário:', err)
        res.status(500).json({ message: 'Erro interno do servidor' })
    }
})

// Middleware de verificação de token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userType = decoded.tipo;
        req.userProfile = decoded.perfil;
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' })
    }
}

// Rota protegida para obter dados do usuário
router.get('/me', verifyToken, async (req, res) => {
    try {
        const db = await connectToDatabase()
        
        if (req.userType === 'cliente') {
            const [rows] = await db.query('SELECT id_cliente, nome, email, cpf_cnpj, endereco, telefone FROM Cliente WHERE id_cliente = ?', [req.userId])
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Cliente não encontrado!' })
            }
            return res.status(200).json({ 
                ...rows[0], 
                tipo: 'cliente' 
            })
        } else if (req.userType === 'funcionario') {
            const [rows] = await db.query('SELECT id_usuario, email, tipo_perfil FROM Usuario WHERE id_usuario = ?', [req.userId])
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Funcionário não encontrado!' })
            }
            return res.status(200).json({ 
                ...rows[0], 
                tipo: 'funcionario' 
            })
        }
        
        return res.status(400).json({ message: 'Tipo de usuário inválido' })
    } catch (err) {
        console.error('Erro ao buscar dados do usuário:', err)
        return res.status(500).json({ message: 'Erro interno do servidor' })
    }
})

export default router