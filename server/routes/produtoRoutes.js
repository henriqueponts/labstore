import express from "express"
import { connectToDatabase } from "../lib/db.js"
import jwt from "jsonwebtoken"
import multer from "multer"
import path from "path"
import fs from "fs"
import { registrarLog } from "../middleware/logMiddleware.js"

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

// Listar todas as marcas
router.get("/marcas", async (req, res) => {
  try {
    const db = await connectToDatabase()
    const [marcas] = await db.query("SELECT id_marca, nome, descricao FROM Marca ORDER BY nome")
    res.status(200).json(marcas)
  } catch (err) {
    console.error("Erro ao buscar marcas:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Listar todos os produtos com suas imagens e marca
router.get("/produtos", async (req, res) => {
  try {
    const db = await connectToDatabase()

    // Buscar produtos com marca e categoria
    const [produtos] = await db.query(
      `SELECT p.*, c.nome as categoria_nome, m.nome as marca_nome FROM Produto p LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria LEFT JOIN Marca m ON p.id_marca = m.id_marca ORDER BY p.nome`,
    )

    // Buscar imagens para cada produto
    for (const produto of produtos) {
      const [imagens] = await db.query(
        `SELECT id_imagem, url_imagem, nome_arquivo, ordem, is_principal FROM ProdutoImagem WHERE id_produto = ? ORDER BY is_principal DESC, ordem ASC`,
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

router.get("/busca-rapida", async (req, res) => {
  try {
    const { termo } = req.query
    if (!termo || termo.trim().length < 2) {
      return res.status(200).json([])
    }
    const db = await connectToDatabase()
    const searchTerm = `%${termo}%`

    const [produtos] = await db.query(
      `SELECT p.*, c.nome as categoria_nome, m.nome as marca_nome FROM Produto p LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria LEFT JOIN Marca m ON p.id_marca = m.id_marca WHERE p.nome LIKE ?`,
      [searchTerm],
    )

    // Buscar imagens para cada produto
    for (const produto of produtos) {
      const [imagens] = await db.query(
        `SELECT id_imagem, url_imagem, nome_arquivo, ordem, is_principal FROM ProdutoImagem WHERE id_produto = ? ORDER BY is_principal DESC, ordem ASC`,
        [produto.id_produto],
      )

      produto.imagens = imagens
      produto.imagemUrl = imagens.find((img) => img.is_principal)?.url_imagem || imagens[0]?.url_imagem || null
    }

    res.status(200).json(produtos)
  } catch (err) {
    console.error("Erro ao buscar produtos:", err)
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

// Criar novo produto com múltiplas imagens
router.post("/produtos", verificarFuncionario, upload.array("imagens", 10), async (req, res) => {
  try {
    const {
      nome,
      descricao,
      preco,
      id_marca,
      modelo,
      estoque,
      id_categoria,
      compatibilidade,
      cor,
      ano_fabricacao,
      peso_kg,
      altura_cm,
      largura_cm,
      comprimento_cm,
    } = req.body

    if (!nome || !descricao || !preco || !id_categoria) {
      return res.status(400).json({ message: "Nome, descrição, preço e categoria são obrigatórios" })
    }
    if (estoque && Number.parseInt(estoque) > 100) {
      return res.status(400).json({ message: "O estoque não pode ser superior a 100 unidades." })
    }
    if (isNaN(Number.parseFloat(preco)) || Number.parseFloat(preco) <= 0) {
      return res.status(400).json({ message: "Preço deve ser um número válido maior que zero" })
    }

    const db = await connectToDatabase()
    const [categoria] = await db.query("SELECT id_categoria FROM Categoria WHERE id_categoria = ?", [id_categoria])
    if (categoria.length === 0) {
      return res.status(400).json({ message: "Categoria não encontrada" })
    }

    if (id_marca) {
      const [marca] = await db.query("SELECT id_marca FROM Marca WHERE id_marca = ?", [id_marca])
      if (marca.length === 0) {
        return res.status(400).json({ message: "Marca não encontrada" })
      }
    }

    const [resultado] = await db.query(
      `INSERT INTO Produto (nome, descricao, preco, id_marca, modelo, estoque, id_categoria, compatibilidade, cor, ano_fabricacao, peso_kg, altura_cm, largura_cm, comprimento_cm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        descricao,
        Number.parseFloat(preco),
        id_marca || null,
        modelo || null,
        Number.parseInt(estoque) || 0,
        id_categoria,
        compatibilidade || null,
        cor || null,
        ano_fabricacao ? Number.parseInt(ano_fabricacao) : null,
        peso_kg ? Number.parseFloat(peso_kg) : null,
        altura_cm ? Number.parseFloat(altura_cm) : null,
        largura_cm ? Number.parseFloat(largura_cm) : null,
        comprimento_cm ? Number.parseFloat(comprimento_cm) : null,
      ],
    )

    const idProduto = resultado.insertId

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const arquivo = req.files[i]
        const urlImagem = `/uploads/produtos/${arquivo.filename}`
        const ehPrincipal = i === 0
        await db.query(
          `INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES (?, ?, ?, ?, ?)`,
          [idProduto, urlImagem, arquivo.filename, i, ehPrincipal],
        )
      }
    }

    await registrarLog(req, {
      acao: 'CREATE',
      tabelaAfetada: 'Produto',
      idRegistro: idProduto,
      descricao: `Produto "${nome}" criado com estoque inicial de ${estoque || 0} unidades`,
      valorNovo: JSON.stringify({ nome, preco, estoque: estoque || 0 })
    })

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

// Buscar produto por ID com suas imagens
router.get("/produtos/:id", async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    // CONSULTA MODIFICADA AQUI: Adicionado LEFT JOIN com Marca para obter marca_nome
    const [produtos] = await db.query(
      `SELECT p.*, c.nome as categoria_nome, m.nome as marca_nome FROM Produto p LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria LEFT JOIN Marca m ON p.id_marca = m.id_marca WHERE p.id_produto = ?`,
      [id],
    )

    if (produtos.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    const produto = produtos[0]

    // Buscar imagens do produto
    const [imagens] = await db.query(
      `SELECT id_imagem, url_imagem, nome_arquivo, ordem, is_principal FROM ProdutoImagem WHERE id_produto = ? ORDER BY is_principal DESC, ordem ASC`,
      [id],
    )

    produto.imagens = imagens

    res.status(200).json(produto)
  } catch (err) {
    console.error("Erro ao buscar produto:", err)
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
      id_marca,
      modelo,
      estoque,
      id_categoria,
      compatibilidade,
      cor,
      ano_fabricacao,
      status,
      peso_kg,
      altura_cm,
      largura_cm,
      comprimento_cm,
      imagens_removidas,
      imagem_principal_id,
      ordens_imagens,
    } = req.body

    const db = await connectToDatabase()
    const [produtoExistente] = await db.query("SELECT * FROM Produto WHERE id_produto = ?", [id])
    if (produtoExistente.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }
    
    const produtoAntigo = produtoExistente[0]
    
    if (id_categoria) {
      const [categoria] = await db.query("SELECT id_categoria FROM Categoria WHERE id_categoria = ?", [id_categoria])
      if (categoria.length === 0) {
        return res.status(400).json({ message: "Categoria não encontrada" })
      }
    }

    if (id_marca) {
      const [marca] = await db.query("SELECT id_marca FROM Marca WHERE id_marca = ?", [id_marca])
      if (marca.length === 0) {
        return res.status(400).json({ message: "Marca não encontrada" })
      }
    }
    
    if (estoque && Number.parseInt(estoque) > 100) {
      return res.status(400).json({ message: "O estoque não pode ser superior a 100 unidades." })
    }

    await db.query(
      `UPDATE Produto SET nome = COALESCE(?, nome), descricao = COALESCE(?, descricao), preco = COALESCE(?, preco), id_marca = COALESCE(?, id_marca), modelo = COALESCE(?, modelo), estoque = COALESCE(?, estoque), id_categoria = COALESCE(?, id_categoria), compatibilidade = COALESCE(?, compatibilidade), cor = COALESCE(?, cor), ano_fabricacao = COALESCE(?, ano_fabricacao), status = COALESCE(?, status), peso_kg = COALESCE(?, peso_kg), altura_cm = COALESCE(?, altura_cm), largura_cm = COALESCE(?, largura_cm), comprimento_cm = COALESCE(?, comprimento_cm) WHERE id_produto = ?`,
      [
        nome || null,
        descricao || null,
        preco ? Number.parseFloat(preco) : null,
        id_marca || null,
        modelo || null,
        estoque ? Number.parseInt(estoque) : null,
        id_categoria || null,
        compatibilidade || null,
        cor || null,
        ano_fabricacao ? Number.parseInt(ano_fabricacao) : null,
        status || null,
        peso_kg ? Number.parseFloat(peso_kg) : null,
        altura_cm ? Number.parseFloat(altura_cm) : null,
        largura_cm ? Number.parseFloat(largura_cm) : null,
        comprimento_cm ? Number.parseFloat(comprimento_cm) : null,
        id,
      ],
    )

    if (estoque && Number.parseInt(estoque) !== Number.parseInt(produtoAntigo.estoque)) {
      await registrarLog(req, {
        acao: 'STOCK_UPDATE',
        tabelaAfetada: 'Produto',
        idRegistro: parseInt(id),
        descricao: `Estoque do produto "${produtoAntigo.nome}" alterado de ${produtoAntigo.estoque} para ${estoque}`,
        campoAlterado: 'estoque',
        valorAnterior: String(produtoAntigo.estoque),
        valorNovo: String(estoque)
      })
    }

    if (preco && Number.parseFloat(preco) !== Number.parseFloat(produtoAntigo.preco)) {
      const precoAntigoNum = Number.parseFloat(produtoAntigo.preco)
      const precoNovoNum = Number.parseFloat(preco)
      
      await registrarLog(req, {
        acao: 'UPDATE',
        tabelaAfetada: 'Produto',
        idRegistro: parseInt(id),
        descricao: `Preço do produto "${produtoAntigo.nome}" alterado de R$ ${precoAntigoNum.toFixed(2)} para R$ ${precoNovoNum.toFixed(2)}`,
        campoAlterado: 'preco',
        valorAnterior: String(produtoAntigo.preco),
        valorNovo: String(preco)
      })
    }

    if (nome && nome !== produtoAntigo.nome) {
      await registrarLog(req, {
        acao: 'UPDATE',
        tabelaAfetada: 'Produto',
        idRegistro: parseInt(id),
        descricao: `Nome do produto alterado de "${produtoAntigo.nome}" para "${nome}"`,
        campoAlterado: 'nome',
        valorAnterior: produtoAntigo.nome,
        valorNovo: nome
      })
    }

    if (imagens_removidas) {
      const idsRemover = JSON.parse(imagens_removidas)
      for (const idImagem of idsRemover) {
        const [dadosImagem] = await db.query("SELECT * FROM ProdutoImagem WHERE id_imagem = ? AND id_produto = ?", [
          idImagem,
          id,
        ])

        if (dadosImagem.length > 0) {
          const caminhoImagem = path.join(process.cwd(), dadosImagem[0].url_imagem)
          if (fs.existsSync(caminhoImagem)) {
            fs.unlinkSync(caminhoImagem)
          }

          await db.query("DELETE FROM ProdutoImagem WHERE id_imagem = ?", [idImagem])
        }
      }
    }

    if (req.files && req.files.length > 0) {
      const [ordemMaxima] = await db.query(
        "SELECT COALESCE(MAX(ordem), -1) as ordem_maxima FROM ProdutoImagem WHERE id_produto = ?",
        [id],
      )

      let proximaOrdem = ordemMaxima[0].ordem_maxima + 1

      for (const arquivo of req.files) {
        const urlImagem = `/uploads/produtos/${arquivo.filename}`

        await db.query(
          `INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES (?, ?, ?, ?, FALSE)`,
          [id, urlImagem, arquivo.filename, proximaOrdem],
        )

        proximaOrdem++
      }
    }

    if (imagem_principal_id) {
      await db.query("UPDATE ProdutoImagem SET is_principal = FALSE WHERE id_produto = ?", [id])
      await db.query("UPDATE ProdutoImagem SET is_principal = TRUE WHERE id_imagem = ? AND id_produto = ?", [
        imagem_principal_id,
        id,
      ])
    }

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

    const [imagensPrincipais] = await db.query(
      "SELECT COUNT(*) as total FROM ProdutoImagem WHERE id_produto = ? AND is_principal = TRUE",
      [id],
    )

    if (imagensPrincipais[0].total === 0) {
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

// Deletar produto (com suas imagens)
router.delete("/produtos/:id", verificarFuncionario, async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [produtoData] = await db.query("SELECT nome, estoque, preco FROM Produto WHERE id_produto = ?", [id])
    if (produtoData.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    const [imagens] = await db.query("SELECT url_imagem FROM ProdutoImagem WHERE id_produto = ?", [id])

    for (const imagem of imagens) {
      const caminhoImagem = path.join(process.cwd(), imagem.url_imagem)
      if (fs.existsSync(caminhoImagem)) {
        fs.unlinkSync(caminhoImagem)
      }
    }

    const [resultado] = await db.query("DELETE FROM Produto WHERE id_produto = ?", [id])

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    const precoNum = Number.parseFloat(produtoData[0].preco)
    
    await registrarLog(req, {
      acao: 'DELETE',
      tabelaAfetada: 'Produto',
      idRegistro: parseInt(id),
      descricao: `Produto "${produtoData[0].nome}" deletado (tinha ${produtoData[0].estoque} unidades em estoque e custava R$ ${precoNum.toFixed(2)})`,
      valorAnterior: JSON.stringify({ 
        nome: produtoData[0].nome,
        estoque: produtoData[0].estoque,
        preco: produtoData[0].preco
      })
    })

    res.status(200).json({ message: "Produto e suas imagens deletados com sucesso" })
  } catch (err) {
    console.error("Erro ao deletar produto:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Adicionar imagens a um produto existente
router.post("/produtos/:id/imagens", verificarFuncionario, upload.array("imagens", 10), async (req, res) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()

    const [produto] = await db.query("SELECT id_produto FROM Produto WHERE id_produto = ?", [id])
    if (produto.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhuma imagem foi enviada" })
    }

    const [ordemMaxima] = await db.query(
      "SELECT COALESCE(MAX(ordem), -1) as ordem_maxima FROM ProdutoImagem WHERE id_produto = ?",
      [id],
    )

    let proximaOrdem = ordemMaxima[0].ordem_maxima + 1

    for (const arquivo of req.files) {
      const urlImagem = `/uploads/produtos/${arquivo.filename}`

      await db.query(
        `INSERT INTO ProdutoImagem (id_produto, url_imagem, nome_arquivo, ordem, is_principal) VALUES (?, ?, ?, ?, FALSE)`,
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

    const [imagem] = await db.query("SELECT * FROM ProdutoImagem WHERE id_imagem = ? AND id_produto = ?", [
      idImagem,
      idProduto,
    ])

    if (imagem.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }

    const dadosImagem = imagem[0]

    const caminhoImagem = path.join(process.cwd(), dadosImagem.url_imagem)
    if (fs.existsSync(caminhoImagem)) {
      fs.unlinkSync(caminhoImagem)
    }

    await db.query("DELETE FROM ProdutoImagem WHERE id_imagem = ?", [idImagem])

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

    const [imagem] = await db.query("SELECT id_imagem FROM ProdutoImagem WHERE id_imagem = ? AND id_produto = ?", [
      idImagem,
      idProduto,
    ])

    if (imagem.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }

    await db.query("UPDATE ProdutoImagem SET is_principal = FALSE WHERE id_produto = ?", [idProduto])

    await db.query("UPDATE ProdutoImagem SET is_principal = TRUE WHERE id_imagem = ? AND id_produto = ?", [
      idImagem,
      idProduto,
    ])

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
    const { ordens } = req.body

    if (!Array.isArray(ordens)) {
      return res.status(400).json({ message: "Ordens deve ser um array" })
    }

    const db = await connectToDatabase()

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

// Buscar produtos com filtros
router.get("/produtos/buscar", async (req, res) => {
  try {
    const { nome, categoria, marca, preco_min, preco_max, status } = req.query
    const db = await connectToDatabase()

    let query = `SELECT p.*, c.nome as categoria_nome, m.nome as marca_nome FROM Produto p LEFT JOIN Categoria c ON p.id_categoria = c.id_categoria LEFT JOIN Marca m ON p.id_marca = m.id_marca WHERE 1=1`
    const params = []

    if (nome) {
      query += ` AND p.nome LIKE ?`
      params.push(`%${nome}%`)
    }

    if (categoria) {
      query += ` AND p.id_categoria = ?`
      params.push(categoria)
    }

    if (marca) {
      query += ` AND p.id_marca = ?`
      params.push(marca)
    }

    if (preco_min) {
      query += ` AND p.preco >= ?`
      params.push(Number.parseFloat(preco_min))
    }

    if (preco_max) {
      query += ` AND p.preco <= ?`
      params.push(Number.parseFloat(preco_max))
    }

    if (status) {
      query += ` AND p.status = ?`
      params.push(status)
    }

    query += ` ORDER BY p.nome`

    const [produtos] = await db.query(query, params)

    for (const produto of produtos) {
      const [imagens] = await db.query(
        `SELECT id_imagem, url_imagem, nome_arquivo, ordem, is_principal FROM ProdutoImagem WHERE id_produto = ? ORDER BY is_principal DESC, ordem ASC`,
        [produto.id_produto],
      )

      produto.imagens = imagens
      produto.imagemUrl = imagens.find((img) => img.is_principal)?.url_imagem || imagens[0]?.url_imagem || null
    }

    res.status(200).json(produtos)
  } catch (err) {
    console.error("Erro ao buscar produtos:", err)
    res.status(500).json({ message: "Erro interno do servidor" })
  }
})

// Servir imagens estáticas
router.use("/uploads", express.static("uploads"))

export default router
