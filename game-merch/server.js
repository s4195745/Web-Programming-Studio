const express = require('express');
const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- IMPORT ROUTES ---
const viewRoutes = require('./routes/viewRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');

// --- MOUNT ROUTES ---
// UI View Routes
app.use('/', viewRoutes);

// API Routes mounted to '/api' so client JS fetch('/api/login') doesn't break
app.use('/api', authRoutes);
app.use('/api', cartRoutes);

// --- START SERVER ---
app.listen(PORT, () => { 
    console.log(`Server is running at http://localhost:${PORT}`); 
});