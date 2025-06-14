// backend/src/routes/lgpdRoutes.js
const express = require('express');
const lgpdController = require('../controllers/lgpdController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

// Listar termos pode ser público ou para usuários logados
router.get('/', authenticateToken, lgpdController.listLgpdTerms);

// Apenas Admin pode gerenciar termos
router.put('/:termId', authenticateToken, authorizeRoles(UserRole.ADMIN), lgpdController.updateLgpdTerm);
// router.post('/', authenticateToken, authorizeRoles(UserRole.ADMIN), lgpdController.createLgpdTerm); // Se criar novos termos for permitido

module.exports = router;
