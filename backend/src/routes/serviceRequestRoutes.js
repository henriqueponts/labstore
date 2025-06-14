// backend/src/routes/serviceRequestRoutes.js
const express = require('express');
const serviceRequestController = require('../controllers/serviceRequestController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

// Todas as rotas aqui são autenticadas
router.use(authenticateToken);

// Solicitações de Serviço
router.get('/', serviceRequestController.listServiceRequests); // Clientes veem os seus, Admin/Analista veem todos (lógica no service)
router.post('/', authorizeRoles(UserRole.CLIENTE), serviceRequestController.createServiceRequest);

// Orçamentos (Quotes) - rotas aninhadas em service requests para contexto
router.get('/quotes/:quoteId', serviceRequestController.getQuote); // Geralmente para cliente ver, ou admin/analista
router.post('/:serviceRequestId/quotes', authorizeRoles(UserRole.ADMIN, UserRole.ANALISTA), serviceRequestController.createQuote);
router.post('/:serviceRequestId/quotes/:quoteId/approve', authorizeRoles(UserRole.CLIENTE), serviceRequestController.approveQuote);
router.post('/:serviceRequestId/quotes/:quoteId/refuse', authorizeRoles(UserRole.CLIENTE), serviceRequestController.refuseQuote);

// Ação de completar serviço
router.post('/:serviceRequestId/complete', authorizeRoles(UserRole.ADMIN, UserRole.ANALISTA), serviceRequestController.completeServiceByTechnician);


module.exports = router;
