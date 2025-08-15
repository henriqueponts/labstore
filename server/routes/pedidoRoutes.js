import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"

const router = express.Router()

// Middleware para verificar token
const verificarToken = (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.cliente = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: "Token inválido" })
  }
}

// Rota para buscar pedidos do cliente logado
router.get("/meus-pedidos", verificarToken, async (req, res) => {
  try {
    const db = await connectToDatabase()

    const clienteId = req.cliente.id_cliente || req.cliente.id || req.cliente.userId || req.cliente.cliente_id

    if (!clienteId) {
      return res.status(400).json({ message: "ID do cliente não encontrado no token" })
    }

    const [pedidos] = await db.query(
      `
      SELECT 
        p.id_pedido,
        p.data_pedido,
        p.status,
        p.frete_nome,
        p.frete_valor,
        p.frete_prazo_dias,
        p.endereco_entrega,
        COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) + COALESCE(p.frete_valor, 0) as valor_total
      FROM Pedido p
      LEFT JOIN ItemPedido ip ON p.id_pedido = ip.id_pedido
      WHERE p.id_cliente = ?
      GROUP BY p.id_pedido
      ORDER BY p.data_pedido DESC
    `,
      [clienteId],
    )

    const pedidosCompletos = await Promise.all(
      pedidos.map(async (pedido) => {
        const [itens] = await db.query(
          `
          SELECT 
            ip.id_produto,
            ip.quantidade,
            ip.preco_unitario,
            (ip.quantidade * ip.preco_unitario) as subtotal,
            pr.nome as nome_produto,
            pi.url_imagem as imagem_principal
          FROM ItemPedido ip
          JOIN Produto pr ON ip.id_produto = pr.id_produto
          LEFT JOIN ProdutoImagem pi ON pr.id_produto = pi.id_produto AND pi.is_principal = TRUE
          WHERE ip.id_pedido = ?
          ORDER BY ip.id_item_pedido
        `,
          [pedido.id_pedido],
        )

        return {
          ...pedido,
          itens,
        }
      }),
    )

    res.json(pedidosCompletos)
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Rota existente para verificar status por link de pagamento
router.get("/status-por-link/:paymentLinkId", verificarToken, async (req, res) => {
  const { paymentLinkId } = req.params

  try {
    const db = await connectToDatabase()

    const [rows] = await db.query(
      `SELECT P.status 
       FROM Pedido P
       JOIN TransacaoPagamento T ON P.id_pedido = T.id_pedido
       WHERE T.payment_link_id = ?`,
      [paymentLinkId],
    )

    if (rows.length > 0) {
      res.json({ status: rows[0].status })
    } else {
      res.json({ status: "pending" })
    }
  } catch (error) {
    console.error("Erro ao buscar status do pedido:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

export default router
