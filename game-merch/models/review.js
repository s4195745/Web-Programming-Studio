const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// A user can only leave one review per product - enforced at the database
// level (in addition to the application-level check in reviewRoutes.js).
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
