const User = require('../models/user');

// Get authenticated user from session or token
async function getAuthenticatedUser(req) {
    try {
        if (req.session && req.session.user) {
            return await User.findById(req.session.user.id);
        }

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            return await User.findOne({ token: token });
        }
        return null;
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return null;
    }
}

// Check if user is logged in and active
async function isAuthenticated(req, res, next) {
    const currentUser = await getAuthenticatedUser(req);

    if (!currentUser) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    // Prevent locked accounts from accessing the application
    if (currentUser.isLocked === true) {
        if (req.session) {
            req.session.destroy(() => {});
        }
        return res.status(403).json({ error: "Account is locked" });
    }

    req.currentUser = currentUser;
    return next();
}

// Force only admin access
async function requireAdmin(req, res, next) {
    const currentUser = req.currentUser || await getAuthenticatedUser(req);

    if (
        currentUser &&
        currentUser.isLocked !== true &&
        currentUser.role &&
        currentUser.role.toLowerCase() === 'admin'
    ) {
        return next();
    }

    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
}

module.exports = {
    isAuthenticated,
    requireAdmin
};