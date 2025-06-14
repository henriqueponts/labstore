
// backend/src/routes/productRoutes.js
const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

// Public route to list products for the store
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);

// Admin/Analyst routes for product management
router.get('/admin/all', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.ANALISTA), productController.listAllProductsForAdmin);
router.post('/', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.ANALISTA), productController.createNewProduct);
router.put('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN, UserRole.ANALISTA), productController.updateExistingProduct);
router.delete('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), productController.deleteExistingProduct); // Only Admin can delete

module.exports = router;
