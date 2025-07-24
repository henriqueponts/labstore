import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"
import updatePendingTerms from "../scripts/update-pending-terms.js"

const router = express.Router()

console.log("📋 lgpdRoutes.js carregado!")

// ✅ FUNÇÃO UTILITÁRIA PARA CONVERTER DATA ISO PARA MYSQL
function convertToMySQLDate(isoDateString) {
  const date = new Date(isoDateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

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

// Middleware para verificar se é admin
const verifyAdmin = async (req, res, next) => {
  if (req.userType !== "funcionario" || req.userProfile !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores." })
  }
  next()
}

// Função para gerar próxima versão automaticamente
const gerarProximaVersao = async (db) => {
  const [ultimaVersao] = await db.query(`
    SELECT versao FROM TermoConsentimento 
    ORDER BY CAST(SUBSTRING_INDEX(versao, '.', 1) AS UNSIGNED) DESC,
             CAST(SUBSTRING_INDEX(versao, '.', -1) AS UNSIGNED) DESC
    LIMIT 1
  `)

  if (ultimaVersao.length === 0) {
    return "1.0"
  }

  const versaoAtual = ultimaVersao[0].versao
  const [major, minor] = versaoAtual.split(".").map(Number)

  return `${major}.${minor + 1}`
}

// ✅ FUNÇÃO CORRIGIDA: Verificar se uma data é hoje ou no passado
const isDateTodayOrPast = (dateString) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(dateString)
  compareDate.setHours(0, 0, 0, 0)

  return compareDate <= today
}

// ✅ FUNÇÃO CORRIGIDA: Verificar se uma data é no passado
const isPastDate = (dateString) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(dateString)
  compareDate.setHours(0, 0, 0, 0)

  return compareDate < today
}

// Função para verificar se pode editar termo pendente
const canEditPendingTerm = (dataEfetiva) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dataImplementacao = new Date(dataEfetiva)
  dataImplementacao.setHours(0, 0, 0, 0)

  // Pode editar até o dia anterior à implementação
  return today < dataImplementacao
}

