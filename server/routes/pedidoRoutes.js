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

// Middleware para verificar se é funcionário/admin
const verificarFuncionario = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1]
    if (!token) {
      return res.status(401).json({ message: "Token não fornecido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verificar se é funcionário
    if (decoded.tipo !== "funcionario") {
      return res.status(403).json({ message: "Acesso negado. Apenas funcionários podem acessar." })
    }

    req.funcionario = decoded
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
      `SELECT 
        p.id_pedido,
        p.data_pedido,
        p.status,
        p.frete_nome,
        p.frete_valor,
        p.frete_prazo_dias,
        p.endereco_entrega,
        p.codigo_rastreio,
        p.motivo_cancelamento,
        p.motivo_estorno,
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
          `SELECT 
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

        const [solicitacaoEstorno] = await db.query(
          `SELECT 
            id_solicitacao_estorno,
            status,
            motivo,
            data_solicitacao,
            data_resposta,
            motivo_recusa
          FROM SolicitacaoEstorno
          WHERE id_pedido = ?
          ORDER BY data_solicitacao DESC
          LIMIT 1
        `,
          [pedido.id_pedido],
        )

        return {
          ...pedido,
          itens,
          solicitacao_estorno: solicitacaoEstorno.length > 0 ? solicitacaoEstorno[0] : null,
        }
      }),
    )

    res.json(pedidosCompletos)
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Rota unificada para verificar status de qualquer pagamento pelo link
router.get("/status-geral/:paymentLinkId", verificarToken, async (req, res) => {
  const { paymentLinkId } = req.params
  try {
    const db = await connectToDatabase()

    // 1. Tenta encontrar o status na tabela de Solicitação de Serviço
    const [solicitacaoRows] = await db.query(
      `SELECT S.status 
       FROM SolicitacaoServico S
       JOIN TransacaoPagamento T ON S.id_solicitacao = T.id_solicitacao
       WHERE T.payment_link_id = ?`,
      [paymentLinkId],
    )

    if (solicitacaoRows.length > 0) {
      // Se o status for 'aprovado' ou posterior, consideramos 'pago' para o frontend
      const status = ["aprovado", "em_execucao", "concluido"].includes(solicitacaoRows[0].status) ? "pago" : "pending"
      return res.json({ status })
    }

    // 2. Se não encontrou, tenta na tabela de Pedidos (lógica existente)
    const [pedidoRows] = await db.query(
      `SELECT P.status 
       FROM Pedido P
       JOIN TransacaoPagamento T ON P.id_pedido = T.id_pedido
       WHERE T.payment_link_id = ?`,
      [paymentLinkId],
    )

    if (pedidoRows.length > 0) {
      return res.json({ status: pedidoRows[0].status })
    }

    // 3. Se não encontrou em nenhum, o pagamento ainda está pendente
    res.json({ status: "pending" })
  } catch (error) {
    console.error("Erro ao buscar status geral do pedido:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Rota existente para verificar status por link de pagamento
/*
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
*/

// Rota para listar todos os pedidos (admin)
router.get("/admin/todos", verificarFuncionario, async (req, res) => {
  try {
    const { busca, status } = req.query
    const db = await connectToDatabase()

    let query = `
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.data_pedido,
        p.status,
        p.frete_nome,
        p.frete_valor,
        p.frete_prazo_dias,
        p.endereco_entrega,
        c.nome as nome_cliente,
        c.email as email_cliente,
        c.telefone as telefone_cliente,
        COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) + COALESCE(p.frete_valor, 0) as valor_total
      FROM Pedido p
      LEFT JOIN Cliente c ON p.id_cliente = c.id_cliente
      LEFT JOIN ItemPedido ip ON p.id_pedido = ip.id_pedido
      WHERE 1=1
    `
    const params = []

    if (busca) {
      query += ` AND (p.id_pedido LIKE ? OR c.nome LIKE ? OR c.email LIKE ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }

    if (status) {
      query += ` AND p.status = ?`
      params.push(status)
    }

    query += ` GROUP BY p.id_pedido ORDER BY p.data_pedido DESC`

    const [pedidos] = await db.query(query, params)

    // Buscar itens de cada pedido
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
    console.error("Erro ao buscar todos os pedidos:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Rota para atualizar status do pedido (admin)
router.put("/admin/:id/status", verificarFuncionario, async (req, res) => {
  try {
    const { id } = req.params
    const { novo_status, motivo } = req.body

    // Validar status
    const statusValidos = [
      "aguardando_pagamento",
      "pago",
      "processando",
      "enviado",
      "entregue",
      "cancelado",
      "estornado",
      "falha_pagamento",
    ]

    if (!statusValidos.includes(novo_status)) {
      return res.status(400).json({ message: "Status inválido" })
    }

    // Verificar se cancelamento ou estorno tem motivo
    if ((novo_status === "cancelado" || novo_status === "estornado") && !motivo) {
      return res.status(400).json({ message: "Motivo é obrigatório para cancelamento ou estorno" })
    }

    const db = await connectToDatabase()

    // Verificar se o pedido existe
    const [pedidoExiste] = await db.query("SELECT id_pedido, status FROM Pedido WHERE id_pedido = ?", [id])
    if (pedidoExiste.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado" })
    }

    // Atualizar status do pedido
    await db.query("UPDATE Pedido SET status = ? WHERE id_pedido = ?", [novo_status, id])

    // Se houver motivo, registrar no histórico (você pode criar uma tabela de histórico se desejar)
    if (motivo) {
      console.log(`Pedido #${id} ${novo_status} - Motivo: ${motivo}`)
      // Aqui você pode inserir em uma tabela de histórico de pedidos se tiver uma
    }

    res.json({ message: "Status do pedido atualizado com sucesso", novo_status })
  } catch (error) {
    console.error("Erro ao atualizar status do pedido:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

router.post("/:id/solicitar-estorno", verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    const { motivo } = req.body

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({ message: "Motivo é obrigatório para solicitar estorno" })
    }

    const db = await connectToDatabase()
    const clienteId = req.cliente.id_cliente || req.cliente.id || req.cliente.userId || req.cliente.cliente_id

    // Verificar se o pedido existe e pertence ao cliente
    const [pedido] = await db.query(
      "SELECT id_pedido, status, id_cliente FROM Pedido WHERE id_pedido = ? AND id_cliente = ?",
      [id, clienteId],
    )

    if (pedido.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado ou não pertence a você" })
    }

    // Verificar se o status permite estorno (pago ou entregue)
    if (!["pago", "entregue"].includes(pedido[0].status)) {
      return res.status(400).json({ message: "Apenas pedidos pagos ou entregues podem ser estornados" })
    }

    // Verificar se já existe uma solicitação de estorno
    const [solicitacaoExistente] = await db.query(
      "SELECT id_solicitacao_estorno FROM SolicitacaoEstorno WHERE id_pedido = ?",
      [id],
    )

    if (solicitacaoExistente.length > 0) {
      return res.status(400).json({ message: "Já existe uma solicitação de estorno para este pedido" })
    }

    // Criar solicitação de estorno
    await db.query("INSERT INTO SolicitacaoEstorno (id_pedido, id_cliente, motivo) VALUES (?, ?, ?)", [
      id,
      clienteId,
      motivo.trim(),
    ])

    console.log(`✅ Solicitação de estorno criada para o pedido #${id}`)
    res.status(201).json({ message: "Solicitação de estorno enviada com sucesso" })
  } catch (error) {
    console.error("Erro ao solicitar estorno:", error)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

export default router
