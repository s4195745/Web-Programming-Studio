const express = require('express');
const router = express.Router();
const { isAuthenticated, requireAdmin } = require('../middleware/auth');

// dashboard view
router.get('/admin/manage-users', isAuthenticated, requireAdmin, (req, res) => {
  res.sendFile('admin-manage-users.html', { root: './public' });
});

// Fairy
router.get('/api/admin/users', isAuthenticated, requireAdmin, async (req, res) => {
  const users = await db.getAllUsers();
  res.json(users);
});

router.post('/api/admin/users/:id/lock', isAuthenticated, requireAdmin, async (req, res) => {
  const { id } = req.params;
  await db.updateUserLockStatus(id, true); // Lock 
  res.json({ message: "User account locked successfully" });
});

router.post('/api/admin/users/:id/unlock', isAuthenticated, requireAdmin, async (req, res) => {
  const { id } = req.params;
  await db.updateUserLockStatus(id, false); // Unlock 
  res.json({ message: "User account unlocked successfully" });
});

module.exports = router;