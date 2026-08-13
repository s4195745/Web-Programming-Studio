document.addEventListener('DOMContentLoaded', () => {
  // Elements - Blog Feed (blog.html)
  const postFeed = document.getElementById('postFeed');
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const searchTypeSelect = document.querySelector('.search-type-select');
  const categorySelect = document.querySelector('.category-select');

  // Elements - Manage Page (UserBlog.html)
  const postForm = document.querySelector('.post-form');
  const postIdInput = document.getElementById('post-id');
  const titleInput = document.getElementById('post-title');
  const categoryInput = document.getElementById('post-category');
  const imageInput = document.getElementById('post-image');
  const contentInput = document.getElementById('post-content');
  const cancelBtn = document.querySelector('.cancel-btn');
  const formTitle = document.getElementById('form-title');
  const userPostsList = document.querySelector('.user-posts-list');

  // 1. Fetch & Render Feed (blog.html)
  if (postFeed) {
    const fetchAndRenderFeed = () => {
      const query = searchInput ? searchInput.value.trim() : '';
      const searchType = searchTypeSelect ? searchTypeSelect.value : 'title';
      const category = categorySelect ? categorySelect.value : '';

      const params = new URLSearchParams({ query, searchType, category });

      fetch(`/api/posts?${params.toString()}`)
        .then(res => res.json())
        .then(posts => {
          postFeed.innerHTML = posts.map(post => `
            <article class="blog-card">
              <div class="card-image-wrapper">
                <img src="${post.imageUrl}" alt="${post.title}" class="card-image" />
              </div>
              <div class="category">
                <span class="icon">${post.categoryIcon}</span>
                <span class="category-name">${post.category}</span>
              </div>
              <h2 class="card-title">${post.title}</h2>
              <p class="card-description">${post.summary}</p>
              <div class="card-meta">${post.dateAdded} • By ${post.author}</div>
              <a href="postDetail.html?id=${post.id}" class="read-link">Read More</a>
            </article>
          `).join('');
        })
        .catch(err => console.error('Error loading posts:', err));
    };

    fetchAndRenderFeed();
    if (searchBtn) searchBtn.addEventListener('click', fetchAndRenderFeed);
    if (categorySelect) categorySelect.addEventListener('change', fetchAndRenderFeed);
  }

  // 2. Manage Posts Functions (UserBlog.html)
  if (postForm) {
    const loadUserPosts = () => {
      fetch('/api/posts')
        .then(res => res.json())
        .then(posts => {
          if (!userPostsList) return;
          userPostsList.innerHTML = posts.map(post => `
            <div class="user-post-item" data-id="${post.id}">
              <a href="postDetail.html?id=${post.id}" class="post-item-link">
                <div class="user-post-thumb">
                  <img src="${post.imageUrl}" alt="${post.title}" />
                </div>
                <div class="user-post-info">
                  <span class="category"><span class="icon">${post.categoryIcon}</span> ${post.category}</span>
                  <h3>${post.title}</h3>
                  <p class="card-meta">${post.dateAdded} • By ${post.author}</p>
                </div>
              </a>
              <div class="menu-dropdown">
                <button type="button" class="three-dots-btn">⋮</button>
                <div class="dropdown-menu">
                  <button type="button" class="dropdown-item edit-btn" onclick="triggerEdit('${post.id}')">Edit</button>
                  <button type="button" class="dropdown-item delete-btn" onclick="triggerDelete('${post.id}')">Delete</button>
                </div>
              </div>
            </div>
          `).join('');
        });
    };

    postForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = postIdInput.value;
      const payload = {
        title: titleInput.value,
        category: categoryInput.value,
        imageUrl: imageInput.value,
        content: contentInput.value
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
      });
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', resetForm);
    }

    function resetForm() {
      postIdInput.value = '';
      titleInput.value = '';
      imageInput.value = '';
      contentInput.value = '';
      if (formTitle) formTitle.textContent = 'Create a New Post';
      if (cancelBtn) cancelBtn.style.display = 'none';
    }

    window.triggerEdit = function(id) {
      fetch(`/api/posts/${id}`)
        .then(res => res.json())
        .then(post => {
          postIdInput.value = post.id;
          titleInput.value = post.title;
          categoryInput.value = post.category;
          imageInput.value = post.imageUrl;
          contentInput.value = post.content;
          if (formTitle) formTitle.textContent = 'Edit Post';
          if (cancelBtn) cancelBtn.style.display = 'inline-block';
        });
    };

    window.triggerDelete = function(id) {
      if (confirm('Are you sure you want to delete this blog post?')) {
        fetch(`/api/posts/${id}`, { method: 'DELETE' })
          .then(() => loadUserPosts());
      }
    };

    loadUserPosts();
  }
});