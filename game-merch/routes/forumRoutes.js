const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import models 
const Thread = require('../models/thread.js');
const User = require('../models/user.js');
const Product = require('../models/product.js');

//Set up multer for upload image (optional)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'assets/uploads/');
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});

//Page shell routes (csr)

router.get('/forum', (req, res) => {
    res.render('modules/discussion_forum/forum');
});

router.get('/forum/new', (req, res) => {
    res.render('modules/discussion_forum/new_thread');
});

router.get('/forum/:id/edit', (req, res) => {
    res.render('modules/discussion_forum/edit_thread');
});

router.get('/forum/:id', (req, res) => {
    res.render('modules/discussion_forum/thread_detail');
});

//JSON API routes
function withAuthorAvatar(t) {
    const author = t.authorId;
    return {
        ...t,
        authorId: author && author._id ? String(author._id) : (author ? String(author) : null),
        authorAvatar: author && author.avatar ? author.avatar : null,
        replies: (t.replies || []).map((r) => {
            const rAuthor = r.authorId;
            return {
                ...r,
                authorId: rAuthor && rAuthor._id ? String(r.Author._id) : (rAuthor ? String(r.Author) : null),
                authorAvatar: rAuthor && rAuthor.avatar ? avatar : null
            }; 
         })
    };
}

router.get('/api/forum/threads', async (req, res) => {
    try {
        const result = await Thread.find({ hidden: { $ne: true } })
        .sort({ pinned: -1, createdAt: -1 })
        .populate('authorId', 'avatar')
        .populate('replies.authorId', 'avatar')
        .lean();
        res.status(200).json(result.map(withAuthorAvatar));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Get thread based on ID
router.get('/api/forum/threads/:id', async (req, res) => {
    try {
        const thread = await Thread.findOne({ _id: req.params.id, hidden: { $ne: true } })
        .populate('authorId', 'avatar')
        .populate('replies.authorId', 'avatar')
        .lean();
        if (!thread) return res.status(404).json({ error: 'Thread not found' });
        res.status(200).json(withAuthorAvatar(thread));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Get product list for sidebar
router.get('/api/forum/related-products', async (req, res) => {
    try {
        const result = await Product.find({}).limit(3);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Create new thread
router.post('/api/forum/threads', upload.array('thread_image', 5), async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'You must be logged in to post.' });
        }
        const { thread_title, thread_content } = req.body;
        if (!thread_title || !thread_content) {
            return res.status(400).json({ error: 'Title and content are required.' });
        }
        const images = req.files ? req.files.map(f => '/assets/uploads/' + f.filename) : [];

        const newThread = new Thread({
            title: thread_title,
            content: thread_content,
            images: images,
            author: req.session.user.username,
            authorId: String(req.session.user.id),
            hidden: false,
            replies: []
        });

        await newThread.save();

        res.status(201).json({ message: 'Thread created successfully', thread: newThread });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Reply to a thread
router.post('/api/forum/threads/:id/reply', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'You must be logged in to reply.' });
        }

        const { reply_content } = req.body;
        if (!reply_content || !reply_content.trim()) {
            return res.status(400).json({ error: 'Reply content is required.' });
        }

        const newReply = {
            author: req.session.user.username,
            authorId: String(req.session.user.id),
            content: reply_content,
            timestamp: new Date().toISOString().slice(0, 16)
        };

        const thread = await Thread.findOne({
            _id: req.params.id,
            hidden: { $ne: true }
        })

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        thread.replies.push(newReply);
        await thread.save();
        
        res.status(201).json({
            message: 'Reply posted successfully',
            reply: newReply,
            thread: thread
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to post reply' + error.message });
    }
});

// Edit - save changed
router.post('/api/forum/threads/:id', upload.array('thread_image', 5), async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Please log in first.' });
        }

        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        if (String(thread.authorId) !== String(req.session.user.id)) {
            return res.status(403).json({ error: 'You can only edit your own posts.' });
        }

        const { thread_title, thread_content } = req.body;
        thread.title = thread_title || thread.title;
        thread.content = thread_content || thread.content;

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => '/assets/uploads/' + f.filename);
            thread.images = thread.images.concat(newImages);
        }

        await thread.save();
        res.status(200).json({ message: 'Thread updated successfully', thread });
    } catch (err) {
        console.error('[PUT /api/forum/threads/:id]', err);
        res.status(500).json({ error: 'Failed to update thread: ' + err.message });
    }
});

// SOFT-DELETE (confirm author)
router.post('/api/forum/threads/:id/delete', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Please log in first.' });
        }

        console.log("Session user data:", req.session.user);

        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        const userId = req.session.user.id || req.session.user.id;
        const freshUser = await User.findById(userId);
        if (!freshUser) {
            return res.status(401).json({ error: 'User account not found.' });
        }
        if (freshUser.isLocked) {
            return res.status(403).json({ error: 'Your account is locked. You cannot perform this action.' });
        }

        if (String(thread.authorId) !== String(freshUser._id)) {
            return res.status(403).json({ error: 'You can only delete your own posts.' });
        }

        thread.hidden = true;
        await thread.save();

        res.json({ message: 'Thread hidden successfully' });
    } catch (err) {
        console.error('[POST /api/forum/threads/:id/delete]', err);
        res.status(500).json({ error: 'Failed to delete thread: ' + err.message });
    }
});

// Admin delete any forum post 
router.post('/api/forum/threads/:id/admin-delete', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'Please log in first.' });
        }

        const freshUser = await User.findById(req.session.user.id);
        if (!freshUser) {
            return res.status(401).json({ error: 'User account not found.' });
        }
        if (freshUser.isLocked) {
            return res.status(403).json({ error: 'Your account is locked. You cannot perform this action.' });
        }

        const isAdmin = String(freshUser.role || '').trim().toLowerCase() === 'admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required.' });
        }

        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        if (thread.pinned) {
            return res.status(403).json({ error: 'Pinned posts cannot be deleted.' });
        }

        thread.hidden = true;
        await thread.save();

        res.json({ message: 'Thread deleted successfully by admin.' });
    } catch (err) {
        console.error('[POST /api/forum/threads/:id/admin-delete]', err);
        res.status(500).json({ error: 'Failed to delete thread by admin: ' + err.message });
    }
});

module.exports = router;