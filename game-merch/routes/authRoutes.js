    const express = require('express');
    const router = express.Router();
    const { users, hashPassword } = require('../data/mockDB');

    // REGISTER
    router.post('/register', (req, res) => {
        const { username, email, password, description } = req.body;

        if (!username || !email || !password || !description) return res.status(400).json({ error: "All fields are required!" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email format!" });
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters with 1 letter and 1 number." });
        }

        if (users.find(u => u.email === email)) return res.status(409).json({ error: "Email is already registered." });

        const newUser = { 
            id: users.length + 1, 
            username, 
            email, 
            password: hashPassword(password), 
            description, 
            role: "customer",
            avatar: null,
            token: null
        };
        users.push(newUser);

        res.status(201).json({ message: "Registration successful" });
    });

    // LOGIN
    router.post('/login', (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password are required!" });
        
        const hashedPassword = hashPassword(password);
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        
        if (user) {
            // Prevent access if the account has been locked by an administrator
            if (user.isLocked) {
                return res.status(403).json({ error: "Your account is locked. Please contact support." });
            }

            const token = "mock_token_" + Buffer.from(user.email + Date.now()).toString('base64');
            user.token = token; 

            // Assign user to express-session if session middleware is active
            if (req.session) {
                req.session.user = { id: user.id, email: user.email, role: user.role, username: user.username };
            }
            
            return res.status(200).json({ 
                message: "Login successful", 
                token: token,
                user: { id: user.id, email: user.email, role: user.role, username: user.username, description: user.description, avatar: user.avatar }
            });
        } else {
            return res.status(401).json({ error: "Invalid email or password." });
        }
    });

    // PROFILE UPDATE
    router.put('/profile', (req, res) => {
        const { currentEmail, token, newUsername, newEmail, newDescription, newAvatar } = req.body;
        if (!currentEmail || !token) return res.status(401).json({ error: "Authentication required." });

        const userIndex = users.findIndex(u => u.email === currentEmail && u.token === token);
        if (userIndex === -1) return res.status(401).json({ error: "Invalid or expired session." });

        if (newEmail && newEmail !== currentEmail) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: "Invalid email format!" });
            if (users.find(u => u.email === newEmail)) return res.status(409).json({ error: "Email already taken." });
        }

        users[userIndex].username = newUsername || users[userIndex].username;
        users[userIndex].email = newEmail || users[userIndex].email;
        users[userIndex].description = newDescription || users[userIndex].description;
        if (newAvatar !== undefined) users[userIndex].avatar = newAvatar;

        res.status(200).json({ message: "Profile updated successfully", user: users[userIndex] });
    });

    // VERIFY PASSWORD
    router.post('/verify-password', (req, res) => {
        const { email, token, password } = req.body;
        const user = users.find(u => u.email === email && u.token === token);
        if (!user) return res.status(401).json({ error: "Invalid session." });
        if (user.password !== hashPassword(password)) return res.status(401).json({ error: "Incorrect current password." });
        res.status(200).json({ message: "Verified." });
    });

    // CHANGE PASSWORD
    router.put('/change-password', (req, res) => {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) return res.status(400).json({ error: "Missing required fields." });
        if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) return res.status(400).json({ error: "Weak password." });

        const user = users.find(u => u.email === email && u.token === token);
        if (!user) return res.status(401).json({ error: "Invalid session." });

        user.password = hashPassword(newPassword);
        res.status(200).json({ message: "Password updated successfully." });
    });

    // DELETE ACCOUNT
    router.delete('/account', (req, res) => {
        const { email, token } = req.body;
        const userIndex = users.findIndex(u => u.email === email && u.token === token);
        if (userIndex === -1) return res.status(401).json({ error: "Invalid session." });

        users.splice(userIndex, 1);
        res.status(200).json({ message: "Account deleted successfully." });
    });

    // FORGOT PASSWORD
    router.post('/forgot-password', (req, res) => {
        const { email } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) return res.status(404).json({ error: "If this email exists, a reset link was sent." }); 
        res.status(200).json({ message: "Reset link sent." });
    });

    module.exports = router;