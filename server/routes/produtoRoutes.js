import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"
import multer from "multer"
import path from "path"
import fs from "fs"

const router = express.Router()

// Configuração do multer para múltiplas imagens
const armazenamento = multer.diskStorage({
  destination: (req, file, cb) => {
    const caminhoUpload = "uploads/produtos/"
    if (!fs.existsSync(caminhoUpload)) {
      fs.mkdirSync(caminhoUpload, { recursive: true })
    }
    cb(null, caminhoUpload)
  },
  filename: (req, file, cb) => {
    const sufixoUnico = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "produto-" + sufixoUnico + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: armazenamento,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por arquivo
    files: 10, // Máximo 10 imagens por produto
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|gif|webp/
    const extensao = tiposPermitidos.test(path.extname(file.originalname).toLowerCase())
    const mimetype = tiposPermitidos.test(file.mimetype)

    if (mimetype && extensao) {
      return cb(null, true)
    } else {
      cb(new Error("Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)"))
    }
  },
})

// Middleware de verificação de token
const verificarFuncionario = async (req, res, next) => {
  try {
    const cabecalhoAuth = req.headers["authorization"]
    if (!cabecalhoAuth || !cabecalhoAuth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token não fornecido" })
    }

    const token = cabecalhoAuth.split(" ")[1]
    const decodificado = jwt.verify(token, process.env.JWT_SECRET)

    if (decodificado.tipo !== "funcionario") {
      return res.status(403).json({ message: "Acesso negado. Apenas funcionários." })
    }

    req.userId = decodificado.id
    req.userType = decodificado.tipo
    req.userProfile = decodificado.perfil

    next()
  } catch (err) {
    console.error("Erro na autenticação:", err.message)
    return res.status(401).json({ message: "Token inválido" })
  }
}

