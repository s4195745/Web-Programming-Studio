require('dotenv').config();
const mongoose = require('mongoose');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
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
const User = require('./models/user');
app.use(async (req, res, next) => {
    res.locals.currentUser = null;
    if (req.session && req.session.user) {
        try {
            res.locals.currentUser = await User.findById(req.session.user.id);
        } catch (err) {
            console.error("Session lookup error:", err);
        }
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
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected successfully!');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });

// Reply button 
app.use(express.urlencoded({ extended: true }));