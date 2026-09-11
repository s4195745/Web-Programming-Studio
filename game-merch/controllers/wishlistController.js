const mongoose = require('mongoose');
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');

// A populated Wishlist document already knows how to shape itself for the
// client (see the toJSON transform in models/wishlist.js). The only thing
// left to the controller is deciding what to do when the referenced product
// no longer exists (populate() resolves it to null in that case).
function formatItem(doc) {
    if (doc.populated('productId') && !doc.productId) return null;
    return doc.toJSON();
}

// GET /api/wishlist - all saved items for the logged-in user
async function getWishlist(req, res) {
    try {
        const items = await Wishlist.find({ userId: req.currentUser._id })
            .populate('productId')
            .sort({ createdAt: -1 });

        res.status(200).json(items.map(formatItem).filter(Boolean));
    } catch (error) {
        console.error('Failed to load wishlist:', error);
        res.status(500).json({ error: 'Failed to load wishlist from database.' });
    }
}

// GET /api/wishlist/stats/:productId - aggregated statistics for one product
// (how many users have saved it, how many have marked it purchased). Computed
// on the fly from the Wishlist collection rather than stored as a duplicated
// counter, so the numbers can never drift out of sync with the real data.
async function getWishlistStats(req, res) {
    try {
        const stats = await Wishlist.aggregate([
            { $match: { productId: new mongoose.Types.ObjectId(req.params.productId) } },
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
}

// POST /api/wishlist - save a product to the logged-in user's wishlist
async function addToWishlist(req, res) {
    try {
        const { productId } = req.body;

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
}

// PUT /api/wishlist/:id - mark an item as purchased / not purchased
async function updatePurchased(req, res) {
    try {
        const item = await Wishlist.findOneAndUpdate(
            { _id: req.params.id, userId: req.currentUser._id },
            { purchased: req.body.purchased },
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
}

// DELETE /api/wishlist/:id - remove an item from the wishlist
async function removeFromWishlist(req, res) {
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
}

module.exports = {
    getWishlist,
    getWishlistStats,
    addToWishlist,
    updatePurchased,
    removeFromWishlist
};
