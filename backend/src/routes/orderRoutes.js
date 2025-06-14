
// backend/src/routes/orderRoutes.js
const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

// All order operations require an authenticated client
router.use(authenticateToken, authorizeRoles(UserRole.CLIENTE));

router.get('/', orderController.listOrders);
router.post('/', orderController.createOrder);

module.exports = router;
