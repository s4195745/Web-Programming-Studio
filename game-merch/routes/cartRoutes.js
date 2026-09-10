const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const cartController = require('../controllers/cartController');
const { validateAddToCart, validateUpdateQuantity, validateRemoveFromCart, validateCheckout } = require('../middleware/validation');

router.get('/products', cartController.getProducts);
router.get('/products/:id', cartController.getSingleProduct);
router.get('/cart', isAuthenticated, cartController.getCart);
router.post('/cart', isAuthenticated, validateAddToCart, cartController.addToCart);
router.put('/cart', isAuthenticated, validateUpdateQuantity, cartController.updateQuantity);
router.delete('/cart', isAuthenticated, validateRemoveFromCart, cartController.removeFromCart);
router.post('/checkout', isAuthenticated, validateCheckout, cartController.checkout);

module.exports = router;
