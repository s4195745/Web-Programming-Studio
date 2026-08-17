// middleware/auth.js

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized access" });
}

// Middleware to enforce Admin-only access
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: "Forbidden: Admin privileges required" });
}

module.exports = { isAuthenticated, requireAdmin };