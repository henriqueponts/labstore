
// backend/src/routes/dashboardRoutes.js
const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/stats', authenticateToken, dashboardController.getStats);

module.exports = router;
