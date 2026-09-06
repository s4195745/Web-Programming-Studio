const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Product = require('./models/product');
const User = require('./models/user');
const Thread = require('./models/thread');

const mockData = require('./data/mockDB.js');
const products = mockData.products || [];
const users = mockData.users || [];
const threadsData = mockData.threads || [];

// Helper function to resolve author's ObjectId by matching name/username
function resolveAuthorId(authorName, userMap) {
  const match = userMap.get(String(authorName || '').trim().toLowerCase());
  return match ? match._id : null;
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // ======== 1. USERS & PRODUCTS MODULE ========
    await Product.deleteMany({});
    await User.deleteMany({});

    const cleanProducts = products.map(({ id, ...rest }) => rest);

    // Asynchronously hash all mock user passwords before insertion
    const cleanUsers = await Promise.all(
      users.map(async ({ id, password, ...rest }) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || '123456', salt);
        return { ...rest, password: hashedPassword };
      })
    );

    if (cleanProducts.length > 0) {
      await Product.insertMany(cleanProducts);
    }

    let insertedUsers = [];
    if (cleanUsers.length > 0) {
      insertedUsers = await User.insertMany(cleanUsers);
    }
    console.log('Users and Products seeded successfully with hashed passwords!');

    // ======== 2. FORUM MODULE ========
    // Build an in-memory lookup map directly from the newly seeded users
    const userMap = new Map();
    insertedUsers.forEach((user) => {
      if (user.name) userMap.set(user.name.trim().toLowerCase(), user);
      if (user.username) userMap.set(user.username.trim().toLowerCase(), user);
    });

    await Thread.deleteMany({});
    console.log('Cleared existing threads in DB.');

    // Format threads: remove legacy 'id' and link actual author ObjectId
    if (threadsData.length > 0) {
      const formattedThreads = threadsData.map(({ id, replies, ...rest }) => ({
        ...rest,
        authorId: resolveAuthorId(rest.author, userMap),
        replies: (replies || []).map(({ id: replyId, ...r }) => ({
          ...r,
          authorId: resolveAuthorId(r.author, userMap),
        })),
      }));

      await Thread.insertMany(formattedThreads);
      console.log(`Successfully seeded ${formattedThreads.length} threads!`);
    } else {
      console.log('No thread data found to seed.');
    }

    // ======== FINISH ========
    await mongoose.connection.close();
    console.log('All modules seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error while seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();