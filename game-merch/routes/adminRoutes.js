// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { users } = require('../data/mockDB');

// Helper function
function getUsers() {
    return users;
}

// Middleware to restrict access to Admin users
function isAdmin(req, res, next) {
    const currentUser = req.user || (req.session && req.session.user);
    if (currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin') {
    }
    return res.status(403).send("Access denied. Admin privileges required.");
}

// Route to render the User Manager page
router.get('/admin', isAdmin, (req, res) => {
    const userList = getUsers();
    res.render('modules/user_account_manage/UserManager', { users: userList });
});

module.exports = router;