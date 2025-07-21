import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"

const router = express.Router()

console.log("📋 lgpdRoutes.js carregado!")

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

// Obter termo LGPD mais recente
router.get("/termo-atual", async (req, res) => {
  console.log("📊 GET /lgpd/termo-atual chamado")
  try {
    const db = await connectToDatabase()
    const [termos] = await db.query(`
            SELECT id_termo, conteudo, versao, data_efetiva 
            FROM TermoConsentimento 
            ORDER BY data_efetiva DESC, id_termo DESC 
            LIMIT 1
        `)

    if (termos.length === 0) {
      console.log("⚠️ Nenhum termo LGPD encontrado no sistema")
      return res.status(404).json({
        message: "Nenhum termo encontrado",
        codigo: "NO_TERMS_FOUND",
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
    const { clienteId } = req.params
    const db = await connectToDatabase()

    // Buscar termo mais recente
    const [termoAtual] = await db.query(`
            SELECT id_termo, conteudo, versao, data_efetiva 
            FROM TermoConsentimento 
            ORDER BY data_efetiva DESC, id_termo DESC 
            LIMIT 1
        `)

    if (termoAtual.length === 0) {
      console.log("⚠️ Nenhum termo LGPD cadastrado - cliente não precisa aceitar")
      return res.status(200).json({
        precisa_aceitar: false,
        termo_atual: null,
        ultimo_aceite: null,
        motivo: "Nenhum termo cadastrado no sistema",
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

    // Verificar se o termo existe
    const [termo] = await db.query("SELECT id_termo FROM TermoConsentimento WHERE id_termo = ?", [id_termo])
    if (termo.length === 0) {
      return res.status(404).json({ message: "Termo não encontrado" })
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
    const db = await connectToDatabase()
    const [count] = await db.query("SELECT COUNT(*) as total FROM TermoConsentimento")

    const temTermos = count[0].total > 0
    console.log(`📊 Status LGPD: ${temTermos ? "Configurado" : "Não configurado"} (${count[0].total} termos)`)

    res.status(200).json({
      configurado: temTermos,
      total_termos: count[0].total,
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
    const db = await connectToDatabase()
    const [termos] = await db.query(`
            SELECT id_termo, versao, data_efetiva, 
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
            SELECT id_termo, conteudo, versao, data_efetiva 
            FROM TermoConsentimento 
            WHERE id_termo = ?
        `,
      [id],
    )

    if (termo.length === 0) {
      return res.status(404).json({ message: "Termo não encontrado" })
    }

    console.log(`📄 Termo ${id} encontrado`)
    res.status(200).json(termo[0])
  } catch (err) {
    console.error("❌ Erro ao buscar termo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Criar/atualizar termo LGPD (admin)
router.post("/termos", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📝 POST /lgpd/termos chamado")
  try {
    const { conteudo, versao, data_efetiva } = req.body

    if (!conteudo || !versao || !data_efetiva) {
      return res.status(400).json({ message: "Conteúdo, versão e data efetiva são obrigatórios" })
    }

    const db = await connectToDatabase()

    // Verificar se a versão já existe
    const [versaoExiste] = await db.query("SELECT id_termo FROM TermoConsentimento WHERE versao = ?", [versao])
    if (versaoExiste.length > 0) {
      return res.status(400).json({ message: "Esta versão já existe" })
    }

    // Inserir novo termo
    const [result] = await db.query(
      `
            INSERT INTO TermoConsentimento (conteudo, versao, data_efetiva) 
            VALUES (?, ?, ?)
        `,
      [conteudo, versao, data_efetiva],
    )

    console.log(`✅ Novo termo criado: ID ${result.insertId}, versão ${versao}`)
    res.status(201).json({
      message: "Termo criado com sucesso",
      id_termo: result.insertId,
      versao: versao,
    })
  } catch (err) {
    console.error("❌ Erro ao criar termo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Relatório de consentimentos (admin)
router.get("/relatorio-consentimentos", verifyToken, verifyAdmin, async (req, res) => {
  console.log("📊 GET /lgpd/relatorio-consentimentos chamado")
  try {
    const db = await connectToDatabase()
    const [relatorio] = await db.query(`
            SELECT 
                t.versao,
                t.data_efetiva,
                COUNT(c.id_consentimento) as total_aceites,
                COUNT(CASE WHEN c.data_revogacao IS NULL THEN 1 END) as aceites_ativos
            FROM TermoConsentimento t
            LEFT JOIN ConsentimentoUsuario c ON t.id_termo = c.id_termo
            GROUP BY t.id_termo, t.versao, t.data_efetiva
            ORDER BY t.data_efetiva DESC
        `)

    console.log(`📊 Relatório gerado com ${relatorio.length} versões`)
    res.status(200).json(relatorio)
  } catch (err) {
    console.error("❌ Erro ao gerar relatório:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ lgpdRoutes.js configurado!")

export default router
