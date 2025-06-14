
// backend/src/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { UserRole } = require('../utils/constants');

const router = express.Router();

// Admin routes for user management
router.get('/', authenticateToken, authorizeRoles(UserRole.ADMIN), userController.listUsers);
router.post('/', authenticateToken, authorizeRoles(UserRole.ADMIN), userController.createUserByAdmin); // Create Admin/Analyst
router.put('/:userId/status', authenticateToken, authorizeRoles(UserRole.ADMIN), userController.changeUserStatus);

// Authenticated users can update their own profile
// Admins can update any user's profile (logic within controller or service)
router.get('/me', authenticateToken, userController.getUserProfile); // Get current user's profile
router.put('/:userId/profile', authenticateToken, userController.updateUserProfile);


module.exports = router;
