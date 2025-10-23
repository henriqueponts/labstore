// Arquivo: server/routes/assistenciaRoutes.js

import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("🔧 assistenciaRoutes.js carregado!")

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/assistencia")
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "assistencia-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por arquivo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, webp)"))
    }
  },
})

// Middleware de autenticação
const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = decoded.id
    req.userType = decoded.tipo
    req.userProfile = decoded.perfil

    next()
  } catch (err) {
    console.error("🚫 Erro na autenticação:", err.message)
    return res.status(401).json({ message: "Token inválido" })
  }
}

// Middleware para verificar se é funcionário
const verifyFuncionario = (req, res, next) => {
  if (req.userType !== "funcionario") {
    return res.status(403).json({ message: "Acesso negado. Apenas funcionários." })
  }
  next()
}

// ==================== ROTAS PARA CLIENTES ====================

// Criar nova solicitação de manutenção
router.post("/solicitar", verifyAuth, upload.array("fotos", 5), async (req, res) => {
  console.log("📝 POST /assistencia/solicitar chamado")
  try {
    if (req.userType !== "cliente") {
      return res.status(403).json({ message: "Apenas clientes podem criar solicitações" })
    }

    const { tipo_equipamento, marca, modelo, descricao_problema, forma_envio } = req.body

    // Validação
    if (!tipo_equipamento || !marca || !modelo || !descricao_problema || !forma_envio) {
      return res.status(400).json({ message: "Todos os campos do equipamento são obrigatórios" })
    }

    const db = await connectToDatabase()

    const id_cliente = req.userId

    const [result] = await db.query(
      `INSERT INTO SolicitacaoServico 
      (id_cliente, tipo_equipamento, marca, modelo, descricao_problema, forma_envio, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'solicitado')`,
      [id_cliente, tipo_equipamento, marca, modelo, descricao_problema, forma_envio],
    )

    const id_solicitacao = result.insertId

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const fotoValues = req.files.map((file) => [id_solicitacao, `/uploads/assistencia/${file.filename}`])

      await db.query("INSERT INTO FotoSolicitacao (id_solicitacao, foto_url) VALUES ?", [fotoValues])
    }

    console.log(`✅ Solicitação criada com ID: ${id_solicitacao}`)
    res.status(201).json({
      message: "Solicitação criada com sucesso",
      id_solicitacao: id_solicitacao,
      protocolo: `AT-${id_solicitacao.toString().padStart(6, "0")}`,
    })
  } catch (err) {
    console.error("❌ Erro ao criar solicitação:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar solicitações do cliente logado
router.get("/minhas-solicitacoes", verifyAuth, async (req, res) => {
  console.log("📊 GET /assistencia/minhas-solicitacoes chamado")
  try {
    if (req.userType !== "cliente") {
      return res.status(403).json({ message: "Apenas clientes podem acessar suas solicitações" })
    }

    const db = await connectToDatabase()

    const [solicitacoes] = await db.query(
      `SELECT 
        s.id_solicitacao, s.tipo_equipamento, s.marca, s.modelo, s.descricao_problema, s.forma_envio,
        s.data_solicitacao, s.status, s.data_aprovacao_orcamento, s.data_conclusao_servico, s.motivo_recusa_orcamento,
        o.id_orcamento, o.diagnostico, o.valor_pecas, o.valor_mao_obra, o.prazo_entrega_dias,
        o.observacoes_tecnicas, o.status_aprovacao, o.data_criacao_orcamento,
        u.nome as nome_analista
      FROM SolicitacaoServico s
      LEFT JOIN Orcamento o ON s.id_solicitacao = o.id_solicitacao
      LEFT JOIN Usuario u ON o.id_analista = u.id_usuario
      WHERE s.id_cliente = ?
      ORDER BY s.data_solicitacao DESC`,
      [req.userId],
    )

    for (const solicitacao of solicitacoes) {
      const [fotos] = await db.query(
        "SELECT foto_url FROM FotoSolicitacao WHERE id_solicitacao = ? ORDER BY data_upload",
        [solicitacao.id_solicitacao],
      )
      solicitacao.fotos = fotos.map((f) => f.foto_url)
    }

    console.log(`📋 ${solicitacoes.length} solicitações encontradas`)
    res.status(200).json(solicitacoes)
  } catch (err) {
    console.error("❌ Erro ao buscar solicitações:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Obter detalhes de uma solicitação específica
router.get("/solicitacao/:id", verifyAuth, async (req, res) => {
  console.log("🔍 GET /assistencia/solicitacao/:id chamado")
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [solicitacao] = await db.query(
      `SELECT 
        s.*,
        o.id_orcamento, o.diagnostico, o.valor_pecas, o.valor_mao_obra, o.prazo_entrega_dias,
        o.observacoes_tecnicas, o.status_aprovacao, o.data_criacao_orcamento,
        u.nome as nome_analista,
        c.nome as nome_cliente, c.email as email_cliente, c.telefone as telefone_cliente
      FROM SolicitacaoServico s
      LEFT JOIN Orcamento o ON s.id_solicitacao = o.id_solicitacao
      LEFT JOIN Usuario u ON o.id_analista = u.id_usuario
      LEFT JOIN Cliente c ON s.id_cliente = c.id_cliente
      WHERE s.id_solicitacao = ?`,
      [id],
    )

    if (solicitacao.length === 0) {
      return res.status(404).json({ message: "Solicitação não encontrada" })
    }

    if (req.userType === "cliente" && solicitacao[0].id_cliente !== req.userId) {
      return res.status(403).json({ message: "Acesso negado" })
    }

    const [fotos] = await db.query(
      "SELECT foto_url FROM FotoSolicitacao WHERE id_solicitacao = ? ORDER BY data_upload",
      [id],
    )
    solicitacao[0].fotos = fotos.map((f) => f.foto_url)

    res.status(200).json(solicitacao[0])
  } catch (err) {
    console.error("❌ Erro ao buscar solicitação:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Aprovar orçamento
router.put("/aprovar-orcamento/:id", verifyAuth, async (req, res) => {
  console.log("✅ PUT /assistencia/aprovar-orcamento/:id chamado")
  try {
    if (req.userType !== "cliente") {
      return res.status(403).json({ message: "Apenas clientes podem aprovar orçamentos" })
    }
    const { id } = req.params
    const db = await connectToDatabase()

    const [solicitacao] = await db.query("SELECT id_cliente, status FROM SolicitacaoServico WHERE id_solicitacao = ?", [id])
    if (solicitacao.length === 0) return res.status(404).json({ message: "Solicitação não encontrada" })
    if (solicitacao[0].id_cliente !== req.userId) return res.status(403).json({ message: "Acesso negado" })
    if (solicitacao[0].status !== "aguardando_aprovacao") return res.status(400).json({ message: "Solicitação não está aguardando aprovação" })

    await db.query("UPDATE SolicitacaoServico SET status = 'aguardando_pagamento', data_aprovacao_orcamento = NOW() WHERE id_solicitacao = ?", [id])
    await db.query("UPDATE Orcamento SET status_aprovacao = 'aprovado' WHERE id_solicitacao = ?", [id])

    console.log(`✅ Orçamento aprovado para solicitação ${id}`)
    res.status(200).json({ message: "Orçamento aprovado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao aprovar orçamento:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Rejeitar orçamento
router.put("/rejeitar-orcamento/:id", verifyAuth, async (req, res) => {
  console.log("❌ PUT /assistencia/rejeitar-orcamento/:id chamado")
  try {
    if (req.userType !== "cliente") {
      return res.status(403).json({ message: "Apenas clientes podem rejeitar orçamentos" })
    }
    const { id } = req.params
    const { motivo } = req.body
    const db = await connectToDatabase()

    const [solicitacao] = await db.query("SELECT id_cliente, status FROM SolicitacaoServico WHERE id_solicitacao = ?", [id])
    if (solicitacao.length === 0) return res.status(404).json({ message: "Solicitação não encontrada" })
    if (solicitacao[0].id_cliente !== req.userId) return res.status(403).json({ message: "Acesso negado" })
    if (solicitacao[0].status !== "aguardando_aprovacao") return res.status(400).json({ message: "Solicitação não está aguardando aprovação" })

    await db.query("UPDATE SolicitacaoServico SET status = 'rejeitado', motivo_recusa_orcamento = ? WHERE id_solicitacao = ?", [motivo ? motivo.trim() : null, id])
    await db.query("UPDATE Orcamento SET status_aprovacao = 'recusado' WHERE id_solicitacao = ?", [id])

    console.log(`❌ Orçamento rejeitado para solicitação ${id}`)
    res.status(200).json({ message: "Orçamento rejeitado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao rejeitar orçamento:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Cancelar solicitação
router.put("/cancelar/:id", verifyAuth, async (req, res) => {
  console.log("🚫 PUT /assistencia/cancelar/:id chamado")
  try {
    if (req.userType !== "cliente") {
      return res.status(403).json({ message: "Apenas clientes podem cancelar solicitações" })
    }
    const { id } = req.params
    const db = await connectToDatabase()

    const [solicitacao] = await db.query("SELECT id_cliente, status FROM SolicitacaoServico WHERE id_solicitacao = ?", [id])
    if (solicitacao.length === 0) return res.status(404).json({ message: "Solicitação não encontrada" })
    if (solicitacao[0].id_cliente !== req.userId) return res.status(403).json({ message: "Acesso negado" })
    if (solicitacao[0].status !== "solicitado") return res.status(400).json({ message: "Esta solicitação já está em análise e não pode mais ser cancelada." })

    await db.query("UPDATE SolicitacaoServico SET status = 'cancelado' WHERE id_solicitacao = ?", [id])

    console.log(`🚫 Solicitação ${id} cancelada`)
    res.status(200).json({ message: "Solicitação cancelada com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao cancelar solicitação:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Confirmar pagamento
router.put("/confirmar-pagamento/:id", verifyAuth, async (req, res) => {
  console.log("💳 PUT /assistencia/confirmar-pagamento/:id chamado")
  try {
    if (req.userType !== "cliente") {
      return res.status(403).json({ message: "Apenas clientes podem confirmar pagamento" })
    }
    const { id } = req.params
    const db = await connectToDatabase()

    const [solicitacao] = await db.query("SELECT id_cliente, status FROM SolicitacaoServico WHERE id_solicitacao = ?", [id])
    if (solicitacao.length === 0) return res.status(404).json({ message: "Solicitação não encontrada" })
    if (solicitacao[0].id_cliente !== req.userId) return res.status(403).json({ message: "Acesso negado" })
    if (solicitacao[0].status !== "aguardando_pagamento") return res.status(400).json({ message: "Solicitação não está aguardando pagamento" })

    await db.query("UPDATE SolicitacaoServico SET status = 'aprovado' WHERE id_solicitacao = ?", [id])

    console.log(`💳 Pagamento confirmado para solicitação ${id}`)
    res.status(200).json({ message: "Pagamento confirmado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao confirmar pagamento:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// ==================== ROTAS PARA FUNCIONÁRIOS ====================

// Listar todas as solicitações (funcionários)
router.get("/gestao/solicitacoes", verifyAuth, verifyFuncionario, async (req, res) => {
  console.log("📊 GET /assistencia/gestao/solicitacoes chamado")
  try {
    const { status, busca } = req.query
    const db = await connectToDatabase()

    let query = `
      SELECT 
        s.id_solicitacao, s.tipo_equipamento, s.marca, s.modelo, s.descricao_problema, s.forma_envio,
        s.data_solicitacao, s.status,
        c.nome as nome_cliente, c.email as email_cliente, c.telefone as telefone_cliente,
        o.id_orcamento, o.status_aprovacao,
        u.nome as nome_analista
      FROM SolicitacaoServico s
      JOIN Cliente c ON s.id_cliente = c.id_cliente
      LEFT JOIN Orcamento o ON s.id_solicitacao = o.id_solicitacao
      LEFT JOIN Usuario u ON o.id_analista = u.id_usuario
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ` AND s.status = ?`
      params.push(status)
    }

    if (busca) {
      const buscaId = busca.replace(/\D/g, "")
      query += ` AND (c.nome LIKE ? OR s.marca LIKE ? OR s.modelo LIKE ? OR s.id_solicitacao = ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`, buscaId || 0)
    }

    query += ` ORDER BY s.data_solicitacao DESC`

    const [solicitacoes] = await db.query(query, params)

    console.log(`📋 ${solicitacoes.length} solicitações encontradas`)
    res.status(200).json(solicitacoes)
  } catch (err) {
    console.error("❌ Erro ao buscar solicitações:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Criar orçamento para uma solicitação
router.post("/gestao/criar-orcamento/:id", verifyAuth, verifyFuncionario, async (req, res) => {
  console.log("💰 POST /assistencia/gestao/criar-orcamento/:id chamado")
  try {
    const { id } = req.params
    const { diagnostico, valor_pecas, valor_mao_obra, prazo_entrega_dias, observacoes_tecnicas } = req.body

    if (!diagnostico || !valor_mao_obra) {
      return res.status(400).json({ message: "Diagnóstico e valor da mão de obra são obrigatórios" })
    }

    if (prazo_entrega_dias && (Number.isNaN(parseInt(prazo_entrega_dias)) || parseInt(prazo_entrega_dias) > 365)) {
        return res.status(400).json({ message: "O prazo de entrega não pode exceder 365 dias." });
    }

    const db = await connectToDatabase()
    const [solicitacao] = await db.query("SELECT status FROM SolicitacaoServico WHERE id_solicitacao = ?", [id])
    if (solicitacao.length === 0) return res.status(404).json({ message: "Solicitação não encontrada" })

    const [orcamentoExistente] = await db.query("SELECT id_orcamento FROM Orcamento WHERE id_solicitacao = ?", [id])
    if (orcamentoExistente.length > 0) return res.status(400).json({ message: "Já existe um orçamento para esta solicitação" })

    await db.query(
      `INSERT INTO Orcamento 
      (id_solicitacao, id_analista, diagnostico, valor_pecas, valor_mao_obra, prazo_entrega_dias, observacoes_tecnicas, status_aprovacao) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [id, req.userId, diagnostico, valor_pecas || null, valor_mao_obra, prazo_entrega_dias || null, observacoes_tecnicas || null],
    )

    await db.query("UPDATE SolicitacaoServico SET status = 'aguardando_aprovacao' WHERE id_solicitacao = ?", [id])

    console.log(`✅ Orçamento criado para solicitação ${id}`)
    res.status(201).json({ message: "Orçamento criado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao criar orçamento:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Atualizar status da solicitação
router.put("/gestao/atualizar-status/:id", verifyAuth, verifyFuncionario, async (req, res) => {
  console.log("🔄 PUT /assistencia/gestao/atualizar-status/:id chamado")
  try {
    const { id } = req.params
    const { status } = req.body

    const statusValidos = [
      "solicitado", "em_analise", "aguardando_aprovacao", "aprovado", "rejeitado",
      "em_execucao", "cancelado", "aguardando_pagamento", "aguardando_retirada_envio", "concluido",
    ]

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ message: "Status inválido" })
    }

    const db = await connectToDatabase()
    const [solicitacao] = await db.query("SELECT id_solicitacao FROM SolicitacaoServico WHERE id_solicitacao = ?", [id])
    if (solicitacao.length === 0) return res.status(404).json({ message: "Solicitação não encontrada" })

    let updateQuery = "UPDATE SolicitacaoServico SET status = ?"
    const params = [status]
    if (status === "concluido") {
      updateQuery += ", data_conclusao_servico = NOW()"
    }
    updateQuery += " WHERE id_solicitacao = ?"
    params.push(id)

    await db.query(updateQuery, params)

    console.log(`✅ Status da solicitação ${id} atualizado para ${status}`)
    res.status(200).json({ message: "Status atualizado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ assistenciaRoutes.js configurado!")

export default router