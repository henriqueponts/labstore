// backend/src/services/cartService.js
const pool = require('../config/db');
const productService = require('./productService'); 

const getCartByClienteIdInternal = async (idCliente) => {
  const [cartRows] = await pool.query('SELECT id_carrinho FROM Carrinho WHERE id_cliente = ?', [idCliente]);
  if (cartRows.length === 0) {
    return []; 
  }
  const idCarrinho = cartRows[0].id_carrinho;

  const sql = `
    SELECT 
      ic.id_item_carrinho, ic.quantidade,
      p.id_produto, p.nome AS nome_produto, p.descricao AS descricao_produto, p.preco, p.marca, p.modelo, p.estoque, p.status AS status_produto, p.imagemUrl,
      cat.id_categoria, cat.nome AS nome_categoria 
    FROM ItemCarrinho ic
    JOIN Produto p ON ic.id_produto = p.id_produto
    JOIN Categoria cat ON p.id_categoria = cat.id_categoria
    WHERE ic.id_carrinho = ?
  `;
  const [items] = await pool.query(sql, [idCarrinho]);
  
  return items.map(item => ({
    id: item.id_produto, 
    nome: item.nome_produto,
    descricao: item.descricao_produto,
    preco: parseFloat(item.preco),
    categoria: item.nome_categoria,
    marca: item.marca,
    modelo: item.modelo,
    estoque: item.estoque,
    status: item.status_produto,
    imagemUrl: item.imagemUrl,
    quantity: item.quantidade,
  }));
};

const addItemToCartInternal = async (idCliente, idProduto, quantity) => {
  const product = await productService.getProductByIdInternal(idProduto);
  if (!product || product.status !== 'ativo') {
    const error = new Error('Produto não encontrado ou indisponível.');
    error.statusCode = 404;
    throw error;
  }
  if (product.estoque < quantity) {
    const error = new Error('Estoque insuficiente.');
    error.statusCode = 400;
    throw error;
  }

  let [cartRows] = await pool.query('SELECT id_carrinho FROM Carrinho WHERE id_cliente = ?', [idCliente]);
  let idCarrinho;
  if (cartRows.length === 0) {
    const [result] = await pool.query('INSERT INTO Carrinho (id_cliente, data_criacao, data_ultima_modificacao) VALUES (?, NOW(), NOW())', [idCliente]);
    idCarrinho = result.insertId;
  } else {
    idCarrinho = cartRows[0].id_carrinho;
  }

  const [existingItems] = await pool.query('SELECT id_item_carrinho, quantidade FROM ItemCarrinho WHERE id_carrinho = ? AND id_produto = ?', [idCarrinho, idProduto]);
  
  let affectedItem;
  if (existingItems.length > 0) {
    const existingItem = existingItems[0];
    const newQuantity = existingItem.quantidade + quantity;
    if (product.estoque < newQuantity) {
        const error = new Error('Estoque insuficiente para a quantidade total no carrinho.');
        error.statusCode = 400;
        throw error;
    }
    await pool.query('UPDATE ItemCarrinho SET quantidade = ? WHERE id_item_carrinho = ?', [newQuantity, existingItem.id_item_carrinho]);
    affectedItem = { ...product, quantity: newQuantity };
  } else {
    await pool.query('INSERT INTO ItemCarrinho (id_carrinho, id_produto, quantidade, preco_unitario_no_momento_adicao, data_adicao) VALUES (?, ?, ?, ?, NOW())', 
      [idCarrinho, idProduto, quantity, product.preco]
    );
    affectedItem = { ...product, quantity };
  }
  await pool.query('UPDATE Carrinho SET data_ultima_modificacao = NOW() where id_carrinho = ?', [idCarrinho]);
  return affectedItem;
};

const updateItemQuantityInternal = async (idCliente, idProduto, newQuantity) => {
    const [cartRows] = await pool.query('SELECT id_carrinho FROM Carrinho WHERE id_cliente = ?', [idCliente]);
    if (cartRows.length === 0) {
        const error = new Error('Carrinho não encontrado.');
        error.statusCode = 404;
        throw error;
    }
    const idCarrinho = cartRows[0].id_carrinho;

    const product = await productService.getProductByIdInternal(idProduto);
    if (!product) {
        const error = new Error('Produto associado ao item do carrinho não encontrado.');
        error.statusCode = 404;
        throw error;
    }
    if (product.estoque < newQuantity && newQuantity > 0) { // Permite zerar mesmo se estoque < newQuantity
        const error = new Error('Estoque insuficiente para a nova quantidade.');
        error.statusCode = 400;
        throw error;
    }

    if (newQuantity <= 0) {
        await pool.query('DELETE FROM ItemCarrinho WHERE id_carrinho = ? AND id_produto = ?', [idCarrinho, idProduto]);
        await pool.query('UPDATE Carrinho SET data_ultima_modificacao = NOW() where id_carrinho = ?', [idCarrinho]);
        return null; 
    } else {
        const [result] = await pool.query(
            'UPDATE ItemCarrinho SET quantidade = ? WHERE id_carrinho = ? AND id_produto = ?', 
            [newQuantity, idCarrinho, idProduto]
        );
        if (result.affectedRows === 0) {
           // Se não afetou, pode ser que o item não exista, tentamos inserir (edge case)
           // Ou lançar erro. Para simplicidade, vamos assumir que o item deveria existir.
            const error = new Error('Item não encontrado no carrinho para atualizar. Considere adicionar primeiro.');
            error.statusCode = 404;
            throw error;
        }
        await pool.query('UPDATE Carrinho SET data_ultima_modificacao = NOW() where id_carrinho = ?', [idCarrinho]);
        return { ...product, quantity: newQuantity };
    }
};

const removeItemFromCartInternal = async (idCliente, idProduto) => {
    const [cartRows] = await pool.query('SELECT id_carrinho FROM Carrinho WHERE id_cliente = ?', [idCliente]);
    if (cartRows.length === 0) {
        const error = new Error('Carrinho não encontrado.');
        error.statusCode = 404;
        throw error;
    }
    const idCarrinho = cartRows[0].id_carrinho;

    const [result] = await pool.query('DELETE FROM ItemCarrinho WHERE id_carrinho = ? AND id_produto = ?', [idCarrinho, idProduto]);
    if (result.affectedRows === 0) {
        const error = new Error('Item não encontrado no carrinho para remoção.');
        error.statusCode = 404;
        throw error;
    }
    await pool.query('UPDATE Carrinho SET data_ultima_modificacao = NOW() where id_carrinho = ?', [idCarrinho]);
    return true;
};

const clearCartInternal = async (idCliente) => {
    const [cartRows] = await pool.query('SELECT id_carrinho FROM Carrinho WHERE id_cliente = ?', [idCliente]);
    if (cartRows.length > 0) {
        const idCarrinho = cartRows[0].id_carrinho;
        await pool.query('DELETE FROM ItemCarrinho WHERE id_carrinho = ?', [idCarrinho]);
        await pool.query('UPDATE Carrinho SET data_ultima_modificacao = NOW() where id_carrinho = ?', [idCarrinho]);
    }
    return true;
};

module.exports = {
  getCartByClienteIdInternal,
  addItemToCartInternal,
  updateItemQuantityInternal,
  removeItemFromCartInternal,
  clearCartInternal
};
