const express = require('express');
const path = require('path');
const router = express.Router();

const { isAuthenticated, requireAdmin } = require('../views/modules/admin/auth');
const db = require(path.join(__dirname, '../data/mockDB'));

// page
router.get('/admin/users', isAuthenticated, requireAdmin, (req, res) => {
    res.render('UserManager');
});

// pull user from 
router.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        const users = await db.getAllUsers();

        const safeUsers = users.map(({ password, token, ...user }) => ({
            ...user,
            isLocked: Boolean(user.isLocked)
        }));

        res.json(safeUsers);
    } catch (error) {
        console.error('Failed to retrieve accounts:', error);
        res.status(500).json({ error: 'Failed to load accounts.' });
    }
});

// Lock user
router.post('/api/admin/users/:id/lock', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        const updatedUser = await db.updateUserLockStatus(
            req.params.id,
            true
        );

        res.json({
            message: 'Account locked successfully.',
            user: {
                id: updatedUser.id,
                isLocked: true
            }
        });
    } catch (error) {
        console.error('Failed to lock account:', error);
        res.status(500).json({
            error: 'Failed to lock account.'
        });
    }
});

// Unlock user
router.post('/api/admin/users/:id/unlock', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        const updatedUser = await db.updateUserLockStatus(
            req.params.id,
            false
        );

        res.json({
            message: 'Account unlocked successfully.',
            user: {
                id: updatedUser.id,
                isLocked: false
            }
        });
    } catch (error) {
        console.error('Failed to unlock account:', error);
        res.status(500).json({
            error: 'Failed to unlock account.'
        });
    }
});

module.exports = router;