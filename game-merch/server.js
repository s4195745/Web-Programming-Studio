const express = require('express');
const app = express();
const PORT = 3000;

// Tell the server to use EJS for templating
app.set('view engine', 'ejs');

// Tell the server where to find static files like CSS and Images
app.use('/assets', express.static('assets'));

// --- ROUTES ---

// 1. Landing Page
app.get('/', (req, res) => {
    res.render('index');
});

// 2. Shop Page (Index)
app.get('/shop', (req, res) => {
    res.render('modules/shopping_cart/index');
});

// 3. Cart Page
app.get('/cart', (req, res) => {
    res.render('modules/shopping_cart/cart'); 
});

// 4. Product Detail Page
app.get('/product-detail', (req, res) => {
    res.render('modules/shopping_cart/product-detail'); 
});

// 5. Checkout Page
app.get('/checkout', (req, res) => {
    res.render('modules/shopping_cart/checkout'); 
});

// 6. Confirmation Page
app.get('/confirmation', (req, res) => {
    res.render('modules/shopping_cart/confirmation'); 
});

// 7. Login Page
app.get('/login', (req, res) => {
    res.render('modules/user_account_manage/login');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running! Open your browser and go to http://localhost:${PORT}`);
});