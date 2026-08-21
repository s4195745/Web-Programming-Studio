const express = require('express');
const router = express.Router();
const { products, wishlist } = require('../data/mockDB');
const { isAuthenticated } = require('../middleware/auth');

// Helper: attach product details to a wishlist entry
function withProduct(item) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    return {
        id: item.id,
        productId: item.productId,
        purchased: item.purchased,
        addedAt: item.addedAt,
        product: {
            id: product.id,
            title: product.title,
            price: product.price,
            category: product.category,
            description: product.description,
            image: product.colors && product.colors[0] ? product.colors[0].mainImage : null
        }
    };
}

// GET /api/wishlist - all saved items for the logged-in user
router.get('/wishlist', isAuthenticated, (req, res) => {
    const userItems = wishlist
        .filter(w => w.userId === req.currentUser.id)
        .map(withProduct)
        .filter(Boolean);

    res.status(200).json(userItems);
});

// POST /api/wishlist - save a product to the logged-in user's wishlist
router.post('/wishlist', isAuthenticated, (req, res) => {
    const { productId } = req.body;
    const parsedProductId = parseInt(productId, 10);

    // --- SERVER-SIDE VALIDATION ---
    if (!productId || isNaN(parsedProductId)) {
        return res.status(400).json({ error: "A valid productId is required." });
    }

    const product = products.find(p => p.id === parsedProductId);
    if (!product) {
        return res.status(404).json({ error: "Product not found." });
    }

    // --- DUPLICATE PROTECTION ---
    const alreadySaved = wishlist.find(
        w => w.userId === req.currentUser.id && w.productId === parsedProductId
    );
    if (alreadySaved) {
        return res.status(409).json({ error: `${product.title} is already in your wishlist.` });
    }

    const newId = wishlist.length ? Math.max(...wishlist.map(w => w.id)) + 1 : 1;
    const newItem = {
        id: newId,
        userId: req.currentUser.id,
        productId: parsedProductId,
        purchased: false,
        addedAt: new Date().toISOString()
    };

    wishlist.push(newItem);
    res.status(201).json(withProduct(newItem));
});

// PUT /api/wishlist/:id - mark an item as purchased / not purchased
router.put('/wishlist/:id', isAuthenticated, (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const { purchased } = req.body;

    if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid wishlist item id." });
    }
    if (typeof purchased !== 'boolean') {
        return res.status(400).json({ error: "'purchased' must be true or false." });
    }

    const item = wishlist.find(w => w.id === itemId && w.userId === req.currentUser.id);
    if (!item) {
        return res.status(404).json({ error: "Wishlist item not found." });
    }

    item.purchased = purchased;
    res.status(200).json(withProduct(item));
});

// DELETE /api/wishlist/:id - remove an item from the wishlist
router.delete('/wishlist/:id', isAuthenticated, (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    if (isNaN(itemId)) {
        return res.status(400).json({ error: "Invalid wishlist item id." });
    }

    const index = wishlist.findIndex(w => w.id === itemId && w.userId === req.currentUser.id);
    if (index === -1) {
        return res.status(404).json({ error: "Wishlist item not found." });
    }

    wishlist.splice(index, 1);
    res.status(200).json({ message: "Item removed from wishlist." });
});

module.exports = router;
