document.addEventListener('DOMContentLoaded', () => {

  const postFeed = document.getElementById('postFeed');
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const searchTypeSelect = document.querySelector('.search-type-select');
  const categorySelect = document.querySelector('.category-select');

  // forms for user blog
  const postForm = document.querySelector('.post-form');
  const postIdInput = document.getElementById('post-id');
  const titleInput = document.getElementById('post-title');
  const categoryInput = document.getElementById('post-category');
  const imageInput = document.getElementById('post-image');
  const contentInput = document.getElementById('post-content');
  const cancelBtn = document.querySelector('.cancel-btn');
  const formTitle = document.getElementById('form-title');
  const submitBtn = postForm ? postForm.querySelector('.submit-btn') : null;
  const userPostsList = document.querySelector('.user-posts-list');

  // currently logged 
  const CURRENT_USER = 'You';

  // blog.html - main feed
  if (postFeed) {
    const fetchAndRenderFeed = () => {
      const query = searchInput ? searchInput.value.trim() : '';
      const searchType = searchTypeSelect ? searchTypeSelect.value : 'title';
      const category = categorySelect ? categorySelect.value : '';

      const params = new URLSearchParams({ query, searchType, category });

      fetch(`/api/posts?${params.toString()}`)
        .then(res => res.json())
        .then(posts => {
          if (posts.length === 0) {
            postFeed.innerHTML = '<p class="no-posts">No blog posts found.</p>';
            return;
          }

          postFeed.innerHTML = posts.map(post => `
            <article class="blog-card" id="card-${post.id}">
              <div class="card-image-wrapper">
                <img src="${post.imageUrl}" alt="${post.title}" class="card-image" onerror="this.src='https://via.placeholder.com/600x338?text=No+Image'" />
              </div>
              <div class="category">
                <span class="icon">${post.categoryIcon || '📝'}</span>
                <span class="category-name">${post.category}</span>
              </div>
              <h2 class="card-title">${post.title}</h2>
              <p class="card-description">${post.summary}</p>
              <div class="card-meta">${post.dateAdded} • By ${post.author}</div>
              
              <!-- Inline Detailed Content Area -->
              <div class="detailed-content" id="detail-${post.id}" style="display: none; margin-top: 15px;">
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;" />
                <div class="article-body">
                  <p>${post.content ? post.content.replace(/\n/g, '<br>') : ''}</p>
                </div>
                ${post.secondaryImage ? `<img src="${post.secondaryImage}" alt="Secondary Illustration" class="article-image" style="margin-top:15px; max-width:100%;" />` : ''}
                
                <section class="comments-section" style="margin-top:20px;">
                  <h3>Comments</h3>
                  <form class="comment-form" onsubmit="submitComment(event, '${post.id}')">
                    <textarea id="commentInput-${post.id}" placeholder="Write a comment..." rows="3" class="comment-input" required></textarea>
                    <button type="submit" class="submit-btn">Post Comment</button>
                  </form>
                  <div class="comment-list" id="commentList-${post.id}">
                    ${renderCommentsHtml(post.comments)}
                  </div>
                </section>
              </div>

              <button type="button" class="read-link" onclick="togglePostDetail('${post.id}')" style="background:none; border:none; cursor:pointer; padding:0; text-decoration:underline;">
                Read More
              </button>
            </article>
          `).join('');
        })
        .catch(err => {
          console.error('Error fetching posts:', err);
          postFeed.innerHTML = '<p class="error-msg">Failed to load posts.</p>';
        });
    };

    fetchAndRenderFeed();

    if (searchBtn) searchBtn.addEventListener('click', fetchAndRenderFeed);
    if (categorySelect) categorySelect.addEventListener('change', fetchAndRenderFeed);
    if (searchInput) {
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') fetchAndRenderFeed();
      });
    }
  }

  // drop down toggle
  window.togglePostDetail = function(id) {
    const detailElem = document.getElementById(`detail-${id}`);
    const cardElem = document.getElementById(`card-${id}`);
    const btn = cardElem ? cardElem.querySelector('.read-link') : null;

    if (detailElem) {
      if (detailElem.style.display === 'none') {
        detailElem.style.display = 'block';
        if (btn) btn.textContent = 'Show Less';
      } else {
        detailElem.style.display = 'none';
        if (btn) btn.textContent = 'Read More';
      }
    }
  };

  // comments render
  function renderCommentsHtml(comments) {
    if (!comments || comments.length === 0) {
      return '<p>No comments.</p>';
    }
    return comments.map(c => `
      <div class="comment-item">
        <span class="comment-author">${c.author}</span>
        <span class="comment-date">${c.date}</span>
        <p class="comment-text">${c.text}</p>
      </div>
    `).join('');
  }

  // comment submission
  window.submitComment = function(e, postId) {
    e.preventDefault();
    const input = document.getElementById(`commentInput-${postId}`);
    const text = input ? input.value.trim() : '';

    if (!text) return;

    fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: CURRENT_USER, text })
    })
    .then(res => res.json())
    .then(() => {
      fetch(`/api/posts/${postId}`)
        .then(res => res.json())
        .then(post => {
          const listElem = document.getElementById(`commentList-${postId}`);
          if (listElem) listElem.innerHTML = renderCommentsHtml(post.comments);
          if (input) input.value = '';
        });
    })
    .catch(err => console.error('Error posting comment:', err));
  };

  // User blog manager
  if (postForm) {
    const loadUserPosts = () => {
      fetch('/api/posts')
        .then(res => res.json())
        .then(posts => {
          if (!userPostsList) return;

          // filter post only from user
          const userOnlyPosts = posts.filter(post => post.author && post.author.toLowerCase() === CURRENT_USER.toLowerCase());

          if (userOnlyPosts.length === 0) {
            userPostsList.innerHTML = '<p class="no-posts">You have not created any posts yet.</p>';
            return;
          }

          userPostsList.innerHTML = userOnlyPosts.map(post => `
            <div class="user-post-item" data-id="${post.id}">
              <div class="user-post-thumb">
                <img src="${post.imageUrl}" alt="${post.title}" onerror="this.src='https://via.placeholder.com/150'" />
              </div>
              <div class="user-post-info">
                <span class="category"><span class="icon">${post.categoryIcon || '📝'}</span> ${post.category}</span>
                <h3>${post.title}</h3>
                <p class="card-meta">${post.dateAdded} • By ${post.author}</p>
              </div>
              <div class="menu-dropdown">
                <button type="button" class="three-dots-btn" onclick="toggleDropdown(event, '${post.id}')" aria-label="Post Options">⋮</button>
                <div class="dropdown-menu" id="dropdown-${post.id}" style="display: none;">
                  <button type="button" class="dropdown-item edit-btn" onclick="triggerEdit('${post.id}')">Edit</button>
                  <button type="button" class="dropdown-item delete-btn" onclick="triggerDelete('${post.id}')">Delete</button>
                </div>
              </div>
            </div>
          `).join('');
        })
        .catch(err => console.error('Error loading posts list:', err));
    };

    //form for create/update
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = postIdInput.value;
      const payload = {
        title: titleInput.value.trim(),
        category: categoryInput.value,
        imageUrl: imageInput.value.trim(),
        content: contentInput.value.trim(),
        author: CURRENT_USER
      };

      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/posts/${id}` : '/api/posts';

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(() => {
        resetForm();
        loadUserPosts();
      })
      .catch(err => console.error('Error saving post:', err));
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetForm);

    function resetForm() {
      postIdInput.value = '';
      titleInput.value = '';
      imageInput.value = '';
      contentInput.value = '';
      if (formTitle) formTitle.textContent = 'Create a New Post';
      if (submitBtn) submitBtn.textContent = 'Publish Post';
      if (cancelBtn) cancelBtn.style.display = 'none';
    }

    // drop down menu visilibty
    window.toggleDropdown = function(e, id) {
      e.stopPropagation();
      const currentDropdown = document.getElementById(`dropdown-${id}`);
      
      // only let 1 menu open
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== currentDropdown) menu.style.display = 'none';
      });

      if (currentDropdown) {
        currentDropdown.style.display = (currentDropdown.style.display === 'none' || !currentDropdown.style.display) ? 'block' : 'none';
      }
    };

    // cloes options when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
      });
    });

    // handler for edit/delete
    window.triggerEdit = function(id) {
      fetch(`/api/posts/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Post not found');
          return res.json();
        })
        .then(post => {
          postIdInput.value = post.id;
          titleInput.value = post.title;
          categoryInput.value = post.category;
          imageInput.value = post.imageUrl;
          contentInput.value = post.content;
          if (formTitle) formTitle.textContent = 'Edit Post';
          if (submitBtn) submitBtn.textContent = 'Save Changes';
          if (cancelBtn) cancelBtn.style.display = 'inline-block';
          window.scrollTo({ top: postForm.offsetTop - 100, behavior: 'smooth' });
        })
        .catch(err => console.error('Error loading post for edit:', err));
    };

    window.triggerDelete = function(id) {
      if (confirm('Delete post? This action cannot be undone.')) {
        fetch(`/api/posts/${id}`, { method: 'DELETE' })
          .then(() => loadUserPosts())
          .catch(err => console.error('Error deleting post:', err));
      }
    };

    loadUserPosts();
  }
});