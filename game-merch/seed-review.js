// Seeds a couple of sample Review documents into MongoDB Atlas.
// Run this AFTER seed.js (which creates the Users and Products collections),
// since this script looks up users and products by their real fields rather
// than by a hardcoded _id (seed.js regenerates _ids every run).
//
// Usage:
//   node seed-review.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Product = require('./models/product');
const Review = require('./models/review');

async function seedReviews() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Atlas for review seeding...');

        const chinh = await User.findOne({ email: 'nguyenthechinh2807@gmail.com' });
        const thanh = await User.findOne({ email: 'Hothanh@gmail.com' });
        if (!chinh || !thanh) {
            console.error('Demo users not found. Run "node seed.js" first.');
            process.exit(1);
        }

        const products = await Product.find({}).limit(2);
        if (products.length < 2) {
            console.error('Need at least 2 products in the database. Run "node seed.js" first.');
            process.exit(1);
        }

        // Clear any previous demo reviews from these two users so the script
        // can be re-run safely without hitting the unique (userId, productId) index.
        await Review.deleteMany({ userId: { $in: [chinh._id, thanh._id] } });

        await Review.insertMany([
            {
                userId: chinh._id,
                productId: products[0]._id,
                rating: 5,
                title: 'Great product, exactly as pictured',
                description: 'The quality feels premium and it matches the photos closely. Would buy again.',
                image: null
            },
            {
                userId: thanh._id,
                productId: products[1]._id,
                rating: 4,
                title: 'Solid quality, good detail',
                description: 'Nicer than I expected for the price, though shipping took a little longer than quoted.',
                image: null
            }
        ]);

        console.log('Reviews seeded: 2 sample reviews.');
        process.exit(0);
    } catch (error) {
        console.error('Review seeding error:', error);
        process.exit(1);
    }
}

seedReviews();
