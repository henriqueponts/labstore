// routes/testRoutes.js - Rotas de teste
import express from "express"
import { connectToDatabase } from "../lib/db.js"

const router = express.Router()

// Teste de conexão com o banco
router.get("/db", async (req, res) => {
  try {
    const db = await connectToDatabase()
    const [result] = await db.execute("SELECT 1 as test")
    res.json({
      success: true,
      message: "Conexão com banco funcionando!",
      result: result[0],
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro na conexão com banco",
      error: error.message,
    })
  }
})

// Teste específico do carrossel
router.get("/carousel", async (req, res) => {
  try {
    const db = await connectToDatabase()

    // Verificar se a tabela existe
    const [tables] = await db.execute("SHOW TABLES LIKE 'carousel_images'")
    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tabela carousel_images não encontrada!",
      })
    }

    // Buscar dados
    const [results] = await db.execute("SELECT * FROM carousel_images ORDER BY ordem ASC")

    res.json({
      success: true,
      message: `Tabela encontrada com ${results.length} registros`,
      data: results,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao testar carrossel",
      error: error.message,
    })
  }
})

export default router
