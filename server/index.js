// Arquivo: server/index.js (versão corrigida e reordenada)
import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import { connectToDatabase } from "./lib/db.js"
import { enviarEmailConfirmacaoCompra } from "./routes/emailCompras.js"
import authRoutes from "./routes/authRoutes.js"
import gestaoRoutes from "./routes/gestaoRoutes.js"
import recuperacaoSenhaRoutes from "./routes/recuperacaoSenha.js"
import chamadosRoutes from "./routes/chamadosRoutes.js"
import produtoRoutes from "./routes/produtoRoutes.js"
import lgpdRoutes from "./routes/lgpdRoutes.js"
import carrinhoRoutes from "./routes/carrinhoRoutes.js"
import freteRoutes from "./routes/freteRoutes.js"
import carrosselRoutes from "./routes/carrosselRoutes.js"
import testRoutes from "./routes/testRoutes.js"
import pagamentoRoutes from "./routes/pagamentoRoutes.js"
import pedidoRoutes from "./routes/pedidoRoutes.js"
import assistenciaRoutes from "./routes/assistenciaRoutes.js"
import relatorioClienteRoutes from "./routes/relatorioClienteRoutes.js"
import relatorioAssistenciaRoutes from "./routes/relatorioAssistenciaRoutes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

console.log("=== TESTE DE VARIÁVEIS ===")
console.log("PAGARME_SECRET_KEY:", process.env.PAGARME_SECRET_KEY ? "DEFINIDO" : "NÃO DEFINIDO")
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "DEFINIDO" : "NÃO DEFINIDO")
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "DEFINIDO" : "NÃO DEFINIDO")
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "DEFINIDO" : "NÃO DEFINIDO")

console.log("🚀 LabStore Server iniciando...")

// =================================================================
// 1. CONFIGURAÇÃO DE MIDDLEWARE (ORDEM CORRETA)
// =================================================================

// Middleware geral para permitir requisições de outras origens
app.use(cors())

