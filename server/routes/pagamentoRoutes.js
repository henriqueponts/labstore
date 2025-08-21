// server/routes/pagamentoRoutes.js — SANDBOX (v5) + snake_case + correções ESTRUTURAIS
import express from 'express';
import fetch from 'node-fetch';
import { connectToDatabase } from '../lib/db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Base URL do SANDBOX (para produção use https://api.pagar.me/core/v5)
const API_BASE_URL = 'https://sdx-api.pagar.me/core/v5';

// Middleware para verificar cliente
const verificarCliente = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.tipo !== 'cliente') {
      return res.status(403).json({ message: 'Acesso negado. Apenas clientes.' });
    }
    req.clienteId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Helper para chamar a API do Pagar.me
const makeRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Basic <base64(sk_xxx:)>
      'Authorization': `Basic ${Buffer.from(`${process.env.PAGARME_SECRET_KEY}:`).toString('base64')}`,
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const responseData = await response.json().catch(() => ({ message: response.statusText }));
  if (!response.ok) {
    console.error(`Erro na chamada para ${url}:`, responseData);
    throw new Error(`Pagar.me API Error (${response.status}): ${JSON.stringify(responseData)}`);
  }
  return responseData;
};


const formatDocument = (doc) => {
  return String(doc || "")
    .replace(/\D/g, "") // remove tudo que não é número
    .slice(0, 14); // garante no máximo 14 dígitos
};

