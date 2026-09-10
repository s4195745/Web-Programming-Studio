const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/blog');
const { getPostData } = require('../assets/js/BlogAttr');
const {words_limit, countWords, getCategoryIcon } = require('../assets/js/BlogAttr');

// ---------------------------- get logged in account name
async function getAccountName(req) {
  const user = req.user ||
    (req.session && req.session.user);
  if (user) {
    return ( user.username || user.name || user.email ); }

  const authHeader = req.headers.authorization;
  if (
    authHeader &&
    authHeader.startsWith('Bearer ')
  ) {

    const token = authHeader.split(' ')[1];
    const foundUser = await User.findOne({ token });
    if (foundUser) {
      return ( foundUser.username || foundUser.name || foundUser.email ); 
    }
  }

  const headerEmail = req.headers['x-user-email'];
  if (headerEmail) { const foundUser = await User.findOne({ email: headerEmail });
    if (foundUser) {
      return ( foundUser.username || foundUser.name || foundUser.email );
    }
  }

  return null;
}

// ------------------------------ GET posts
router.get( '/api/posts',
  async (req, res) => {
    try {
      let posts = await Post.find().sort({ createdAt: -1 });
      const { query, searchType,  category, userOnly } = req.query;

      // only posts from current user in UserBlog
      if (userOnly === 'true') {
        const currentAccount = await getAccountName(req);
        if (!currentAccount) { return res.json([]); 
        }

        posts = posts.filter(
            post =>
              post.author &&
              post.author.toLowerCase() ===
              currentAccount.toLowerCase()
          );
      }

      //---------------------------catergories filer
      if (category) {
        posts = posts.filter(
            post =>
              post.category &&
              post.category.toLowerCase() ===
              category.toLowerCase()
            );
      }

      // --------------------------- search 
      if (query) {
        const q = query.toLowerCase();
        posts = posts.filter(post => {
            if ( searchType === 'author' ) {
              return post.author ?.toLowerCase().includes(q); }
            if ( searchType === 'title' ) {
              return post.title ?.toLowerCase().includes(q); }
            return (
              post.title ?.toLowerCase().includes(q) ||
              post.author ?.toLowerCase().includes(q) ||
              post.category ?.toLowerCase().includes(q) ||
              post.content ?.toLowerCase().includes(q)
            );
          });
      }
      res.json(posts);

    } catch (error) { console.error( 'Error loading posts:', error );
      res.status(500).json({ error: 'Failed to load posts' });
    }
  }
);


// -------------------------- GET one post by ID for UserBlog
router.get( '/api/posts/:id',
  async (req, res) => {
    try { const post = await Post.findOne({ id: req.params.id });
      if (!post) { return res.status(404).json({ error: 'Post not found' }); }
      res.json(post);

    } catch (error) {
      console.error( 'Error loading post:', error);
      res.status(500).json({ error: 'Failed to load post' });
    }
  }
);

// -------------------------- GET current account endpoint
router.get( '/api/current-user',
  async (req, res) => {
    try { const accountName = await getAccountName(req);
      res.json({ accountName: accountName || 'Guest', isLoggedIn: !!accountName });
 
    } catch (error) {
      console.error( 'Error getting current user:', error );
      res.status(500).json({ error: 'Failed to get current user' });
    }
  }
);

// ------------------------ POST(create) post
router.post( '/api/posts',
  async (req, res) => {
    try { const accountName = await getAccountName(req);
      if (!accountName) {return res.status(401).json({ error: 'Please sign in to create a post.' }); }
      const postData = req.body || {};
      if (!postData.content) {
        return res.status(400).json({ error: 'Post content is required.' });
      }

      if ( countWords( postData.content ) > words_limit ) {
        return res.status(400).json({ error: `Post content cannot exceed ${words_limit} words.` });
      }

      const newPost = await Post.create({
          id:`post-${Date.now()}`,
          title: postData.title,
          author: accountName,
          dateAdded:  new Date()
              .toLocaleDateString('en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }),
          category:postData.category,
          categoryIcon: getCategoryIcon( postData.category),
          summary: postData.summary ||
            ( postData.content.length > 50
                ? postData.content.substring(0, 50) + '...'
                : postData.content
            ),
          content:postData.content,
          imageUrl: postData.imageUrl || 'https://via.placeholder.com/600x338',
          secondaryImage: postData.secondaryImage ||'',
          comments: [] });


      return res.status(201).json(newPost);

    } catch (error) {console.error( 'Error creating post:', error );
      return res.status(500).json({ error: 'Failed to create post'
      });
    }
  }
);

// --------------------------- PUT(edit) post
router.put( '/api/posts/:id',
  async (req, res) => {
    try {
      const accountName =await getAccountName(req);
      if (!accountName) {
        return res.status(401).json({ error: 'Please sign in to edit a post.' });
      }

      const post = await Post.findOne({ id:req.params.id });
      if (!post) { return res.status(404).json({ error: 'Post not found' });
      }

      // -------------------------------check if current user have ethe post
      if ( !post.author ||
        post.author.toLowerCase() !==
        accountName.toLowerCase()) {
        return res.status(403).json({error: 'You can only edit your own posts.'});
      }

      const postData = req.body || {};

      // ------------------ word limit check
      if ( postData.content !==
        undefined &&
        countWords( postData.content) > words_limit) {
        return res.status(400).json({ error: `Post content cannot exceed ${words_limit} words.` });
      }

      // UPDATE FIELDS
      if (postData.title !== undefined ) {
        post.title = postData.title;}
      if (postData.category !== undefined ) {
        post.category = postData.category;
        post.categoryIcon = getCategoryIcon(
            postData.category);
          }
      if ( postData.imageUrl !== undefined ) {
        post.imageUrl = postData.imageUrl;
      }
      if ( postData.secondaryImage !== undefined ) {
        post.secondaryImage = postData.secondaryImage;
      }
      if ( postData.content !== undefined ) {
        post.content = postData.content;
      }
      if ( postData.summary !== undefined
      ) { post.summary = postData.summary;}

      // -----------------------------save edits
      await post.save();
      return res.json(post);

    } catch (error) {
      console.error( 'Error editing post:', error );
      return res.status(500).json({  error: 'Failed to edit post' });
    }
  }
);

// ---------------------------- delete post
router.delete( '/api/posts/:id',
  async (req, res) => {
    try { const accountName = await getAccountName(req);
      const post = await Post.findOne({ id: req.params.id});
      if (!post) { return res.status(404).json({ error:'Post not found'});
      }
      
      await Post.deleteOne({ id: req.params.id  });
      return res.json({  message: 'Post deleted.'});

    } catch (error) { console.error( 'Error deleting post:', error);
      return res.status(500).json({ error: 'Failed.'
      });
    }
  }
);

// ------------------------------ POST comment, default to guest if no acc
router.post( '/api/posts/:id/comments',
  async (req, res) => {
    try {
      const accountName =( await getAccountName(req)) || 'Guest';
      const post = await Post.findOne({ id: req.params.id});
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const newComment = {
        id: `c-${Date.now()}`,
        author: accountName,
        date:new Date().toLocaleDateString('en-US',
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }
            ),
        text: req.body.text
      };
      post.comments.push( newComment
      );
      await post.save();

      res.status(201).json(newComment);
      
    } catch (error) {
      console.error('Error adding comment:',error);
      res.status(500).json({error: 'Failed to comment.'
      });
    }
  }
);

module.exports =
  router;