// backend/src/controllers/orderController.js
const orderService = require('../services/orderService');

const getDbClienteId = (compositeId) => {
    if (compositeId && compositeId.startsWith('cliente_')) {
        return parseInt(compositeId.split('_')[1], 10);
    }
    throw new Error('ID de cliente inválido no token.');
};

const listOrders = async (req, res, next) => {
  try {
    const idCliente = getDbClienteId(req.user.id);
    const orders = await orderService.getOrdersByClienteIdInternal(idCliente);
    res.json(orders);
  } catch (error) {
    if(!error.statusCode) error.statusCode = 500;
    next(error);
  }
};

const createOrder = async (req, res, next) => {
    try {
        const idCliente = getDbClienteId(req.user.id);
        const orderDetails = req.body; // ex: { metodo_pagamento: 'pix', enderecoEntrega: '...' }
        if (!orderDetails.metodo_pagamento) {
            return res.status(400).json({ message: 'Método de pagamento é obrigatório.' });
        }
        const newOrder = await orderService.createOrderFromCartInternal(idCliente, orderDetails);
        res.status(201).json(newOrder);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

module.exports = { listOrders, createOrder };
