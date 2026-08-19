// views/modules/admin/auth.js

const { users } = require('../../../data/mockDB');

// Helper to extract authenticated user from Session or Authorization Header
function getAuthenticatedUser(req) {
    if (req.session && req.session.user) {
        return users.find(u => u.id === req.session.user.id);
    }

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        return users.find(u => u.token === token);
    }

    return null;
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    const currentUser = getAuthenticatedUser(req);

    if (!currentUser) {
        return res.status(401).json({
            error: "Unauthorized access"
        });
    }

    // IMPORTANT: prevent locked accounts from accessing protected routes
    if (currentUser.isLocked === true) {
        if (req.session) {
            req.session.destroy(() => {});
        }

        return res.status(403).json({
            error: "Account is locked"
        });
    }

    req.currentUser = currentUser;
    return next();
}

// Middleware to enforce Admin-only access
function requireAdmin(req, res, next) {
    const currentUser = req.currentUser || getAuthenticatedUser(req);

    if (
        currentUser &&
        currentUser.isLocked !== true &&
        currentUser.role &&
        currentUser.role.toLowerCase() === 'admin'
    ) {
        return next();
    }

    return res.status(403).json({
        error: "Forbidden: Admin privileges required"
    });
}

module.exports = {
    isAuthenticated,
    requireAdmin
};