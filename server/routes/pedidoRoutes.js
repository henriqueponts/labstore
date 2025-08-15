import express from 'express';
import { connectToDatabase } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware simples para verificar token (pode usar o seu 'verificarCliente' se preferir)
const verificarToken = (req, res, next) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// A nova rota que o frontend vai chamar
router.get('/status-por-link/:paymentLinkId', verificarToken, async (req, res) => {
  const { paymentLinkId } = req.params;

  try {
    const db = await connectToDatabase();
    
    // Busca na nossa tabela de transações usando o ID do link de pagamento
    const [rows] = await db.query(
      `SELECT P.status 
       FROM Pedido P
       JOIN TransacaoPagamento T ON P.id_pedido = T.id_pedido
       WHERE T.payment_link_id = ?`,
      [paymentLinkId]
    );

    if (rows.length > 0) {
      // Encontrou o pedido, retorna o status do nosso banco
      res.json({ status: rows[0].status }); // Ex: { status: 'pago' }
    } else {
      // O webhook ainda não processou, então o pedido está pendente
      res.json({ status: 'pending' });
    }
  } catch (error) {
    console.error("Erro ao buscar status do pedido:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;