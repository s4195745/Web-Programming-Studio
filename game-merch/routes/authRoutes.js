const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { hashPassword } = require('../data/mockDB'); // Reusing your existing hashing logic

// REGISTER
router.post('/register', async (req, res) => {
    const { username, email, password, description } = req.body;

    if (!username || !email || !password || !description) return res.status(400).json({ error: "All fields are required!" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email format!" });
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters with 1 letter and 1 number." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ error: "Email is already registered." });

        await User.create({ 
            username, 
            email, 
            password: hashPassword(password), 
            description, 
            role: "customer" 
        });
        res.status(201).json({ message: "Registration successful" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required!" });
    
    try {
        const hashedPassword = hashPassword(password);
        const user = await User.findOne({ email, password: hashedPassword });
        
        if (user) {
            if (user.isLocked) {
                return res.status(403).json({ error: "Your account is locked. Please contact support." });
            }

            const token = "mock_token_" + Buffer.from(user.email + Date.now()).toString('base64');
            user.token = token; 
            
            // This is the crucial fix: saving the active token to MongoDB Atlas
            await user.save(); 

            if (req.session) {
                req.session.user = { id: user._id, email: user.email, role: user.role, username: user.username };
            }
            
            return res.status(200).json({ 
                message: "Login successful", 
                token: token,
                user: { id: user._id, email: user.email, role: user.role, username: user.username, description: user.description, avatar: user.avatar }
            });
        } else {
            return res.status(401).json({ error: "Invalid email or password." });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// PROFILE UPDATE
router.put('/profile', async (req, res) => {
    const { currentEmail, token, newUsername, newEmail, newDescription, newAvatar } = req.body;
    if (!currentEmail || !token) return res.status(401).json({ error: "Authentication required." });

    try {
        const user = await User.findOne({ email: currentEmail, token: token });
        if (!user) return res.status(401).json({ error: "Invalid or expired session." });

        if (newEmail && newEmail !== currentEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: "Invalid email format!" });
            const existingUser = await User.findOne({ email: newEmail });
            if (existingUser) return res.status(409).json({ error: "Email already taken." });
        }

        user.username = newUsername || user.username;
        user.email = newEmail || user.email;
        user.description = newDescription || user.description;
        if (newAvatar !== undefined) user.avatar = newAvatar;

        await user.save();
        res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// VERIFY PASSWORD
router.post('/verify-password', async (req, res) => {
    const { email, token, password } = req.body;
    try {
        const user = await User.findOne({ email, token });
        if (!user) return res.status(401).json({ error: "Invalid session." });
        if (user.password !== hashPassword(password)) return res.status(401).json({ error: "Incorrect current password." });
        res.status(200).json({ message: "Verified." });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// CHANGE PASSWORD
router.put('/change-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: "Missing required fields." });
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) return res.status(400).json({ error: "Weak password." });

    try {
        const user = await User.findOne({ email, token });
        if (!user) return res.status(401).json({ error: "Invalid session." });

        user.password = hashPassword(newPassword);
        await user.save();
        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// DELETE ACCOUNT
router.delete('/account', async (req, res) => {
    const { email, token } = req.body;
    try {
        const user = await User.findOneAndDelete({ email, token });
        if (!user) return res.status(401).json({ error: "Invalid session." });
        res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "If this email exists, a reset link was sent." }); 
        res.status(200).json({ message: "Reset link sent." });
    } catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;