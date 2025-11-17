import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"
import ExcelJS from "exceljs"

const router = express.Router()

console.log("📊 relatorioVendasRoutes.js carregado!")

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

// --- ROTAS DO DASHBOARD ---

// Estatísticas gerais de vendas
router.get("/dashboard/estatisticas", verifyAdmin, async (req, res) => {
  console.log("📊 GET /relatorios/vendas/dashboard/estatisticas chamado")
  try {
    const db = await connectToDatabase()

    // Total de vendas (pedidos)
    const [totalVendas] = await db.query("SELECT COUNT(*) as total FROM Pedido")

    // Faturamento total (soma de todos os pedidos)
    const [faturamento] = await db.query(`
      SELECT 
        COALESCE(SUM(
          (SELECT COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0)
           FROM ItemPedido ip
           WHERE ip.id_pedido = p.id_pedido) + COALESCE(p.frete_valor, 0)
        ), 0) as faturamento_total
      FROM Pedido p
    `)

    // Ticket médio
    const ticketMedio =
      totalVendas[0].total > 0 ? faturamento[0].faturamento_total / totalVendas[0].total : 0

    // Total de produtos vendidos (quantidade)
    const [produtosVendidos] = await db.query(`
      SELECT COALESCE(SUM(quantidade), 0) as total
      FROM ItemPedido
    `)

    res.status(200).json({
      totalVendas: totalVendas[0].total,
      faturamentoTotal: Number(faturamento[0].faturamento_total),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      totalProdutosVendidos: produtosVendidos[0].total,
    })
  } catch (err) {
    console.error("❌ Erro ao gerar estatísticas de vendas:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Vendas por status
router.get("/dashboard/por-status", verifyAdmin, async (req, res) => {
  console.log("📊 GET /relatorios/vendas/dashboard/por-status chamado")
  try {
    const db = await connectToDatabase()
    const query = `
      SELECT 
        p.status,
        COUNT(*) as quantidade,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0)
           FROM ItemPedido ip
           WHERE ip.id_pedido = p.id_pedido) + COALESCE(p.frete_valor, 0)
        ), 0) as valor_total
      FROM Pedido p
      GROUP BY p.status
      ORDER BY quantidade DESC
    `
    const [results] = await db.query(query)
    res.status(200).json(results)
  } catch (err) {
    console.error("❌ Erro ao buscar vendas por status:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// --- ROTAS DO RELATÓRIO DETALHADO ---

// Relatório completo de vendas
router.get("/", verifyAdmin, async (req, res) => {
  console.log("📋 GET /relatorios/vendas chamado")
  try {
    const { dataInicial, dataFinal, status, busca } = req.query
    const db = await connectToDatabase()

    let query = `
      SELECT 
        p.id_pedido,
        p.data_pedido,
        p.status,
        p.frete_valor,
        p.codigo_rastreio,
        c.nome as nome_cliente,
        c.email as email_cliente,
        c.telefone as telefone_cliente,
        COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) + COALESCE(p.frete_valor, 0) as valor_total,
        COUNT(ip.id_item_pedido) as quantidade_itens
      FROM Pedido p
      LEFT JOIN ItemPedido ip ON p.id_pedido = ip.id_pedido
      LEFT JOIN Cliente c ON p.id_cliente = c.id_cliente
      WHERE 1=1
    `
    const params = []

    if (busca) {
      query += ` AND (c.nome LIKE ? OR c.email LIKE ? OR p.id_pedido LIKE ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }

    if (dataInicial) {
      query += ` AND DATE(p.data_pedido) >= ?`
      params.push(dataInicial)
    }

    if (dataFinal) {
      query += ` AND DATE(p.data_pedido) <= ?`
      params.push(dataFinal)
    }

    if (status) {
      query += ` AND p.status = ?`
      params.push(status)
    }

    query += ` GROUP BY p.id_pedido ORDER BY p.data_pedido DESC`

    const [vendas] = await db.query(query, params)
    console.log(`📋 ${vendas.length} vendas encontradas no relatório`)
    res.status(200).json(vendas)
  } catch (err) {
    console.error("❌ Erro ao gerar relatório de vendas:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Exportar relatório em Excel
router.get("/exportar", verifyAdmin, async (req, res) => {
  console.log("📥 GET /relatorios/vendas/exportar chamado")
  try {
    const { dataInicial, dataFinal, status, busca } = req.query
    const db = await connectToDatabase()

    let query = `
      SELECT 
        p.id_pedido,
        p.data_pedido,
        c.nome as nome_cliente,
        c.email as email_cliente,
        c.telefone as telefone_cliente,
        c.cpf_cnpj,
        p.status,
        p.endereco_entrega,
        p.frete_nome,
        p.frete_valor,
        p.codigo_rastreio,
        COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) as subtotal_produtos,
        COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) + COALESCE(p.frete_valor, 0) as valor_total,
        COUNT(ip.id_item_pedido) as quantidade_itens
      FROM Pedido p
      LEFT JOIN ItemPedido ip ON p.id_pedido = ip.id_pedido
      LEFT JOIN Cliente c ON p.id_cliente = c.id_cliente
      WHERE 1=1
    `
    const params = []

    if (busca) {
      query += ` AND (c.nome LIKE ? OR c.email LIKE ? OR p.id_pedido LIKE ?)`
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    }

    if (dataInicial) {
      query += ` AND DATE(p.data_pedido) >= ?`
      params.push(dataInicial)
    }

    if (dataFinal) {
      query += ` AND DATE(p.data_pedido) <= ?`
      params.push(dataFinal)
    }

    if (status) {
      query += ` AND p.status = ?`
      params.push(status)
    }

    query += ` GROUP BY p.id_pedido ORDER BY p.data_pedido DESC`

    const [vendas] = await db.query(query, params)

    // Criar workbook do Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Relatório de Vendas")

    worksheet.columns = [
      { header: "Pedido", key: "id_pedido", width: 10 },
      { header: "Data", key: "data_pedido", width: 18 },
      { header: "Cliente", key: "nome_cliente", width: 30 },
      { header: "CPF/CNPJ", key: "cpf_cnpj", width: 18 },
      { header: "Email", key: "email_cliente", width: 30 },
      { header: "Telefone", key: "telefone_cliente", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Qtd. Itens", key: "quantidade_itens", width: 12 },
      { header: "Subtotal Produtos", key: "subtotal_produtos", width: 18 },
      { header: "Frete", key: "frete_valor", width: 12 },
      { header: "Valor Total", key: "valor_total", width: 15 },
      { header: "Código Rastreio", key: "codigo_rastreio", width: 20 },
      { header: "Endereço Entrega", key: "endereco_entrega", width: 40 },
    ]

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF8B5CF6" },
    }
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

    vendas.forEach((venda) => {
      const row = worksheet.addRow({
        id_pedido: venda.id_pedido,
        data_pedido: new Date(venda.data_pedido).toLocaleString("pt-BR"),
        nome_cliente: venda.nome_cliente,
        cpf_cnpj: venda.cpf_cnpj || "N/A",
        email_cliente: venda.email_cliente,
        telefone_cliente: venda.telefone_cliente || "N/A",
        status: venda.status,
        quantidade_itens: venda.quantidade_itens,
        subtotal_produtos: venda.subtotal_produtos || 0,
        frete_valor: venda.frete_valor || 0,
        valor_total: venda.valor_total || 0,
        codigo_rastreio: venda.codigo_rastreio || "N/A",
        endereco_entrega: venda.endereco_entrega || "N/A",
      })

      // Formatar valores monetários
      row.getCell("subtotal_produtos").numFmt = "R$ #,##0.00"
      row.getCell("frete_valor").numFmt = "R$ #,##0.00"
      row.getCell("valor_total").numFmt = "R$ #,##0.00"
    })

    // Adicionar linha de resumo
    const totalRow = worksheet.addRow({
      id_pedido: "",
      data_pedido: "",
      nome_cliente: "",
      cpf_cnpj: "",
      email_cliente: "",
      telefone_cliente: "",
      status: "",
      quantidade_itens: vendas.reduce((sum, v) => sum + v.quantidade_itens, 0),
      subtotal_produtos: vendas.reduce((sum, v) => sum + Number(v.subtotal_produtos || 0), 0),
      frete_valor: vendas.reduce((sum, v) => sum + Number(v.frete_valor || 0), 0),
      valor_total: vendas.reduce((sum, v) => sum + Number(v.valor_total || 0), 0),
      codigo_rastreio: "",
      endereco_entrega: `Total de Vendas: ${vendas.length}`,
    })

    totalRow.font = { bold: true }
    totalRow.getCell("subtotal_produtos").numFmt = "R$ #,##0.00"
    totalRow.getCell("frete_valor").numFmt = "R$ #,##0.00"
    totalRow.getCell("valor_total").numFmt = "R$ #,##0.00"
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    }

    // Adicionar bordas
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
    })

    // Configurar resposta
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename=relatorio-vendas-${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    console.error("❌ Erro ao exportar relatório de vendas:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ relatorioVendasRoutes.js configurado!")

export default router