// Rota de Webhook - PRECISA VIR ANTES do express.json() para receber o body raw
app.post("/pagamento/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const event = JSON.parse(req.body.toString())
    // Log simplificado para não poluir o console, focando no tipo de evento
    console.log(`✅ Webhook recebido: ${event.type}`)

    // Processa apenas eventos de pagamento bem-sucedido
    if (event.type === "order.paid") {
      const order = event.data
      const paymentLinkId = order.code
      const db = await connectToDatabase()

      // ==================================================================
      // LÓGICA DE DECISÃO ROBUSTA: CONSULTA AO BANCO DE DADOS
      // ==================================================================

      // 1. Tenta encontrar o link na tabela de pagamentos de ASSISTÊNCIA
      const [assistenciaRows] = await db.query(
        "SELECT id_solicitacao FROM TempPagamentoAssistencia WHERE payment_link_id = ?",
        [paymentLinkId],
      )

      // CASO 1: É UM PAGAMENTO DE ASSISTÊNCIA TÉCNICA
      if (assistenciaRows.length > 0) {
        const { id_solicitacao } = assistenciaRows[0]
        console.log(`[Webhook] Pagamento de ASSISTÊNCIA TÉCNICA detectado para solicitação #${id_solicitacao}`)

        await db.beginTransaction()
        try {
          // Atualiza o status da solicitação para 'aprovado'
          await db.query("UPDATE SolicitacaoServico SET status = 'aprovado' WHERE id_solicitacao = ?", [id_solicitacao])

          // Registra a transação
          await db.query(
            `INSERT INTO TransacaoPagamento 
            (id_pedido, id_solicitacao, transaction_id_pagarme, status, metodo_pagamento, valor_centavos, parcelas, payment_link_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              null, // Explicitamente definindo id_pedido como nulo
              id_solicitacao,
              order.id,
              "paid",
              order.charges?.[0]?.payment_method || null,
              order.amount || null,
              order.charges?.[0]?.installments || null,
              paymentLinkId,
            ],
          )

          // Limpa a tabela temporária
          await db.query("DELETE FROM TempPagamentoAssistencia WHERE payment_link_id = ?", [paymentLinkId])

          await db.commit()
          console.log(`[Webhook] ✅ Sucesso! Solicitação ${id_solicitacao} atualizada para 'aprovado'.`)

          // (Opcional) Futuramente, você pode criar e chamar uma função para enviar e-mail de confirmação do serviço
          // await enviarEmailConfirmacaoServico(id_solicitacao);
        } catch (err) {
          await db.rollback()
          console.error(
            `[Webhook] ❌ ERRO ao processar pagamento de assistência para solicitação ${id_solicitacao}:`,
            err,
          )
        }
      } else {
        // CASO 2: É UM PAGAMENTO DE PRODUTO (Lógica original)
        console.log(`[Webhook] Pagamento de PRODUTO detectado para o link ${paymentLinkId}`)

        const [freteRows] = await db.query("SELECT * FROM TempFrete WHERE payment_link_id = ?", [paymentLinkId])
        let clienteId = freteRows.length > 0 ? freteRows[0].cliente_id : null

        // Fallback para encontrar cliente por e-mail se não estiver na tabela temporária
        if (!clienteId && order.customer?.email) {
          const [clienteRows] = await db.query("SELECT id_cliente FROM Cliente WHERE email = ? LIMIT 1", [
            order.customer.email,
          ])
          if (clienteRows.length > 0) clienteId = clienteRows[0].id_cliente
        }

        if (clienteId) {
          await db.beginTransaction()
          try {
            const freteInfo = freteRows[0] || { frete_nome: null, frete_valor: 0, frete_prazo_dias: null }
            const [itensCarrinho] = await db.query("SELECT * FROM CarrinhoDetalhado WHERE id_cliente = ?", [clienteId])

            const [pedidoResult] = await db.query(
              `INSERT INTO Pedido (id_cliente, frete_nome, frete_valor, frete_prazo_dias, status, endereco_entrega) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                clienteId,
                freteInfo.frete_nome,
                freteInfo.frete_valor,
                freteInfo.frete_prazo_dias,
                "pago",
                order.shipping?.address?.line_1 || order.customer?.address?.line_1 || null,
              ],
            )
            const pedidoId = pedidoResult.insertId

            if (itensCarrinho.length > 0) {
              for (const item of itensCarrinho) {
                await db.query(
                  `INSERT INTO ItemPedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)`,
                  [pedidoId, item.id_produto, item.quantidade, item.preco_atual],
                )
                await db.query("UPDATE Produto SET estoque = estoque - ? WHERE id_produto = ?", [
                  item.quantidade,
                  item.id_produto,
                ])
              }
              await db.query("CALL LimparCarrinho(?)", [clienteId])
            } else {
              console.warn(
                `[Webhook] Carrinho do cliente ${clienteId} estava vazio. O pedido ${pedidoId} foi criado sem itens.`,
              )
            }

            await db.query(
              `INSERT INTO TransacaoPagamento (id_pedido, transaction_id_pagarme, status, metodo_pagamento, valor_centavos, parcelas, payment_link_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                pedidoId,
                order.id,
                "paid",
                order.charges?.[0]?.payment_method,
                order.amount,
                order.charges?.[0]?.installments,
                paymentLinkId,
              ],
            )

            await db.query("DELETE FROM TempFrete WHERE payment_link_id = ?", [paymentLinkId])
            await db.commit()
            console.log(`[Webhook] ✅ Sucesso! Pedido ${pedidoId} criado para cliente ${clienteId}.`)

            if (pedidoId) {
              await enviarEmailConfirmacaoCompra(pedidoId)
            }
          } catch (err) {
            await db.rollback()
            console.error(`[Webhook] ❌ ERRO ao processar pedido de produto para cliente ${clienteId}:`, err)
          }
        } else {
          console.warn(
            `[Webhook] ⚠️ AVISO: Pagamento de produto ignorado. Não foi possível identificar o cliente para o link ${paymentLinkId}.`,
          )
        }
      }
    }
    // Responde ao Pagar.me que o webhook foi recebido com sucesso
    res.status(200).send("OK")
  } catch (error) {
    console.error("❌ ERRO FATAL no processamento do webhook:", error)
    res.status(500).send("Erro Interno do Servidor")
  }
})

// Middleware para parse de JSON (para todas as outras rotas)
app.use(express.json())

// Middleware para servir arquivos estáticos (imagens, etc.)
console.log("📁 Configurando middleware de arquivos estáticos...")
const uploadsPath = path.join(__dirname, "uploads")
console.log(`📂 Servindo arquivos de: ${uploadsPath}`)
app.use("/uploads", express.static(uploadsPath))

// Middleware de log geral
app.use((req, res, next) => {
  if (req.url.includes("/api/carrossel") || req.url.includes("/uploads")) {
    console.log(`🌐 ${req.method} ${req.url}`)
  }
  next()
})

// =================================================================
// 2. REGISTRO DE ROTAS DA APLICAÇÃO
// =================================================================

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "LabStore API funcionando!",
    version: "1.0.0",
    routes: {
      auth: ["/auth/login", "/auth/me", "/auth/registro/cliente", "/auth/registro/funcionario"],
      gestao: ["/gestao/usuarios", "/gestao/clientes"],
      // <<< ADICIONEI A DOCUMENTAÇÃO DA NOVA ROTA AQUI
      assistencia: ["/assistencia/solicitar", "/assistencia/minhas-solicitacoes"],
      produtos: ["/produtos/produtos", "/produtos/categorias"],
      carrinho: [
        "/carrinho/",
        "/carrinho/adicionar",
        "/carrinho/atualizar",
        "/carrinho/remover/:id",
        "/carrinho/limpar",
      ],
      carrossel: ["/api/carrossel", "/api/carrossel/:id"],
      test: ["/test/db", "/test/carrossel"],
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
    uploads: {
      carrossel: "/uploads/carrossel/",
      produtos: "/uploads/produtos/",
    },
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
app.use("/pagamento", pagamentoRoutes)
app.use("/pedido", pedidoRoutes)
app.use("/api/carrossel", carrosselRoutes)
app.use("/test", testRoutes)
app.use("/relatorios/clientes", relatorioClienteRoutes)

// <<< ADICIONE ESTA LINHA PARA REGISTRAR A ROTA DE ASSISTÊNCIA
app.use("/assistencia", assistenciaRoutes)
app.use("/assistencia", relatorioAssistenciaRoutes)

console.log("✅ Rotas registradas!")

// =================================================================
// 3. INICIALIZAÇÃO DO SERVIDOR
// =================================================================
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`)
  console.log("📋 Rotas de teste disponíveis:")
  console.log("  - GET  /test/db (testar conexão com banco)")
  console.log("  - GET  /test/carrossel (testar dados do carrossel)")
  console.log("  - GET  /api/carrossel (listar imagens do carrossel)")
  console.log("  - GET  /uploads/carrossel/ (servir imagens do carrossel)")
  console.log("  - GET  /uploads/produtos/ (servir imagens dos produtos)")
  console.log("")
  console.log("🗄️ Conecte ao banco MySQL e configure JWT_SECRET no .env")
  console.log(`📁 Diretório de uploads: ${path.join(__dirname, "uploads")}`)
})
