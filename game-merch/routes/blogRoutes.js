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

// Api?
router.get('/api/posts', (req, res) => { /* load & return posts */ });
router.post('/api/posts', (req, res) => { /* create post */ });
router.put('/api/posts/:id', (req, res) => { /* update post */ });
router.delete('/api/posts/:id', (req, res) => { /* delete post */ });
router.post('/api/posts/:id/comments', (req, res) => { /* add comment */ });

module.exports = router;