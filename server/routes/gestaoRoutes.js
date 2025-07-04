// Arquivo: server/routes/gestaoRoutes.js

import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

console.log('📋 gestaoRoutes.js carregado!');

// Middleware de verificação de token e permissão de admin
const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar se é funcionário
        if (decoded.tipo !== 'funcionario') {
            return res.status(403).json({ message: 'Acesso negado. Apenas funcionários.' });
        }
        
        req.userId = decoded.id;
        req.userType = decoded.tipo;
        req.userProfile = decoded.perfil;
        
        next();
    } catch (err) {
        console.error('🚫 Erro na autenticação:', err.message);
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Rota de teste
router.get('/test', (req, res) => {
    res.json({ message: 'Gestão routes funcionando!', timestamp: new Date().toISOString() });
});

// Listar todos os funcionários (usuários)
router.get('/usuarios', verifyAdmin, async (req, res) => {
    console.log('📊 GET /gestao/usuarios chamado');
    try {
        const db = await connectToDatabase();
        const [usuarios] = await db.query(`
            SELECT id_usuario, email, tipo_perfil, data_cadastro, status 
            FROM Usuario 
            ORDER BY data_cadastro DESC
        `);
        
        console.log(`👥 ${usuarios.length} usuários encontrados`);
        res.status(200).json(usuarios);
    } catch (err) {
        console.error('❌ Erro ao buscar usuários:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Listar todos os clientes
router.get('/clientes', verifyAdmin, async (req, res) => {
    console.log('📊 GET /gestao/clientes chamado');
    try {
        const db = await connectToDatabase();
        const [clientes] = await db.query(`
            SELECT id_cliente, nome, email, telefone, data_cadastro, status 
            FROM Cliente 
            ORDER BY data_cadastro DESC
        `);
        
        console.log(`👥 ${clientes.length} clientes encontrados`);
        res.status(200).json(clientes);
    } catch (err) {
        console.error('❌ Erro ao buscar clientes:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Alterar perfil de usuário (apenas admin)
router.put('/usuarios/:id/perfil', verifyAdmin, async (req, res) => {
    try {
        if (req.userProfile !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const { id } = req.params;
        const { tipo_perfil } = req.body;

        if (!['admin', 'analista'].includes(tipo_perfil)) {
            return res.status(400).json({ message: 'Tipo de perfil inválido' });
        }

        const db = await connectToDatabase();
        
        const [userExists] = await db.query('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        await db.query('UPDATE Usuario SET tipo_perfil = ? WHERE id_usuario = ?', [tipo_perfil, id]);
        
        console.log(`✅ Perfil do usuário ${id} alterado para ${tipo_perfil}`);
        res.status(200).json({ message: 'Perfil atualizado com sucesso' });
    } catch (err) {
        console.error('❌ Erro ao alterar perfil:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Inativar usuário (apenas admin)
router.put('/usuarios/:id/inativar', verifyAdmin, async (req, res) => {
    try {
        if (req.userProfile !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const { id } = req.params;

        if (parseInt(id) === req.userId) {
            return res.status(400).json({ message: 'Você não pode inativar sua própria conta' });
        }

        const db = await connectToDatabase();
        
        const [userExists] = await db.query('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        await db.query('UPDATE Usuario SET status = "inativo" WHERE id_usuario = ?', [id]);
        
        console.log(`✅ Usuário ${id} inativado`);
        res.status(200).json({ message: 'Usuário inativado com sucesso' });
    } catch (err) {
        console.error('❌ Erro ao inativar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Reativar usuário (apenas admin)
router.put('/usuarios/:id/reativar', verifyAdmin, async (req, res) => {
    try {
        if (req.userProfile !== 'admin') {
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
        }

        const { id } = req.params;
        const db = await connectToDatabase();
        
        const [userExists] = await db.query('SELECT id_usuario FROM Usuario WHERE id_usuario = ?', [id]);
        if (userExists.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        await db.query('UPDATE Usuario SET status = "ativo" WHERE id_usuario = ?', [id]);
        
        console.log(`✅ Usuário ${id} reativado`);
        res.status(200).json({ message: 'Usuário reativado com sucesso' });
    } catch (err) {
        console.error('❌ Erro ao reativar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Inativar cliente
router.put('/clientes/:id/inativar', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await connectToDatabase();
        
        const [clientExists] = await db.query('SELECT id_cliente FROM Cliente WHERE id_cliente = ?', [id]);
        if (clientExists.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        await db.query('UPDATE Cliente SET status = "inativo" WHERE id_cliente = ?', [id]);
        
        console.log(`✅ Cliente ${id} inativado`);
        res.status(200).json({ message: 'Cliente inativado com sucesso' });
    } catch (err) {
        console.error('❌ Erro ao inativar cliente:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Reativar cliente
router.put('/clientes/:id/reativar', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const db = await connectToDatabase();
        
        const [clientExists] = await db.query('SELECT id_cliente FROM Cliente WHERE id_cliente = ?', [id]);
        if (clientExists.length === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }

        await db.query('UPDATE Cliente SET status = "ativo" WHERE id_cliente = ?', [id]);
        
        console.log(`✅ Cliente ${id} reativado`);
        res.status(200).json({ message: 'Cliente reativado com sucesso' });
    } catch (err) {
        console.error('❌ Erro ao reativar cliente:', err);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

console.log('✅ gestaoRoutes.js configurado!');

export default router;