// Listar todas as categorias
router.get("/categorias", async (req, res) => {
  try {
    const db = await connectToDatabase()
    const [categorias] = await db.query("SELECT * FROM Categoria ORDER BY nome")
    res.status(200).json(categorias)
  } catch (err) {
    console.error("Erro ao buscar categorias:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Criar nova categoria
router.post("/categorias", verificarFuncionario, async (req, res) => {
  try {
    const { nome, descricao } = req.body

    if (!nome) {
      return res.status(400).json({ message: "Nome da categoria é obrigatório" })
    }

    const db = await connectToDatabase()

    const [categoriaExistente] = await db.query("SELECT id_categoria FROM Categoria WHERE nome = ?", [nome])
    if (categoriaExistente.length > 0) {
      return res.status(400).json({ message: "Categoria já existe" })
    }

    const [resultado] = await db.query("INSERT INTO Categoria (nome, descricao) VALUES (?, ?)", [
      nome,
      descricao || null,
    ])

    res.status(201).json({
      message: "Categoria criada com sucesso",
      id_categoria: resultado.insertId,
    })
  } catch (err) {
    console.error("Erro ao criar categoria:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todos os produtos com suas imagens
router.get("/produtos", async (req, res) => {
  try {
    const db = await connectToDatabase()

    // Buscar produtos
    const [produtos] = await db.query(`
      SELECT p.*, c.nome as categoria_nome 
      FROM Produto p 
      LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria 
      ORDER BY p.nome
    `)

    // Buscar imagens para cada produto
    for (const produto of produtos) {
      const [imagens] = await db.query(
        `
        SELECT id_imagem, url_imagem, nome_arquivo, ordem, is_principal
        FROM ProdutoImagem 
        WHERE id_produto = ? 
        ORDER BY is_principal DESC, ordem ASC
      `,
        [produto.id_produto],
      )

      produto.imagens = imagens
      // Manter compatibilidade com código antigo
      produto.imagemUrl = imagens.find((img) => img.is_principal)?.url_imagem || imagens[0]?.url_imagem || null
    }

    res.status(200).json(produtos)
  } catch (err) {
    console.error("Erro ao buscar produtos:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Buscar produto por ID com suas imagens
router.get("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [produtos] = await db.query(
      `
      SELECT p.*, c.nome as categoria_nome 
      FROM Produto p 
      LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria 
      WHERE p.id_produto = ?
    `,
      [id],
    )

    if (produtos.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    const produto = produtos[0]

    // Buscar imagens do produto
    const [imagens] = await db.query(
      `
      SELECT id_imagem, url_imagem, nome_arquivo, ordem, is_principal
      FROM ProdutoImagem 
      WHERE id_produto = ? 
      ORDER BY is_principal DESC, ordem ASC
    `,
      [id],
    )

    produto.imagens = imagens

    res.status(200).json(produto)
  } catch (err) {
    console.error("Erro ao buscar produto:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Criar novo produto com múltiplas imagens
router.post("/produtos", verificarFuncionario, upload.array("imagens", 10), async (req, res) => {
  try {
    const { nome, descricao, preco, marca, modelo, estoque, id_categoria, compatibilidade, cor, ano_fabricacao } =
      req.body

    // Validações básicas
    if (!nome || !descricao || !preco || !id_categoria) {
      return res.status(400).json({
        message: "Nome, descrição, preço e categoria são obrigatórios",
      })
    }

    if (isNaN(Number.parseFloat(preco)) || Number.parseFloat(preco) <= 0) {
      return res.status(400).json({ message: "Preço deve ser um número válido maior que zero" })
    }

    const db = await connectToDatabase()

    // Verificar se categoria existe
    const [categoria] = await db.query("SELECT id_categoria FROM Categoria WHERE id_categoria = ?", [id_categoria])
    if (categoria.length === 0) {
      return res.status(400).json({ message: "Categoria não encontrada" })
    }

    // Inserir produto
    const [resultado] = await db.query(
      `
      INSERT INTO Produto (
          nome, descricao, preco, marca, modelo, estoque, 
          id_categoria, compatibilidade, cor, ano_fabricacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nome,
        descricao,
        Number.parseFloat(preco),
        marca || null,
        modelo || null,
        Number.parseInt(estoque) || 0,
        id_categoria,
        compatibilidade || null,
        cor || null,
        ano_fabricacao ? Number.parseInt(ano_fabricacao) : null,
      ],
    )

    const idProduto = resultado.insertId

    // Inserir imagens se foram enviadas
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const arquivo = req.files[i]
        const urlImagem = `/uploads/produtos/${arquivo.filename}`
        const ehPrincipal = i === 0 // Primeira imagem é a principal

        await db.query(
          `INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) 
           VALUES (?, ?, ?, ?, ?)`,
          [idProduto, urlImagem, arquivo.filename, i, ehPrincipal],
        )
      }
    }

    res.status(201).json({
      message: "Produto criado com sucesso",
      id_produto: idProduto,
      imagens_enviadas: req.files?.length || 0,
    })
  } catch (err) {
    console.error("Erro ao criar produto:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Atualizar produto existente
router.put("/produtos/:id", verificarFuncionario, upload.array("novas_imagens", 10), async (req, res) => {
  try {
    const { id } = req.params
    const {
      nome,
      descricao,
      preco,
      marca,
      modelo,
      estoque,
      id_categoria,
      compatibilidade,
      cor,
      ano_fabricacao,
      status,
      imagens_removidas, // IDs das imagens a serem removidas
      imagem_principal_id, // ID da nova imagem principal
      ordens_imagens, // JSON com as novas ordens das imagens
    } = req.body

    const db = await connectToDatabase()

    // Verificar se produto existe
    const [produtoExistente] = await db.query("SELECT * FROM Produto WHERE id_produto = ?", [id])
    if (produtoExistente.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    // Verificar se categoria existe (se foi fornecida)
    if (id_categoria) {
      const [categoria] = await db.query("SELECT id_categoria FROM Categoria WHERE id_categoria = ?", [id_categoria])
      if (categoria.length === 0) {
        return res.status(400).json({ message: "Categoria não encontrada" })
      }
    }

    // Atualizar dados do produto
    await db.query(
      `
      UPDATE Produto SET 
          nome = COALESCE(?, nome),
          descricao = COALESCE(?, descricao),
          preco = COALESCE(?, preco),
          marca = COALESCE(?, marca),
          modelo = COALESCE(?, modelo),
          estoque = COALESCE(?, estoque),
          id_categoria = COALESCE(?, id_categoria),
          compatibilidade = COALESCE(?, compatibilidade),
          cor = COALESCE(?, cor),
          ano_fabricacao = COALESCE(?, ano_fabricacao),
          status = COALESCE(?, status)
      WHERE id_produto = ?
      `,
      [
        nome || null,
        descricao || null,
        preco ? Number.parseFloat(preco) : null,
        marca || null,
        modelo || null,
        estoque ? Number.parseInt(estoque) : null,
        id_categoria || null,
        compatibilidade || null,
        cor || null,
        ano_fabricacao ? Number.parseInt(ano_fabricacao) : null,
        status || null,
        id,
      ],
    )

    // Processar remoção de imagens
    if (imagens_removidas) {
      const idsRemover = JSON.parse(imagens_removidas)
      for (const idImagem of idsRemover) {
        // Buscar dados da imagem antes de remover
        const [dadosImagem] = await db.query("SELECT * FROM ProdutoImagem WHERE id_imagem = ? AND id_produto = ?", [
          idImagem,
          id,
        ])

        if (dadosImagem.length > 0) {
          // Remover arquivo físico
          const caminhoImagem = path.join(process.cwd(), dadosImagem[0].url_imagem)
          if (fs.existsSync(caminhoImagem)) {
            fs.unlinkSync(caminhoImagem)
          }

          // Remover do banco
          await db.query("DELETE FROM ProdutoImagem WHERE id_imagem = ?", [idImagem])
        }
      }
    }

    // Adicionar novas imagens
    if (req.files && req.files.length > 0) {
      // Buscar a maior ordem atual
      const [ordemMaxima] = await db.query(
        "SELECT COALESCE(MAX(ordem), -1) as ordem_maxima FROM ProdutoImagem WHERE id_produto = ?",
        [id],
      )

      let proximaOrdem = ordemMaxima[0].ordem_maxima + 1

      for (const arquivo of req.files) {
        const urlImagem = `/uploads/produtos/${arquivo.filename}`

        await db.query(
          `INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) 
           VALUES (?, ?, ?, ?, FALSE)`,
          [id, urlImagem, arquivo.filename, proximaOrdem],
        )

        proximaOrdem++
      }
    }

    // Atualizar imagem principal
    if (imagem_principal_id) {
      // Remover principal de todas as imagens
      await db.query("UPDATE ProdutoImagem SET is_principal = FALSE WHERE id_produto = ?", [id])
      // Definir a nova imagem principal
      await db.query("UPDATE ProdutoImagem SET is_principal = TRUE WHERE id_imagem = ? AND id_produto = ?", [
        imagem_principal_id,
        id,
      ])
    }

    // Atualizar ordens das imagens
    if (ordens_imagens) {
      const ordens = JSON.parse(ordens_imagens)
      for (const item of ordens) {
        await db.query("UPDATE ProdutoImagem SET ordem = ? WHERE id_imagem = ? AND id_produto = ?", [
          item.ordem,
          item.id_imagem,
          id,
        ])
      }
    }

    // Garantir que sempre há uma imagem principal
    const [imagensPrincipais] = await db.query(
      "SELECT COUNT(*) as total FROM ProdutoImagem WHERE id_produto = ? AND is_principal = TRUE",
      [id],
    )

    if (imagensPrincipais[0].total === 0) {
      // Se não há imagem principal, definir a primeira como principal
      const [primeiraImagem] = await db.query(
        "SELECT id_imagem FROM ProdutoImagem WHERE id_produto = ? ORDER BY ordem LIMIT 1",
        [id],
      )

      if (primeiraImagem.length > 0) {
        await db.query("UPDATE ProdutoImagem SET is_principal = TRUE WHERE id_imagem = ?", [
          primeiraImagem[0].id_imagem,
        ])
      }
    }

    res.status(200).json({
      message: "Produto atualizado com sucesso",
      novas_imagens_adicionadas: req.files?.length || 0,
    })
  } catch (err) {
    console.error("Erro ao atualizar produto:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Adicionar imagens a um produto existente
router.post("/produtos/:id/imagens", verificarFuncionario, upload.array("imagens", 10), async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // Verificar se produto existe
    const [produto] = await db.query("SELECT id_produto FROM Produto WHERE id_produto = ?", [id])
    if (produto.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhuma imagem foi enviada" })
    }

    // Buscar a maior ordem atual
    const [ordemMaxima] = await db.query(
      "SELECT COALESCE(MAX(ordem), -1) as ordem_maxima FROM ProdutoImagem WHERE id_produto = ?",
      [id],
    )

    let proximaOrdem = ordemMaxima[0].ordem_maxima + 1

    // Inserir novas imagens
    for (const arquivo of req.files) {
      const urlImagem = `/uploads/produtos/${arquivo.filename}`

      await db.query(
        `INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) 
         VALUES (?, ?, ?, ?, FALSE)`,
        [id, urlImagem, arquivo.filename, proximaOrdem],
      )

      proximaOrdem++
    }

    res.status(201).json({
      message: "Imagens adicionadas com sucesso",
      imagens_adicionadas: req.files.length,
    })
  } catch (err) {
    console.error("Erro ao adicionar imagens:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Deletar uma imagem específica
router.delete("/produtos/:idProduto/imagens/:idImagem", verificarFuncionario, async (req, res) => {
  try {
    const { idProduto, idImagem } = req.params
    const db = await connectToDatabase()

    // Buscar a imagem
    const [imagem] = await db.query("SELECT * FROM ProdutoImagem WHERE id_imagem = ? AND id_produto = ?", [
      idImagem,
      idProduto,
    ])

    if (imagem.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }

    const dadosImagem = imagem[0]

    // Remover arquivo físico
    const caminhoImagem = path.join(process.cwd(), dadosImagem.url_imagem)
    if (fs.existsSync(caminhoImagem)) {
      fs.unlinkSync(caminhoImagem)
    }

    // Remover do banco
    await db.query("DELETE FROM ProdutoImagem WHERE id_imagem = ?", [idImagem])

    // Se era a imagem principal, definir outra como principal
    if (dadosImagem.is_principal) {
      const [outrasImagens] = await db.query(
        "SELECT id_imagem FROM ProdutoImagem WHERE id_produto = ? ORDER BY ordem LIMIT 1",
        [idProduto],
      )

      if (outrasImagens.length > 0) {
        await db.query("UPDATE ProdutoImagem SET is_principal = TRUE WHERE id_imagem = ?", [outrasImagens[0].id_imagem])
      }
    }

    res.status(200).json({ message: "Imagem deletada com sucesso" })
  } catch (err) {
    console.error("Erro ao deletar imagem:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Definir imagem principal
router.put("/produtos/:idProduto/imagens/:idImagem/principal", verificarFuncionario, async (req, res) => {
  try {
    const { idProduto, idImagem } = req.params
    const db = await connectToDatabase()

    // Verificar se a imagem existe
    const [imagem] = await db.query("SELECT id_imagem FROM ProdutoImagem WHERE id_imagem = ? AND id_produto = ?", [
      idImagem,
      idProduto,
    ])

    if (imagem.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }

    // Remover principal de todas as imagens do produto
    await db.query("UPDATE ProdutoImagem SET is_principal = FALSE WHERE id_produto = ?", [idProduto])

    // Definir a nova imagem principal
    await db.query("UPDATE ProdutoImagem SET is_principal = TRUE WHERE id_imagem = ?", [idImagem])

    res.status(200).json({ message: "Imagem principal definida com sucesso" })
  } catch (err) {
    console.error("Erro ao definir imagem principal:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Atualizar ordem das imagens
router.put("/produtos/:idProduto/imagens/ordem", verificarFuncionario, async (req, res) => {
  try {
    const { idProduto } = req.params
    const { ordens } = req.body // Array de objetos: [{ id_imagem: 1, ordem: 0 }, ...]

    if (!Array.isArray(ordens)) {
      return res.status(400).json({ message: "Ordens deve ser um array" })
    }

    const db = await connectToDatabase()

    // Atualizar ordem de cada imagem
    for (const item of ordens) {
      await db.query("UPDATE ProdutoImagem SET ordem = ? WHERE id_imagem = ? AND id_produto = ?", [
        item.ordem,
        item.id_imagem,
        idProduto,
      ])
    }

    res.status(200).json({ message: "Ordem das imagens atualizada com sucesso" })
  } catch (err) {
    console.error("Erro ao atualizar ordem das imagens:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Deletar produto (com suas imagens)
router.delete("/produtos/:id", verificarFuncionario, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // Buscar todas as imagens do produto
    const [imagens] = await db.query("SELECT url_imagem FROM ProdutoImagem WHERE id_produto = ?", [id])

    // Remover arquivos físicos
    for (const imagem of imagens) {
      const caminhoImagem = path.join(process.cwd(), imagem.url_imagem)
      if (fs.existsSync(caminhoImagem)) {
        fs.unlinkSync(caminhoImagem)
      }
    }

    // Deletar produto (as imagens serão deletadas automaticamente por CASCADE)
    const [resultado] = await db.query("DELETE FROM Produto WHERE id_produto = ?", [id])

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    res.status(200).json({ message: "Produto e suas imagens deletados com sucesso" })
  } catch (err) {
    console.error("Erro ao deletar produto:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Servir imagens estáticas
router.use("/uploads", express.static("uploads"))

export default router
