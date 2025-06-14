// backend/src/routes/helpTicketRoutes.js
const express = require('express');
const helpTicketController = require('../controllers/helpTicketController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

router.use(authenticateToken);

router.get('/', helpTicketController.listHelpTickets); // Clientes veem os seus, Admin/Analista veem todos
router.post('/', authorizeRoles(UserRole.CLIENTE), helpTicketController.createHelpTicket);

// TODO: Rotas para ver detalhes de um ticket, adicionar respostas, mudar status (para Admin/Analista)

module.exports = router;
