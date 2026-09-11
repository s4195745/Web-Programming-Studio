// Request validation for the Wishlist module.
// Runs before the controller so wishlistController only ever sees a well-formed
// request body, instead of re-checking the same fields with if/else on every route.

function validateAddToWishlist(req, res, next) {
    const { productId } = req.body;
    if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ error: 'A valid productId is required.' });
    }
    next();
}

function validatePurchasedUpdate(req, res, next) {
    const { purchased } = req.body;
    if (typeof purchased !== 'boolean') {
        return res.status(400).json({ error: "'purchased' must be true or false." });
    }
    next();
}

module.exports = {
    validateAddToWishlist,
    validatePurchasedUpdate
};
