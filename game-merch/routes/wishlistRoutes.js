const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const { isAuthenticated } = require('../middleware/auth');

// Format a populated wishlist document into the shape the client already expects
// (assets/js/wishlistscript.js), so the front-end code did not need to change.
function formatItem(doc) {
    const product = doc.productId; // populated Product document
    if (!product) return null;

    return {
        id: doc._id.toString(),
        productId: product._id.toString(),
        purchased: doc.purchased,
        addedAt: doc.createdAt,
        product: {
            id: product._id.toString(),
            title: product.title,
            price: product.price,
            category: product.category,
            description: product.description,
            image: product.colors && product.colors[0] ? product.colors[0].mainImage : null
        }
    };
}

// GET /api/wishlist - all saved items for the logged-in user
router.get('/wishlist', isAuthenticated, async (req, res) => {
    try {
        const items = await Wishlist.find({ userId: req.currentUser._id })
            .populate('productId')
            .sort({ createdAt: -1 });

        const formatted = items.map(formatItem).filter(Boolean);
        res.status(200).json(formatted);
    } catch (error) {
        console.error('Failed to load wishlist:', error);
        res.status(500).json({ error: 'Failed to load wishlist from database.' });
    }
});

// GET /api/wishlist/stats/:productId - aggregated statistics for one product
// (how many users have saved it, how many have marked it purchased). Computed
// on the fly from the Wishlist collection rather than stored as a duplicated
// counter, so the numbers can never drift out of sync with the real data.
router.get('/wishlist/stats/:productId', async (req, res) => {
    try {
        const stats = await Wishlist.aggregate([
            { $match: { productId: new (require('mongoose').Types.ObjectId)(req.params.productId) } },
            {
                $group: {
                    _id: '$productId',
                    savedByUsers: { $sum: 1 },
                    purchasedCount: { $sum: { $cond: ['$purchased', 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || { savedByUsers: 0, purchasedCount: 0 };
        res.status(200).json({
            productId: req.params.productId,
            savedByUsers: result.savedByUsers,
            purchasedCount: result.purchasedCount
        });
    } catch (error) {
        console.error('Failed to compute wishlist stats:', error);
        res.status(400).json({ error: 'Invalid product id.' });
    }
});

// POST /api/wishlist - save a product to the logged-in user's wishlist
router.post('/wishlist', isAuthenticated, async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'A valid productId is required.' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // --- DUPLICATE PROTECTION (application-level check; the schema also
        // enforces this with a unique compound index as a second safety net) ---
        const alreadySaved = await Wishlist.findOne({
            userId: req.currentUser._id,
            productId: product._id
        });
        if (alreadySaved) {
            return res.status(409).json({ error: `${product.title} is already in your wishlist.` });
        }

        const created = await Wishlist.create({
            userId: req.currentUser._id,
            productId: product._id,
            purchased: false
        });
        const populated = await created.populate('productId');

        res.status(201).json(formatItem(populated));
    } catch (error) {
        if (error.code === 11000) {
            // Unique index violation - duplicate wishlist entry
            return res.status(409).json({ error: 'This product is already in your wishlist.' });
        }
        console.error('Failed to add to wishlist:', error);
        res.status(400).json({ error: 'Invalid product id.' });
    }
});

// PUT /api/wishlist/:id - mark an item as purchased / not purchased
router.put('/wishlist/:id', isAuthenticated, async (req, res) => {
    try {
        const { purchased } = req.body;
        if (typeof purchased !== 'boolean') {
            return res.status(400).json({ error: "'purchased' must be true or false." });
        }

        const item = await Wishlist.findOneAndUpdate(
            { _id: req.params.id, userId: req.currentUser._id },
            { purchased },
            { new: true }
        ).populate('productId');

        if (!item) {
            return res.status(404).json({ error: 'Wishlist item not found.' });
        }

        res.status(200).json(formatItem(item));
    } catch (error) {
        console.error('Failed to update wishlist item:', error);
        res.status(400).json({ error: 'Invalid wishlist item id.' });
    }
});

// DELETE /api/wishlist/:id - remove an item from the wishlist
router.delete('/wishlist/:id', isAuthenticated, async (req, res) => {
    try {
        const deleted = await Wishlist.findOneAndDelete({
            _id: req.params.id,
            userId: req.currentUser._id
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Wishlist item not found.' });
        }

        res.status(200).json({ message: 'Item removed from wishlist.' });
    } catch (error) {
        console.error('Failed to remove wishlist item:', error);
        res.status(400).json({ error: 'Invalid wishlist item id.' });
    }
});

module.exports = router;
