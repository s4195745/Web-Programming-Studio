require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const Product = require('./models/product');
const User = require('./models/user');
const { products, users } = require('./data/mockDB');

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Atlas for seeding...');

        await Product.deleteMany({});
        await User.deleteMany({});

        const cleanProducts = products.map(({ id, ...rest }) => rest);
        
        // Asynchronously hash all mock user passwords before insertion
        const cleanUsers = await Promise.all(users.map(async ({ id, password, ...rest }) => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            return { ...rest, password: hashedPassword };
        }));

        await Product.insertMany(cleanProducts);
        await User.insertMany(cleanUsers);

        console.log('Database seeded successfully with hashed passwords!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();