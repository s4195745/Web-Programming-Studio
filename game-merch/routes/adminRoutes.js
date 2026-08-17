// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { users } = require('../data/mockDB');

// Helper to return in-memory users array
function getUsers() {
    return users;
}

// Middleware to restrict access to Admin users
function isAdmin(req, res, next) {
    const currentUser = req.user || (req.session && req.session.user);
    if (currentUser && currentUser.role && currentUser.role.toLowerCase() === 'admin') {
        return next();
    }
    return res.status(403).send("Access denied. Admin privileges required.");
}

// Render Admin User Manager View
router.get('/UserManager', isAdmin, (req, res) => {
    const userList = getUsers();
    res.render('modules/user_account_manage/UserManager', { users: userList });
});

// API Endpoint to Lock / Unlock User
router.put('/api/admin/users/:id/lock-status', isAdmin, (req, res) => {
    const userId = req.params.id;
    const { isLocked } = req.body;
    const userList = getUsers();

    const user = userList.find(u => String(u.id) === String(userId));
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    user.isLocked = isLocked;

    return res.json({ 
        message: `Account successfully ${isLocked ? 'locked' : 'unlocked'}.` 
    });
});

module.exports = router;