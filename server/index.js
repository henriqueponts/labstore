// Arquivo: server/index.js (versão corrigida)
import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import { connectToDatabase } from "./lib/db.js"
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
import pagamentoRoutes from './routes/pagamentoRoutes.js'
import pedidoRoutes from './routes/pedidoRoutes.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

console.log('=== TESTE DE VARIÁVEIS ===');
console.log('PAGARME_SECRET_KEY:', process.env.PAGARME_SECRET_KEY ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINIDO' : 'NÃO DEFINIDO');

console.log("🚀 LabStore Server iniciando...")

// Middlewares
app.use(cors())

app.post('/pagamento/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Parse do body
    const event = JSON.parse(req.body.toString());
    console.log('Webhook recebido com sucesso:', JSON.stringify(event, null, 2)); // Log completo para depuração

    if (event.type === 'order.paid') {
      const order = event.data;
      // Tentar ler metadata de order.metadata ou order.integration.metadata
      let metadata = order.metadata || order.integration?.metadata || {};
      console.log('Metadata extraída:', metadata);

      let clienteId = metadata.cliente_id;

      // Fallback: Buscar cliente por email se cliente_id não estiver em metadata
      if (!clienteId && order.customer?.email) {
        const db = await connectToDatabase();
        const [clienteRows] = await db.query(
          'SELECT id_cliente FROM Cliente WHERE email = ? LIMIT 1',
          [order.customer.email]
        );
        if (clienteRows.length > 0) {
          clienteId = clienteRows[0].id_cliente;
          console.log(`Cliente encontrado via email: ID ${clienteId}`);
        } else {
          console.log(`Cliente não encontrado para email: ${order.customer.email}`);
        }
      }

      if (clienteId) {
        const db = await connectToDatabase();
        await db.beginTransaction();
        try {
          // Buscar itens do carrinho
          const [itensCarrinho] = await db.query(
            'SELECT * FROM CarrinhoDetalhado WHERE id_cliente = ?',
            [clienteId]
          );

          // Criar pedido
          const [pedidoResult] = await db.query(
            `INSERT INTO Pedido (id_cliente, frete_nome, frete_valor, frete_prazo_dias, status, endereco_entrega)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              clienteId,
              metadata.frete_nome || null,
              metadata.frete_valor ? parseFloat(metadata.frete_valor) : 0,
              metadata.frete_prazo_dias ? parseInt(metadata.frete_prazo_dias) : null,
              'pago',
              metadata.endereco_entrega || order.customer?.address?.street || null
            ]
          );
          const pedidoId = pedidoResult.insertId;

          // Inserir itens do pedido
          if (itensCarrinho.length > 0) {
            for (const item of itensCarrinho) {
              await db.query(
                `INSERT INTO ItemPedido (id_pedido, id_produto, quantidade, preco_unitario)
                 VALUES (?, ?, ?, ?)`,
                [pedidoId, item.id_produto, item.quantidade, item.preco_atual]
              );
              await db.query('UPDATE Produto SET estoque = estoque - ? WHERE id_produto = ?', [
                item.quantidade,
                item.id_produto
              ]);
            }

            // Limpar carrinho
            await db.query('CALL LimparCarrinho(?)', [clienteId]);
          } else {
            console.log('Nenhum item no carrinho, mas registrando transação básica');
            // Inserir itens do webhook, se necessário
            for (const item of order.items || []) {
              const [produtoRows] = await db.query(
                'SELECT id_produto, preco FROM Produto WHERE nome LIKE ? LIMIT 1',
                [`%${item.name || item.description}%`]
              );
              if (produtoRows.length > 0) {
                const produto = produtoRows[0];
                const quantidade = item.quantity || 1;
                const precoUnitario = item.amount / 100 / quantidade; // Converte centavos para reais
                await db.query(
                  `INSERT INTO ItemPedido (id_pedido, id_produto, quantidade, preco_unitario)
                   VALUES (?, ?, ?, ?)`,
                  [pedidoId, produto.id_produto, quantidade, precoUnitario]
                );
                await db.query('UPDATE Produto SET estoque = estoque - ? WHERE id_produto = ?', [
                  quantidade,
                  produto.id_produto
                ]);
              }
            }
          }

          // Registrar transação
          await db.query(
            `INSERT INTO TransacaoPagamento
            (id_pedido, transaction_id_pagarme, status, metodo_pagamento, valor_centavos, parcelas, payment_link_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              pedidoId,
              order.id, // O ID da ordem (or_...)
              'paid',
              order.charges?.[0]?.payment_method || null,
              order.amount || null,
              order.charges?.[0]?.installments || null,
              order.code // payment_link_id (pl_...)
            ]
          );

          console.log(`Pedido ${pedidoId} criado com sucesso via Webhook para cliente ${clienteId}`);
          await db.commit();
        } catch (err) {
          await db.rollback();
          console.error('Erro ao processar pedido no webhook:', err);
        }
      } else {
        console.log('Webhook ignorado: Não foi possível identificar o cliente');
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro fatal no webhook:', error);
    res.status(500).send('Erro');
  }
});

app.use(express.json())

app.use("/uploads", express.static(path.join(__dirname, "uploads")))
// Middleware para servir arquivos estáticos do diretório "uploads"

// Middleware adicional para debug de arquivos estáticos
app.use("/uploads", (req, res, next) => {
  const filePath = path.join(__dirname, "Uploads", req.path)
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
app.use('/pagamento', pagamentoRoutes);
app.use("/pedido", pedidoRoutes);
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