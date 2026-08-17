const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Folder & Data File Setup
const BLOG_DIR = __dirname;
const DATA_FILE = path.join(BLOG_DIR, 'posts.json');

const initialPosts = [];

router.use(express.json());
router.use(express.static(__dirname));
// connecto to css
router.use(express.static(path.join(__dirname, '../../')));
// root URL to blog.html
router.get('/', (req, res) => {
  res.redirect('/blog.html');
});

// initialize data storage
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
// GET posts
router.get('/api/posts', (req, res) => {
  let posts = loadPosts();
  const { query, searchType, category } = req.query;

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

//  create post 
router.post('/api/posts', (req, res) => {
  const posts = loadPosts();
  const { title, author, category, imageUrl, content, summary } = req.body;

  const newPost = {
    id: `post-${Date.now()}`,
    title,
    author: author || "You",
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
  const posts = loadPosts();
  const idx = posts.findIndex(p => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Post not found" });

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

// DELETE /api/posts/:id - Delete Post
router.delete('/api/posts/:id', (req, res) => {
  let posts = loadPosts();
  const filtered = posts.filter(p => p.id !== req.params.id);

  if (posts.length === filtered.length) {
    return res.status(404).json({ error: "Post not found" });
  }

  savePosts(filtered);
  res.json({ success: true, message: "Post deleted" });
});

// comment 
router.post('/api/posts/:id/comments', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);

  if (!post) return res.status(404).json({ error: "Post not found" });

  const newComment = {
    id: `c-${Date.now()}`,
    author: req.body.author || "Guest",
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
