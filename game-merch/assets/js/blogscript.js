document.addEventListener('DOMContentLoaded', async () => {

  const postFeed = document.getElementById('postFeed');
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');
  const searchTypeSelect = document.querySelector('.search-type-select');
  const categorySelect = document.querySelector('.category-select');

  const postForm = document.querySelector('.post-form');
  const postIdInput = document.getElementById('post-id');
  const titleInput = document.getElementById('post-title');
  const categoryInput = document.getElementById('post-category');
  const imageInput = document.getElementById('post-image');
  const summaryInput = document.getElementById('post-summary');
  const contentInput = document.getElementById('post-content');
  const cancelBtn = document.querySelector('.cancel-btn');
  const formTitle = document.getElementById('form-title');
  const submitBtn = postForm ? postForm.querySelector('.submit-btn') : null;
  const userPostsList = document.querySelector('.user-posts-list');

  // Track existing image during editing
  let existingImageUrl = '';

  // Read auth tokens/session data from sessionStorage set by auth-validation.js
  const currentUsername = sessionStorage.getItem("username");
  const currentEmail = sessionStorage.getItem("userEmail");
  const currentToken = sessionStorage.getItem("token");

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    if (currentEmail) headers['x-user-email'] = currentEmail;
    return headers;
  }

  let CURRENT_USER = currentUsername || currentEmail || window.currentUserAccount || '';

  // If CURRENT_USER is empty, query the server using auth headers
  if (!CURRENT_USER) {
    try {
      const res = await fetch('/api/current-user', { headers: getAuthHeaders() });
      const data = await res.json();
      CURRENT_USER = data.accountName !== 'Guest' ? data.accountName : '';
    } catch (e) {
      console.error('Failed to get name:', e);
    }
  }

// --- Helper: Read Image Input (Supports Files, Base64 Data URLs, & Web Links) ---
  const processImageInput = (inputElem, fallbackUrl = '') => {
    return new Promise((resolve) => {
      if (!inputElem) return resolve(fallbackUrl);

      // 1. Handle File Upload (<input type="file">)
      if (inputElem.type === 'file' && inputElem.files && inputElem.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result); // Resolves as Base64 Data URL
        reader.onerror = () => resolve(fallbackUrl);
        reader.readAsDataURL(inputElem.files[0]);
      } 
      // 2. Handle Image URL Link (<input type="url"> or <input type="text">)
      else if (inputElem.value && inputElem.value.trim()) {
        resolve(inputElem.value.trim());
      } 
      // 3. Fallback to existing image or empty string
      else {
        resolve(fallbackUrl);
      }
    });
  };

  // --- Main Feed ---
  if (postFeed) {
    const fetchAndRenderFeed = () => {
      const query = searchInput ? searchInput.value.trim() : '';
      const searchType = searchTypeSelect ? searchTypeSelect.value : 'title';
      const category = categorySelect ? categorySelect.value : '';

      const params = new URLSearchParams({ query, searchType, category });

      fetch(`/api/posts?${params.toString()}`)
        .then(res => res.json())
        .then(posts => {
          if (!Array.isArray(posts) || posts.length === 0) {
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
              
              <div class="detailed-content" id="detail-${post.id}" style="display: none; margin-top: 15px;">
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #ccc;" />
                <div class="article-body">
                  <p>${post.content ? post.content.replace(/\n/g, '<br>') : ''}</p>
                </div>
                ${post.secondaryImage ? `<img src="${post.secondaryImage}" alt="Secondary Illustration" class="article-image" style="margin-top:15px; max-width:100%;" />` : ''}
                
                <section class="comments-section" style="margin-top:20px;">
                  <h3>Comments</h3>
                  <form class="comment-form" onsubmit="submitComment(event, '${post.id}')">
                    <textarea id="commentInput-${post.id}" placeholder="${CURRENT_USER ? 'Write a comment as ' + CURRENT_USER + '...' : 'Write a comment as Guest...'}" rows="3" class="comment-input" required></textarea>
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

  function renderCommentsHtml(comments) {
    if (!comments || comments.length === 0) return '<p>No comments.</p>';
    return comments.map(c => `
      <div class="comment-item">
        <span class="comment-author">${c.author}</span>
        <span class="comment-date">${c.date}</span>
        <p class="comment-text">${c.text}</p>
      </div>
    `).join('');
  }

// --- Global Window Bindings for Inline HTML Handlers ---

  window.togglePostDetail = function(id) {
    const detailElem = document.getElementById(`detail-${id}`);
    const cardElem = document.getElementById(`card-${id}`);
    const btn = cardElem ? cardElem.querySelector('.read-link') : null;

    if (detailElem && cardElem) {
      if (detailElem.style.display === 'none') {
        // Expand card details and container
        detailElem.style.display = 'block';
        cardElem.classList.add('expanded');
        if (btn) btn.textContent = 'Show Less';
      } else {
        // Collapse card details and container
        detailElem.style.display = 'none';
        cardElem.classList.remove('expanded');
        if (btn) btn.textContent = 'Read More';
      }
    }
  };

  window.submitComment = function(e, postId) {
    e.preventDefault();
    const input = document.getElementById(`commentInput-${postId}`);
    const text = input ? input.value.trim() : '';

    if (!text) return;

    fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
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

  const loadUserPosts = () => {
    if (!userPostsList) return;

    if (!CURRENT_USER) {
      userPostsList.innerHTML = '<p class="no-posts">Please log in to view and manage your posts.</p>';
      return;
    }

    fetch(`/api/posts?userOnly=true`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(userOnlyPosts => {
        if (!Array.isArray(userOnlyPosts) || userOnlyPosts.length === 0) {
          userPostsList.innerHTML = `<p class="no-posts">No posts found for ${CURRENT_USER}.</p>`;
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

  // --- Form Handlers ---
  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!CURRENT_USER) {
        alert("Please sign in to publish a post.");
        return;
      }

      const id = postIdInput.value;
      const contentVal = contentInput.value.trim();
      let summaryVal = summaryInput ? summaryInput.value.trim() : '';

      if (!summaryVal) {
        const firstSentenceMatch = contentVal.match(/^[^.!?]*[.!?]/);
        summaryVal = firstSentenceMatch ? firstSentenceMatch[0].trim() : (contentVal.length > 50 ? contentVal.substring(0, 50) + '...' : contentVal);
      }

      // Convert selected file to Base64
      const finalImageUrl = await processImageInput(imageInput, existingImageUrl);

      const payload = {
        title: titleInput.value.trim(),
        category: categoryInput.value,
        imageUrl: finalImageUrl,
        summary: summaryVal,
        content: contentVal
      };

      fetch(id ? `/api/posts/${id}` : '/api/posts', {
        method: id ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) return res.json().then(err => Promise.reject(err));
        return res.json();
      })
      .then(() => {
        resetForm();
        loadUserPosts();
        if (postFeed) fetchAndRenderFeed();
      })
      .catch(err => alert(err.error || 'Error saving post'));
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetForm);

    function resetForm() {
      postIdInput.value = '';
      titleInput.value = '';
      if (imageInput) imageInput.value = '';
      contentInput.value = '';
      existingImageUrl = '';
      if (summaryInput) summaryInput.value = '';
      if (formTitle) formTitle.textContent = 'Create a New Post';
      if (submitBtn) submitBtn.textContent = 'Publish Post';
      if (cancelBtn) cancelBtn.style.display = 'none';
    }

    loadUserPosts();
  }

  window.toggleDropdown = function(e, id) {
    e.stopPropagation();
    const currentDropdown = document.getElementById(`dropdown-${id}`);
    
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== currentDropdown) menu.style.display = 'none';
    });

    if (currentDropdown) {
      currentDropdown.style.display = (currentDropdown.style.display === 'none' || !currentDropdown.style.display) ? 'block' : 'none';
    }
  };

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.style.display = 'none');
  });

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
        contentInput.value = post.content;
        existingImageUrl = post.imageUrl || '';
        
        // Reset file input value
        if (imageInput && imageInput.type === 'file') {
          imageInput.value = '';
        } else if (imageInput) {
          imageInput.value = post.imageUrl || '';
        }

        if (summaryInput) summaryInput.value = post.summary || '';
        
        if (formTitle) formTitle.textContent = 'Edit Post';
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        window.scrollTo({ top: postForm.offsetTop - 100, behavior: 'smooth' });
      })
      .catch(err => console.error('Error loading post for edit:', err));
  };

  window.triggerDelete = function(id) {
    if (confirm('Confirm deletion?')) {
      fetch(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      .then(res => {
        if (!res.ok) return res.json().then(err => Promise.reject(err));
        return res.json();
      })
      .then(() => {
        loadUserPosts();
        if (postFeed) fetchAndRenderFeed();
      })
      .catch(err => alert(err.error || 'Error.'));
    }
  };
});

