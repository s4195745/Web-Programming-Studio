const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { validateRegister, validateLogin, validateProfileUpdate, validatePasswordChange } = require('../middleware/validation');
const authController = require('../controllers/authController');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.put('/profile', isAuthenticated, validateProfileUpdate, authController.updateProfile);
router.post('/verify-password', isAuthenticated, authController.verifyPassword);
router.put('/change-password', isAuthenticated, validatePasswordChange, authController.changePassword);
router.delete('/account', isAuthenticated, authController.deleteAccount);
router.post('/forgot-password', authController.forgotPassword);
router.post('/logout', authController.logout);

module.exports = router;
