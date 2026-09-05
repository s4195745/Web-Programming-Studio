const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Thread = require('./models/thread.js');

const mockData = require('./data/mockDB.js'); 
const threadsData = mockData.threads || []; 

const KNOWN_USERS = [
  { userId: 1, username: 'Nguyen The Chinh' },
  { userId: 2, username: 'Admin' },
  { userId: 3, username: 'ThanhHo' },
];

function resolveAuthorId(authorName) {
  const match = KNOWN_USERS.find(
    u => String(u.username || '').trim().toLocaleLowerCase() === String(authorName || '').trim().toLocaleLowerCase()
  );
  return match ? match.userId : 0;
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');

    // ======== FORUM MODULE =========

    //Delete all forum data on DB to avoid duplicates when seeding
    await Thread.deleteMany({});
    console.log('Cleared existing threads in DB.');

    // Push the data into the database
    if (threadsData.length > 0) {
      // Format the threads data to exclude the 'id' field before inserting into MongoDB
      const formattedThreads = threadsData.map(({ id, replies, ...rest }) => ({
        ...rest,
        authorId: resolveAuthorId(rest.author),
        replies: (replies || []).map(r => ({
          ...r,
          authorId: resolveAuthorId(r.author),
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