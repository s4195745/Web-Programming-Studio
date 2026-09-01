const express = require('express');
const router = express.Router();
const { threads, products, users } = require('../data/mockDB');
const multer = require('multer');

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
router.get('/api/forum/threads', (req, res) => {
    const result = threads.filter(t => !t.hidden);
    res.status(200).json(result);
});

//Get thread based on ID
router.get('/api/forum/threads/:id', (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id) && !t.hidden);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    res.status(200).json(thread);
});

//Get product list for sidebar
router.get('/api/forum/related-products', (req, res) => {
    res.status(200).json(products);
});

//Create new thread
router.post('/api/forum/threads', upload.array('thread_image', 5), (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to post.' });
    }

    const { thread_title, thread_content } = req.body;
    if (!thread_title || !thread_content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    const newId = threads.length > 0 ? Math.max(...threads.map(t => t.id)) + 1 : 1;
    const images = req.files ? req.files.map(f => '/assets/uploads/' + f.filename) : [];

    const newThread = {
        id: newId,
        pinned: false,
        title: thread_title,
        content: thread_content,
        images: images,
        // Ep author lay tu session da dang nhap, khong tin input client gui len
        author: req.session.user.username,
        timestamp: new Date().toISOString().slice(0, 16),
        replies: []
    };

    threads.push(newThread);
    res.status(201).json({ message: 'Thread created successfully', thread: newThread });
});


//Reply to a thread
router.post('/api/forum/threads/:id/reply', (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const { reply_author, reply_content } = req.body;
    if (!reply_author || !reply_content) {
        return res.status(400).json({ error: 'Name and reply content are required.' });
    }

    if (!thread.replies) thread.replies = [];
    const newReply = {
        author: reply_author,
        content: reply_content,
        timestamp: new Date().toISOString().slice(0, 16)
    };
    thread.replies.push(newReply);

    res.status(201).json({ message: 'Reply posted successfully', reply: newReply, thread });
});

// Edit - save changed
router.post('/api/forum/threads/:id', upload.array('thread_image', 5), (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    const { thread_title, thread_content } = req.body;
    thread.title = thread_title;
    thread.content = thread_content;

    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => '/assets/uploads/' + f.filename);
        thread.images = thread.images.concat(newImages);
    }

    res.status(200).json({ message: 'Thread updated successfully', thread });
});

// SOFT-DELETE (confirm author)
router.post('/api/forum/:id/delete', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Please log in first.' });
    }

    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // Fetch the  user data from  database
    const freshUser = users.find(u => u.id === Number(req.session.user.id));

    if (!freshUser) {
        return res.status(401).json({ error: 'User account not found.' });
    }

    // case-insensitive comparison
    const threadAuthor = String(thread.author || '').trim().toLowerCase();
    const currentUsername = String(freshUser.username || '').trim().toLowerCase();

    if (threadAuthor !== currentUsername) {
        return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    thread.hidden = true;
    res.json({ message: 'Thread hidden successfully' });
});

// Admin delete any forum post 
router.post('/api/forum/threads/:id/admin-delete', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Please log in first.' });
    }
    const freshUser = users.find(u => u.id === Number(req.session.user.id));

    if (!freshUser) {
        return res.status(401).json({ error: 'User account not found.' });
    }

    const currentUser = res.locals.currentUser || req.session.user || null;
    const isAdmin =
        String(freshUser.role || '')
            .trim()
            .toLowerCase() === 'admin';

    if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required.' });
    }

    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    if (thread.pinned) {
        return res.status(403).json({ error: 'Pinned posts cannot be deleted.' });
    }

    thread.hidden = true;

    res.json({ message: 'Thread deleted successfully by admin.' });
});

// CREATE NEW THREAD
router.post('/forum', upload.array('thread_image', 5), (req, res) => {
    // 1. Check if the user is authenticated
    if (!req.session || !req.session.user) {
        return res.status(401).send("You must be logged in to post.");
    }
    
    
    const { thread_title, thread_content } = req.body;

    const newId = threads.length > 0 ? Math.max(...threads.map(t => t.id)) + 1 : 1;
    const images = req.files ? req.files.map(f => '/assets/uploads/' + f.filename) : [];

    threads.push({
        id: newId,
        pinned: false,
        title: thread_title,
        content: thread_content,
        images: images,
        // 2. Force the author to be the securely logged-in session username
        author: req.session.user.username,
        timestamp: new Date().toISOString().slice(0, 16),
        replies: []
    });

    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    if (thread.pinned) {
        return res.status(403).json({ error: 'Pinned posts cannot be deleted.' });
    }

    thread.hidden = true;
    res.json({ message: 'Thread deleted successfully by admin.' });
});

module.exports = router;