// Criar link de pagamento (Checkout Pagar.me) - VERSÃO CORRIGIDA
router.post("/criar-link", verificarCliente, async (req, res) => {
  try {
    const { frete_nome, frete_valor, frete_prazo_dias, endereco_entrega } = req.body;
    
    if (!frete_nome || frete_valor == null || frete_prazo_dias == null) {
      return res.status(400).json({
        success: false,
        message: "Campos de frete (nome, valor, prazo) são obrigatórios"
      });
    }

    // Conecta ao banco de dados
    const db = await connectToDatabase();

    // Buscar dados do cliente
    const [clienteRows] = await db.query(
      'SELECT nome, email, cpf_cnpj FROM Cliente WHERE id_cliente = ?',
      [req.clienteId]
    );

    if (clienteRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    const nome_cliente = clienteRows[0].nome;
    const email_cliente = clienteRows[0].email;
    const documento_cliente = formatDocument(clienteRows[0].cpf_cnpj);

    // Busca itens do carrinho do cliente
    const [itensCarrinho] = await db.query(`
      SELECT c.quantidade, c.preco_atual, p.nome AS nome_produto
      FROM CarrinhoDetalhado c
      JOIN Produto p ON c.id_produto = p.id_produto
      WHERE c.id_cliente = ?
    `, [req.clienteId]);


    // Calcular total do carrinho + frete em centavos
    let totalCentavos = 0;
    for (const item of itensCarrinho) {
      totalCentavos += Math.round(item.quantidade * item.preco_atual * 100);
    }
    totalCentavos += Math.round(Number(frete_valor) * 100);

    // Gerar parcelas para cartão de crédito (1 até max_installments)
    const maxInstallments = 12; // ou outro valor que queira limitar
    const parcelas = [];
    for (let i = 1; i <= maxInstallments; i++) {
      parcelas.push({
        number: i,
        total: Math.round(totalCentavos / i) // simplificado: divide igual o total
      });
    }

    // Montar payload final para enviar à API
    const paymentLinkData = {
      type: "order",
      name: `Pedido LabStore (Cliente #${req.clienteId})`,
      is_building: false,

      payment_settings: {
        accepted_payment_methods: ["credit_card", "pix", "boleto"],

        credit_card_settings: {
          operation_type: "auth_and_capture",
          installments: parcelas // array de parcelas gerado acima
        },

        pix_settings: { expires_in: 3600 },
        boleto_settings: { due_in: 3 }
      },

      cart_settings: {
        items: itensCarrinho.map(item => ({
          name: item.nome_produto || "Produto da Loja",
          amount: Math.round(item.preco_atual * item.quantidade * 100),
          default_quantity: item.quantidade
        })),
        items_total_cost: totalCentavos,
        total_cost: totalCentavos,
        shipping_cost: Math.round(Number(frete_valor) * 100),
        shipping_total_cost: Math.round(Number(frete_valor) * 100)
      },

      customer_settings: {
        customer_editable: false,
        customer: {
          name: nome_cliente,
          email: email_cliente,
          type: documento_cliente.length > 11 ? "company" : "individual",
          document: documento_cliente || "00000000000",
          document_type: documento_cliente.length > 11 ? "cnpj" : "cpf"
        }
      },

      metadata: {
        cliente_id: req.clienteId.toString(),
        nome_cliente,
        email_cliente,
        frete_nome,
        frete_valor: frete_valor.toString(),
        frete_prazo_dias: frete_prazo_dias.toString(),
        endereco_entrega: endereco_entrega || ""
      }
    };

    console.log("Payload enviado ao Pagar.me:", JSON.stringify(paymentLinkData, null, 2));

    // Chama API do Pagar.me (sandbox)
    const response = await fetch(`${API_BASE_URL}/paymentlinks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(process.env.PAGARME_SECRET_KEY + ":").toString("base64")}`
      },
      body: JSON.stringify(paymentLinkData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erro na API do Pagar.me:", data);
      return res.status(response.status).json({
        success: false,
        message: "Erro ao criar link de pagamento",
        error: data
      });
    }

    // Após criar o link, salvamos os dados do frete temporariamente
    try {
        const db = await connectToDatabase();
        // Usamos ON DUPLICATE KEY UPDATE para evitar erros caso o link já exista
        await db.query(
            `INSERT INTO TempFrete (payment_link_id, frete_nome, frete_valor, frete_prazo_dias, cliente_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             frete_nome = VALUES(frete_nome),
             frete_valor = VALUES(frete_valor),
             frete_prazo_dias = VALUES(frete_prazo_dias),
             cliente_id = VALUES(cliente_id)`,
            [data.id, frete_nome, frete_valor, frete_prazo_dias, req.clienteId]
        );
        console.log(`Dados de frete para o link ${data.id} salvos/atualizados temporariamente.`);
    } catch (dbError) {
        // Se falhar ao salvar o frete, o processo não deve parar, mas logamos o erro.
        console.error("ERRO CRÍTICO: Não foi possível salvar os dados de frete temporários.", dbError);
        // Em um cenário de produção, você poderia enviar um alerta aqui.
    }

    // Log de sucesso
    console.log("Link criado com sucesso:", data);

    // Retorna URL de pagamento e ID do pedido/link para o frontend
    return res.json({
      success: true,
      payment_url: data.url,   // URL para pagamento (campo retornado pelo Pagar.me)
      order_id: data.id        // ID do link/pedido criado pelo Pagar.me
    });
    
  } catch (err) {
    console.error("Erro ao criar link de pagamento:", err);
    return res.status(500).json({
      success: false,
      message: "Erro interno no servidor",
      error: err.message
    });
  }
});


// Rota para verificar pagamento
router.get('/verificar-pagamento/:paymentLinkId', verificarCliente, async (req, res) => {
  const { paymentLinkId } = req.params;

  try {
    // Consulta Payment Link no Pagar.me
    const link = await makeRequest(`${API_BASE_URL}/paymentlinks/${paymentLinkId}`);

    // Pega a primeira charge, se existir
    const charge = link.charges?.[0];

    res.json({
      status: charge?.status || 'pending',            // pending, paid, failed
      payment_method: charge?.payment_method || null, // credit_card, pix, boleto
      amount: charge?.amount || link.cart_settings?.items_total_cost || 0,
      paid: charge?.status === 'paid'
    });

  } catch (err) {
    console.error('Erro ao verificar pagamento:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;