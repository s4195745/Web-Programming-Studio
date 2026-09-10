const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    purchased: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// A user can only save the same product once — enforced at the database level
// (in addition to the application-level check in wishlistRoutes.js) so no
// duplicate wishlist entry can ever be created for the same user + product pair.
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
