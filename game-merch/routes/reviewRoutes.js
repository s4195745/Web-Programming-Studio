const express = require('express');
const router = express.Router();
const { products, users, reviews } = require('../data/mockDB');
const { isAuthenticated } = require('../middleware/auth');

// Helper: attach product + reviewer info to a review entry
function withDetails(review) {
    const product = products.find(p => p.id === review.productId);
    const reviewer = users.find(u => u.id === review.userId);

    return {
        id: review.id,
        productId: review.productId,
        rating: review.rating,
        title: review.title,
        description: review.description,
        image: review.image,
        createdAt: review.createdAt,
        product: product ? { id: product.id, title: product.title, category: product.category, image: (product.colors && product.colors[0]) ? product.colors[0].mainImage : null } : null,
        reviewerUsername: reviewer ? reviewer.username : 'Unknown user'
    };
}

function validateReviewInput(body) {
    const { productId, title, description, rating } = body;
    const parsedProductId = parseInt(productId, 10);
    const parsedRating = parseInt(rating, 10);

    if (!productId || isNaN(parsedProductId)) return "A valid product must be selected.";
    if (!products.find(p => p.id === parsedProductId)) return "Product not found.";
    if (!title || !title.trim()) return "Review title is required.";
    if (title.trim().length > 80) return "Review title must be 80 characters or fewer.";
    if (!description || !description.trim()) return "Review description is required.";
    if (!rating || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return "Please select a star rating between 1 and 5.";
    }
    return null;
}

// GET /api/reviews - public, anyone can browse reviews
router.get('/reviews', (req, res) => {
    res.status(200).json(reviews.map(withDetails));
});

// POST /api/reviews - create a new review (must be logged in)
router.post('/reviews', isAuthenticated, (req, res) => {
    const error = validateReviewInput(req.body);
    if (error) return res.status(400).json({ error });

    const parsedProductId = parseInt(req.body.productId, 10);

    // one review per product per user
    const existing = reviews.find(
        r => r.userId === req.currentUser.id && r.productId === parsedProductId
    );
    if (existing) {
        return res.status(409).json({ error: "You've already reviewed this product. You can edit your existing review instead." });
    }

    const newId = reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
    const newReview = {
        id: newId,
        userId: req.currentUser.id,
        productId: parsedProductId,
        rating: parseInt(req.body.rating, 10),
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        image: req.body.image || null,
        createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    res.status(201).json(withDetails(newReview));
});

// PUT /api/reviews/:id - edit your own review
router.put('/reviews/:id', isAuthenticated, (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) return res.status(400).json({ error: "Invalid review id." });

    const review = reviews.find(r => r.id === reviewId);
    if (!review) return res.status(404).json({ error: "Review not found." });
    if (review.userId !== req.currentUser.id) {
        return res.status(403).json({ error: "You can only edit your own review." });
    }

    const error = validateReviewInput(req.body);
    if (error) return res.status(400).json({ error });

    review.productId = parseInt(req.body.productId, 10);
    review.rating = parseInt(req.body.rating, 10);
    review.title = req.body.title.trim();
    review.description = req.body.description.trim();
    if (req.body.image !== undefined) review.image = req.body.image;

    res.status(200).json(withDetails(review));
});

// DELETE /api/reviews/:id - delete your own review
router.delete('/reviews/:id', isAuthenticated, (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) return res.status(400).json({ error: "Invalid review id." });

    const index = reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return res.status(404).json({ error: "Review not found." });
    if (reviews[index].userId !== req.currentUser.id) {
        return res.status(403).json({ error: "You can only delete your own review." });
    }

    reviews.splice(index, 1);
    res.status(200).json({ message: "Review deleted." });
});

module.exports = router;
