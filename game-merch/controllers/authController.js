const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.register = async (req, res) => {
    const { username, email, password, description } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ error: 'Email is already registered.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({ 
            username, 
            email, 
            password: hashedPassword, 
            description, 
            role: 'customer' 
        });
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid email or password.' });

        if (user.isLocked) {
            return res.status(403).json({ error: 'Your account is locked. Please contact support.' });
        }

        const token = 'secure_token_' + Buffer.from(user.email + Date.now()).toString('base64');
        user.token = token; 
        
        await user.save(); 

        if (req.session) {
            req.session.user = { id: user._id, email: user.email, role: user.role, username: user.username };
        }
        
        return res.status(200).json({ 
            message: 'Login successful', 
            token: token,
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role, 
                username: user.username, 
                description: user.description, 
                avatar: user.avatar 
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.updateProfile = async (req, res) => {
    const { newUsername, newEmail, newDescription, newAvatar } = req.body;
    try {
        const user = req.currentUser;

        if (newEmail && newEmail !== user.email) {
            const existingUser = await User.findOne({ email: newEmail });
            if (existingUser) return res.status(409).json({ error: 'Email already taken.' });
        }

        user.username = newUsername || user.username;
        user.email = newEmail || user.email;
        user.description = newDescription || user.description;
        if (newAvatar !== undefined) user.avatar = newAvatar;

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.verifyPassword = async (req, res) => {
    const { password } = req.body;
    try {
        const user = req.currentUser;
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Incorrect current password.' });

        res.status(200).json({ message: 'Verified.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.changePassword = async (req, res) => {
    const { newPassword } = req.body;
    try {
        const user = req.currentUser;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.currentUser._id);
        res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'If this email exists, a reset link was sent.' }); 
        res.status(200).json({ message: 'Reset link sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
};

exports.logout = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: 'Failed to log out.' });
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Logged out successfully.' });
        });
    } else {
        return res.status(200).json({ message: 'Logged out successfully.' });
    }
};
