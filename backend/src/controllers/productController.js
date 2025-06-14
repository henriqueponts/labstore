// backend/src/controllers/productController.js
const productService = require('../services/productService');

const listProducts = async (req, res, next) => {
  try {
    const products = await productService.getAllProductsInternal(false); 
    res.json(products);
  } catch (error) {
    next(error);
  }
};

const listAllProductsForAdmin = async (req, res, next) => {
    try {
        const products = await productService.getAllProductsInternal(true); 
        res.json(products);
    } catch (error) {
        next(error);
    }
}

const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductByIdInternal(req.params.id); 
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const createNewProduct = async (req, res, next) => {
  try {
    const { nome, descricao, preco, categoria, estoque, status, marca, modelo, imagemUrl, compatibilidade, cor, ano_fabricacao } = req.body;
    
    if (!nome || !descricao || preco === undefined || !categoria || estoque === undefined) {
        return res.status(400).json({ message: 'Campos obrigatórios: nome, descricao, preco, categoria (ID), estoque.' });
    }
    // O frontend envia o ID da categoria no campo 'categoria'.
    const productData = { 
        nome, descricao, preco, 
        id_categoria: parseInt(categoria, 10), // Converte para id_categoria numérico
        marca, modelo, estoque, status: status || 'ativo', imagemUrl, compatibilidade, cor, ano_fabricacao
    };

    const product = await productService.createProductInternal(productData);
    res.status(201).json(product);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const updateExistingProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const productDataFromRequest = { ...req.body };
    
    // Se o frontend enviar 'categoria' como o ID da categoria, converte para 'id_categoria'
    if (productDataFromRequest.categoria !== undefined) {
        productDataFromRequest.id_categoria = parseInt(productDataFromRequest.categoria, 10);
        delete productDataFromRequest.categoria; 
    }

    const product = await productService.updateProductInternal(productId, productDataFromRequest);
    res.json(product);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const deleteExistingProduct = async (req, res, next) => {
  try {
    await productService.deleteProductInternal(req.params.id);
    res.status(204).send();
  } catch (error)
 {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  listProducts,
  listAllProductsForAdmin,
  getProduct,
  createNewProduct,
  updateExistingProduct,
  deleteExistingProduct,
};
