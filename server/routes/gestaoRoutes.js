// Arquivo: server/routes/gestaoRoutes.js

import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"

const router = express.Router()

console.log("📋 gestaoRoutes.js carregado!")

// Middleware de verificação de token e permissão de admin
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Verificar se é funcionário
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

// Rota de teste
router.get("/test", (req, res) => {
  res.json({ message: "Gestão routes funcionando!", timestamp: new Date().toISOString() })
})

// Listar todos os funcionários (usuários)
router.get("/usuarios", verifyAdmin, async (req, res) => {
  console.log("📊 GET /gestao/usuarios chamado")
  try {
    const db = await connectToDatabase()
    const [usuarios] = await db.query(
      `SELECT id_usuario, nome, email, tipo_perfil, data_cadastro, status FROM Usuario ORDER BY data_cadastro DESC`,
    )

    console.log(`👥 ${usuarios.length} usuários encontrados`)
    res.status(200).json(usuarios)
  } catch (err) {
    console.error("❌ Erro ao buscar usuários:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Buscar usuários com filtros
router.get("/usuarios/buscar", verifyAdmin, async (req, res) => {
  console.log("🔍 GET /gestao/usuarios/buscar chamado")
  try {
    const { nome, email, telefone, status } = req.query
    const db = await connectToDatabase()

    let query = `SELECT id_usuario, nome, email, tipo_perfil, data_cadastro, status FROM Usuario WHERE 1=1`
    const params = []

    if (nome) {
      query += ` AND nome LIKE ?`
      params.push(`%${nome}%`)
    }

    if (email) {
      query += ` AND email LIKE ?`
      params.push(`%${email}%`)
    }

    if (status && ["ativo", "inativo"].includes(status)) {
      query += ` AND status = ?`
      params.push(status)
    }

    query += ` ORDER BY data_cadastro DESC`

    const [usuarios] = await db.query(query, params)

    console.log(`🔍 ${usuarios.length} usuários encontrados com filtros`)
    res.status(200).json(usuarios)
  } catch (err) {
    console.error("❌ Erro ao buscar usuários:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Obter dados específicos de um usuário para edição
router.get("/usuarios/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [usuario] = await db.query(
      "SELECT id_usuario, nome, email, tipo_perfil, data_cadastro, status FROM Usuario WHERE id_usuario = ?",
      [id],
    )

    if (usuario.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    res.status(200).json(usuario[0])
  } catch (err) {
    console.error("❌ Erro ao buscar usuário:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Editar dados de funcionário (endereço, telefone) - apenas admin
router.put("/usuarios/:id/editar", verifyAdmin, async (req, res) => {
  try {
    if (req.userProfile !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." })
    }

    const { id } = req.params
    const { nome, email } = req.body

    // Validação básica
    if (!nome || !email) {
      return res.status(400).json({ message: "Nome e email são obrigatórios" })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido" })
    }

    const db = await connectToDatabase()

    // Verificar se o usuário existe
    const [userExists] = await db.query("SELECT id_usuario FROM Usuario WHERE id_usuario = ?", [id])
    if (userExists.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    // Verificar se o email já está em uso por outro usuário
    const [emailExists] = await db.query("SELECT id_usuario FROM Usuario WHERE email = ? AND id_usuario != ?", [
      email,
      id,
    ])
    if (emailExists.length > 0) {
      return res.status(400).json({ message: "Este email já está em uso por outro usuário" })
    }

    // Atualizar dados do usuário
    await db.query("UPDATE Usuario SET nome = ?, email = ? WHERE id_usuario = ?", [nome, email, id])

    console.log(`✅ Dados do usuário ${id} atualizados`)
    res.status(200).json({ message: "Dados do usuário atualizados com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao editar usuário:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todos os clientes
router.get("/clientes", verifyAdmin, async (req, res) => {
  console.log("📊 GET /gestao/clientes chamado")
  try {
    const db = await connectToDatabase()
    const [clientes] = await db.query(
      `SELECT id_cliente, nome, email, telefone, data_cadastro, status FROM Cliente ORDER BY data_cadastro DESC`,
    )

    console.log(`👥 ${clientes.length} clientes encontrados`)
    res.status(200).json(clientes)
  } catch (err) {
    console.error("❌ Erro ao buscar clientes:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Buscar clientes com filtros
router.get("/clientes/buscar", verifyAdmin, async (req, res) => {
  console.log("🔍 GET /gestao/clientes/buscar chamado")
  try {
    const { nome, email, telefone, status } = req.query
    const db = await connectToDatabase()

    let query = `SELECT id_cliente, nome, email, telefone, endereco, data_cadastro, status FROM Cliente WHERE 1=1`
    const params = []

    if (nome) {
      query += ` AND nome LIKE ?`
      params.push(`%${nome}%`)
    }

    if (email) {
      query += ` AND email LIKE ?`
      params.push(`%${email}%`)
    }

    if (telefone) {
      query += ` AND telefone LIKE ?`
      params.push(`%${telefone}%`)
    }

    if (status && ["ativo", "inativo"].includes(status)) {
      query += ` AND status = ?`
      params.push(status)
    }

    query += ` ORDER BY data_cadastro DESC`

    const [clientes] = await db.query(query, params)

    console.log(`🔍 ${clientes.length} clientes encontrados com filtros`)
    res.status(200).json(clientes)
  } catch (err) {
    console.error("❌ Erro ao buscar clientes:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Obter dados específicos de um cliente para edição
router.get("/clientes/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [cliente] = await db.query(
      "SELECT id_cliente, nome, email, telefone, endereco, data_cadastro, status FROM Cliente WHERE id_cliente = ?",
      [id],
    )

    if (cliente.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" })
    }

    res.status(200).json(cliente[0])
  } catch (err) {
    console.error("❌ Erro ao buscar cliente:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Editar dados de cliente (nome e telefone) - apenas admin
router.put("/clientes/:id/editar", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, telefone } = req.body

    // Validação básica
    if (!nome) {
      return res.status(400).json({ message: "Nome é obrigatório" })
    }

    const db = await connectToDatabase()

    // Verificar se o cliente existe
    const [clientExists] = await db.query("SELECT id_cliente FROM Cliente WHERE id_cliente = ?", [id])
    if (clientExists.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" })
    }

    // Atualizar dados do cliente (sem email)
    await db.query("UPDATE Cliente SET nome = ?, telefone = ? WHERE id_cliente = ?", [nome, telefone || null, id])

    console.log(`✅ Dados do cliente ${id} atualizados`)
    res.status(200).json({ message: "Dados do cliente atualizados com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao editar cliente:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Alterar perfil de usuário (apenas admin)
router.put("/usuarios/:id/perfil", verifyAdmin, async (req, res) => {
  try {
    if (req.userProfile !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." })
    }

    const { id } = req.params
    const { tipo_perfil } = req.body

    if (!["admin", "analista"].includes(tipo_perfil)) {
      return res.status(400).json({ message: "Tipo de perfil inválido" })
    }

    const db = await connectToDatabase()

    const [userExists] = await db.query("SELECT id_usuario FROM Usuario WHERE id_usuario = ?", [id])
    if (userExists.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    await db.query("UPDATE Usuario SET tipo_perfil = ? WHERE id_usuario = ?", [tipo_perfil, id])

    console.log(`✅ Perfil do usuário ${id} alterado para ${tipo_perfil}`)
    res.status(200).json({ message: "Perfil atualizado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao alterar perfil:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Inativar usuário (apenas admin)
router.put("/usuarios/:id/inativar", verifyAdmin, async (req, res) => {
  try {
    if (req.userProfile !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." })
    }

    const { id } = req.params

    if (Number.parseInt(id) === req.userId) {
      return res.status(400).json({ message: "Você não pode inativar sua própria conta" })
    }

    const db = await connectToDatabase()

    const [userExists] = await db.query("SELECT id_usuario FROM Usuario WHERE id_usuario = ?", [id])
    if (userExists.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    await db.query('UPDATE Usuario SET status = "inativo" WHERE id_usuario = ?', [id])

    console.log(`✅ Usuário ${id} inativado`)
    res.status(200).json({ message: "Usuário inativado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao inativar usuário:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Reativar usuário (apenas admin)
router.put("/usuarios/:id/reativar", verifyAdmin, async (req, res) => {
  try {
    if (req.userProfile !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." })
    }

    const { id } = req.params
    const db = await connectToDatabase()

    const [userExists] = await db.query("SELECT id_usuario FROM Usuario WHERE id_usuario = ?", [id])
    if (userExists.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" })
    }

    await db.query('UPDATE Usuario SET status = "ativo" WHERE id_usuario = ?', [id])

    console.log(`✅ Usuário ${id} reativado`)
    res.status(200).json({ message: "Usuário reativado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao reativar usuário:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Inativar cliente
router.put("/clientes/:id/inativar", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [clientExists] = await db.query("SELECT id_cliente FROM Cliente WHERE id_cliente = ?", [id])
    if (clientExists.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" })
    }

    await db.query('UPDATE Cliente SET status = "inativo" WHERE id_cliente = ?', [id])

    console.log(`✅ Cliente ${id} inativado`)
    res.status(200).json({ message: "Cliente inativado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao inativar cliente:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Reativar cliente
router.put("/clientes/:id/reativar", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [clientExists] = await db.query("SELECT id_cliente FROM Cliente WHERE id_cliente = ?", [id])
    if (clientExists.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" })
    }

    await db.query('UPDATE Cliente SET status = "ativo" WHERE id_cliente = ?', [id])

    console.log(`✅ Cliente ${id} reativado`)
    res.status(200).json({ message: "Cliente reativado com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao reativar cliente:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todas as marcas
router.get("/marcas", verifyAdmin, async (req, res) => {
  console.log("📊 GET /gestao/marcas chamado")
  try {
    const db = await connectToDatabase()
    const [marcas] = await db.query(`SELECT id_marca, nome, descricao FROM Marca ORDER BY nome ASC`)

    console.log(`🏷️ ${marcas.length} marcas encontradas`)
    res.status(200).json(marcas)
  } catch (err) {
    console.error("❌ Erro ao buscar marcas:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Criar nova marca
router.post("/marcas", verifyAdmin, async (req, res) => {
  console.log("➕ POST /gestao/marcas chamado")
  try {
    const { nome, descricao } = req.body

    // Validação básica
    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: "Nome da marca é obrigatório" })
    }

    const db = await connectToDatabase()

    // Verificar se a marca já existe
    const [existingBrand] = await db.query("SELECT id_marca FROM Marca WHERE nome = ?", [nome.trim()])
    if (existingBrand.length > 0) {
      return res.status(400).json({ message: "Já existe uma marca com este nome" })
    }

    // Inserir nova marca
    const [result] = await db.query("INSERT INTO Marca (nome, descricao) VALUES (?, ?)", [
      nome.trim(),
      descricao?.trim() || null,
    ])

    console.log(`✅ Nova marca criada com ID: ${result.insertId}`)
    res.status(201).json({
      message: "Marca criada com sucesso",
      id_marca: result.insertId,
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
    })
  } catch (err) {
    console.error("❌ Erro ao criar marca:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Obter dados específicos de uma marca
router.get("/marcas/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [marca] = await db.query("SELECT id_marca, nome, descricao FROM Marca WHERE id_marca = ?", [id])

    if (marca.length === 0) {
      return res.status(404).json({ message: "Marca não encontrada" })
    }

    res.status(200).json(marca[0])
  } catch (err) {
    console.error("❌ Erro ao buscar marca:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Editar marca
router.put("/marcas/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, descricao } = req.body

    // Validação básica
    if (!nome || !nome.trim()) {
      return res.status(400).json({ message: "Nome da marca é obrigatório" })
    }

    const db = await connectToDatabase()

    // Verificar se a marca existe
    const [brandExists] = await db.query("SELECT id_marca FROM Marca WHERE id_marca = ?", [id])
    if (brandExists.length === 0) {
      return res.status(404).json({ message: "Marca não encontrada" })
    }

    // Verificar se o nome já está em uso por outra marca
    const [nameExists] = await db.query("SELECT id_marca FROM Marca WHERE nome = ? AND id_marca != ?", [
      nome.trim(),
      id,
    ])
    if (nameExists.length > 0) {
      return res.status(400).json({ message: "Já existe uma marca com este nome" })
    }

    // Atualizar marca
    await db.query("UPDATE Marca SET nome = ?, descricao = ? WHERE id_marca = ?", [
      nome.trim(),
      descricao?.trim() || null,
      id,
    ])

    console.log(`✅ Marca ${id} atualizada`)
    res.status(200).json({ message: "Marca atualizada com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao editar marca:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Deletar marca (apenas se não estiver sendo usada por produtos)
router.delete("/marcas/:id", verifyAdmin, async (req, res) => {
  try {
    if (req.userProfile !== "admin") {
      return res.status(403).json({ message: "Acesso negado. Apenas administradores." })
    }

    const { id } = req.params
    const db = await connectToDatabase()

    // Verificar se a marca existe
    const [brandExists] = await db.query("SELECT id_marca FROM Marca WHERE id_marca = ?", [id])
    if (brandExists.length === 0) {
      return res.status(404).json({ message: "Marca não encontrada" })
    }

    // Verificar se a marca está sendo usada por produtos
    const [productsUsingBrand] = await db.query("SELECT COUNT(*) as count FROM Produto WHERE id_marca = ?", [id])
    if (productsUsingBrand[0].count > 0) {
      return res.status(400).json({
        message: `Não é possível deletar esta marca pois ela está sendo usada por ${productsUsingBrand[0].count} produto(s)`,
      })
    }

    // Deletar marca
    await db.query("DELETE FROM Marca WHERE id_marca = ?", [id])

    console.log(`✅ Marca ${id} deletada`)
    res.status(200).json({ message: "Marca deletada com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao deletar marca:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todos os pedidos
router.get("/pedidos", verifyAdmin, async (req, res) => {
  console.log("📊 GET /gestao/pedidos chamado")
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
        p.codigo_rastreio,
        p.motivo_cancelamento,
        p.motivo_estorno,
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

        const [solicitacaoEstorno] = await db.query(
          `SELECT 
            se.id_solicitacao_estorno,
            se.status,
            se.motivo,
            se.data_solicitacao,
            se.data_resposta,
            se.motivo_recusa,
            se.id_funcionario_resposta,
            u.nome as nome_funcionario
          FROM SolicitacaoEstorno se
          LEFT JOIN Usuario u ON se.id_funcionario_resposta = u.id_usuario
          WHERE se.id_pedido = ?
          ORDER BY se.data_solicitacao DESC
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

    console.log(`📦 ${pedidosCompletos.length} pedidos encontrados`)
    res.status(200).json(pedidosCompletos)
  } catch (err) {
    console.error("❌ Erro ao buscar pedidos:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Atualizar status do pedido
router.put("/pedidos/:id/status", verifyAdmin, async (req, res) => {
  console.log(`🔄 PUT /gestao/pedidos/${req.params.id}/status chamado`)
  try {
    const { id } = req.params
    const { novo_status, motivo, codigo_rastreio } = req.body

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

    if (novo_status === "enviado" && !codigo_rastreio) {
      return res.status(400).json({ message: "Código de rastreio é obrigatório para pedidos enviados" })
    }

    const db = await connectToDatabase()

    // Verificar se o pedido existe
    const [pedidoExiste] = await db.query("SELECT id_pedido, status FROM Pedido WHERE id_pedido = ?", [id])
    if (pedidoExiste.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado" })
    }

    const statusAtual = pedidoExiste[0].status
    if (statusAtual === "cancelado" || statusAtual === "estornado") {
      return res.status(400).json({
        message: `Não é possível alterar o status de um pedido ${statusAtual}`,
      })
    }

    let updateQuery = "UPDATE Pedido SET status = ?"
    const updateParams = [novo_status]

    if (novo_status === "cancelado") {
      updateQuery += ", motivo_cancelamento = ?"
      updateParams.push(motivo)
    } else if (novo_status === "estornado") {
      updateQuery += ", motivo_estorno = ?"
      updateParams.push(motivo)
    } else if (novo_status === "enviado") {
      updateQuery += ", codigo_rastreio = ?"
      updateParams.push(codigo_rastreio)
    }

    updateQuery += " WHERE id_pedido = ?"
    updateParams.push(id)

    // Atualizar status do pedido
    await db.query(updateQuery, updateParams)

    // Registrar no log se houver motivo
    if (motivo) {
      console.log(`📝 Pedido #${id} ${novo_status} - Motivo: ${motivo}`)
    }
    if (codigo_rastreio) {
      console.log(`📦 Pedido #${id} - Código de rastreio: ${codigo_rastreio}`)
    }

    console.log(`✅ Status do pedido ${id} atualizado para ${novo_status}`)
    res.status(200).json({ message: "Status do pedido atualizado com sucesso", novo_status })
  } catch (err) {
    console.error("❌ Erro ao atualizar status do pedido:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

router.get("/estornos/pendentes", verifyAdmin, async (req, res) => {
  console.log("📋 GET /gestao/estornos/pendentes chamado")
  try {
    const db = await connectToDatabase()

    const [solicitacoes] = await db.query(
      `SELECT 
        se.id_solicitacao_estorno,
        se.id_pedido,
        se.motivo,
        se.data_solicitacao,
        se.status,
        p.status as status_pedido,
        c.nome as nome_cliente,
        c.email as email_cliente,
        COALESCE(SUM(ip.quantidade * ip.preco_unitario), 0) + COALESCE(p.frete_valor, 0) as valor_pedido
      FROM SolicitacaoEstorno se
      JOIN Pedido p ON se.id_pedido = p.id_pedido
      JOIN Cliente c ON se.id_cliente = c.id_cliente
      LEFT JOIN ItemPedido ip ON p.id_pedido = ip.id_pedido
      WHERE se.status = 'pendente'
      GROUP BY se.id_solicitacao_estorno
      ORDER BY se.data_solicitacao ASC
    `,
    )

    console.log(`📋 ${solicitacoes.length} solicitações de estorno pendentes`)
    res.status(200).json(solicitacoes)
  } catch (err) {
    console.error("❌ Erro ao buscar solicitações de estorno:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

router.put("/estornos/:id/aprovar", verifyAdmin, async (req, res) => {
  console.log(`✅ PUT /gestao/estornos/${req.params.id}/aprovar chamado`)
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // Buscar a solicitação
    const [solicitacao] = await db.query(
      "SELECT id_pedido, status FROM SolicitacaoEstorno WHERE id_solicitacao_estorno = ?",
      [id],
    )

    if (solicitacao.length === 0) {
      return res.status(404).json({ message: "Solicitação de estorno não encontrada" })
    }

    if (solicitacao[0].status !== "pendente") {
      return res.status(400).json({ message: "Esta solicitação já foi processada" })
    }

    const idPedido = solicitacao[0].id_pedido

    // Atualizar solicitação
    await db.query(
      `UPDATE SolicitacaoEstorno 
       SET status = 'aprovado', 
           data_resposta = NOW(), 
           id_funcionario_resposta = ? 
       WHERE id_solicitacao_estorno = ?`,
      [req.userId, id],
    )

    // Atualizar status do pedido para estornado
    await db.query("UPDATE Pedido SET status = 'estornado' WHERE id_pedido = ?", [idPedido])

    console.log(`✅ Solicitação de estorno #${id} aprovada e pedido #${idPedido} estornado`)
    res.status(200).json({ message: "Solicitação de estorno aprovada com sucesso" })
  } catch (err) {
    console.error("❌ Erro ao aprovar estorno:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

router.put("/estornos/:id/recusar", verifyAdmin, async (req, res) => {
  console.log(`❌ PUT /gestao/estornos/${req.params.id}/recusar chamado`)
  try {
    const { id } = req.params
    const { motivo_recusa } = req.body

    if (!motivo_recusa || !motivo_recusa.trim()) {
      return res.status(400).json({ message: "Motivo da recusa é obrigatório" })
    }

    const db = await connectToDatabase()

    // Buscar a solicitação
    const [solicitacao] = await db.query("SELECT status FROM SolicitacaoEstorno WHERE id_solicitacao_estorno = ?", [id])

    if (solicitacao.length === 0) {
      return res.status(404).json({ message: "Solicitação de estorno não encontrada" })
    }

    if (solicitacao[0].status !== "pendente") {
      return res.status(400).json({ message: "Esta solicitação já foi processada" })
    }

    // Atualizar solicitação
    await db.query(
      `UPDATE SolicitacaoEstorno 
       SET status = 'recusado', 
           data_resposta = NOW(), 
           id_funcionario_resposta = ?, 
           motivo_recusa = ? 
       WHERE id_solicitacao_estorno = ?`,
      [req.userId, motivo_recusa.trim(), id],
    )

    console.log(`❌ Solicitação de estorno #${id} recusada`)
    res.status(200).json({ message: "Solicitação de estorno recusada" })
  } catch (err) {
    console.error("❌ Erro ao recusar estorno:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

console.log("✅ gestaoRoutes.js configurado!")

export default router
