const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Post = require('../models/blog');

function getCategoryIcon(cat) {
  const icons = { 'Merch': '📱', 'Fan-art': '🎨', 'Discussion': '💬', 'Review': '⭐' };
  return icons[cat] || '📝';
}

// get logged in account name
async function getAccountName(req) {
  const user = req.user || (req.session && req.session.user);

  if (user) {
    return user.username || user.name || user.email;
  }

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    const foundUser = await User.findOne({ token });

    if (foundUser) {
      return foundUser.username || foundUser.name || foundUser.email;
    }
  }

  const headerEmail = req.headers['x-user-email'];

  if (headerEmail) {
    const foundUser = await User.findOne({
      email: headerEmail
    });

    if (foundUser) {
      return foundUser.username || foundUser.name || foundUser.email;
    }
  }

  return null;
}

// GET posts
router.get('/api/posts', async (req, res) => {
  try {
    let posts = await Post.find().sort({ createdAt: -1 });

    const { query, searchType, category, userOnly } = req.query;

    if (userOnly === 'true') {
      const currentAccount = await getAccountName(req);

      if (!currentAccount) {
        return res.json([]);
      }

      posts = posts.filter(
        post =>
          post.author &&
          post.author.toLowerCase() === currentAccount.toLowerCase()
      );
    }

    if (category) {
      posts = posts.filter(
        post =>
          post.category &&
          post.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (query) {
      const q = query.toLowerCase();

      posts = posts.filter(post => {
        if (searchType === 'author') {
          return post.author?.toLowerCase().includes(q);
        }

        if (searchType === 'title') {
          return post.title?.toLowerCase().includes(q);
        }

        return (
          post.title?.toLowerCase().includes(q) ||
          post.author?.toLowerCase().includes(q) ||
          post.category?.toLowerCase().includes(q) ||
          post.content?.toLowerCase().includes(q)
        );
      });
    }

    res.json(posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// GET current account endpoint
router.get('/api/current-user', (req, res) => {
  const accountName = getAccountName(req);
  res.json({ accountName: accountName || 'Guest', isLoggedIn: !!accountName });
});

// POST(create) post
router.post('/api/posts', async (req, res) => {
  try {
    const accountName = await getAccountName(req);

    if (!accountName) {
      return res.status(401).json({
        error: 'Please sign in to create a post.'
      });
    }

    const {
      title,
      category,
      imageUrl,
      secondaryImage,
      content,
      summary
    } = req.body;

    const newPost = await Post.create({
      id: `post-${Date.now()}`,
      title,
      author: accountName,
      dateAdded: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      category,
      categoryIcon: getCategoryIcon(category),
      summary:
        summary ||
        (content.length > 80
          ? content.substring(0, 80) + '...'
          : content),
      content,
      imageUrl:
        imageUrl || 'https://via.placeholder.com/600x338',
      secondaryImage: secondaryImage || '',
      comments: []
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);

    res.status(500).json({
      error: 'Failed to create post'
    });
  }
});

// PUT(edit) post
router.put('/api/posts/:id', async (req, res) => {
  try {
    const accountName = await getAccountName(req);

    if (!accountName) {
      return res.status(401).json({
        error: 'Please sign in to edit a post.'
      });
    }

    const post = await Post.findOne({
      id: req.params.id
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    if (
      !post.author ||
      post.author.toLowerCase() !== accountName.toLowerCase()
    ) {
      return res.status(403).json({
        error: 'You can only edit your own posts.'
      });
    }

    const {
      title,
      category,
      imageUrl,
      secondaryImage,
      content,
      summary
    } = req.body;

    post.title = title || post.title;
    post.category = category || post.category;

    if (category) {
      post.categoryIcon = getCategoryIcon(category);
    }

    post.imageUrl = imageUrl || post.imageUrl;

    if (secondaryImage !== undefined) {
      post.secondaryImage = secondaryImage;
    }

    post.content = content || post.content;

    if (summary !== undefined) {
      post.summary = summary;
    }

    await post.save();

    res.json(post);
  } catch (error) {
    console.error('Error editing post:', error);

    res.status(500).json({
      error: 'Failed to edit post'
    });
  }
});

// DELETE post
router.delete('/api/posts/:id', async (req, res) => {
  try {
    const accountName = await getAccountName(req);

    if (!accountName) {
      return res.status(401).json({
        error: 'Please sign in to delete a post.'
      });
    }

    const post = await Post.findOne({
      id: req.params.id
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const currentUser = await User.findOne({
      $or: [
        { username: accountName },
        { name: accountName },
        { email: accountName }
      ]
    });

    const isAdmin =
      currentUser &&
      String(currentUser.role).toLowerCase() === 'admin';

    const isOwner =
      post.author &&
      post.author.toLowerCase() === accountName.toLowerCase();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: 'You can only delete your own posts.'
      });
    }

    await Post.deleteOne({
      id: req.params.id
    });

    res.json({
      success: true,
      message: 'Post deleted'
    });
  } catch (error) {
    console.error('Error deleting post:', error);

    res.status(500).json({
      error: 'Failed to delete post'
    });
  }
});

// POST comment
router.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const accountName = (await getAccountName(req)) || 'Guest';

    const post = await Post.findOne({
      id: req.params.id
    });

    if (!post) {
      return res.status(404).json({
        error: 'Post not found'
      });
    }

    const newComment = {
      id: `c-${Date.now()}`,
      author: accountName,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      text: req.body.text
    };

    post.comments.push(newComment);

    await post.save();

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);

    res.status(500).json({
      error: 'Failed to add comment'
    });
  }
});

module.exports = router;