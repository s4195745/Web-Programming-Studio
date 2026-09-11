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
// (in addition to the application-level check in wishlistController.js) so no
// duplicate wishlist entry can ever be created for the same user + product pair.
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

// The model owns its own client-facing shape (rather than a controller hand-
// building a plain object): when productId has been populate()'d, embed the
// product's display fields; otherwise leave productId as the raw id string.
wishlistSchema.set('toJSON', {
    virtuals: false,
    transform: (doc, ret) => {
        ret.id = doc._id.toString();
        ret.addedAt = doc.createdAt;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;

        if (doc.populated('productId') && doc.productId) {
            const product = doc.productId;
            ret.productId = product._id.toString();
            ret.product = {
                id: product._id.toString(),
                title: product.title,
                price: product.price,
                category: product.category,
                description: product.description,
                image: product.colors && product.colors[0] ? product.colors[0].mainImage : null
            };
        } else if (!doc.populated('productId')) {
            ret.productId = doc.productId.toString();
        }

        return ret;
    }
});

module.exports = mongoose.model('Wishlist', wishlistSchema);
