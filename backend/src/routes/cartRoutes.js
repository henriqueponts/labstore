
// backend/src/routes/cartRoutes.js
const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

// All cart operations require an authenticated client
router.use(authenticateToken, authorizeRoles(UserRole.CLIENTE));

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem); // itemId is productId
router.delete('/items/:itemId', cartController.removeItem); // itemId is productId

module.exports = router;
