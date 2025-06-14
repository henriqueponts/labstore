// backend/src/services/orderService.js
const pool = require('../config/db');
const cartService = require('./cartService');
// productService já está usando nomes de colunas corretos.

const mapDbOrderToOrder = async (dbOrder) => {
  if (!dbOrder) return null;

  const [itemsRows] = await pool.query(
    `SELECT ip.quantidade, ip.preco_unitario,
            p.id_produto, p.nome AS nome_produto_pedido, p.descricao AS descricao_produto_pedido, p.preco AS preco_atual_produto, p.id_categoria, p.marca, p.modelo, p.estoque, p.status AS status_produto_pedido, p.imagemUrl,
            c.nome AS nome_categoria_pedido
     FROM ItemPedido ip
     JOIN Produto p ON ip.id_produto = p.id_produto
     JOIN Categoria c ON p.id_categoria = c.id_categoria
     WHERE ip.id_pedido = ?`,
    [dbOrder.id_pedido]
  );

  const items = itemsRows.map(item => ({
    id: item.id_produto,
    nome: item.nome_produto_pedido,
    descricao: item.descricao_produto_pedido,
    preco: parseFloat(item.preco_unitario),
    categoria: item.nome_categoria_pedido,
    marca: item.marca,
    modelo: item.modelo,
    estoque: item.estoque, 
    status: item.status_produto_pedido,
    imagemUrl: item.imagemUrl,
    quantity: item.quantidade,
  }));
  
  const valorTotalCalculado = items.reduce((sum, item) => sum + item.preco * item.quantity, 0);

  return {
    id: String(dbOrder.id_pedido), // Frontend espera string
    clienteId: `cliente_${dbOrder.id_cliente}`, 
    data_pedido: dbOrder.data_pedido,
    status: dbOrder.status, 
    metodo_pagamento: dbOrder.metodo_pagamento,
    items: items,
    valorTotal: valorTotalCalculado,
    enderecoEntrega: dbOrder.endereco_entrega || 'Endereço não especificado no pedido',
  };
};


const getOrdersByClienteIdInternal = async (idCliente) => {
  const [ordersRows] = await pool.query(
    'SELECT * FROM Pedido WHERE id_cliente = ? ORDER BY data_pedido DESC',
    [idCliente]
  );
  return Promise.all(ordersRows.map(mapDbOrderToOrder));
};

const createOrderFromCartInternal = async (idCliente, orderDetails) => {
  const connection = await pool.getConnection(); 
  try {
    await connection.beginTransaction();

    const cartItems = await cartService.getCartByClienteIdInternal(idCliente);
    if (!cartItems || cartItems.length === 0) {
      const error = new Error("Carrinho vazio.");
      error.statusCode = 400;
      throw error;
    }
    
    const clienteData = (await require('./authService').findUserById(`cliente_${idCliente}`));
    const enderecoEntrega = orderDetails.enderecoEntrega || clienteData?.endereco || 'Endereço padrão não encontrado';

    const [pedidoResult] = await connection.query(
      'INSERT INTO Pedido (id_cliente, data_pedido, status, metodo_pagamento, endereco_entrega) VALUES (?, NOW(), ?, ?, ?)',
      [idCliente, 'aguardando_pagamento', orderDetails.metodo_pagamento || 'pix', enderecoEntrega]
    );
    const idPedido = pedidoResult.insertId;

    for (const item of cartItems) {
      const [productRows] = await connection.query('SELECT estoque, nome FROM Produto WHERE id_produto = ? FOR UPDATE', [item.id]); // item.id é o id_produto
      if (productRows.length === 0 || productRows[0].estoque < item.quantity) {
        throw new Error(`Estoque insuficiente para o produto ${productRows.length > 0 ? productRows[0].nome : 'desconhecido'}.`);
      }
      
      await connection.query(
        'INSERT INTO ItemPedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
        [idPedido, item.id, item.quantity, item.preco] // item.preco é o preço do produto no carrinho
      );
      await connection.query('UPDATE Produto SET estoque = estoque - ? WHERE id_produto = ?', [item.quantity, item.id]);
    }

    await cartService.clearCartInternal(idCliente); 
    
    await connection.commit();

    const [newOrderRows] = await pool.query('SELECT * FROM Pedido WHERE id_pedido = ?', [idPedido]);
    return mapDbOrderToOrder(newOrderRows[0]);

  } catch (error) {
    await connection.rollback();
    if (!error.statusCode) error.statusCode = 500; 
    if (error.message.includes('Estoque insuficiente')) error.statusCode = 400;
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { 
    getOrdersByClienteIdInternal, 
    createOrderFromCartInternal 
};
