const path = require('path');
const express = require('express');
const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.set('views', path.join(__dirname, 'views'));

// Expose logged-in user to all EJS views automatically
app.use((req, res, next) => {
    res.locals.user = req.user || (req.session && req.session.user) || null;
    next();
});

// --- IMPORT ROUTES ---
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const blogRoutes = require('./views/modules/blog/blogSV');
const adminRoutes = require('./routes/adminRoutes');

// --- MOUNT ROUTES ---
// UI View Routes
app.use('/', viewRoutes);
app.use('/', blogRoutes);
app.use('/', adminRoutes);

// API Routes 
app.use('/api', authRoutes);
app.use('/api', cartRoutes);

// admin checker
function isAdmin(req, res, next) {
    const currentUser = req.user || (req.session && req.session.user);
    if (currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin') {
        return next();
    }
    return res.status(403).send("Access denied.");
}

// --- START SERVER ---
app.listen(PORT, () => { 
    console.log(`Server is running at http://localhost:${PORT}`); 
});