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

// Editar dados de cliente (endereço, telefone) - apenas admin
router.put("/clientes/:id/editar", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { nome, email, telefone, endereco } = req.body

    // Validação básica
    if (!nome || !email) {
      return res.status(400).json({ message: "Nome e email são obrigatórios" })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email inválido" })
    }

    const db = await connectToDatabase()

    // Verificar se o cliente existe
    const [clientExists] = await db.query("SELECT id_cliente FROM Cliente WHERE id_cliente = ?", [id])
    if (clientExists.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" })
    }

    // Verificar se o email já está em uso por outro cliente
    const [emailExists] = await db.query("SELECT id_cliente FROM Cliente WHERE email = ? AND id_cliente != ?", [
      email,
      id,
    ])
    if (emailExists.length > 0) {
      return res.status(400).json({ message: "Este email já está em uso por outro cliente" })
    }

    // Atualizar dados do cliente
    await db.query("UPDATE Cliente SET nome = ?, email = ?, telefone = ?, endereco = ? WHERE id_cliente = ?", [
      nome,
      email,
      telefone || null,
      endereco || null,
      id,
    ])

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

console.log("✅ gestaoRoutes.js configurado!")

export default router
