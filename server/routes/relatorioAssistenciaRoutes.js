import express from "express"
import { connectToDatabase } from "../lib/db.js"
import ExcelJS from "exceljs"

const router = express.Router()

// Rota para buscar assistências por período
router.get("/relatorio", async (req, res) => {
  try {
    const { dataInicio, dataFim, status, cliente } = req.query
    const db = await connectToDatabase()

    let query = `
      SELECT 
        s.id_solicitacao,
        CONCAT('AT-', LPAD(s.id_solicitacao, 6, '0')) as protocolo,
        s.tipo_equipamento,
        s.marca,
        s.modelo,
        s.descricao_problema as problema_relatado,
        s.data_solicitacao,
        s.status,
        s.forma_envio,
        c.nome as nome_cliente,
        c.cpf_cnpj,
        c.email as email_cliente,
        c.telefone as telefone_cliente,
        (COALESCE(o.valor_pecas, 0) + COALESCE(o.valor_mao_obra, 0)) as valor_total,
        o.prazo_entrega_dias,
        u.nome as tecnico_responsavel
      FROM SolicitacaoServico s
      INNER JOIN Cliente c ON s.id_cliente = c.id_cliente
      LEFT JOIN Orcamento o ON s.id_solicitacao = o.id_solicitacao
      LEFT JOIN Usuario u ON o.id_analista = u.id_usuario
      WHERE 1=1
    `

    const params = []

    if (dataInicio) {
      query += " AND DATE(s.data_solicitacao) >= ?"
      params.push(dataInicio)
    }

    if (dataFim) {
      query += " AND DATE(s.data_solicitacao) <= ?"
      params.push(dataFim)
    }

    if (status) {
      query += " AND s.status = ?"
      params.push(status)
    }

    if (cliente) {
      query += " AND (c.nome LIKE ? OR c.cpf_cnpj LIKE ?)"
      params.push(`%${cliente}%`, `%${cliente}%`)
    }

    query += " ORDER BY s.data_solicitacao DESC"

    const [assistencias] = await db.query(query, params)
    res.json(assistencias)
  } catch (error) {
    console.error("Erro ao buscar assistências:", error)
    res.status(500).json({ message: "Erro ao buscar assistências" })
  }
})

