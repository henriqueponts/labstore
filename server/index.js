// Arquivo: server/index.js (versão atualizada)
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
import carrinhoRoutes from "./routes/carrinhoRoutes.js" // <-- ADICIONADO
import freteRoutes from "./routes/freteRoutes.js" // <-- ADICIONADO


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

console.log("🚀 LabStore Server iniciando...")

// Middlewares
app.use(cors())
app.use(express.json())

// Servir arquivos estáticos (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "LabStore API funcionando!",
    version: "1.0.0",
    routes: {
      auth: ["/auth/login", "/auth/me", "/auth/registro/cliente", "/auth/registro/funcionario"],
      gestao: ["/gestao/usuarios", "/gestao/clientes"],
      produtos: ["/produtos/produtos", "/produtos/categorias"],
      carrinho: ["/carrinho/", "/carrinho/adicionar", "/carrinho/atualizar", "/carrinho/remover/:id", "/carrinho/limpar"], // <-- ADICIONADO
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
app.use("/carrinho", carrinhoRoutes) // <-- ADICIONADO
app.use("/frete", freteRoutes) // <-- ADICIONADO
console.log("✅ Rotas registradas!")

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`)
  console.log("📋 Rotas ativas:")
  console.log("  - GET  / (API info)")
  console.log("  - POST /auth/login")
  console.log("  - GET  /auth/me")
  console.log("  - POST /auth/registro/cliente")
  console.log("  - POST /auth/registro/funcionario")
  console.log("  - GET  /gestao/test")
  console.log("  - GET  /gestao/usuarios")
  console.log("  - GET  /gestao/clientes")
  console.log("  - PUT  /gestao/usuarios/:id/perfil")
  console.log("  - PUT  /gestao/usuarios/:id/inativar")
  console.log("  - PUT  /gestao/clientes/:id/inativar")
  console.log("  - GET  /produtos/produtos")
  console.log("  - POST /produtos/produtos")
  console.log("  - GET  /produtos/categorias")
  console.log("  - POST /produtos/categorias")
  console.log("  - GET  /chamados/meus-chamados")
  console.log("  - POST /chamados/criar")
  console.log("  - PUT  /chamados/:id/encerrar")
  console.log("  - GET  /chamados/todos")
  console.log("  - PUT  /chamados/:id/status")
  console.log("  - GET  /lgpd/termo-atual")
  console.log("  - GET  /lgpd/status")
  console.log("  - GET  /lgpd/termos")
  console.log("  - POST /lgpd/termos")
  console.log("  - GET  /lgpd/termos/:id")
  console.log("  - POST /lgpd/aceitar-termo")
  console.log("  - GET  /lgpd/verificar-consentimento/:clienteId")
  console.log("  - GET  /lgpd/relatorio-consentimentos")
  console.log("")
  console.log("🗄️  Conecte ao banco MySQL e configure JWT_SECRET no .env")
})
