const express = require('express');
const router = express.Router();
// Ensure auth.js is moved to a middleware folder
const { isAuthenticated, requireAdmin } = require('../middleware/auth'); 
// Destructure the array directly for the dynamic prototype
const { users } = require('../data/mockDB'); 

// Page route
router.get('/admin/users', isAuthenticated, requireAdmin, (req, res) => {
    res.render('modules/admin/UserManager');
});

// API to get all users
router.get('/api/admin/users', isAuthenticated, requireAdmin, (req, res) => {
    try {
        const safeUsers = users.map(({ password, token, ...user }) => ({
            ...user,
            isLocked: Boolean(user.isLocked)
        }));
        res.status(200).json(safeUsers);
    } catch (error) {
        console.error('Failed to retrieve accounts:', error);
        res.status(500).json({ error: 'Failed to load accounts.' });
    }
});

// Lock user
router.post('/api/admin/users/:id/lock', isAuthenticated, requireAdmin, (req, res) => {
    try {
        const user = users.find(u => u.id === parseInt(req.params.id));
        if (!user) return res.status(404).json({ error: 'User not found.' });

        user.isLocked = true;

        res.json({
            message: 'Account locked successfully.',
            user: { id: user.id, isLocked: true }
        });
    } catch (error) {
        console.error('Failed to lock account:', error);
        res.status(500).json({ error: 'Failed to lock account.' });
    }
});

// Unlock user
router.post('/api/admin/users/:id/unlock', isAuthenticated, requireAdmin, (req, res) => {
    try {
        const user = users.find(u => u.id === parseInt(req.params.id));
        if (!user) return res.status(404).json({ error: 'User not found.' });

        user.isLocked = false;

        res.json({
            message: 'Account unlocked successfully.',
            user: { id: user.id, isLocked: false }
        });
    } catch (error) {
        console.error('Failed to unlock account:', error);
        res.status(500).json({ error: 'Failed to unlock account.' });
    }
});

module.exports = router;