// ✅ NOVA ROTA: Atualizar termos pendentes manualmente (admin)
router.post("/atualizar-termos-pendentes", verifyToken, verifyAdmin, async (req, res) => {
  console.log("🔄 POST /lgpd/atualizar-termos-pendentes chamado")
  try {
    const result = await updatePendingTerms()

    res.status(200).json({
      message: `${result.updated} termo(s) atualizado(s) com sucesso`,
      termos_atualizados: result.terms,
      total_atualizados: result.updated,
    })
  } catch (err) {
    console.error("❌ Erro ao atualizar termos pendentes:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Obter termo LGPD mais recente ATIVO
router.get("/termo-atual", async (req, res) => {
  console.log("📊 GET /lgpd/termo-atual chamado")
  try {
    // ✅ ATUALIZAR TERMOS PENDENTES AUTOMATICAMENTE ANTES DE BUSCAR
    await updatePendingTerms()

    const db = await connectToDatabase()
    const [termos] = await db.query(`
      SELECT id_termo, conteudo, versao, data_efetiva, status_termo
      FROM TermoConsentimento 
      WHERE status_termo = 'ativo'
      ORDER BY data_efetiva DESC, id_termo DESC 
      LIMIT 1
    `)

    if (termos.length === 0) {
      console.log("⚠️ Nenhum termo LGPD ativo encontrado no sistema")
      return res.status(404).json({
        message: "Nenhum termo ativo encontrado",
        codigo: "NO_ACTIVE_TERMS_FOUND",
      })
    }

    console.log(`📄 Termo atual encontrado: versão ${termos[0].versao}`)
    res.status(200).json(termos[0])
  } catch (err) {
    console.error("❌ Erro ao buscar termo atual:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Verificar se cliente precisa aceitar novo termo
router.get("/verificar-consentimento/:clienteId", verifyToken, async (req, res) => {
  console.log("🔍 GET /lgpd/verificar-consentimento chamado")
  try {
    // ✅ ATUALIZAR TERMOS PENDENTES AUTOMATICAMENTE
    await updatePendingTerms()

    const { clienteId } = req.params
    const db = await connectToDatabase()

    // Buscar termo ativo mais recente
    const [termoAtual] = await db.query(`
      SELECT id_termo, conteudo, versao, data_efetiva 
      FROM TermoConsentimento 
      WHERE status_termo = 'ativo'
      ORDER BY data_efetiva DESC, id_termo DESC 
      LIMIT 1
    `)

    if (termoAtual.length === 0) {
      console.log("⚠️ Nenhum termo LGPD ativo - cliente não precisa aceitar")
      return res.status(200).json({
        precisa_aceitar: false,
        termo_atual: null,
        ultimo_aceite: null,
        motivo: "Nenhum termo ativo no sistema",
      })
    }

    // Verificar se cliente já aceitou este termo
    const [consentimento] = await db.query(
      `
      SELECT c.id_consentimento, c.data_aceite, t.versao
      FROM ConsentimentoUsuario c
      JOIN TermoConsentimento t ON c.id_termo = t.id_termo
      WHERE c.id_cliente = ? AND c.data_revogacao IS NULL
      ORDER BY c.data_aceite DESC
      LIMIT 1
      `,
      [clienteId],
    )

    const precisaAceitar = consentimento.length === 0 || consentimento[0].versao !== termoAtual[0].versao

    console.log(`🔍 Cliente ${clienteId} - Termo atual:`, termoAtual[0]?.versao)
    console.log(`🔍 Cliente ${clienteId} - Último aceite:`, consentimento[0]?.versao || "nenhum")
    console.log(`🔍 Cliente ${clienteId} precisa aceitar termo: ${precisaAceitar}`)

    res.status(200).json({
      precisa_aceitar: precisaAceitar,
      termo_atual: termoAtual[0],
      ultimo_aceite: consentimento.length > 0 ? consentimento[0] : null,
    })
  } catch (err) {
    console.error("❌ Erro ao verificar consentimento:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Registrar aceite de termo pelo cliente
router.post("/aceitar-termo", verifyToken, async (req, res) => {
  console.log("✅ POST /lgpd/aceitar-termo chamado")
  try {
    const { id_termo } = req.body
    const clienteId = req.userId
    const ipAddress = req.ip || req.connection.remoteAddress

    if (req.userType !== "cliente") {
      return res.status(400).json({ message: "Apenas clientes podem aceitar termos" })
    }

    const db = await connectToDatabase()

    // Verificar se o termo existe e está ativo
    const [termo] = await db.query(
      "SELECT id_termo FROM TermoConsentimento WHERE id_termo = ? AND status_termo = 'ativo'",
      [id_termo],
    )
    if (termo.length === 0) {
      return res.status(404).json({ message: "Termo não encontrado ou não está ativo" })
    }

    // Revogar consentimentos anteriores (se houver)
    await db.query(
      `
      UPDATE ConsentimentoUsuario 
      SET data_revogacao = NOW() 
      WHERE id_cliente = ? AND data_revogacao IS NULL
      `,
      [clienteId],
    )

    // Registrar novo consentimento
    await db.query(
      `
      INSERT INTO ConsentimentoUsuario (id_cliente, id_termo, ip_address_aceite) 
      VALUES (?, ?, ?)
      `,
      [clienteId, id_termo, ipAddress],
    )

    console.log(`✅ Consentimento registrado para cliente ${clienteId}, termo ${id_termo}`)
    res.status(200).json({ message: "Consentimento registrado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao registrar consentimento:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Verificar se existem termos no sistema
router.get("/status", async (req, res) => {
  console.log("📊 GET /lgpd/status chamado")
  try {
    // ✅ ATUALIZAR TERMOS PENDENTES AUTOMATICAMENTE
    await updatePendingTerms()

    const db = await connectToDatabase()
    const [count] = await db.query("SELECT COUNT(*) as total FROM TermoConsentimento WHERE status_termo = 'ativo'")
    const [pendingCount] = await db.query(
      "SELECT COUNT(*) as total FROM TermoConsentimento WHERE status_termo = 'pendente'",
    )

    const temTermos = count[0].total > 0
    const temPendente = pendingCount[0].total > 0

    console.log(
      `📊 Status LGPD: ${temTermos ? "Configurado" : "Não configurado"} (${count[0].total} ativos, ${pendingCount[0].total} pendentes)`,
    )

    res.status(200).json({
      configurado: temTermos,
      total_termos_ativos: count[0].total,
      total_termos_pendentes: pendingCount[0].total,
      pode_criar_novo: !temPendente,
    })
  } catch (err) {
    console.error("❌ Erro ao verificar status LGPD:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todos os termos (admin)
router.get("/termos", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📊 GET /lgpd/termos chamado")
  try {
    // ✅ ATUALIZAR TERMOS PENDENTES AUTOMATICAMENTE
    await updatePendingTerms()

    const db = await connectToDatabase()
    const [termos] = await db.query(`
      SELECT id_termo, versao, data_efetiva, status_termo,
             LEFT(conteudo, 100) as preview_conteudo
      FROM TermoConsentimento 
      ORDER BY data_efetiva DESC, id_termo DESC
    `)

    console.log(`📄 ${termos.length} termos encontrados`)
    res.status(200).json(termos)
  } catch (err) {
    console.error("❌ Erro ao buscar termos:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Obter termo específico (admin)
router.get("/termos/:id", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📊 GET /lgpd/termos/:id chamado")
  try {
    const { id } = req.params
    const db = await connectToDatabase()
    const [termo] = await db.query(
      `
      SELECT id_termo, conteudo, versao, data_efetiva, status_termo
      FROM TermoConsentimento 
      WHERE id_termo = ?
      `,
      [id],
    )

    if (termo.length === 0) {
      return res.status(404).json({ message: "Termo não encontrado" })
    }

    // Verificar se pode editar (apenas termos pendentes e antes da data de implementação)
    const podeEditar = termo[0].status_termo === "pendente" && canEditPendingTerm(termo[0].data_efetiva)

    console.log(`📄 Termo ${id} encontrado - Status: ${termo[0].status_termo}, Pode editar: ${podeEditar}`)
    res.status(200).json({
      ...termo[0],
      pode_editar: podeEditar,
    })
  } catch (err) {
    console.error("❌ Erro ao buscar termo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Verificar se pode criar novo termo
router.get("/pode-criar-termo", verifyToken, verifyAdmin, async (req, res) => {
  try {
    // ✅ ATUALIZAR TERMOS PENDENTES AUTOMATICAMENTE
    await updatePendingTerms()

    const db = await connectToDatabase()

    // Verificar se há termo pendente
    const [termoPendente] = await db.query(`
      SELECT id_termo, versao, data_efetiva 
      FROM TermoConsentimento 
      WHERE status_termo = 'pendente'
      LIMIT 1
    `)

    const podecriar = termoPendente.length === 0

    res.status(200).json({
      pode_criar: podecriar,
      termo_pendente: termoPendente.length > 0 ? termoPendente[0] : null,
      motivo: podecriar ? null : "Existe um termo pendente. Aguarde a implementação para criar um novo.",
    })
  } catch (err) {
    console.error("❌ Erro ao verificar se pode criar termo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// ✅ CRIAR NOVO TERMO LGPD (ADMIN) - ROTA CORRIGIDA
router.post("/termos", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📝 POST /lgpd/termos chamado")
  try {
    const { conteudo, data_efetiva } = req.body

    if (!conteudo || !data_efetiva) {
      return res.status(400).json({ message: "Conteúdo e data efetiva são obrigatórios" })
    }

    const db = await connectToDatabase()

    // ✅ CONVERTER DATA ISO PARA MYSQL DATE
    const dataEfetivaMysql = convertToMySQLDate(data_efetiva)

    console.log("📅 Data original (ISO):", data_efetiva)
    console.log("📅 Data convertida (MySQL):", dataEfetivaMysql)

    // Verificar se pode criar novo termo (não pode haver termo pendente)
    const [termoPendente] = await db.query(`
      SELECT id_termo FROM TermoConsentimento 
      WHERE status_termo = 'pendente'
      LIMIT 1
    `)

    if (termoPendente.length > 0) {
      return res.status(400).json({
        message: "Não é possível criar um novo termo. Existe um termo pendente aguardando implementação.",
        codigo: "TERMO_PENDENTE_EXISTS",
      })
    }

    // Gerar próxima versão automaticamente
    const versao = await gerarProximaVersao(db)

    // ✅ DETERMINAR STATUS CORRIGIDO: Ativo se for hoje ou passado, pendente se for futuro
    let status_termo
    if (isPastDate(data_efetiva)) {
      return res.status(400).json({
        message: "A data efetiva não pode ser no passado",
      })
    } else if (isDateTodayOrPast(data_efetiva)) {
      status_termo = "ativo"
      console.log(`📅 Termo para hoje ou data chegou - Status: ATIVO`)
    } else {
      status_termo = "pendente"
      console.log(`📅 Termo agendado para ${data_efetiva} - Status: PENDENTE`)
    }

    // ✅ INSERIR NO BANCO COM DATA CONVERTIDA
    const [result] = await db.query(
      `INSERT INTO TermoConsentimento (conteudo, versao, data_efetiva, status_termo) 
       VALUES (?, ?, ?, ?)`,
      [conteudo, versao, dataEfetivaMysql, status_termo], // ← USANDO A DATA CONVERTIDA
    )

    console.log(`✅ Novo termo criado: ID ${result.insertId}, versão ${versao}, status ${status_termo}`)
    res.status(201).json({
      message: "Termo criado com sucesso",
      id_termo: result.insertId,
      versao: versao,
      status_termo: status_termo,
      data_efetiva: dataEfetivaMysql,
    })
  } catch (err) {
    console.error("❌ Erro ao criar termo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// ✅ EDITAR TERMO PENDENTE (ADMIN) - ROTA CORRIGIDA
router.put("/termos/:id", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📝 PUT /lgpd/termos/:id chamado")
  try {
    const { id } = req.params
    const { conteudo, data_efetiva } = req.body

    if (!conteudo || !data_efetiva) {
      return res.status(400).json({ message: "Conteúdo e data efetiva são obrigatórios" })
    }

    const db = await connectToDatabase()

    // ✅ CONVERTER DATA ISO PARA MYSQL DATE
    const dataEfetivaMysql = convertToMySQLDate(data_efetiva)

    console.log("📅 Data original (ISO):", data_efetiva)
    console.log("📅 Data convertida (MySQL):", dataEfetivaMysql)

    // Verificar se o termo existe e está pendente
    const [termo] = await db.query(
      "SELECT id_termo, status_termo, data_efetiva FROM TermoConsentimento WHERE id_termo = ?",
      [id],
    )

    if (termo.length === 0) {
      return res.status(404).json({ message: "Termo não encontrado" })
    }

    if (termo[0].status_termo !== "pendente") {
      return res.status(400).json({
        message: "Apenas termos pendentes podem ser editados",
      })
    }

    // Verificar se ainda pode editar (antes da data de implementação)
    if (!canEditPendingTerm(termo[0].data_efetiva)) {
      return res.status(400).json({
        message: "Não é possível editar o termo. A data de implementação chegou.",
      })
    }

    // ✅ VALIDAR NOVA DATA CORRIGIDA
    if (isPastDate(data_efetiva)) {
      return res.status(400).json({
        message: "A data efetiva não pode ser no passado",
      })
    }

    // ✅ DETERMINAR NOVO STATUS CORRIGIDO
    const status_termo = isDateTodayOrPast(data_efetiva) ? "ativo" : "pendente"

    // ✅ ATUALIZAR COM DATA CONVERTIDA
    await db.query(
      `UPDATE TermoConsentimento 
       SET conteudo = ?, data_efetiva = ?, status_termo = ?
       WHERE id_termo = ?`,
      [conteudo, dataEfetivaMysql, status_termo, id], // ← USANDO A DATA CONVERTIDA
    )

    console.log(`✅ Termo ${id} atualizado`)
    res.status(200).json({
      message: "Termo atualizado com sucesso",
      termo: {
        id_termo: Number.parseInt(id),
        data_efetiva: dataEfetivaMysql,
        status_termo: status_termo,
      },
    })
  } catch (err) {
    console.error("❌ Erro ao atualizar termo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Relatório de consentimentos (admin)
router.get("/relatorio-consentimentos", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📊 GET /lgpd/relatorio-consentimentos chamado")
  try {
    // ✅ ATUALIZAR TERMOS PENDENTES AUTOMATICAMENTE
    await updatePendingTerms()

    const db = await connectToDatabase()
    const [relatorio] = await db.query(`
      SELECT 
          t.versao,
          t.data_efetiva,
          t.status_termo,
          COUNT(c.id_consentimento) as total_aceites,
          COUNT(CASE WHEN c.data_revogacao IS NULL THEN 1 END) as aceites_ativos
      FROM TermoConsentimento t
      LEFT JOIN ConsentimentoUsuario c ON t.id_termo = c.id_termo
      GROUP BY t.id_termo, t.versao, t.data_efetiva, t.status_termo
      ORDER BY t.data_efetiva DESC
    `)

    console.log(`📊 Relatório gerado com ${relatorio.length} versões`)
    res.status(200).json(relatorio)
  } catch (err) {
    console.error("❌ Erro ao gerar relatório:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ lgpdRoutes.js configurado com todas as correções!")

export default router
