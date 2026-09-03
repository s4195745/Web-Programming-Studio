require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');
const User = require('./models/user');
const Blog = require('./models/blog');
const blogs = require('./data/posts.json');
const { products, users } = require('./data/mockDB');

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Atlas for seeding...');

        await Product.deleteMany({});
        await User.deleteMany({});
        await Blog.deleteMany({});

        const cleanProducts = products.map(({ id, ...rest }) => rest);
        const cleanUsers = users.map(({ id, ...rest }) => rest);
        const cleanBlogs = blogs.map(blog => ({...blog, comments: blog.comments || [] }));

        await Product.insertMany(cleanProducts);
        await User.insertMany(cleanUsers);
        await Blog.insertMany(cleanBlogs);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedDatabase();