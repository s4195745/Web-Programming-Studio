const express = require('express');
const router = express.Router();

router.get('/', (req, res) => { res.render('index'); });

// Shopping Cart Module Pages
router.get('/shop', (req, res) => { res.render('modules/shopping_cart/index'); });
router.get('/cart', (req, res) => { res.render('modules/shopping_cart/cart'); });
router.get('/product_detail', (req, res) => { res.render('modules/shopping_cart/product_detail'); });
router.get('/checkout', (req, res) => { res.render('modules/shopping_cart/checkout'); });
router.get('/confirmation', (req, res) => { res.render('modules/shopping_cart/confirmation'); });

// User Account Module Pages
router.get('/login', (req, res) => { res.render('modules/user_account_manage/login'); });
router.get('/register', (req, res) => { res.render('modules/user_account_manage/register'); });
router.get('/profile', (req, res) => { res.render('modules/user_account_manage/profile'); });
router.get('/edit_profile', (req, res) => { res.render('modules/user_account_manage/edit_profile'); });
router.get('/change_password', (req, res) => { res.render('modules/user_account_manage/change_password'); });
router.get('/verify_password', (req, res) => { res.render('modules/user_account_manage/verify_password'); });
router.get('/forgot_password', (req, res) => { res.render('modules/user_account_manage/forgot_password'); });
router.get('/forgot_password_confirm', (req, res) => { res.render('modules/user_account_manage/forgot_password_confirm'); });
router.get('/delete_account', (req, res) => { res.render('modules/user_account_manage/delete_account'); });

// blog pages
router.get('/blog', (req, res) => { res.render('modules/blog/blog'); });
router.get('/UserBlog', (req, res) => { res.render('modules/blog/UserBlog'); });

//admin page
router.get('/admin', (req, res) => { res.render('modules/user_account_manage/UserManager', { users });
});

module.exports = router;