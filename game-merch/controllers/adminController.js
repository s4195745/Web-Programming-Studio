const User = require('../models/user');
const Thread = require('../models/thread');
const Cart = require('../models/cart');
const Blog = require('../models/blog');
const Review = require('../models/review');
const Wishlist = require('../models/wishlist');
const Order = require('../models/order');

// Escape a string for safe use inside a RegExp (used for case-insensitive
// exact-match lookups, e.g. matching a username against Blog.author).
function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Page route
exports.renderUserManager = (req, res) => {
    res.render('modules/admin/UserManager');
};

// API to get all users
exports.getAllUsers = async (req, res) => {
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
};

// API to get a single user's details (used by the "view account" modal)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -token');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.status(200).json({ ...user.toObject(), id: user._id.toString() });
    } catch (error) {
        console.error('Failed to retrieve account:', error);
        res.status(400).json({ error: 'Invalid user id.' });
    }
};

// Lock user
exports.lockUser = async (req, res) => {
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
};

// Unlock user
exports.unlockUser = async (req, res) => {
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
};

// Permanently delete a user account and everything attached to it
// (threads, replies inside other people's threads, blog posts/comments,
// cart, wishlist entries, reviews and orders)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete an administrator account.' });
        }
        if (String(user._id) === String(req.currentUser._id)) {
            return res.status(403).json({ error: 'You cannot delete your own account.' });
        }

        const userId = user._id;
        // Blog posts/comments store the author as a plain username string (no authorId
        // field), so match it case-insensitively/exactly rather than by ObjectId.
        const usernamePattern = new RegExp(`^${escapeRegExp(user.username)}$`, 'i');

        await Promise.all([
            // Threads created by this user are removed entirely.
            Thread.deleteMany({ authorId: userId }),
            // Replies this user left on OTHER people's threads are stripped out too.
            Thread.updateMany(
                { 'replies.authorId': userId },
                { $pull: { replies: { authorId: userId } } }
            ),
            // Blog posts authored by this user.
            Blog.deleteMany({ author: usernamePattern }),
            // Comments this user left on other people's blog posts.
            Blog.updateMany(
                {},
                { $pull: { comments: { author: usernamePattern } } }
            ),
            Cart.deleteOne({ userId }),
            Wishlist.deleteMany({ userId }),
            Review.deleteMany({ userId }),
            Order.deleteMany({ userId })
        ]);

        await User.deleteOne({ _id: userId });

        res.status(200).json({ message: 'Account and all associated data have been permanently deleted.' });
    } catch (error) {
        console.error('Failed to delete account:', error);
        res.status(500).json({ error: 'Failed to delete account.' });
    }
};
