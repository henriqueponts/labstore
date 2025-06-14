// backend/src/controllers/helpTicketController.js
const helpTicketService = require('../services/helpTicketService');
const { UserRole } = require('../utils/constants');

const getDbClienteId = (compositeId) => {
    if (compositeId && compositeId.startsWith('cliente_')) {
        return parseInt(compositeId.split('_')[1], 10);
    }
    throw new Error('ID de cliente inválido no token.');
};

const listHelpTickets = async (req, res, next) => {
    try {
        const tickets = await helpTicketService.getHelpTicketsInternal(req.user);
        res.json(tickets);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

const createHelpTicket = async (req, res, next) => {
    try {
        if (req.user.role !== UserRole.CLIENTE) {
            return res.status(403).json({ message: 'Apenas clientes podem abrir chamados de suporte.'});
        }
        const idClienteDb = getDbClienteId(req.user.id);
        const { assunto, descricao, categoria } = req.body;
        if (!assunto || !descricao) {
            return res.status(400).json({ message: 'Assunto e descrição são obrigatórios.' });
        }
        const newTicket = await helpTicketService.createHelpTicketInternal(idClienteDb, req.body);
        res.status(201).json(newTicket);
    } catch (error) {
        if(!error.statusCode) error.statusCode = 500;
        next(error);
    }
};

module.exports = {
    listHelpTickets,
    createHelpTicket,
};
