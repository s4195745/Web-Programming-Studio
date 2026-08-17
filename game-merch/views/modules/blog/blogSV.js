const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const BLOG_DIR = __dirname;
const DATA_FILE = path.join(BLOG_DIR, 'posts.json');

const initialPosts = [];

function loadPosts() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialPosts, null, 2), 'utf8');
    return initialPosts;
  }
  const fileData = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(fileData);
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

function getCategoryIcon(cat) {
  const icons = { 'Merch': '📱', 'Fan-art': '🎨', 'Discussion': '💬', 'Review': '⭐' };
  return icons[cat] || '📝';
}

// Helper: Get logged-in user's display account name
function getAccountName(req) {
  const user = req.user || (req.session && req.session.user);
  return user ? (user.username || user.name || user.email) : null;
}

// GET posts
router.get('/api/posts', (req, res) => {
  let posts = loadPosts();
  const { query, searchType, category, userOnly } = req.query;

  // Filter posts created by the current user when requested
  if (userOnly === 'true') {
    const currentAccount = getAccountName(req);
    if (!currentAccount) return res.json([]);
    posts = posts.filter(p => p.author && p.author.toLowerCase() === currentAccount.toLowerCase());
  }

  if (category) {
    posts = posts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (query) {
    const q = query.toLowerCase();
    posts = posts.filter(p => {
      if (searchType === 'author') return p.author.toLowerCase().includes(q);
      if (searchType === 'title') return p.title.toLowerCase().includes(q);
      return (
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );
    });
  }

  res.json(posts);
});

// GET current account endpoint
router.get('/api/current-user', (req, res) => {
  const accountName = getAccountName(req);
  res.json({ accountName: accountName || 'Guest', isLoggedIn: !!accountName });
});

// CREATE post (Uses Account Name)
router.post('/api/posts', (req, res) => {
  const accountName = getAccountName(req);

  if (!accountName) {
    return res.status(401).json({ error: "Please sign in to create a post." });
  }

  const posts = loadPosts();
  const { title, category, imageUrl, content, summary } = req.body;

  const newPost = {
    id: `post-${Date.now()}`,
    title,
    author: accountName,
    dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    category,
    categoryIcon: getCategoryIcon(category),
    summary: summary || (content.length > 80 ? content.substring(0, 80) + '...' : content),
    content,
    imageUrl: imageUrl || "https://via.placeholder.com/600x338",
    secondaryImage: "",
    comments: []
  };

  posts.unshift(newPost);
  savePosts(posts);
  res.status(201).json(newPost);
});

// edit post
router.put('/api/posts/:id', (req, res) => {
  const accountName = getAccountName(req);
  const posts = loadPosts();
  const idx = posts.findIndex(p => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Post not found" });

  if (posts[idx].author.toLowerCase() !== accountName.toLowerCase()) {
    return res.status(403).json({ error: "You can only edit your own posts." });
  }

  const { title, category, imageUrl, content, summary } = req.body;

  posts[idx] = {
    ...posts[idx],
    title: title || posts[idx].title,
    category: category || posts[idx].category,
    categoryIcon: category ? getCategoryIcon(category) : posts[idx].categoryIcon,
    imageUrl: imageUrl || posts[idx].imageUrl,
    content: content || posts[idx].content,
    summary: summary !== undefined ? summary : posts[idx].summary
  };

  savePosts(posts);
  res.json(posts[idx]);
});

// delete post
router.delete('/api/posts/:id', (req, res) => {
  const accountName = getAccountName(req);
  let posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.author.toLowerCase() !== accountName.toLowerCase()) {
    return res.status(403).json({ error: "You can only delete your own posts." });
  }

  const filtered = posts.filter(p => p.id !== req.params.id);
  savePosts(filtered);
  res.json({ success: true, message: "Post deleted" });
});

// post
router.post('/api/posts/:id/comments', (req, res) => {
  const accountName = getAccountName(req) || "Guest";
  const posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  const newComment = {
    id: `c-${Date.now()}`,
    author: accountName,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    text: req.body.text
  };

  post.comments.push(newComment);
  savePosts(posts);
  res.status(201).json(newComment);
});

router.get('/api/posts/:id', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

loadPosts();
module.exports = router;