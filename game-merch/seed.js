const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Thread = require('./models/thread.js');


const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  username: String,
}), 'users');

// Load mock data from local file
const mockData = require('./data/mockDB.js'); 
const threadsData = mockData.threads || []; 

// helper function to resolve author's ObjectId by matching name/username 
function resolveAuthorId(authorName, userMap) {
  const match = userMap.get(String(authorName || '').trim().toLocaleLowerCase());
  return match ? match._id : null;
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // ======== FORUM MODULE =========

    // Fetch existing users to build an in-memory lookup map 
    const users = await User.find({}, '_id name username').lean();
    const userMap = new Map();
    users.forEach(user => {
      if (user.name) userMap.set(user.name.trim().toLowerCase(), user);
      if (user.username) userMap.set(user.username.trim().toLowerCase(), user);
    });

    //Delete all forum data on DB to avoid duplicates when seeding
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

    // ========== END OF FORUM MODULE =========

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error while seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();