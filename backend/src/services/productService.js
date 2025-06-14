// backend/src/services/productService.js
const pool = require('../config/db');

const mapDbProductToProduct = (dbProduct) => {
  if (!dbProduct) return null;
  return {
    id: dbProduct.id_produto,
    nome: dbProduct.nome_produto, // Alias da query SQL
    descricao: dbProduct.descricao_produto, // Alias da query SQL
    preco: parseFloat(dbProduct.preco),
    categoria: dbProduct.nome_categoria, // Alias da query SQL
    id_categoria: dbProduct.id_categoria, // Para uso interno, se necessário
    marca: dbProduct.marca,
    modelo: dbProduct.modelo,
    estoque: dbProduct.estoque,
    status: dbProduct.status_produto, // Alias da query SQL
    imagemUrl: dbProduct.imagemUrl || null,
    compatibilidade: dbProduct.compatibilidade || null,
    cor: dbProduct.cor || null,
    ano_fabricacao: dbProduct.ano_fabricacao || null,
  };
};

const getAllProductsInternal = async (forManagement = false) => {
  let sql = `
    SELECT 
      p.id_produto, p.nome AS nome_produto, p.descricao AS descricao_produto, p.preco, p.marca, p.modelo, p.estoque, p.status AS status_produto, p.imagemUrl, p.compatibilidade, p.cor, p.ano_fabricacao,
      c.id_categoria, c.nome AS nome_categoria
    FROM Produto p
    JOIN Categoria c ON p.id_categoria = c.id_categoria
  `;
  if (!forManagement) {
    sql += " WHERE p.status = 'ativo'"; // No banco, Produto.status é ENUM('ativo', 'inativo')
  }
  const [rows] = await pool.query(sql);
  return rows.map(mapDbProductToProduct);
};

const getProductByIdInternal = async (id) => {
  const sql = `
    SELECT 
      p.id_produto, p.nome AS nome_produto, p.descricao AS descricao_produto, p.preco, p.marca, p.modelo, p.estoque, p.status AS status_produto, p.imagemUrl, p.compatibilidade, p.cor, p.ano_fabricacao,
      c.id_categoria, c.nome AS nome_categoria
    FROM Produto p
    JOIN Categoria c ON p.id_categoria = c.id_categoria
    WHERE p.id_produto = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows.length > 0 ? mapDbProductToProduct(rows[0]) : null;
};

const createProductInternal = async (productData) => {
  const { nome, descricao, preco, id_categoria, marca, modelo, estoque, status, imagemUrl, compatibilidade, cor, ano_fabricacao } = productData;
  
  const [catRows] = await pool.query('SELECT id_categoria FROM Categoria WHERE id_categoria = ?', [id_categoria]);
  if (catRows.length === 0) {
      const error = new Error('Categoria não encontrada.');
      error.statusCode = 400;
      throw error;
  }

  const sql = `
    INSERT INTO Produto (nome, descricao, preco, id_categoria, marca, modelo, estoque, status, imagemUrl, compatibilidade, cor, ano_fabricacao) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [nome, descricao, preco, id_categoria, marca || null, modelo || null, estoque, status || 'ativo', imagemUrl || null, compatibilidade || null, cor || null, ano_fabricacao || null]);
  return getProductByIdInternal(result.insertId);
};

const updateProductInternal = async (id, productData) => {
  // O controller já deve ter convertido productData.categoria para productData.id_categoria se necessário.
  const { nome, descricao, preco, id_categoria, marca, modelo, estoque, status, imagemUrl, compatibilidade, cor, ano_fabricacao } = productData;
  
  const fieldsToUpdate = {};
  if (nome !== undefined) fieldsToUpdate.nome = nome;
  if (descricao !== undefined) fieldsToUpdate.descricao = descricao;
  if (preco !== undefined) fieldsToUpdate.preco = preco;
  if (id_categoria !== undefined) {
    const [catRows] = await pool.query('SELECT id_categoria FROM Categoria WHERE id_categoria = ?', [id_categoria]);
    if (catRows.length === 0) {
        const error = new Error('Categoria para atualização não encontrada.');
        error.statusCode = 400;
        throw error;
    }
    fieldsToUpdate.id_categoria = id_categoria;
  }
  if (marca !== undefined) fieldsToUpdate.marca = marca;
  if (modelo !== undefined) fieldsToUpdate.modelo = modelo;
  if (estoque !== undefined) fieldsToUpdate.estoque = estoque;
  if (status !== undefined) fieldsToUpdate.status = status;
  if (imagemUrl !== undefined) fieldsToUpdate.imagemUrl = imagemUrl;
  if (compatibilidade !== undefined) fieldsToUpdate.compatibilidade = compatibilidade;
  if (cor !== undefined) fieldsToUpdate.cor = cor;
  if (ano_fabricacao !== undefined) fieldsToUpdate.ano_fabricacao = ano_fabricacao;


  if (Object.keys(fieldsToUpdate).length === 0) {
    return getProductByIdInternal(id); // Nenhum campo válido para atualizar, retorna o produto existente
  }
  
  const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(fieldsToUpdate), id];
  
  const sql = `UPDATE Produto SET ${setClauses} WHERE id_produto = ?`;
  const [result] = await pool.query(sql, values);

  if (result.affectedRows === 0) {
    const error = new Error('Produto não encontrado para atualização.');
    error.statusCode = 404;
    throw error;
  }
  return getProductByIdInternal(id);
};

const deleteProductInternal = async (id) => {
  // Adicionar verificação se o produto está em algum ItemPedido ou ItemCarrinho pode ser necessário
  // para evitar exclusão ou usar ON DELETE SET NULL/RESTRICT na FK.
  const [result] = await pool.query('DELETE FROM Produto WHERE id_produto = ?', [id]);
  if (result.affectedRows === 0) {
    const error = new Error('Produto não encontrado para exclusão.');
    error.statusCode = 404;
    throw error;
  }
  return true;
};

module.exports = {
  getAllProductsInternal,
  getProductByIdInternal,
  createProductInternal,
  updateProductInternal,
  deleteProductInternal,
};
