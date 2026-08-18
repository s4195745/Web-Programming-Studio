//not sure if this is eneded tbh

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '../data/posts.json');

// routes
router.get('/', (req, res) => {
  res.render('modules/blog/blog');
});

router.get('/UserBlog', (req, res) => {
  res.render('modules/blog/UserBlog');
});

// Api
router.get('/api/posts', (req, res) => { /* load & return posts */ });
router.post('/api/posts', (req, res) => { /* create post */ });
router.put('/api/posts/:id', (req, res) => { /* update post */ });
router.delete('/api/posts/:id', (req, res) => { /* delete post */ });
router.post('/api/posts/:id/comments', (req, res) => { /* add comment */ });

const { users } = require('./mockDB'); // Ensure path correctly points to mockDB.js

function getAccountName(req) {
  // 1. Check session / req.user
  if (req.user) return req.user.username || req.user.name || req.user.email;
  if (req.session && req.session.user) return req.session.user.username || req.session.user.email;

  // 2. Check Authorization Header token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const foundUser = users.find(u => u.token === token);
    if (foundUser) return foundUser.username || foundUser.email;
  }

  // 3. Fallback check for custom user email/username headers
  const headerEmail = req.headers['x-user-email'];
  if (headerEmail) {
    const foundUser = users.find(u => u.email === headerEmail);
    if (foundUser) return foundUser.username || foundUser.email;
  }

  return null;
}

module.exports = router;