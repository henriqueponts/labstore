// Arquivo: server/index.js (versão corrigida)
import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import authRoutes from "./routes/authRoutes.js"
import gestaoRoutes from "./routes/gestaoRoutes.js"
import recuperacaoSenhaRoutes from "./routes/recuperacaoSenha.js"
import chamadosRoutes from "./routes/chamadosRoutes.js"
import produtoRoutes from "./routes/produtoRoutes.js"
import lgpdRoutes from "./routes/lgpdRoutes.js"
import carrinhoRoutes from "./routes/carrinhoRoutes.js"
import freteRoutes from "./routes/freteRoutes.js"
import carouselRoutes from "./routes/carouselRoutes.js"
import testRoutes from "./routes/testRoutes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

console.log("🚀 LabStore Server iniciando...")

// Middlewares
app.use(cors())
app.use(express.json())

// Servir arquivos estáticos (uploads) - CORRIGIDO
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Middleware adicional para debug de arquivos estáticos
app.use("/uploads", (req, res, next) => {
  const filePath = path.join(__dirname, "uploads", req.path)
  console.log(`📁 Tentando servir arquivo: ${filePath}`)
  next()
})

// Middleware de log para debug
app.use((req, res, next) => {
  if (req.url.includes("/api/carousel") || req.url.includes("/uploads")) {
    console.log(`🌐 ${req.method} ${req.url}`)
  }
  next()
})

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "LabStore API funcionando!",
    version: "1.0.0",
    routes: {
      auth: ["/auth/login", "/auth/me", "/auth/registro/cliente", "/auth/registro/funcionario"],
      gestao: ["/gestao/usuarios", "/gestao/clientes"],
      produtos: ["/produtos/produtos", "/produtos/categorias"],
      carrinho: [
        "/carrinho/",
        "/carrinho/adicionar",
        "/carrinho/atualizar",
        "/carrinho/remover/:id",
        "/carrinho/limpar",
      ],
      carousel: ["/api/carousel", "/api/carousel/:id", "/api/carousel/reorder"],
      test: ["/test/db", "/test/carousel"],
      chamados: [
        "/chamados/meus-chamados",
        "/chamados/criar",
        "/chamados/:id/encerrar",
        "/chamados/todos",
        "/chamados/:id",
        "/chamados/:id/status",
        "/chamados/:id/responder",
        "/chamados/stats/dashboard",
      ],
      lgpd: [
        "/lgpd/termo-atual",
        "/lgpd/status",
        "/lgpd/termos",
        "/lgpd/termos/:id",
        "/lgpd/aceitar-termo",
        "/lgpd/verificar-consentimento/:clienteId",
        "/lgpd/relatorio-consentimentos",
      ],
    },
    status: "online",
  })
})

// Registrar rotas
console.log("🔗 Registrando rotas...")
app.use("/auth", authRoutes)
app.use("/gestao", gestaoRoutes)
app.use("/auth", recuperacaoSenhaRoutes)
app.use("/chamados", chamadosRoutes)
app.use("/produtos", produtoRoutes)
app.use("/lgpd", lgpdRoutes)
app.use("/carrinho", carrinhoRoutes)
app.use("/frete", freteRoutes)
app.use("/api/carousel", carouselRoutes)
app.use("/test", testRoutes)
console.log("✅ Rotas registradas!")

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`)
  console.log("📋 Rotas de teste disponíveis:")
  console.log("  - GET  /test/db (testar conexão com banco)")
  console.log("  - GET  /test/carousel (testar dados do carrossel)")
  console.log("  - GET  /api/carousel (listar imagens do carrossel)")
  console.log("  - GET  /uploads/carousel/ (servir imagens do carrossel)")
  console.log("")
  console.log("🗄️  Conecte ao banco MySQL e configure JWT_SECRET no .env")
})
