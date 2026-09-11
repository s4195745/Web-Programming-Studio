const express = require('express');
const router = express.Router();
const { isAuthenticated, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Page route
router.get('/admin/users', isAuthenticated, requireAdmin, adminController.renderUserManager);

// API to get all users
router.get('/api/admin/users', isAuthenticated, requireAdmin, adminController.getAllUsers);

// API to get a single user's details (used by the "view account" modal)
router.get('/api/admin/users/:id', isAuthenticated, requireAdmin, adminController.getUserById);

// Lock user
router.post('/api/admin/users/:id/lock', isAuthenticated, requireAdmin, adminController.lockUser);

// Unlock user
router.post('/api/admin/users/:id/unlock', isAuthenticated, requireAdmin, adminController.unlockUser);

// Permanently delete a user account and everything attached to it
router.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, adminController.deleteUser);

module.exports = router;
