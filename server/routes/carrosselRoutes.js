// Arquivo: server/routes/carrosselRoutes.js (VERSÃO CORRIGIDA)

import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { connectToDatabase } from "../lib/db.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/carrossel")
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "carrossel-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Aumentado para 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Apenas arquivos de imagem são permitidos!"), false)
    }
  },
})

// GET - Listar todas as imagens do carrossel
router.get("/", async (req, res) => {
  try {
    const db = await connectToDatabase()
    const [rows] = await db.execute(
      "SELECT id_carrossel, titulo, subtitulo, url_imagem, link_destino, ordem, ativo FROM carrossel_imagens ORDER BY ordem ASC",
    )
    
    // Normalizar URLs das imagens
    const normalizedRows = rows.map(row => ({
      ...row,
      ativo: Boolean(row.ativo), // Garantir que seja boolean
      url_imagem: row.url_imagem ? (
        row.url_imagem.startsWith('http') ? row.url_imagem : 
        row.url_imagem.startsWith('/') ? row.url_imagem :
        `/uploads/carrossel/${row.url_imagem}`
      ) : null
    }))
    
    console.log(`📊 Retornando ${normalizedRows.length} imagens do carrossel`)
    res.json(normalizedRows)
  } catch (error) {
    console.error("⚠ Erro ao buscar carrossel:", error)
    res.status(500).json({ message: "Erro ao buscar imagens do carrossel", error: error.message })
  }
})

// POST - Criar nova imagem (opcional)
router.post("/", upload.single("imagem"), async (req, res) => {
  try {
    const { titulo, subtitulo, link_destino, ordem } = req.body
    
    if (!req.file) {
      return res.status(400).json({ message: "Imagem é obrigatória" })
    }
    
    if (!titulo || !subtitulo) {
      return res.status(400).json({ message: "Título e subtítulo são obrigatórios" })
    }
    
    const url_imagem = `/uploads/carrossel/${req.file.filename}`
    
    const db = await connectToDatabase()
    const [result] = await db.execute(
      "INSERT INTO carrossel_imagens (titulo, subtitulo, url_imagem, link_destino, ordem, ativo) VALUES (?, ?, ?, ?, ?, ?)",
      [titulo, subtitulo, url_imagem, link_destino || null, parseInt(ordem) || 1, true]
    )
    
    const [newImage] = await db.execute(
      "SELECT * FROM carrossel_imagens WHERE id_carrossel = ?", 
      [result.insertId]
    )
    
    console.log(`✅ Nova imagem criada: ${titulo}`)
    res.status(201).json({
      ...newImage[0],
      ativo: Boolean(newImage[0].ativo)
    })
  } catch (error) {
    console.error("⚠ Erro ao criar imagem:", error)
    // Remover arquivo se houve erro
    if (req.file) {
      const filePath = req.file.path
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    res.status(500).json({ message: "Erro ao criar imagem", error: error.message })
  }
})

// PUT - Atualizar imagem do carrossel
router.put("/:id", upload.single("imagem"), async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, subtitulo, link_destino, ordem, ativo } = req.body
    
    console.log(`🔄 Atualizando imagem ${id}:`, { titulo, subtitulo, link_destino, ordem, ativo })
    
    const db = await connectToDatabase()
    const [existing] = await db.execute("SELECT * FROM carrossel_imagens WHERE id_carrossel = ?", [id])
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }

    let url_imagem = existing[0].url_imagem
    
    // Se uma nova imagem foi enviada
    if (req.file) {
      console.log(`📸 Nova imagem recebida: ${req.file.filename}`)
      
      // Remover imagem antiga se existir
      if (existing[0].url_imagem) {
        const oldImagePath = path.join(__dirname, "..", existing[0].url_imagem)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
          console.log(`🗑 Imagem antiga removida: ${oldImagePath}`)
        }
      }
      url_imagem = `/uploads/carrossel/${req.file.filename}`
    }
    
    // Lógica robusta para converter 'ativo' para booleano
    let finalAtivo = Boolean(ativo === 'true' || ativo === true || ativo === 1 || ativo === '1')

    await db.execute(
      "UPDATE carrossel_imagens SET titulo = ?, subtitulo = ?, url_imagem = ?, link_destino = ?, ordem = ?, ativo = ? WHERE id_carrossel = ?",
      [titulo, subtitulo, url_imagem, link_destino || null, parseInt(ordem) || 1, finalAtivo, id]
    )

    const [updated] = await db.execute("SELECT * FROM carrossel_imagens WHERE id_carrossel = ?", [id])
    
    console.log(`✅ Imagem ${id} atualizada com sucesso`)
    res.json({
      ...updated[0],
      ativo: Boolean(updated[0].ativo)
    })
  } catch (error) {
    console.error("⚠ Erro ao atualizar imagem:", error)
    // Remover novo arquivo se houve erro
    if (req.file) {
      const filePath = req.file.path
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
    res.status(500).json({ message: "Erro ao atualizar imagem", error: error.message })
  }
})

// DELETE - Remover imagem (opcional)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    
    const db = await connectToDatabase()
    const [existing] = await db.execute("SELECT * FROM carrossel_imagens WHERE id_carrossel = ?", [id])
    
    if (existing.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }
    
    // Remover arquivo físico
    if (existing[0].url_imagem) {
      const imagePath = path.join(__dirname, "..", existing[0].url_imagem)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
        console.log(`🗑 Arquivo removido: ${imagePath}`)
      }
    }
    
    // Remover do banco
    await db.execute("DELETE FROM carrossel_imagens WHERE id_carrossel = ?", [id])
    
    console.log(`🗑 Imagem ${id} removida do banco de dados`)
    res.json({ message: "Imagem removida com sucesso" })
  } catch (error) {
    console.error("⚠ Erro ao remover imagem:", error)
    res.status(500).json({ message: "Erro ao remover imagem", error: error.message })
  }
})

// GET - Buscar imagem específica
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    
    const db = await connectToDatabase()
    const [rows] = await db.execute(
      "SELECT * FROM carrossel_imagens WHERE id_carrossel = ?", 
      [id]
    )
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }
    
    res.json({
      ...rows[0],
      ativo: Boolean(rows[0].ativo)
    })
  } catch (error) {
    console.error("⚠ Erro ao buscar imagem:", error)
    res.status(500).json({ message: "Erro ao buscar imagem", error: error.message })
  }
})

export default router