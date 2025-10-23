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
import pagamentoRoutes from './routes/pagamentoRoutes.js'
import pedidoRoutes from './routes/pedidoRoutes.js';
// O import já estava aqui, o que é ótimo!
import assistenciaRoutes from './routes/assistenciaRoutes.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

console.log('=== TESTE DE VARIÁVEIS ===');
console.log('PAGARME_SECRET_KEY:', process.env.PAGARME_SECRET_KEY ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'DEFINIDO' : 'NÃO DEFINIDO');

console.log("🚀 LabStore Server iniciando...")

// =================================================================
// 1. CONFIGURAÇÃO DE MIDDLEWARE (ORDEM CORRETA)
// =================================================================

// Middleware geral para permitir requisições de outras origens
app.use(cors())

// Rota de Webhook - PRECISA VIR ANTES do express.json() para receber o body raw
app.post('/pagamento/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Parse do body
    const event = JSON.parse(req.body.toString());
    console.log('Webhook recebido com sucesso:', JSON.stringify(event, null, 2));

    if (event.type === 'order.paid') {
      const order = event.data;
      const paymentLinkId = order.code; // O ID do link de pagamento (pl_...)

      // 1. Buscar dados do frete da nossa tabela temporária
      const db = await connectToDatabase();
      const [freteRows] = await db.query(
        'SELECT * FROM TempFrete WHERE payment_link_id = ?',
        [paymentLinkId]
      );

      let freteInfo = {
        frete_nome: null,
        frete_valor: 0,
        frete_prazo_dias: null,
        cliente_id: null
      };

      if (freteRows.length > 0) {
        freteInfo = freteRows[0];
        console.log(`Dados de frete encontrados para ${paymentLinkId}:`, freteInfo);
      } else {
        console.warn(`AVISO: Nenhum dado de frete encontrado na tabela TempFrete para o link ${paymentLinkId}. Usando fallbacks.`);
      }
      
      // Usar o ID do cliente da tabela de frete é mais seguro
      let clienteId = freteInfo.cliente_id;

      // Fallback: Buscar cliente por email se não estiver na tabela de frete
      if (!clienteId && order.customer?.email) {
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
        await db.beginTransaction();
        let pedidoId;
        try {
          // Buscar itens do carrinho
          const [itensCarrinho] = await db.query(
            'SELECT * FROM CarrinhoDetalhado WHERE id_cliente = ?',
            [clienteId]
          );

          // 2. Usar os dados de frete que buscamos da nossa tabela
          const [pedidoResult] = await db.query(
            `INSERT INTO Pedido (id_cliente, frete_nome, frete_valor, frete_prazo_dias, status, endereco_entrega)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              clienteId,
              freteInfo.frete_nome,
              freteInfo.frete_valor,
              freteInfo.frete_prazo_dias,
              'pago',
              order.shipping?.address?.line_1 || order.customer?.address?.line_1 || null
            ]
          );
          pedidoId = pedidoResult.insertId;

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
              paymentLinkId // Usando a variável que já temos
            ]
          );

          // 3. Limpar a entrada da tabela temporária (OPCIONAL, MAS RECOMENDADO)
          await db.query('DELETE FROM TempFrete WHERE payment_link_id = ?', [paymentLinkId]);
          console.log(`Dados de frete temporários para ${paymentLinkId} foram limpos.`);
          
          console.log(`Pedido ${pedidoId} criado com sucesso via Webhook para cliente ${clienteId}`);
          await db.commit();

          if (pedidoId) {
            try {
              await enviarEmailConfirmacaoCompra(pedidoId);
            } catch (emailError) {
              console.error(`Falha ao enfileirar e-mail para o pedido ${pedidoId}, mas o pedido foi salvo.`);
            }
          }

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
      produtos: "/uploads/produtos/"
    }
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
app.use("/api/carrossel", carrosselRoutes)
app.use("/test", testRoutes)

// <<< ADICIONE ESTA LINHA PARA REGISTRAR A ROTA DE ASSISTÊNCIA
app.use("/assistencia", assistenciaRoutes);

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