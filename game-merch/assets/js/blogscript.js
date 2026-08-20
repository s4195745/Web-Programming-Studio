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
  const secondaryImageInput = document.getElementById('post-secondary-image');
  const summaryInput = document.getElementById('post-summary');
  const contentInput = document.getElementById('post-content');
  const cancelBtn = document.querySelector('.cancel-btn');
  const formTitle = document.getElementById('form-title');
  const submitBtn = postForm ? postForm.querySelector('.submit-btn') : null;
  const userPostsList = document.querySelector('.user-posts-list');

  // HTML templates from the page
  const blogCardTemplate = document.getElementById('blog-card-template');
  const commentTemplate = document.getElementById('comment-template');
  const userPostTemplate = document.getElementById('user-post-template');

  // Track existing image during editing
  let existingImageUrl = '';
  let existingSecondaryImageUrl = '';

  // Allows adminDeletePost() and form handlers to refresh the feed
  let fetchAndRenderFeed = null;

  // Read auth tokens/session data
  const currentUsername = sessionStorage.getItem("username");
  const currentEmail = sessionStorage.getItem("userEmail");
  const currentToken = sessionStorage.getItem("token");

  function getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    if (currentEmail) {
      headers['x-user-email'] = currentEmail;
    }

    return headers;
  }

  let CURRENT_USER =
    currentUsername ||
    currentEmail ||
    window.currentUserAccount ||
    window.currentUser ||
    '';

  let CURRENT_USER_ROLE = String(
    window.currentUserRole ||
    sessionStorage.getItem('userRole') ||
    ''
  ).trim().toLowerCase();

  let IS_ADMIN = CURRENT_USER_ROLE === 'admin';

  // if no acconut, default to guest
  if (!CURRENT_USER) {
    try {
      const res = await fetch('/api/current-user', {
        headers: getAuthHeaders()
      });

      const data = await res.json();

      CURRENT_USER =
        data.accountName !== 'Guest'
          ? data.accountName
          : '';

      if (data.role) {
        CURRENT_USER_ROLE = String(data.role).trim().toLowerCase();
        IS_ADMIN = CURRENT_USER_ROLE === 'admin';
      }

    } catch (e) {
      console.error('Failed to get current user:', e);
    }
  }

  // image reader
  const getImageInputValue = (inputElem, fallbackUrl = '') => {
    if (
      inputElem &&
      inputElem.value &&
      inputElem.value.trim()
    ) {
      return inputElem.value.trim();
    }

    return fallbackUrl;
  };

  // render comments
  function renderCommentsHtml(comments) {
    if (
      !comments ||
      !Array.isArray(comments) ||
      comments.length === 0
    ) {
      return '<p>No comments.</p>';
    }

    if (!commentTemplate) {
      return '<p>No comments.</p>';
    }

    const fragment = document.createDocumentFragment();
    comments.forEach(comment => {
    const clone = commentTemplate.content.cloneNode(true);
    const item = clone.querySelector('.comment-item');
    const author = clone.querySelector('.comment-author');
    const date = clone.querySelector('.comment-date');
    const text = clone.querySelector('.comment-text');
      if (author) {
        author.textContent = comment.author || 'Guest';
      }

      if (date) {
        date.textContent = comment.date || '';
      }

      if (text) {
        text.textContent = comment.text || '';
      }

      fragment.appendChild(clone);
    });

    const wrapper = document.createElement('div');
    wrapper.appendChild(fragment);
    return wrapper.innerHTML;
  }

  // main blog feed
  if (postFeed) {
    fetchAndRenderFeed = function () {
      const query = searchInput
          ? searchInput.value.trim()
          : '';

      const searchType = searchTypeSelect
          ? searchTypeSelect.value
          : 'title';

      const category = categorySelect
          ? categorySelect.value
          : '';

      const params = new URLSearchParams({
        query,
        searchType,
        category
      });

      fetch(`/api/posts?${params.toString()}`)
        .then(res => {

          if (!res.ok) {
            throw new Error('Failed to fetch posts');
          }

          return res.json();
        })
        .then(posts => {

          postFeed.innerHTML = '';

          if (
            !Array.isArray(posts) ||
            posts.length === 0
          ) {

            postFeed.innerHTML =
              '<p class="no-posts">No blog posts found.</p>';

            return;
          }

          posts.forEach(post => {
            if (!blogCardTemplate) {
              console.error(
                'blog-card-template was not found.'
              );
              return;
            }

            const clone = blogCardTemplate.content.cloneNode(true);
            const card = clone.querySelector('.blog-card');
            const image = clone.querySelector('.card-image');
            const categoryIcon = clone.querySelector('.category .icon');
            const categoryName = clone.querySelector('.category-name');
            const title = clone.querySelector('.card-title');
            const description = clone.querySelector('.card-description');
            const meta = clone.querySelector('.card-meta');
            const detail = clone.querySelector('.detailed-content');
            const secondaryImage = clone.querySelector('.secondary-article-image');
            const articleContent = clone.querySelector('.article-content');
            const commentInput = clone.querySelector('.comment-input');
            const commentList = clone.querySelector('.comment-list');
            const readButton = clone.querySelector('.read-link');
            const adminDeleteButton = clone.querySelector('.admin-delete-post-btn');

            // blog card data
            if (card) {
              card.id = `card-${post.id}`;
            }

            if (image) {
              image.src =
                post.imageUrl ||
                'https://via.placeholder.com/600x338?text=No+Image';

              image.alt = post.title || 'Blog post';
              image.onerror = function () {
                this.src = 'https://via.placeholder.com/600x338?text=No+Image';
              };
            }

            if (categoryIcon) {
              categoryIcon.textContent =
                post.categoryIcon || '📝';
            }

            if (categoryName) {
              categoryName.textContent =
                post.category || '';
            }

            if (title) {
              title.textContent =
                post.title || '';
            }

            if (description) {
              description.textContent =
                post.summary || '';
            }

            if (meta) {
              meta.textContent =
                `${post.dateAdded || ''} • By ${post.author || 'Unknown'}`;
            }

           // read more content
            if (detail) {
              detail.id = `detail-${post.id}`;
              detail.style.display = 'none';
            }

            if (secondaryImage) {
              if (post.secondaryImage) {
                secondaryImage.src = post.secondaryImage;
                secondaryImage.alt = 'Secondary Illustration';
                secondaryImage.style.display = 'block';

              } else {
                secondaryImage.style.display = 'none';
              }
            }
            if (articleContent) {
              articleContent.innerHTML =
                post.content
                  ? post.content.replace(/\n/g, '<br>')
                  : '';
            }

            //comments
            if (commentInput) {

              commentInput.id = `commentInput-${post.id}`;
              commentInput.placeholder = CURRENT_USER
                  ? `Write a comment as ${CURRENT_USER}...`
                  : 'Write a comment as Guest...';
            }

            if (commentList) {
              commentList.id =
                `commentList-${post.id}`;
              commentList.innerHTML =
                renderCommentsHtml(post.comments);
            }


            // Read More button
            if (readButton) {
              readButton.textContent = 'Read More';
              readButton.addEventListener('click',
                () => {

                  if (!detail || !card) {
                    return;
                  }

                  const isHidden = detail.style.display === 'none';

                  if (isHidden) {
                    detail.style.display = 'block';
                    card.classList.add('expanded');
                    readButton.textContent ='Show Less';

                  } else {
                    detail.style.display ='none';
                    card.classList.remove('expanded');
                    readButton.textContent ='Read More';
                  }
                }
              );
            }

            // ---------------------------------------------
            // Comment form
            // ---------------------------------------------

            const commentForm =
              clone.querySelector('.comment-form');

            if (commentForm) {
              commentForm.addEventListener('submit',
                event => {

                  event.preventDefault();
                  submitComment(
                    event,
                    post.id
                  );
                }
              );
            }

 // Submit Comment
  async function submitComment(event, postId) {

    event.preventDefault();

    const input =
      document.getElementById(
        `commentInput-${postId}`
      );

    const text =
      input
        ? input.value.trim()
        : '';

    if (!text) {
      return;
    }

    try {

      const response =
        await fetch(
          `/api/posts/${postId}/comments`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              text
            })
          }
        );

      if (!response.ok) {
        throw new Error(
          'Failed to post comment'
        );
      }

      const postResponse =
        await fetch(
          `/api/posts/${postId}`
        );

      const post =
        await postResponse.json();

      const listElem =
        document.getElementById(
          `commentList-${postId}`
        );

      if (listElem) {

        listElem.innerHTML =
          renderCommentsHtml(
            post.comments
          );
      }

      if (input) {
        input.value = '';
      }

    } catch (err) {

      console.error(
        'Error posting comment:',
        err
      );
    }
  }         
            // admin's gun
            if (adminDeleteButton) {
              if (IS_ADMIN) {
                adminDeleteButton.style.display = 'inline-block';
                adminDeleteButton.addEventListener('click',
                  event => {

                    adminDeletePost(
                      post.id,
                      event
                    );
                  }
                );

              } else {

                adminDeleteButton.style.display = 'none';
              }
            }

            postFeed.appendChild(clone);
          });
        })
        .catch(err => {

          console.error('Error fetching posts:',
            err
          );

          postFeed.innerHTML ='<p class="error-msg">Failed to load posts.</p>';
        });
    };

    fetchAndRenderFeed();
    if (searchBtn) {
      searchBtn.addEventListener(
        'click',
        fetchAndRenderFeed
      );
    }

    if (categorySelect) {
      categorySelect.addEventListener(
        'change',
        fetchAndRenderFeed
      );
    }

    if (searchInput) {
      searchInput.addEventListener(
        'keyup',
        event => {

          if (event.key === 'Enter') {
            fetchAndRenderFeed();
          }
        }
      );
    }
  }

  // ---------------------------------------------------------
  // UserBlog Posts
  // ---------------------------------------------------------

  const loadUserPosts = () => {

    if (!userPostsList) {
      return;
    }

    if (!CURRENT_USER) {

      userPostsList.innerHTML =
        '<p class="no-posts">Please log in to view and manage your posts.</p>';

      return;
    }

    fetch(
      `/api/posts?userOnly=true`,
      {
        headers: getAuthHeaders()
      }
    )
      .then(res => res.json())
      .then(userOnlyPosts => {

        userPostsList.innerHTML = '';

        if (
          !Array.isArray(userOnlyPosts) ||
          userOnlyPosts.length === 0
        ) {

          userPostsList.innerHTML =
            `<p class="no-posts">No posts found for ${CURRENT_USER}.</p>`;

          return;
        }

        userOnlyPosts.forEach(post => {

          if (!userPostTemplate) {
            console.error(
              'user-post-template was not found.'
            );
            return;
          }

          const clone =
            userPostTemplate.content.cloneNode(true);

          const item =
            clone.querySelector('.user-post-item');

          const thumb =
            clone.querySelector('.user-post-thumb img');

          const categoryIcon =
            clone.querySelector('.category .icon');

          const categoryText =
            clone.querySelector('.category-text');

          const postTitle =
            clone.querySelector('.user-post-info h3');

          const meta =
            clone.querySelector('.card-meta');

          const dotsButton =
            clone.querySelector('.three-dots-btn');

          const dropdown =
            clone.querySelector('.dropdown-menu');

          const editButton =
            clone.querySelector('.edit-btn');

          const deleteButton =
            clone.querySelector('.delete-btn');

          if (item) {
            item.dataset.id = post.id;
          }

          if (thumb) {

            thumb.src =
              post.imageUrl ||
              'https://via.placeholder.com/150';

            thumb.alt =
              post.title || '';

            thumb.onerror =
              function () {
                this.src =
                  'https://via.placeholder.com/150';
              };
          }

          if (categoryIcon) {
            categoryIcon.textContent =
              post.categoryIcon || '📝';
          }

          if (categoryText) {
            categoryText.textContent =
              post.category || '';
          }

          if (postTitle) {
            postTitle.textContent =
              post.title || '';
          }

          if (meta) {
            meta.textContent =
              `${post.dateAdded || ''} • By ${post.author || ''}`;
          }

          if (dotsButton) {

            dotsButton.addEventListener(
              'click',
              event => {

                toggleDropdown(
                  event,
                  post.id
                );
              }
            );
          }

          if (dropdown) {
            dropdown.id =
              `dropdown-${post.id}`;
          }

          if (editButton) {

            editButton.addEventListener(
              'click',
              () => {
                triggerEdit(post.id);
              }
            );
          }

          if (deleteButton) {

            deleteButton.addEventListener(
              'click',
              () => {
                triggerDelete(post.id);
              }
            );
          }

          userPostsList.appendChild(clone);
        });

      })
      .catch(err => {

        console.error(
          'Error loading posts list:',
          err
        );
      });
  };

  // ---------------------------------------------------------
  // Form Handlers
  // ---------------------------------------------------------

  if (postForm) {

    postForm.addEventListener(
      'submit',
      event => {

        event.preventDefault();

        if (!CURRENT_USER) {

          alert(
            'Please sign in to publish a post.'
          );

          return;
        }

        const id =
          postIdInput.value;

        const contentVal =
          contentInput.value.trim();

        let summaryVal =
          summaryInput
            ? summaryInput.value.trim()
            : '';

        if (!summaryVal) {

          const firstSentenceMatch =
            contentVal.match(
              /^[^.!?]*[.!?]/
            );

          summaryVal =
            firstSentenceMatch
              ? firstSentenceMatch[0].trim()
              : (
                contentVal.length > 50
                  ? contentVal.substring(0, 50) + '...'
                  : contentVal
              );
        }

        const finalImageUrl =
          getImageInputValue(
            imageInput,
            existingImageUrl
          );

        const finalSecondaryImageUrl =
          getImageInputValue(
            secondaryImageInput,
            existingSecondaryImageUrl
          );

        const payload = {
          title: titleInput.value.trim(),
          category: categoryInput.value,
          imageUrl: finalImageUrl,
          secondaryImage: finalSecondaryImageUrl,
          summary: summaryVal,
          content: contentVal
        };

        fetch(
          id
            ? `/api/posts/${id}`
            : '/api/posts',
          {
            method: id
              ? 'PUT'
              : 'POST',

            headers:
              getAuthHeaders(),

            body:
              JSON.stringify(payload)
          }
        )
          .then(res => {

            if (!res.ok) {

              return res
                .json()
                .then(err =>
                  Promise.reject(err)
                );
            }

            return res.json();
          })
          .then(() => {

            resetForm();

            loadUserPosts();

            if (postFeed && fetchAndRenderFeed) {
              fetchAndRenderFeed();
            }
          })
          .catch(err => {

            alert(
              err.error ||
              'Error saving post'
            );
          });
      }
    );

    if (cancelBtn) {
      cancelBtn.addEventListener(
        'click',
        resetForm
      );
    }

    function resetForm() {

      postIdInput.value = '';
      titleInput.value = '';

      if (imageInput) {
        imageInput.value = '';
      }

      if (secondaryImageInput) {
        secondaryImageInput.value = '';
      }

      contentInput.value = '';

      existingImageUrl = '';
      existingSecondaryImageUrl = '';

      if (summaryInput) {
        summaryInput.value = '';
      }

      if (formTitle) {
        formTitle.textContent =
          'Create a New Post';
      }

      if (submitBtn) {
        submitBtn.textContent =
          'Publish Post';
      }

      if (cancelBtn) {
        cancelBtn.style.display =
          'none';
      }
    }

    loadUserPosts();
  }

  // ---------------------------------------------------------
  // UserBlog Dropdown
  // ---------------------------------------------------------

  function toggleDropdown(event, id) {

    event.stopPropagation();

    const currentDropdown =
      document.getElementById(
        `dropdown-${id}`
      );

    document
      .querySelectorAll('.dropdown-menu')
      .forEach(menu => {

        if (menu !== currentDropdown) {
          menu.style.display = 'none';
        }

      });

    if (currentDropdown) {

      currentDropdown.style.display =
        (
          currentDropdown.style.display === 'none' ||
          !currentDropdown.style.display
        )
          ? 'block'
          : 'none';
    }
  }

  window.toggleDropdown =
    toggleDropdown;

  document.addEventListener(
    'click',
    () => {

      document
        .querySelectorAll('.dropdown-menu')
        .forEach(menu => {
          menu.style.display = 'none';
        });

    }
  );

  // ---------------------------------------------------------
  // Edit
  // ---------------------------------------------------------

  async function triggerEdit(id) {

    try {

      const res =
        await fetch(
          `/api/posts/${id}`
        );

      if (!res.ok) {
        throw new Error(
          'Post not found'
        );
      }

      const post =
        await res.json();

      postIdInput.value =
        post.id;

      titleInput.value =
        post.title;

      categoryInput.value =
        post.category;

      contentInput.value =
        post.content;

      existingImageUrl =
        post.imageUrl || '';

      existingSecondaryImageUrl =
        post.secondaryImage || '';

      if (imageInput) {
        imageInput.value =
          post.imageUrl || '';
      }

      if (secondaryImageInput) {
        secondaryImageInput.value =
          post.secondaryImage || '';
      }

      if (summaryInput) {
        summaryInput.value =
          post.summary || '';
      }

      if (formTitle) {
        formTitle.textContent =
          'Edit Post';
      }

      if (submitBtn) {
        submitBtn.textContent =
          'Save Changes';
      }

      if (cancelBtn) {
        cancelBtn.style.display =
          'inline-block';
      }

      if (postForm) {

        window.scrollTo({
          top:
            postForm.offsetTop - 100,
          behavior:
            'smooth'
        });
      }

    } catch (err) {

      console.error(
        'Error loading post for edit:',
        err
      );
    }
  }

  window.triggerEdit =
    triggerEdit;

  // ---------------------------------------------------------
  // User's own delete
  // ---------------------------------------------------------

  async function triggerDelete(id) {

    if (!confirm('Confirm deletion?')) {
      return;
    }

    try {

      const res =
        await fetch(
          `/api/posts/${id}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders()
          }
        );

      if (!res.ok) {

        const err =
          await res.json();

        throw err;
      }

      loadUserPosts();

      if (postFeed && fetchAndRenderFeed) {
        fetchAndRenderFeed();
      }

    } catch (err) {

      alert(
        err.error ||
        'Error.'
      );
    }
  }

  window.triggerDelete =
    triggerDelete;

  // ---------------------------------------------------------
  // ADMIN ONLY DELETE FROM MAIN FEED
  // ---------------------------------------------------------

  async function adminDeletePost(id, event) {

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Frontend protection
    if (!IS_ADMIN) {

      alert(
        'You do not have permission to delete blog posts.'
      );

      return;
    }

    if (
      !confirm(
        'Delete this blog post from the main feed?\n\nThis cannot be undone.'
      )
    ) {
      return;
    }

    try {

      const res =
        await fetch(
          `/api/posts/${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders()
          }
        );

      if (!res.ok) {

        const err =
          await res.json();

        throw err;
      }

      // Refresh main feed
      if (postFeed && fetchAndRenderFeed) {
        fetchAndRenderFeed();
      }

      // Refresh UserBlog
      loadUserPosts();

    } catch (err) {

      console.error(
        'Admin deletion error:',
        err
      );

      alert(
        err.error ||
        'Error deleting blog post.'
      );
    }
  }

  window.adminDeletePost =
    adminDeletePost;
});