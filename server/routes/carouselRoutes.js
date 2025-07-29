// Arquivo: server/routes/carouselRoutes.js (VERSÃO SIMPLIFICADA FINAL)

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
    const uploadPath = path.join(__dirname, "../uploads/carousel")
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "carousel-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
      "SELECT id_carousel, titulo, subtitulo, url_imagem, link_destino, ordem, ativo FROM carousel_images ORDER BY ordem ASC",
    )
    res.json(rows)
  } catch (error) {
    console.error("❌ Erro ao buscar carrossel:", error)
    res.status(500).json({ message: "Erro ao buscar imagens do carrossel", error: error.message })
  }
})

// PUT - Atualizar imagem do carrossel (sem reordenação)
router.put("/:id", upload.single("imagem"), async (req, res) => {
  try {
    const { id } = req.params
    const { titulo, subtitulo, link_destino, ordem, ativo } = req.body
    
    const db = await connectToDatabase()
    const [existing] = await db.execute("SELECT * FROM carousel_images WHERE id_carousel = ?", [id])
    if (existing.length === 0) {
      return res.status(404).json({ message: "Imagem não encontrada" })
    }

    let url_imagem = existing[0].url_imagem
    if (req.file) {
      if (existing[0].url_imagem) {
        const oldImagePath = path.join(__dirname, "..", existing[0].url_imagem)
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath)
      }
      url_imagem = `/uploads/carousel/${req.file.filename}`
    }
    
    // Lógica robusta para converter 'ativo' para booleano
    let finalAtivo = (ativo === 'true' || ativo === true || ativo === 1 || ativo === '1');

    await db.execute(
      "UPDATE carousel_images SET titulo = ?, subtitulo = ?, url_imagem = ?, link_destino = ?, ordem = ?, ativo = ? WHERE id_carousel = ?",
      [titulo, subtitulo, url_imagem, link_destino || null, ordem, finalAtivo, id],
    )

    const [updated] = await db.execute("SELECT * FROM carousel_images WHERE id_carousel = ?", [id])
    res.json(updated[0])
  } catch (error) {
    console.error("❌ Erro ao atualizar imagem:", error)
    res.status(500).json({ message: "Erro ao atualizar imagem", error: error.message })
  }
})

// ROTA E FUNÇÃO DE REORDENAÇÃO FORAM COMPLETAMENTE REMOVIDAS

// Outras rotas como POST e DELETE podem ser mantidas se você precisar delas.

export default router