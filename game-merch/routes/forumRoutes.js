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

router.get('/forum', (req, res) => {
    const { q, sort } = req.query;
    let result = threads.filter(t => !t.hidden);

    if (q) {
        const keyword = q.toLowerCase();
        result = result.filter(t =>
            t.title.toLowerCase().includes(keyword) ||
            t.content.toLowerCase().includes(keyword)
        );
    }

    result.sort((a, b) => {
        if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
        }
        return sort === "oldest"
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.render('modules/discussion_forum/forum', { threads: result, q: q || '', sort: sort || 'newest', products: products });
});

router.get('/forum/new', (req, res) => {
    res.render('modules/discussion_forum/new_thread');
});

router.get('/forum/:id', (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id) && !t.hidden);
    if (!thread) return res.status(404).send('Thread not found');
    res.render('modules/discussion_forum/thread_detail', { thread, products });
});

//REPLY FROM THREAD POST
router.post('/forum/:id/reply', (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).send('Thread not found');

    const { reply_author, reply_content } = req.body;

    if (!thread.replies) thread.replies = [];
    thread.replies.push({
        author: reply_author,
        content: reply_content,
        timestamp: new Date().toISOString().slice(0, 16)
    });

    res.redirect('/forum/' + thread.id);
});

// EDIT (change data based on the previous)
router.get('/forum/:id/edit', (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).send('Thread not found');
    res.render('modules/discussion_forum/edit_thread', { thread });
});

// EDIT — (save changed)
router.post('/forum/:id/edit', upload.array('thread_image', 5), (req, res) => {
    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).send('Thread not found');

    const { thread_title, thread_content } = req.body;

    thread.title = thread_title;
    thread.content = thread_content;

    if (req.files && req.files.length > 0) {
        const newImages = req.files.map(f => '/assets/uploads/' + f.filename);
        thread.images = thread.images.concat(newImages);
    }

    res.redirect('/forum/' + thread.id);
});

// SOFT-DELETE (Only the author can delete)
router.post('/forum/:id/delete', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Please log in first.' });
    }

    const thread = threads.find(t => t.id === Number(req.params.id));
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    // 1. Fetch the freshest user data directly from the database
    const freshUser = users.find(u => u.id === req.session.user.id);
    const secureUsername = freshUser ? freshUser.username : req.session.user.username;

    // 2. Perform a foolproof, case-insensitive comparison without trailing spaces
    const threadAuthor = String(thread.author).trim().toLowerCase();
    const currentUsername = String(secureUsername).trim().toLowerCase();

    if (threadAuthor !== currentUsername) {
        return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    thread.hidden = true;
    res.json({ message: 'Thread hidden successfully' });
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

    res.redirect('/forum');
});

module.exports = router;