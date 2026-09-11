const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { validateAddToWishlist, validatePurchasedUpdate } = require('../middleware/validateWishlist');
const wishlistController = require('../controllers/wishlistController');

router.get('/wishlist', isAuthenticated, wishlistController.getWishlist);
router.get('/wishlist/stats/:productId', wishlistController.getWishlistStats);
router.post('/wishlist', isAuthenticated, validateAddToWishlist, wishlistController.addToWishlist);
router.put('/wishlist/:id', isAuthenticated, validatePurchasedUpdate, wishlistController.updatePurchased);
router.delete('/wishlist/:id', isAuthenticated, wishlistController.removeFromWishlist);

module.exports = router;