// Rota para exportar relatório em Excel
router.get("/relatorio/exportar", async (req, res) => {
  try {
    const { dataInicio, dataFim, status, cliente } = req.query
    const db = await connectToDatabase()

    let query = `
      SELECT 
        s.id_solicitacao,
        CONCAT('AT-', LPAD(s.id_solicitacao, 6, '0')) as protocolo,
        s.data_solicitacao,
        c.nome as nome_cliente,
        c.cpf_cnpj,
        c.email as email_cliente,
        c.telefone as telefone_cliente,
        s.tipo_equipamento,
        s.marca,
        s.modelo,
        s.descricao_problema as problema_relatado,
        s.status,
        o.diagnostico,
        o.valor_pecas,
        o.valor_mao_obra,
        (COALESCE(o.valor_pecas, 0) + COALESCE(o.valor_mao_obra, 0)) as valor_total,
        o.prazo_entrega_dias,
        u.nome as tecnico_responsavel,
        o.observacoes_tecnicas
      FROM SolicitacaoServico s
      INNER JOIN Cliente c ON s.id_cliente = c.id_cliente
      LEFT JOIN Orcamento o ON s.id_solicitacao = o.id_solicitacao
      LEFT JOIN Usuario u ON o.id_analista = u.id_usuario
      WHERE 1=1
    `

    const params = []

    if (dataInicio) {
      query += " AND DATE(s.data_solicitacao) >= ?"
      params.push(dataInicio)
    }

    if (dataFim) {
      query += " AND DATE(s.data_solicitacao) <= ?"
      params.push(dataFim)
    }

    if (status) {
      query += " AND s.status = ?"
      params.push(status)
    }

    if (cliente) {
      query += " AND (c.nome LIKE ? OR c.cpf_cnpj LIKE ?)"
      params.push(`%${cliente}%`, `%${cliente}%`)
    }

    query += " ORDER BY s.data_solicitacao DESC"

    const [assistencias] = await db.query(query, params)

    // Criar workbook do Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Assistências")

    worksheet.columns = [
      { header: "Protocolo", key: "protocolo", width: 15 },
      { header: "Data Agendamento", key: "data_solicitacao", width: 18 },
      { header: "Cliente", key: "nome_cliente", width: 25 },
      { header: "CPF/CNPJ", key: "cpf_cnpj", width: 18 },
      { header: "Email", key: "email_cliente", width: 30 },
      { header: "Telefone", key: "telefone_cliente", width: 15 },
      { header: "Tipo Equipamento", key: "tipo_equipamento", width: 20 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Modelo", key: "modelo", width: 20 },
      { header: "Problema Relatado", key: "problema_relatado", width: 40 },
      { header: "Status", key: "status", width: 20 },
      { header: "Diagnóstico", key: "diagnostico", width: 40 },
      { header: "Valor Peças (R$)", key: "valor_pecas", width: 15 },
      { header: "Valor Mão de Obra (R$)", key: "valor_mao_obra", width: 20 },
      { header: "Valor Total (R$)", key: "valor_total", width: 15 },
      { header: "Prazo Entrega (dias)", key: "prazo_entrega_dias", width: 18 },
      { header: "Técnico Responsável", key: "tecnico_responsavel", width: 25 },
      { header: "Observações", key: "observacoes_tecnicas", width: 40 },
    ]

    // Estilizar cabeçalho
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    }
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

    assistencias.forEach((assistencia) => {
      const row = worksheet.addRow({
        protocolo: assistencia.protocolo,
        data_solicitacao: new Date(assistencia.data_solicitacao).toLocaleDateString("pt-BR"),
        nome_cliente: assistencia.nome_cliente,
        cpf_cnpj: assistencia.cpf_cnpj || "N/A",
        email_cliente: assistencia.email_cliente,
        telefone_cliente: assistencia.telefone_cliente || "N/A",
        tipo_equipamento: assistencia.tipo_equipamento,
        marca: assistencia.marca,
        modelo: assistencia.modelo,
        problema_relatado: assistencia.problema_relatado || "N/A",
        status: assistencia.status,
        diagnostico: assistencia.diagnostico || "N/A",
        valor_pecas: assistencia.valor_pecas || 0,
        valor_mao_obra: assistencia.valor_mao_obra || 0,
        valor_total: assistencia.valor_total || 0,
        prazo_entrega_dias: assistencia.prazo_entrega_dias || "N/A",
        tecnico_responsavel: assistencia.tecnico_responsavel || "N/A",
        observacoes_tecnicas: assistencia.observacoes_tecnicas || "N/A",
      })

      // Formatar valores monetários
      row.getCell("valor_pecas").numFmt = "R$ #,##0.00"
      row.getCell("valor_mao_obra").numFmt = "R$ #,##0.00"
      row.getCell("valor_total").numFmt = "R$ #,##0.00"
    })

    // Adicionar linha de resumo
    const totalRow = worksheet.addRow({
      protocolo: "",
      data_solicitacao: "",
      nome_cliente: "",
      cpf_cnpj: "",
      email_cliente: "",
      telefone_cliente: "",
      tipo_equipamento: "",
      marca: "",
      modelo: "",
      problema_relatado: "",
      status: "",
      diagnostico: "",
      valor_pecas: "",
      valor_mao_obra: "",
      valor_total: assistencias.reduce((sum, a) => sum + (a.valor_total || 0), 0),
      prazo_entrega_dias: "",
      tecnico_responsavel: "",
      observacoes_tecnicas: `Total de Assistências: ${assistencias.length}`,
    })

    totalRow.font = { bold: true }
    totalRow.getCell("valor_total").numFmt = "R$ #,##0.00"
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    }

    // Adicionar bordas
    worksheet.eachRow((row, rowNumber) => {
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
    res.setHeader("Content-Disposition", `attachment; filename=relatorio_assistencias_${dataInicio}_${dataFim}.xlsx`)

    await workbook.xlsx.write(res)
  } catch (error) {
    console.error("Erro ao exportar relatório:", error)
    res.status(500).json({ message: "Erro ao exportar relatório" })
  }
})

export default router
