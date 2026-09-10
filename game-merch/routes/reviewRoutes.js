const express = require('express');
const router = express.Router();
const Review = require('../models/review');
const Product = require('../models/product');
const { isAuthenticated } = require('../middleware/auth');

// Format a populated review document into the shape the client already
// expects (assets/js/reviewscript.js), so the front-end code did not need
// to change beyond fixing the id type (see reviewscript.js).
function formatReview(doc) {
    const product = doc.productId; // populated Product document
    const reviewer = doc.userId;   // populated User document

    return {
        id: doc._id.toString(),
        productId: product ? product._id.toString() : null,
        rating: doc.rating,
        title: doc.title,
        description: doc.description,
        image: doc.image,
        createdAt: doc.createdAt,
        product: product ? {
            id: product._id.toString(),
            title: product.title,
            category: product.category,
            image: product.colors && product.colors[0] ? product.colors[0].mainImage : null
        } : null,
        reviewerId: reviewer ? reviewer._id.toString() : null,
        reviewerUsername: reviewer ? reviewer.username : 'Unknown user'
    };
}

function validateReviewInput(body) {
    const { productId, title, description, rating } = body;
    const parsedRating = parseInt(rating, 10);

    if (!productId) return 'A valid product must be selected.';
    if (!title || !title.trim()) return 'Review title is required.';
    if (title.trim().length > 80) return 'Review title must be 80 characters or fewer.';
    if (!description || !description.trim()) return 'Review description is required.';
    if (!rating || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return 'Please select a star rating between 1 and 5.';
    }
    return null;
}

// GET /api/reviews - public, anyone can browse reviews
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('productId')
            .populate('userId')
            .sort({ createdAt: -1 });

        res.status(200).json(reviews.map(formatReview));
    } catch (error) {
        console.error('Failed to load reviews:', error);
        res.status(500).json({ error: 'Failed to load reviews from database.' });
    }
});

// POST /api/reviews - create a new review (must be logged in)
router.post('/reviews', isAuthenticated, async (req, res) => {
    try {
        const error = validateReviewInput(req.body);
        if (error) return res.status(400).json({ error });

        const product = await Product.findById(req.body.productId);
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        // one review per product per user (application-level check; the
        // schema also enforces this with a unique compound index)
        const existing = await Review.findOne({
            userId: req.currentUser._id,
            productId: product._id
        });
        if (existing) {
            return res.status(409).json({ error: "You've already reviewed this product. You can edit your existing review instead." });
        }

        const created = await Review.create({
            userId: req.currentUser._id,
            productId: product._id,
            rating: parseInt(req.body.rating, 10),
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            image: req.body.image || null
        });

        const populated = await created.populate(['productId', 'userId']);
        res.status(201).json(formatReview(populated));
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "You've already reviewed this product. You can edit your existing review instead." });
        }
        console.error('Failed to create review:', error);
        res.status(400).json({ error: 'Invalid product id.' });
    }
});

// PUT /api/reviews/:id - edit your own review
router.put('/reviews/:id', isAuthenticated, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found.' });
        if (review.userId.toString() !== req.currentUser._id.toString()) {
            return res.status(403).json({ error: 'You can only edit your own review.' });
        }

        const error = validateReviewInput(req.body);
        if (error) return res.status(400).json({ error });

        const product = await Product.findById(req.body.productId);
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        review.productId = product._id;
        review.rating = parseInt(req.body.rating, 10);
        review.title = req.body.title.trim();
        review.description = req.body.description.trim();
        if (req.body.image !== undefined) review.image = req.body.image;

        await review.save();
        const populated = await review.populate(['productId', 'userId']);
        res.status(200).json(formatReview(populated));
    } catch (error) {
        console.error('Failed to update review:', error);
        res.status(400).json({ error: 'Invalid review id.' });
    }
});

// DELETE /api/reviews/:id - delete your own review
router.delete('/reviews/:id', isAuthenticated, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found.' });
        if (review.userId.toString() !== req.currentUser._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own review.' });
        }

        await Review.deleteOne({ _id: review._id });
        res.status(200).json({ message: 'Review deleted.' });
    } catch (error) {
        console.error('Failed to delete review:', error);
        res.status(400).json({ error: 'Invalid review id.' });
    }
});

module.exports = router;
