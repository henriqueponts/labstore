import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"

const router = express.Router()

console.log("📞 chamadosRoutes.js carregado!")

// Middleware de verificação de token
const verifyToken = async (req, res, next) => {
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

// Middleware para verificar se é cliente
const verifyCliente = (req, res, next) => {
  if (req.userType !== "cliente") {
    return res.status(403).json({ message: "Acesso negado. Apenas clientes podem abrir chamados." })
  }
  next()
}

// Middleware para verificar se é funcionário
const verifyFuncionario = (req, res, next) => {
  if (req.userType !== "funcionario") {
    return res.status(403).json({ message: "Acesso negado. Apenas funcionários." })
  }
  next()
}

// Buscar histórico de respostas de um chamado (para funcionários)
router.get("/:id/respostas", verifyToken, verifyFuncionario, async (req, res) => {
  console.log(`📋 GET /chamados/${req.params.id}/respostas chamado`)
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // Verificar se o chamado existe
    const [chamadoExists] = await db.query(`SELECT id_chamado FROM ChamadoSuporte WHERE id_chamado = ?`, [id])

    if (chamadoExists.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado" })
    }

    // Buscar histórico de respostas
    const [respostas] = await db.query(
      `
        SELECT 
            rc.resposta,
            rc.data_resposta,
            rc.tipo_usuario,
            CASE 
                WHEN rc.tipo_usuario = 'funcionario' THEN u.nome
                WHEN rc.tipo_usuario = 'cliente' THEN c.nome
            END as nome_usuario
        FROM RespostaChamado rc
        LEFT JOIN Usuario u ON rc.id_funcionario = u.id_usuario AND rc.tipo_usuario = 'funcionario'
        LEFT JOIN Cliente c ON rc.id_cliente = c.id_cliente AND rc.tipo_usuario = 'cliente'
        WHERE rc.id_chamado = ?
        ORDER BY rc.data_resposta ASC
      `,
      [id],
    )

    console.log(`📞 ${respostas.length} respostas encontradas para chamado ${id}`)
    res.status(200).json(respostas)
  } catch (err) {
    console.error("❌ Erro ao buscar respostas do chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar chamados do cliente logado
router.get("/meus-chamados", verifyToken, verifyCliente, async (req, res) => {
  console.log("📋 GET /chamados/meus-chamados chamado")
  try {
    const db = await connectToDatabase()
    const [chamados] = await db.query(
      `
            SELECT 
                cs.id_chamado,
                cs.assunto,
                cs.descricao,
                cs.categoria,
                cs.status,
                cs.data_abertura,
                cs.ultima_resposta,
                cs.data_ultima_resposta,
                cs.proximo_responder,
                cs.total_respostas,
                cs.ultima_atividade,
                u.nome as funcionario_nome
            FROM ChamadoSuporte cs
            LEFT JOIN Usuario u ON cs.funcionario_responsavel = u.id_usuario
            WHERE cs.id_cliente = ? 
            ORDER BY cs.ultima_atividade DESC
        `,
      [req.userId],
    )

    console.log(`📞 ${chamados.length} chamados encontrados para cliente ${req.userId}`)
    res.status(200).json(chamados)
  } catch (err) {
    console.error("❌ Erro ao buscar chamados:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Buscar detalhes de um chamado específico (para cliente)
router.get("/meu-chamado/:id", verifyToken, verifyCliente, async (req, res) => {
  console.log(`📋 GET /chamados/meu-chamado/${req.params.id} chamado`)
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // Buscar o chamado
    const [chamados] = await db.query(
      `
            SELECT 
                cs.id_chamado,
                cs.assunto,
                cs.descricao,
                cs.categoria,
                cs.status,
                cs.data_abertura,
                cs.ultima_resposta,
                cs.data_ultima_resposta,
                cs.proximo_responder,
                cs.total_respostas,
                cs.ultima_atividade,
                u.nome as funcionario_nome
            FROM ChamadoSuporte cs
            LEFT JOIN Usuario u ON cs.funcionario_responsavel = u.id_usuario
            WHERE cs.id_chamado = ? AND cs.id_cliente = ?
        `,
      [id, req.userId],
    )

    if (chamados.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado" })
    }

    // Buscar histórico de respostas
    const [respostas] = await db.query(
      `
            SELECT 
                rc.resposta,
                rc.data_resposta,
                rc.tipo_usuario,
                CASE 
                    WHEN rc.tipo_usuario = 'funcionario' THEN u.nome
                    WHEN rc.tipo_usuario = 'cliente' THEN c.nome
                END as nome_usuario
            FROM RespostaChamado rc
            LEFT JOIN Usuario u ON rc.id_funcionario = u.id_usuario AND rc.tipo_usuario = 'funcionario'
            LEFT JOIN Cliente c ON rc.id_cliente = c.id_cliente AND rc.tipo_usuario = 'cliente'
            WHERE rc.id_chamado = ?
            ORDER BY rc.data_resposta ASC
        `,
      [id],
    )

    const chamadoCompleto = {
      ...chamados[0],
      respostas: respostas,
    }

    console.log(`📞 Detalhes do chamado ${id} encontrados`)
    res.status(200).json(chamadoCompleto)
  } catch (err) {
    console.error("❌ Erro ao buscar detalhes do chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Cliente responder chamado
router.post("/:id/responder-cliente", verifyToken, verifyCliente, async (req, res) => {
  console.log(`💬 POST /chamados/${req.params.id}/responder-cliente chamado`)
  try {
    const { id } = req.params
    const { resposta } = req.body

    if (!resposta || !resposta.trim()) {
      return res.status(400).json({ message: "Resposta é obrigatória" })
    }

    const db = await connectToDatabase()

    // Verificar se o chamado existe e pertence ao cliente
    const [chamadoExists] = await db.query(
      `
            SELECT id_chamado, status, proximo_responder 
            FROM ChamadoSuporte 
            WHERE id_chamado = ? AND id_cliente = ?
        `,
      [id, req.userId],
    )

    if (chamadoExists.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado" })
    }

    const chamado = chamadoExists[0]

    if (chamado.status === "encerrado") {
      return res.status(400).json({ message: "Não é possível responder um chamado encerrado" })
    }

    if (chamado.proximo_responder !== "cliente") {
      return res.status(400).json({
        message: "Aguarde a resposta do funcionário antes de enviar uma nova mensagem",
      })
    }

    // Iniciar transação
    await db.query("START TRANSACTION")

    try {
      // Inserir resposta na tabela de respostas (apenas id_cliente, id_funcionario fica NULL)
      await db.query(
        `
                INSERT INTO RespostaChamado (id_chamado, id_cliente, resposta, tipo_usuario) 
                VALUES (?, ?, ?, 'cliente')
            `,
        [id, req.userId, resposta.trim()],
      )

      // Atualizar chamado
      await db.query(
        `
                UPDATE ChamadoSuporte 
                SET status = 'aguardando_funcionario',
                    proximo_responder = 'funcionario',
                    ultima_resposta = ?,
                    data_ultima_resposta = NOW(),
                    ultima_atividade = NOW()
                WHERE id_chamado = ?
            `,
        [resposta.trim(), id],
      )

      // Confirmar transação
      await db.query("COMMIT")

      console.log(`✅ Cliente ${req.userId} respondeu chamado ${id}`)

      res.status(200).json({
        message: "Resposta enviada com sucesso!",
        status: "aguardando_funcionario",
      })
    } catch (err) {
      // Reverter transação em caso de erro
      await db.query("ROLLBACK")
      throw err
    }
  } catch (err) {
    console.error("❌ Erro ao cliente responder chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Criar novo chamado
router.post("/criar", verifyToken, verifyCliente, async (req, res) => {
  console.log("📝 POST /chamados/criar chamado")
  try {
    const { assunto, descricao, categoria } = req.body

    if (!assunto || !descricao) {
      return res.status(400).json({ message: "Assunto e descrição são obrigatórios" })
    }

    const db = await connectToDatabase()
    const [result] = await db.query(
      `
            INSERT INTO ChamadoSuporte (id_cliente, assunto, descricao, categoria, proximo_responder) 
            VALUES (?, ?, ?, ?, 'funcionario')
        `,
      [req.userId, assunto, descricao, categoria || null],
    )

    // Buscar o chamado criado para retornar com o ID
    const [novoChamado] = await db.query(
      `
            SELECT 
                id_chamado,
                assunto,
                descricao,
                categoria,
                status,
                data_abertura
            FROM ChamadoSuporte 
            WHERE id_chamado = ?
        `,
      [result.insertId],
    )

    console.log(`✅ Chamado ${result.insertId} criado para cliente ${req.userId}`)
    res.status(201).json({
      message: "Chamado criado com sucesso!",
      chamado: novoChamado[0],
      protocolo: `LAB${result.insertId.toString().padStart(6, "0")}`,
    })
  } catch (err) {
    console.error("❌ Erro ao criar chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Encerrar chamado
router.put("/:id/encerrar", verifyToken, verifyCliente, async (req, res) => {
  console.log(`🔒 PUT /chamados/${req.params.id}/encerrar chamado`)
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // Verificar se o chamado pertence ao cliente
    const [chamadoExists] = await db.query(
      `
            SELECT id_chamado FROM ChamadoSuporte 
            WHERE id_chamado = ? AND id_cliente = ? AND status != 'encerrado'
        `,
      [id, req.userId],
    )

    if (chamadoExists.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado ou já encerrado" })
    }

    await db.query(
      `
            UPDATE ChamadoSuporte 
            SET status = 'encerrado',
                proximo_responder = NULL,
                ultima_atividade = NOW()
            WHERE id_chamado = ?
        `,
      [id],
    )

    console.log(`✅ Chamado ${id} encerrado pelo cliente ${req.userId}`)
    res.status(200).json({ message: "Chamado encerrado com sucesso!" })
  } catch (err) {
    console.error("❌ Erro ao encerrar chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todos os chamados (para funcionários)
router.get("/todos", verifyToken, verifyFuncionario, async (req, res) => {
  console.log("📋 GET /chamados/todos chamado")
  try {
    const { status, categoria, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const db = await connectToDatabase()

    let whereClause = "WHERE 1=1"
    const params = []

    if (status && status !== "todos") {
      whereClause += " AND cs.status = ?"
      params.push(status)
    }

    if (categoria && categoria !== "todas") {
      whereClause += " AND cs.categoria = ?"
      params.push(categoria)
    }

    // Buscar chamados com paginação
    const [chamados] = await db.query(
      `
            SELECT 
                cs.id_chamado,
                cs.assunto,
                cs.descricao,
                cs.categoria,
                cs.status,
                cs.data_abertura,
                cs.proximo_responder,
                cs.total_respostas,
                cs.ultima_atividade,
                c.nome as cliente_nome,
                c.email as cliente_email,
                c.telefone as cliente_telefone
            FROM ChamadoSuporte cs
            JOIN Cliente c ON cs.id_cliente = c.id_cliente
            ${whereClause}
            ORDER BY 
                CASE cs.status 
                    WHEN 'aberto' THEN 1
                    WHEN 'aguardando_funcionario' THEN 2
                    WHEN 'em_andamento' THEN 3
                    WHEN 'respondido' THEN 4
                    WHEN 'aguardando_cliente' THEN 5
                    WHEN 'resolvido' THEN 6
                    WHEN 'encerrado' THEN 7
                END,
                cs.ultima_atividade DESC
            LIMIT ? OFFSET ?
        `,
      [...params, Number.parseInt(limit), Number.parseInt(offset)],
    )

    // Contar total de chamados
    const [totalResult] = await db.query(
      `
            SELECT COUNT(*) as total
            FROM ChamadoSuporte cs
            JOIN Cliente c ON cs.id_cliente = c.id_cliente
            ${whereClause}
        `,
      params,
    )

    const total = totalResult[0].total
    const totalPages = Math.ceil(total / limit)

    console.log(`📞 ${chamados.length} chamados encontrados (página ${page}/${totalPages})`)
    res.status(200).json({
      chamados,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number.parseInt(limit),
      },
    })
  } catch (err) {
    console.error("❌ Erro ao buscar todos os chamados:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Buscar chamado específico (para funcionários)
router.get("/:id", verifyToken, verifyFuncionario, async (req, res) => {
  console.log(`📋 GET /chamados/${req.params.id} chamado`)
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [chamados] = await db.query(
      `
            SELECT 
                cs.id_chamado,
                cs.assunto,
                cs.descricao,
                cs.categoria,
                cs.status,
                cs.data_abertura,
                cs.proximo_responder,
                cs.total_respostas,
                cs.ultima_atividade,
                c.id_cliente,
                c.nome as cliente_nome,
                c.email as cliente_email,
                c.telefone as cliente_telefone,
                c.cpf_cnpj as cliente_documento
            FROM ChamadoSuporte cs
            JOIN Cliente c ON cs.id_cliente = c.id_cliente
            WHERE cs.id_chamado = ?
        `,
      [id],
    )

    if (chamados.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado" })
    }

    console.log(`📞 Chamado ${id} encontrado`)
    res.status(200).json(chamados[0])
  } catch (err) {
    console.error("❌ Erro ao buscar chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Atualizar status do chamado (para funcionários)
router.put("/:id/status", verifyToken, verifyFuncionario, async (req, res) => {
  console.log(`🔄 PUT /chamados/${req.params.id}/status chamado`)
  try {
    const { id } = req.params
    const { status, observacao } = req.body

    const statusValidos = [
      "aberto",
      "em_andamento",
      "respondido",
      "aguardando_cliente",
      "aguardando_funcionario",
      "encerrado",
      "resolvido",
    ]
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ message: "Status inválido" })
    }

    const db = await connectToDatabase()

    const [chamadoExists] = await db.query(
      `
            SELECT id_chamado FROM ChamadoSuporte WHERE id_chamado = ?
        `,
      [id],
    )

    if (chamadoExists.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado" })
    }

    // Determinar próximo responder baseado no status
    let proximoResponder = null
    if (status === "aguardando_cliente") {
      proximoResponder = "cliente"
    } else if (status === "aguardando_funcionario") {
      proximoResponder = "funcionario"
    }

    await db.query(
      `
            UPDATE ChamadoSuporte 
            SET status = ?,
                proximo_responder = ?,
                ultima_atividade = NOW()
            WHERE id_chamado = ?
        `,
      [status, proximoResponder, id],
    )

    console.log(`✅ Status do chamado ${id} atualizado para ${status} por funcionário ${req.userId}`)

    res.status(200).json({
      message: "Status atualizado com sucesso!",
      status: status,
    })
  } catch (err) {
    console.error("❌ Erro ao atualizar status:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Responder chamado (para funcionários)
router.post("/:id/responder", verifyToken, verifyFuncionario, async (req, res) => {
  console.log(`💬 POST /chamados/${req.params.id}/responder chamado`)
  try {
    const { id } = req.params
    const { resposta } = req.body

    if (!resposta || !resposta.trim()) {
      return res.status(400).json({ message: "Resposta é obrigatória" })
    }

    const db = await connectToDatabase()

    // Verificar se o chamado existe
    const [chamadoExists] = await db.query(
      `
            SELECT id_chamado, status FROM ChamadoSuporte WHERE id_chamado = ?
        `,
      [id],
    )

    if (chamadoExists.length === 0) {
      return res.status(404).json({ message: "Chamado não encontrado" })
    }

    if (chamadoExists[0].status === "encerrado") {
      return res.status(400).json({ message: "Não é possível responder um chamado encerrado" })
    }

    // Iniciar transação
    await db.query("START TRANSACTION")

    try {
      // Inserir resposta na tabela de respostas (apenas id_funcionario, id_cliente fica NULL)
      await db.query(
        `
                INSERT INTO RespostaChamado (id_chamado, id_funcionario, resposta, tipo_usuario) 
                VALUES (?, ?, ?, 'funcionario')
            `,
        [id, req.userId, resposta.trim()],
      )

      // Atualizar chamado com a última resposta e status
      await db.query(
        `
                UPDATE ChamadoSuporte 
                SET status = 'aguardando_cliente',
                    proximo_responder = 'cliente',
                    ultima_resposta = ?,
                    data_ultima_resposta = NOW(),
                    funcionario_responsavel = ?,
                    ultima_atividade = NOW()
                WHERE id_chamado = ?
            `,
        [resposta.trim(), req.userId, id],
      )

      // Confirmar transação
      await db.query("COMMIT")

      console.log(`✅ Chamado ${id} respondido por funcionário ${req.userId}`)

      res.status(200).json({
        message: "Resposta enviada com sucesso!",
        status: "aguardando_cliente",
      })
    } catch (err) {
      // Reverter transação em caso de erro
      await db.query("ROLLBACK")
      throw err
    }
  } catch (err) {
    console.error("❌ Erro ao responder chamado:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Estatísticas dos chamados (para funcionários)
router.get("/stats/dashboard", verifyToken, verifyFuncionario, async (req, res) => {
  console.log("📊 GET /chamados/stats/dashboard chamado")
  try {
    const db = await connectToDatabase()

    // Estatísticas gerais
    const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as abertos,
                SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
                SUM(CASE WHEN status = 'respondido' THEN 1 ELSE 0 END) as respondidos,
                SUM(CASE WHEN status = 'aguardando_cliente' THEN 1 ELSE 0 END) as aguardando_cliente,
                SUM(CASE WHEN status = 'aguardando_funcionario' THEN 1 ELSE 0 END) as aguardando_funcionario,
                SUM(CASE WHEN status = 'resolvido' THEN 1 ELSE 0 END) as resolvidos,
                SUM(CASE WHEN status = 'encerrado' THEN 1 ELSE 0 END) as encerrados
            FROM ChamadoSuporte
        `)

    // Chamados por categoria
    const [categorias] = await db.query(`
            SELECT 
                categoria,
                COUNT(*) as quantidade
            FROM ChamadoSuporte
            WHERE categoria IS NOT NULL
            GROUP BY categoria
            ORDER BY quantidade DESC
        `)

    // Chamados dos últimos 7 dias
    const [recentes] = await db.query(`
            SELECT 
                DATE(data_abertura) as data,
                COUNT(*) as quantidade
            FROM ChamadoSuporte
            WHERE data_abertura >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(data_abertura)
            ORDER BY data DESC
        `)

    console.log("📊 Estatísticas geradas com sucesso")
    res.status(200).json({
      geral: stats[0],
      categorias,
      recentes,
    })
  } catch (err) {
    console.error("❌ Erro ao buscar estatísticas:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ chamadosRoutes.js configurado!")

export default router
