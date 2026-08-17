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

// --- IMPORT ROUTES ---
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const blogRoutes = require('./views/modules/blog/blogSV');

// --- MOUNT ROUTES ---
// UI View Routes
app.use('/', viewRoutes);
app.use('/', blogRoutes);

// API Routes 
app.use('/api', authRoutes);
app.use('/api', cartRoutes);

// --- START SERVER ---
app.listen(PORT, () => { 
    console.log(`Server is running at http://localhost:${PORT}`); 
});