require('dotenv').config();
const mongoose = require('mongoose');

const path = require('path');
const express = require('express');
const app = express();
const PORT = 3000;
const session = require('express-session');

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('views', path.join(__dirname, 'views'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false
    }
}));

// ejs views current user 
app.use((req, res, next) => {
    res.locals.currentUser = null;

    if (req.session && req.session.user) {
        const { users } = require('./data/mockDB');

        res.locals.currentUser = users.find(
            user => user.id === req.session.user.id
        ) || null;
    }

    next();
});

// --- IMPORT ROUTES ---
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const blogRoutes = require('./routes/blogRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const forumRoutes = require('./routes/forumRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- MOUNT ROUTES ---
// UI View Routes
app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/', blogRoutes);
app.use('/', adminRoutes);
app.use('/', forumRoutes);


// API Routes 
app.use('/api', authRoutes);
app.use('/api', cartRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', reviewRoutes);

app.set('views', path.join(__dirname, 'views'));

// --- START SERVER ---
app.listen(PORT, () => { 
    console.log(`Server is running at http://localhost:${PORT}`); 
});

// Reply button 
app.use(express.urlencoded({ extended: true }));