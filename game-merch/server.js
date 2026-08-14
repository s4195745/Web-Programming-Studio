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

// --- SHOPPING CART ROUTE---

// Shop Page (Index)
app.get('/shop', (req, res) => {
    res.render('modules/shopping_cart/index');
});

// Cart Page
app.get('/cart', (req, res) => {
    res.render('modules/shopping_cart/cart'); 
});

// Product Detail Page
app.get('/product_detail', (req, res) => {
    res.render('modules/shopping_cart/product_detail'); 
});

// Checkout Page
app.get('/checkout', (req, res) => {
    res.render('modules/shopping_cart/checkout'); 
});

// Confirmation Page
app.get('/confirmation', (req, res) => {
    res.render('modules/shopping_cart/confirmation'); 
});

// --- USER ACCOUNT ROUTES ---

// Login Page
app.get('/login', (req, res) => {
    res.render('modules/user_account_manage/login');
});

// Register Page
app.get('/register', (req, res) => {
    res.render('modules/user_account_manage/register');
});

// Profile Page
app.get('/profile', (req, res) => {
    res.render('modules/user_account_manage/profile');
});

// Edit Profile Page
app.get('/edit_profile', (req, res) => {
    res.render('modules/user_account_manage/edit_profile');
});

// Change Password Page
app.get('/change_password', (req, res) => {
    res.render('modules/user_account_manage/change_password');
});

// Verify Password Page
app.get('/verify_password', (req, res) => {
    res.render('modules/user_account_manage/verify_password');
});

// Forgot Password Page
app.get('/forgot_password', (req, res) => {
    res.render('modules/user_account_manage/forgot_password');
});

// Forgot Password Confirm Page
app.get('/forgot_password_confirm', (req, res) => {
    res.render('modules/user_account_manage/forgot_password_confirm'); 
});

// Delete Account Page
app.get('/delete_account', (req, res) => {
    res.render('modules/user_account_manage/delete_account');
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running! Open your browser and go to http://localhost:${PORT}`);
});