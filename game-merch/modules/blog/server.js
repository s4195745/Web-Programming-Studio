const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'posts.json');

app.use(express.json());
app.use(express.static(__dirname));
// connecto to css
app.use(express.static(path.join(__dirname, '../../')));
// root URL to blog.html
app.get('/', (req, res) => {
  res.redirect('/blog.html');
});

// Initial seed data merged from post1Blog.html and post2Blog.html
const initialPosts = [
  {
    id: "post-1",
    title: "Lea Plushie",
    author: "RadicalFishGames",
    dateAdded: "June 18, 2026",
    category: "Merch",
    categoryIcon: "📱",
    summary: "Lea Plushie pre-order is live on Makeship now!",
    content: "Presenting: The smug Lea plush!\n\nAfter years of passionate fan demand we can finally present the new and extra smug Lea plush, in partnership with Makeship! And there will be as many as there is demand… If you preorder yours within the next 3 weeks!",
    imageUrl: "https://www.radicalfishgames.com/wp-content/uploads/plush-header-600x338.jpg",
    secondaryImage: "http://www.radicalfishgames.com/wp-content/uploads/LeaPlush-Launch-Post.png",
    comments: [
      {
        id: "c1",
        author: "Mungids",
        date: "June 19, 2026",
        text: "ik i live in SEA but man. shipping time of doom and despair bro."
      }
    ]
  },
  {
    id: "post-2",
    title: "I got angry!",
    author: "GamerUser",
    dateAdded: "Sep 30, 2025",
    category: "Fan-art",
    categoryIcon: "🎨",
    summary: "This fat fuck killed me ten times over.",
    content: "This fat fuck killed me ten times over, so I had to sit down and draw it to vent my frustration.\n\nEvil ass lava arena bro. I railed it with 100 needeles",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0UFw4m4xmzPauBwlyDQUHxCZHGCUsVzRrbd-TaQUghNse_dKngKO7TAk&s=10",
    secondaryImage: "",
    comments: [
      {
        id: "c2",
        author: "SilkDaughter",
        date: "Oct 01, 2025",
        text: "Skill Issue lmaooooo."
      }
    ]
  }
];

// Helper to initialize data storage
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

// REST API Endpoints

// GET /api/posts - Get all posts with optional filtering & search
app.get('/api/posts', (req, res) => {
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

// GET /api/posts/:id - Detailed View
app.get('/api/posts/:id', (req, res) => {
  const posts = loadPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// POST /api/posts - Create Post
app.post('/api/posts', (req, res) => {
  const posts = loadPosts();
  const { title, author, category, imageUrl, content } = req.body;

  const newPost = {
    id: `post-${Date.now()}`,
    title,
    author: author || "You",
    dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    category,
    categoryIcon: getCategoryIcon(category),
    summary: content.length > 80 ? content.substring(0, 80) + '...' : content,
    content,
    imageUrl: imageUrl || "https://via.placeholder.com/600x338",
    secondaryImage: "",
    comments: []
  };

  posts.unshift(newPost);
  savePosts(posts);
  res.status(201).json(newPost);
});

// PUT /api/posts/:id - Edit Post
app.put('/api/posts/:id', (req, res) => {
  const posts = loadPosts();
  const idx = posts.findIndex(p => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Post not found" });

  const { title, category, imageUrl, content } = req.body;

  posts[idx] = {
    ...posts[idx],
    title: title || posts[idx].title,
    category: category || posts[idx].category,
    categoryIcon: category ? getCategoryIcon(category) : posts[idx].categoryIcon,
    imageUrl: imageUrl || posts[idx].imageUrl,
    content: content || posts[idx].content,
    summary: content ? (content.length > 80 ? content.substring(0, 80) + '...' : content) : posts[idx].summary
  };

  savePosts(posts);
  res.json(posts[idx]);
});

// DELETE /api/posts/:id - Delete Post
app.delete('/api/posts/:id', (req, res) => {
  let posts = loadPosts();
  const filtered = posts.filter(p => p.id !== req.params.id);

  if (posts.length === filtered.length) {
    return res.status(404).json({ error: "Post not found" });
  }

  savePosts(filtered);
  res.json({ success: true, message: "Post deleted" });
});

// POST /api/posts/:id/comments - Add Comment
app.post('/api/posts/:id/comments', (req, res) => {
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

// Initialize storage file on startup
loadPosts();

app.listen(PORT, () => {
  console.log(`Blogging server running on http://localhost:${PORT}`);
});