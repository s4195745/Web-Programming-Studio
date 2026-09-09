// Seeds a couple of sample Wishlist documents into MongoDB Atlas.
// Run this AFTER seed.js (which creates the Users and Products collections),
// since this script looks up a demo user and demo products by their real
// fields rather than by a hardcoded _id (seed.js regenerates _ids every run).
//
// Usage:
//   node seed-wishlist.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');
const Product = require('./models/product');
const Wishlist = require('./models/wishlist');

const DEMO_USER_EMAIL = 'nguyenthechinh2807@gmail.com';

async function seedWishlist() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Atlas for wishlist seeding...');

        const demoUser = await User.findOne({ email: DEMO_USER_EMAIL });
        if (!demoUser) {
            console.error(`No user found with email ${DEMO_USER_EMAIL}. Run "node seed.js" first.`);
            process.exit(1);
        }

        const products = await Product.find({}).limit(2);
        if (products.length < 2) {
            console.error('Need at least 2 products in the database. Run "node seed.js" first.');
            process.exit(1);
        }

        // Clear any previous demo wishlist entries for this user so the script
        // can be re-run safely without hitting the unique (userId, productId) index.
        await Wishlist.deleteMany({ userId: demoUser._id });

        await Wishlist.insertMany([
            { userId: demoUser._id, productId: products[0]._id, purchased: false },
            { userId: demoUser._id, productId: products[1]._id, purchased: true }
        ]);

        console.log(`Wishlist seeded for ${demoUser.username}: 2 sample items.`);
        process.exit(0);
    } catch (error) {
        console.error('Wishlist seeding error:', error);
        process.exit(1);
    }
}

seedWishlist();
