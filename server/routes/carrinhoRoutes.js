
import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware para verificar se o usuÃ¡rio Ã© um cliente logado
const verificarCliente = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token nÃ£o fornecido' });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.tipo !== 'cliente') {
            return res.status(403).json({ message: 'Acesso negado. Apenas clientes podem acessar o carrinho.' });
        }
        
        req.clienteId = decoded.id; // Adiciona o id do cliente na requisiÃ§Ã£o
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invÃ¡lido' });
    }
};

// Rota para obter o carrinho do cliente logado
router.get('/', verificarCliente, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [itensCarrinho] = await db.query(
            'SELECT * FROM CarrinhoDetalhado WHERE id_cliente = ?', 
            [req.clienteId]
        );
        res.status(200).json(itensCarrinho);
    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para adicionar um item ao carrinho
router.post('/adicionar', verificarCliente, async (req, res) => {
    const { id_produto, quantidade } = req.body;

    if (!id_produto || !quantidade || quantidade <= 0) {
        return res.status(400).json({ message: 'ID do produto e quantidade sÃ£o obrigatÃ³rios.' });
    }

    try {
        const db = await connectToDatabase();
        await db.query('CALL AdicionarItemCarrinho(?, ?, ?)', [req.clienteId, id_produto, quantidade]);
        res.status(200).json({ message: 'Produto adicionado ao carrinho com sucesso!' });
    } catch (error) {
        console.error('Erro ao adicionar item ao carrinho:', error);
        // Verifica se o erro Ã© de estoque insuficiente
        if (error.sqlMessage && error.sqlMessage.includes('Estoque insuficiente')) {
            return res.status(400).json({ message: 'Estoque insuficiente para a quantidade solicitada.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para atualizar a quantidade de um item no carrinho
router.put('/atualizar', verificarCliente, async (req, res) => {
    const { id_produto, nova_quantidade } = req.body;

    if (!id_produto || nova_quantidade === undefined || nova_quantidade < 0) {
        return res.status(400).json({ message: 'ID do produto e nova quantidade sÃ£o obrigatÃ³rios.' });
    }

    try {
        const db = await connectToDatabase();
        await db.query('CALL AtualizarQuantidadeItem(?, ?, ?)', [req.clienteId, id_produto, nova_quantidade]);
        res.status(200).json({ message: 'Quantidade atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
        if (error.sqlMessage && error.sqlMessage.includes('Estoque insuficiente')) {
            return res.status(400).json({ message: 'Estoque insuficiente para a quantidade solicitada.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para remover um item do carrinho
router.delete('/remover/:id_produto', verificarCliente, async (req, res) => {
    const { id_produto } = req.params;

    try {
        const db = await connectToDatabase();
        await db.query('CALL RemoverItemCarrinho(?, ?)', [req.clienteId, id_produto]);
        res.status(200).json({ message: 'Produto removido do carrinho com sucesso!' });
    } catch (error) {
        console.error('Erro ao remover item do carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para limpar o carrinho
router.delete('/limpar', verificarCliente, async (req, res) => {
    try {
        const db = await connectToDatabase();
        await db.query('CALL LimparCarrinho(?)', [req.clienteId]);
        res.status(200).json({ message: 'Carrinho esvaziado com sucesso!' });
    } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

export default router;