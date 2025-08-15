// server/routes/webhookRoutes.js - Processamento completo de webhooks Pagar.me

import express from 'express';
import { connectToDatabase } from '../lib/db.js';

const router = express.Router();

// Rota para receber webhooks do Pagar.me
router.post('/pagarme', async (req, res) => {
  console.log('=== WEBHOOK RECEBIDO ===');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const webhookData = req.body;
    
    // Verifica se é um evento válido do Pagar.me
    if (!webhookData.type || !webhookData.data) {
      console.log('Webhook inválido - dados incompletos');
      return res.status(400).json({ message: 'Dados do webhook inválidos' });
    }

    const { type, data: orderData } = webhookData;
    console.log(`Tipo de evento: ${type}`);
    console.log(`Status do pedido: ${orderData.status}`);

    // Processa apenas eventos de pagamento confirmado
    if (type === 'order.paid' && orderData.status === 'paid') {
      await processarPedidoPago(orderData);
      console.log('✅ Pedido processado com sucesso!');
    } else {
      console.log(`⚠️ Evento não processado: ${type} (${orderData.status})`);
    }

    // Sempre responde OK para o Pagar.me não reenviar
    res.status(200).json({ message: 'Webhook processado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Função para processar pedido pago
async function processarPedidoPago(orderData) {
  const db = await connectToDatabase();
  
  try {
    await db.beginTransaction();
    console.log('🔄 Iniciando transação no banco...');
    
    // Extrai dados do pedido
    const {
      id: orderId,
      code: paymentLinkId,
      amount: valorTotal,
      customer,
      items,
      charges,
      integration
    } = orderData;

    // Busca dados do cliente usando o email
    const [clienteRows] = await db.query(
      'SELECT id_cliente FROM Cliente WHERE email = ? LIMIT 1',
      [customer.email]
    );

    if (clienteRows.length === 0) {
      throw new Error(`Cliente não encontrado: ${customer.email}`);
    }

    const clienteId = clienteRows[0].id_cliente;
    console.log(`👤 Cliente encontrado: ID ${clienteId}`);

    // Extrai metadados do pedido
    const metadata = integration?.metadata || {};
    const freteNome = metadata.frete_nome || 'Não especificado';
    const freteValor = parseFloat(metadata.frete_valor || '0');
    const fretePrazo = parseInt(metadata.frete_prazo_dias || '0');
    const enderecoEntrega = metadata.endereco_entrega || 'Endereço do cliente';

    console.log(`📦 Dados do frete: ${freteNome} - R$ ${freteValor}`);

    // Verifica se o pedido já existe para evitar duplicação
    const [pedidoExistente] = await db.query(
      'SELECT P.id_pedido FROM Pedido P JOIN TransacaoPagamento T ON P.id_pedido = T.id_pedido WHERE T.payment_link_id = ?',
      [paymentLinkId]
    );

    if (pedidoExistente.length > 0) {
      console.log('⚠️ Pedido já processado anteriormente');
      await db.rollback();
      return;
    }

    // 1. Cria o pedido principal
    const [resultPedido] = await db.query(`
      INSERT INTO Pedido (
        id_cliente, 
        frete_nome, 
        frete_valor, 
        frete_prazo_dias, 
        status, 
        endereco_entrega,
        data_pedido
      ) VALUES (?, ?, ?, ?, 'pago', ?, NOW())
    `, [clienteId, freteNome, freteValor, fretePrazo, enderecoEntrega]);

    const pedidoId = resultPedido.insertId;
    console.log(`📝 Pedido criado: ID ${pedidoId}`);

    // 2. Adiciona os itens do pedido
    for (const item of items) {
      // Busca o produto pelo nome (pode melhorar esta lógica se necessário)
      const [produtoRows] = await db.query(
        'SELECT id_produto, preco FROM Produto WHERE nome LIKE ? LIMIT 1',
        [`%${item.description || item.name}%`]
      );

      if (produtoRows.length > 0) {
        const produto = produtoRows[0];
        const quantidade = item.quantity || 1;
        const precoUnitario = item.amount / 100 / quantidade; // Converte centavos para reais

        await db.query(`
          INSERT INTO ItemPedido (id_pedido, id_produto, quantidade, preco_unitario)
          VALUES (?, ?, ?, ?)
        `, [pedidoId, produto.id_produto, quantidade, precoUnitario]);

        console.log(`📦 Item adicionado: ${item.name} (Qtd: ${quantidade})`);

        // Atualiza o estoque
        await db.query(
          'UPDATE Produto SET estoque = estoque - ? WHERE id_produto = ?',
          [quantidade, produto.id_produto]
        );
      }
    }

    // 3. Registra a transação de pagamento
    const charge = charges[0] || {};
    await db.query(`
      INSERT INTO TransacaoPagamento (
        id_pedido,
        transaction_id_pagarme,
        status,
        metodo_pagamento,
        valor_centavos,
        parcelas,
        payment_link_id,
        data_transacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      pedidoId,
      charge.id || orderId,
      'paid',
      charge.payment_method || 'unknown',
      valorTotal,
      charge.installments || 1,
      paymentLinkId
    ]);

    console.log('💳 Transação registrada');

    // 4. Limpa o carrinho do cliente
    await db.query(
      'CALL LimparCarrinho(?)',
      [clienteId]
    );

    console.log('🛒 Carrinho limpo');

    // Confirma todas as operações
    await db.commit();
    console.log('✅ Transação confirmada com sucesso!');

  } catch (error) {
    await db.rollback();
    console.error('❌ Erro na transação:', error);
    throw error;
  } finally {
    await db.end();
  }
}

export default router;