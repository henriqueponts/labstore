// backend/src/controllers/cartController.js
const cartService = require('../services/cartService');

// Helper para extrair o ID numérico do cliente do ID composto
const getDbClienteId = (compositeId) => {
    if (compositeId && compositeId.startsWith('cliente_')) {
        return parseInt(compositeId.split('_')[1], 10);
    }
    throw new Error('ID de cliente inválido no token.');
};

const getCart = async (req, res, next) => {
  try {
    const idCliente = getDbClienteId(req.user.id);
    const cartItems = await cartService.getCartByClienteIdInternal(idCliente);
    res.json(cartItems);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const idCliente = getDbClienteId(req.user.id);
    const { productId, quantity } = req.body; // productId aqui é o id_produto
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ message: 'ProductId (numérico) e quantity (positiva) são obrigatórios.' });
    }
    const updatedItem = await cartService.addItemToCartInternal(idCliente, parseInt(productId, 10), quantity);
    res.status(201).json(updatedItem);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const idCliente = getDbClienteId(req.user.id);
    const { itemId } = req.params; // itemId aqui é o id_produto
    const { quantity } = req.body;
     if (typeof quantity !== 'number') {
        return res.status(400).json({ message: 'Quantity (numérica) é obrigatória.' });
    }
    const updatedItem = await cartService.updateItemQuantityInternal(idCliente, parseInt(itemId, 10), quantity);
    if(updatedItem === null && quantity <= 0) {
        return res.status(204).send();
    }
    res.json(updatedItem);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const idCliente = getDbClienteId(req.user.id);
    const { itemId } = req.params; // itemId aqui é o id_produto
    await cartService.removeItemFromCartInternal(idCliente, parseInt(itemId, 10));
    res.status(204).send(); 
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
