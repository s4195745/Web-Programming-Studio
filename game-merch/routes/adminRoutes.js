const express = require('express');
const router = express.Router();
const { isAuthenticated, requireAdmin } = require('../middleware/auth'); 
const User = require('../models/user'); 
const Thread = require('../models/thread');
const Cart = require('../models/cart');
const Product = require('../models/product');

// Page route
router.get('/admin/users', isAuthenticated, requireAdmin, (req, res) => {
    res.render('modules/admin/UserManager');
});

// API to get all users
router.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        // Fetch all users from Atlas, excluding sensitive fields
        const users = await User.find({}).select('-password -token');
        
        // Map MongoDB _id to the id field expected by your frontend script
        const safeUsers = users.map(user => ({
            ...user.toObject(),
            id: user._id.toString() 
        }));
        
        res.status(200).json(safeUsers);
    } catch (error) {
        console.error('Failed to retrieve accounts:', error);
        res.status(500).json({ error: 'Failed to load accounts.' });
    }
});

// Lock user
router.post('/api/admin/users/:id/lock', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot lock an administrator.' });
        }

        user.isLocked = true;
        await user.save();

        res.json({
            message: 'Account locked successfully.',
            user: { id: user._id.toString(), isLocked: true }
        });
    } catch (error) {
        console.error('Failed to lock account:', error);
        res.status(500).json({ error: 'Failed to lock account.' });
    }
});

// Unlock user
router.post('/api/admin/users/:id/unlock', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        user.isLocked = false;
        await user.save();

        res.json({
            message: 'Account unlocked successfully.',
            user: { id: user._id.toString(), isLocked: false }
        });
    } catch (error) {
        console.error('Failed to unlock account:', error);
        res.status(500).json({ error: 'Failed to unlock account.' });
    }
});

module.exports = router;