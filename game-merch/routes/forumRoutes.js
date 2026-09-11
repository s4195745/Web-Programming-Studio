const express = require('express');
const router = express.Router();
const multer = require('multer');
 
const { isAuthenticated, requireAdmin } = require('../middleware/auth');
const { validateCreateThread, validateReply } = require('../middleware/validateForum');
const forumController = require('../controllers/forumController');
 
// Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 } // 3mb/ảnh
});
 
// Read only (no log in requirement)
router.get('/api/forum/threads', forumController.getThreads);
router.get('/api/forum/threads/:id', forumController.getThreadById);
router.get('/api/forum/related-products', forumController.getRelatedProducts);
 
// Log in requirements
router.post('/api/forum/threads', isAuthenticated, upload.array('thread_image', 5), validateCreateThread, forumController.createThread);
router.post('/api/forum/threads/:id/reply', isAuthenticated, validateReply, forumController.replyToThread);
router.post('/api/forum/threads/:id/like', isAuthenticated, forumController.toggleHeart);
router.post('/api/forum/threads/:id', isAuthenticated, upload.array('thread_image', 5), forumController.editThread);
router.post('/api/forum/threads/:id/delete', isAuthenticated, forumController.deleteThread);
 
// Admin only
router.post('/api/forum/threads/:id/admin-delete', isAuthenticated, requireAdmin, forumController.adminDeleteThread);
 
module.exports = router;
 