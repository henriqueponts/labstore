// Arquivo: server/routes/relatorioClienteRoutes.js (NOVO NOME)

import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"
import ExcelJS from "exceljs"

const router = express.Router()

console.log("📊 relatorioClienteRoutes.js carregado!")

// Middleware de verificação de token e permissão de admin
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" })
    }
    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.tipo !== "funcionario") {
      return res.status(403).json({ message: "Acesso negado. Apenas funcionários." })
    }
    req.userId = decoded.id
    req.userType = decoded.tipo
    req.userProfile = decoded.perfil
    next()
  } catch (err) {
    console.error("🚫 Erro na autenticação:", err.message)
    return res.status(401).json({ message: "Token inválido" })
  }
}

// --- ROTAS DO DASHBOARD (relativas a /relatorios/clientes) ---

// URL FINAL: GET /relatorios/clientes/dashboard/estatisticas
router.get("/dashboard/estatisticas", verifyAdmin, async (req, res) => {
  console.log("📊 GET /relatorios/clientes/dashboard/estatisticas chamado")
  try {
    const db = await connectToDatabase()
    const [totalClientes] = await db.query("SELECT COUNT(*) as total FROM Cliente")
    const [clientesAtivos] = await db.query('SELECT COUNT(*) as total FROM Cliente WHERE status = "ativo"')
    const [clientesInativos] = await db.query('SELECT COUNT(*) as total FROM Cliente WHERE status = "inativo"')
    res.status(200).json({
      totalClientes: totalClientes[0].total,
      clientesAtivos: clientesAtivos[0].total,
      clientesInativos: clientesInativos[0].total,
    })
  } catch (err) {
    console.error("❌ Erro ao gerar estatísticas de clientes:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// URL FINAL: GET /relatorios/clientes/dashboard/por-tipo
router.get("/dashboard/por-tipo", verifyAdmin, async (req, res) => {
  console.log("👤🏢 GET /relatorios/clientes/dashboard/por-tipo chamado")
  try {
    const db = await connectToDatabase()
    const query = `
      SELECT
        SUM(CASE WHEN LENGTH(REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '-', ''), '/', '')) = 11 THEN 1 ELSE 0 END) as clientesPF,
        SUM(CASE WHEN LENGTH(REPLACE(REPLACE(REPLACE(cpf_cnpj, '.', ''), '-', ''), '/', '')) = 14 THEN 1 ELSE 0 END) as clientesPJ
      FROM Cliente;
    `
    const [results] = await db.query(query)
    res.status(200).json({
      clientesPF: results[0].clientesPF || 0,
      clientesPJ: results[0].clientesPJ || 0,
    })
  } catch (err) {
    console.error("❌ Erro ao buscar clientes por tipo:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// --- ROTAS DO RELATÓRIO DETALHADO (relativas a /relatorios/clientes) ---

// URL FINAL: GET /relatorios/clientes
router.get("/", verifyAdmin, async (req, res) => {
  console.log("📋 GET /relatorios/clientes chamado")
  try {
    const { dataInicial, dataFinal, status, busca } = req.query
    const db = await connectToDatabase()
    let query = `
      SELECT
        c.id_cliente, c.nome, c.cpf_cnpj, c.email, c.telefone,
        c.endereco, c.data_cadastro, c.status,
        COUNT(p.id_pedido) as quantidade_compras
      FROM Cliente c
      LEFT JOIN Pedido p ON c.id_cliente = p.id_cliente
      WHERE 1=1
    `
    const params = []
    if (busca) {
      query += ` AND (c.nome LIKE ? OR c.email LIKE ? OR c.cpf_cnpj LIKE ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }
    if (dataInicial) {
      query += ` AND DATE(c.data_cadastro) >= ?`
      params.push(dataInicial)
    }
    if (dataFinal) {
      query += ` AND DATE(c.data_cadastro) <= ?`
      params.push(dataFinal)
    }
    if (status && ["ativo", "inativo"].includes(status)) {
      query += ` AND c.status = ?`
      params.push(status)
    }
    query += ` GROUP BY c.id_cliente ORDER BY c.data_cadastro DESC`
    const [clientes] = await db.query(query, params)
    console.log(`📋 ${clientes.length} clientes encontrados no relatório`)
    res.status(200).json(clientes)
  } catch (err) {
    console.error("❌ Erro ao gerar relatório:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// URL FINAL: GET /relatorios/clientes/exportar
router.get("/exportar", verifyAdmin, async (req, res) => {
  console.log("📥 GET /relatorios/clientes/exportar chamado")
  try {
    // ... (lógica de exportação permanece a mesma)
    const { dataInicial, dataFinal, status, busca } = req.query
    const db = await connectToDatabase()
    let query = `
      SELECT
        c.id_cliente, c.nome, c.cpf_cnpj, c.email, c.telefone, c.endereco,
        c.data_cadastro, c.status, COUNT(p.id_pedido) as quantidade_compras
      FROM Cliente c
      LEFT JOIN Pedido p ON c.id_cliente = p.id_cliente
      WHERE 1=1
    `
    const params = []
    if (busca) {
      query += ` AND (c.nome LIKE ? OR c.email LIKE ? OR c.cpf_cnpj LIKE ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }
    if (dataInicial) {
      query += ` AND DATE(c.data_cadastro) >= ?`
      params.push(dataInicial)
    }
    if (dataFinal) {
      query += ` AND DATE(c.data_cadastro) <= ?`
      params.push(dataFinal)
    }
    if (status && ["ativo", "inativo"].includes(status)) {
      query += ` AND c.status = ?`
      params.push(status)
    }
    query += ` GROUP BY c.id_cliente ORDER BY c.data_cadastro DESC`
    const [clientes] = await db.query(query, params)
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Relatório de Clientes")
    worksheet.columns = [
      { header: "Código", key: "id_cliente", width: 10 },
      { header: "Nome", key: "nome", width: 30 },
      { header: "CPF/CNPJ", key: "cpf_cnpj", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "Telefone", key: "telefone", width: 15 },
      { header: "Endereço", key: "endereco", width: 40 },
      { header: "Data de Cadastro", key: "data_cadastro", width: 18 },
      { header: "Status", key: "status", width: 12 },
      { header: "Quantidade de Compras", key: "quantidade_compras", width: 20 },
    ]
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    }
    clientes.forEach((cliente) => {
      worksheet.addRow({
        ...cliente,
        telefone: cliente.telefone || "N/A",
        endereco: cliente.endereco || "N/A",
        data_cadastro: new Date(cliente.data_cadastro).toLocaleDateString("pt-BR"),
      })
    })
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=relatorio-clientes-${Date.now()}.xlsx`)
    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error("❌ Erro ao exportar relatório:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ relatorioClienteRoutes.js configurado!")

export default router