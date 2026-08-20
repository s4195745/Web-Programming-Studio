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
  const submitBtn = postForm
    ? postForm.querySelector('.submit-btn')
    : null;
  const userPostsList = document.querySelector('.user-posts-list');
  
  // main feeds
  const blogCardTemplate = document.getElementById('blog-card-template');
  const commentTemplate = document.getElementById('comment-template');

  // track images in editting/creating
  let existingImageUrl = '';
  let existingSecondaryImageUrl = '';
  let fetchAndRenderFeed = null;
 
  // auth
  const currentUsername = sessionStorage.getItem('username');
  const currentEmail = sessionStorage.getItem('userEmail');
  const currentToken = sessionStorage.getItem('token');

  function getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (currentToken) {
      headers['Authorization'] =
        `Bearer ${currentToken}`;
    }

    if (currentEmail) {
      headers['x-user-email'] =
        currentEmail;
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
  )
    .trim()
    .toLowerCase();

  let IS_ADMIN =
    CURRENT_USER_ROLE === 'admin';

 
  // gete current user else default to guest
  if (!CURRENT_USER) {
    try {
      const res = await fetch('/api/current-user',
          {
            headers: getAuthHeaders()
          }
        );

      const data = await res.json();
      CURRENT_USER = data.accountName !== 'Guest'
          ? data.accountName
          : '';

      if (data.role) {
        CURRENT_USER_ROLE = String(data.role)
            .trim()
            .toLowerCase();

        IS_ADMIN = CURRENT_USER_ROLE === 'admin';
      }

    } catch (e) {
      console.error(
        'Failed to get current user:',
        e
      );
    }
  }


  // Iimage imput helper
  const getImageInputValue =
    (inputElem, fallbackUrl = '') => {

      if (
        inputElem &&
        inputElem.value &&
        inputElem.value.trim()
      ) {

        return inputElem.value.trim();
      }

      return fallbackUrl;
    };

 
  // comment render
  function renderCommentsHtml(comments) {

    if (
      !comments ||
      !Array.isArray(comments) ||
      comments.length === 0
    ) {

      return '<p>No comments.</p>';
    }
    if (commentTemplate) {
      const fragment = document.createDocumentFragment();
      comments.forEach(comment => {
        const clone = commentTemplate.content.cloneNode(true);
        const author = clone.querySelector('.comment-author');
        const date =  clone.querySelector('.comment-date');
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

    // fall back so no comments doesnt nuke the blog
    return comments.map(comment => `
      <div class="comment-item">

        <span class="comment-author">
          ${comment.author || 'Guest'}
        </span>

        <span class="comment-date">
          ${comment.date || ''}
        </span>

        <p class="comment-text">
          ${comment.text || ''}
        </p>
      </div>
    `).join('');
  }

  // comment submission
  async function submitComment(event, postId) {
    event.preventDefault();

    const input = document.getElementById( `commentInput-${postId}`);
    const text = input
        ? input.value.trim()
        : '';

    if (!text) {return;}
    try {
      const response =await fetch(`/api/posts/${postId}/comments`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              text: text
            })
          }
        );

      if (!response.ok) {
        const errorData =await response.json()
            .catch(() => ({}));
        throw errorData;
      }

      const postResponse =await fetch(`/api/posts/${postId}`
        );

      if (!postResponse.ok) {
        throw new Error('Failed to reload post'
        );
      }

      const post = await postResponse.json();
      const listElem =document.getElementById(`commentList-${postId}`
        );

      if (listElem) {
        listElem.innerHTML =renderCommentsHtml(
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

      alert(
        err.error ||
        'Error posting comment.'
      );
    }
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


      fetch(
        `/api/posts?${params.toString()}`
      )
        .then(res => {
          if (!res.ok) {
            throw new Error(
              'Failed to fetch posts'
            );
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
                'blog template.'
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
            const readButton =clone.querySelector('.read-link');
            const adminDeleteButton =clone.querySelector('.admin-delete-post-btn');
            if (card) {card.id =`card-${post.id}`;}

            // summary iamge
            if (image) {

              image.src = post.imageUrl ||'https://via.placeholder.com/600x338?text=No+Image';
              image.alt = post.title || 'Blog post';
              image.onerror = function () { this.src = 'https://via.placeholder.com/600x338?text=No+Image';};
            }

            // catergories
            if (categoryIcon) {
              categoryIcon.textContent =
                post.categoryIcon ||
                '📝';}

            if (categoryName) {
              categoryName.textContent =
                post.category ||
                '';}

         
            // post title
            if (title) {
              title.textContent =
                post.title ||
                '';}


            // post summary
            if (description) {
              description.textContent =
                post.summary ||
                '';}

            // date and author
            if (meta) {
              meta.textContent =
                `${post.dateAdded || ''} • By ${post.author || 'Unknown'}`;
            }

            // read more content
            if (detail) {
              detail.id =`detail-${post.id}`;
              detail.style.display ='none';}


            // 2nd image
            if (secondaryImage) {
              if (post.secondaryImage) {
                secondaryImage.src = post.secondaryImage;
                secondaryImage.alt = 'Secondary Illustration';
                secondaryImage.style.display = 'block';

              } else {
                secondaryImage.style.display ='none';
              }
            }


            // content
            if (articleContent) {
              articleContent.innerHTML =
                post.content
                  ? post.content.replace(
                      /\n/g,
                      '<br>')
                  : '';
            }

            // comment input
            if (commentInput) {
              commentInput.id =
                `commentInput-${post.id}`;

              commentInput.placeholder =
                CURRENT_USER
                  ? `Write a comment as ${CURRENT_USER}...`
                  : 'Write a comment as Guest...';
            }

            // COMMENTS
            if (commentList) {
             commentList.id = `commentList-${post.id}`;
              commentList.innerHTML = renderCommentsHtml(
                  post.comments
                );
            }

            const commentForm =clone.querySelector('.comment-form');
            if (commentForm) {
              commentForm.addEventListener('submit',
                event => {

                  submitComment(
                    event,
                    post.id
                  );
                }
              );
            }

            // read more
            if (readButton) {
              readButton.textContent = 'Read More';
              readButton.addEventListener('click',
                () => {

                  if (!detail || !card) {
                    return;
                  }

                  const isHidden = detail.style.display === 'none';
                  if (isHidden) {
                    detail.style.display ='block';
                    card.classList.add('expanded');
                    readButton.textContent = 'Show Less';

                  } else {
                    detail.style.display = 'none';
                    card.classList.remove('expanded');                  
                    readButton.textContent ='Read More';
                  }
                }
              );
            }
               
            // admin only display
            if (adminDeleteButton) {
              if (IS_ADMIN) {
                adminDeleteButton.style.display =
                  'inline-block';

                adminDeleteButton.addEventListener(
                  'click',
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

          postFeed.innerHTML = '<p class="error-msg">Failed to load posts.</p>';
        });
    };

    // Initial feed load
    fetchAndRenderFeed();

    // Search
    if (searchBtn) {
      searchBtn.addEventListener(
        'click',
        fetchAndRenderFeed
      );
    }


    // Category
    if (categorySelect) {

      categorySelect.addEventListener(
        'change',
        fetchAndRenderFeed
      );
    }

    // Enter refresj
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

// user blog
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
      .then(res => {
        if (!res.ok) {
          throw new Error(
            'Failed to load user posts'
          );
        }

        return res.json();
      })

      .then(userOnlyPosts => {

        if (
          !Array.isArray(userOnlyPosts) ||
          userOnlyPosts.length === 0
        ) {

          userPostsList.innerHTML =
            `<p class="no-posts">No posts found for ${CURRENT_USER}.</p>`;

          return;
        }

       // user blog render -  this shit is actually cursed i tried a bunch of other methods but it constantly breaks 

        userPostsList.innerHTML =
          userOnlyPosts.map(post => `

            <div
              class="user-post-item"
              data-id="${post.id}">

              <div class="user-post-thumb">
                <img
                  src="${post.imageUrl || 'https://via.placeholder.com/150'}"
                  alt="${post.title || ''}"
                  onerror="this.src='https://via.placeholder.com/150'"/>
              </div>

              <div class="user-post-info">
                <span class="category">
                  <span class="icon">
                    ${post.categoryIcon || '📝'}
                  </span>

                  ${post.category || ''}
                </span>

                <h3>
                  ${post.title || ''}
                </h3>

                <p class="card-meta">
                  ${post.dateAdded || ''} • By ${post.author || ''}
                </p>
              </div>

              <div class="menu-dropdown">
                <button
                  type="button"
                  class="three-dots-btn"
                  onclick="toggleDropdown(event, '${post.id}')"
                  aria-label="Post Options"
                >
                  ⋮
                </button>

                <div
                  class="dropdown-menu"
                  id="dropdown-${post.id}"
                  style="display: none;">

                  <button
                    type="button"
                    class="dropdown-item edit-btn"
                    onclick="triggerEdit('${post.id}')">
                    Edit
                  </button>


                  <button
                    type="button"
                    class="dropdown-item delete-btn"
                    onclick="triggerDelete('${post.id}')">
                    Delete
                  </button>

                </div>
              </div>
            </div>
          `).join('');
      })


      .catch(err => {
        console.error(
          'Error loading posts list:',
          err
        );
      });
  };



  if (postForm) {
    postForm.addEventListener(
      'submit',
      event => {
        event.preventDefault();

        if (!CURRENT_USER) {
          alert('Please sign in to publish a post.');

          return;
        }

        const id =postIdInput.value;
        const contentVal = contentInput.value.trim();
        let summaryVal = summaryInput
            ? summaryInput.value.trim()
            : '';

        // default to first sentence or 50 words if no summary
        if (!summaryVal) {
          const firstSentenceMatch = contentVal.match(
              /^[^.!?]*[.!?]/
            );

          summaryVal = firstSentenceMatch
              ? firstSentenceMatch[0].trim()
              : ( contentVal.length > 50
                    ? contentVal.substring(0, 50) + '...'
                    : contentVal )
                    ;
        }

        // images links
        const finalImageUrl = getImageInputValue(
            imageInput,
            existingImageUrl
          );

        const finalSecondaryImageUrl =  getImageInputValue(
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

        // create/edit posts
        fetch(
          id
            ? `/api/posts/${id}`
            : '/api/posts',
          {
            method:
              id
                ? 'PUT'
                : 'POST',

            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
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

          // refresh page
          .then(() => {
            resetForm(); 
            loadUserPosts();

            if (
              postFeed &&
              fetchAndRenderFeed
            ) {

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
        formTitle.textContent = 'Create a New Post';
      }

      if (submitBtn) {
        submitBtn.textContent = 'Publish Post';
      }

      if (cancelBtn) {
        cancelBtn.style.display = 'none';
      }
    }

    loadUserPosts();
  }
  
  // drop down table for delete/edit
  function toggleDropdown(event, id) {
    event.stopPropagation();

    const currentDropdown = document.getElementById(`dropdown-${id}`);
    document
      .querySelectorAll('.dropdown-menu')
      .forEach(menu => {

        if (menu !== currentDropdown) {
          menu.style.display ='none';
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

  window.toggleDropdown = toggleDropdown;
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

  // edit functiom
  async function triggerEdit(id) {
    try {
      const res = await fetch(`/api/posts/${id}`
        );

      if (!res.ok) {
        throw new Error('Post not found'
        );
      }

      const post = await res.json();
      postIdInput.value = post.id;
      titleInput.value = post.title;
      categoryInput.value = post.category;
      contentInput.value = post.content;
      existingImageUrl = post.imageUrl || '';
      existingSecondaryImageUrl = post.secondaryImage || '';

      if (imageInput) {
        imageInput.value = post.imageUrl || '';
      }

      if (secondaryImageInput) {
        secondaryImageInput.value =  post.secondaryImage || '';
      }


      if (summaryInput) {
        summaryInput.value = post.summary || '';
      }

      if (formTitle) {
        formTitle.textContent = 'Edit Post';
      }

      if (submitBtn) {
        submitBtn.textContent = 'Save Changes';
      }

      if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
      }

      if (postForm) {
        window.scrollTo({
          top: postForm.offsetTop - 100,
          behavior: 'smooth'
        });
      }

    } catch (err) {
      console.error(
        'Error loading post for edit:',
        err
      );
    }
  }

  window.triggerEdit = triggerEdit;

  // delete functn
  async function triggerDelete(id) {
    if (!confirm('Confirm deletion?')) {
      return;
    }

    try { const res = await fetch(`/api/posts/${id}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders()
          }
        );

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      // refresh blog
      loadUserPosts();

      if (
        postFeed &&
        fetchAndRenderFeed
      ) {

        fetchAndRenderFeed();
      }

    } catch (err) {
      alert(
        err.error || 'Error.'
      );
    }
  }

  window.triggerDelete = triggerDelete;


  // =========================================================
  // admin gun
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀   ⢀⣴⢶⣶⣶⠼⣦⣤⣼⣼⡆⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠖⣯⠿⠟⠛⠻⢶⣿⣯⣿⣿⣃⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣖⣺⡿⠿⠷⠶⠒⢶⣶⠖⠀⠉⡻⢻⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠀⣴⢻⣭⣫⣿⠁⠀⠀⠀⠀⠀⠀⠀⢀⣾⠃⢀⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⢀⣖⡿⠋⢙⣿⠿⢿⠿⣿⡦⠄⠀⠀⠀⣠⣾⠟⠀⠀⣼⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⢀⣰⣿⣴⣿⡿⠿⠿⠿⢿⣦⣄⠀⠀⠀⣠⣾⣿⠃⠀⢀⣸⡿⣳⣶⣲⡄⠀⠀⠀⠀⠀⠀
//⠀⠀⣾⣽⡿⣛⣵⠾⠿⠿⠷⣦⣌⠻⣷⣄⢰⣿⠟⠁⠀⢠⣾⠿⢡⣯⠸⠧⢽⣄⠀⠀⠀⠀⠀
//⠀⢸⡇⡟⣴⡿⢟⣽⣾⣿⣶⣌⠻⣧⣹⣿⡿⠋⠀⠀⠀⣾⠿⡇⣽⣿⣄⠀⠀⠉⠳⣄⢀⡀⠀
//⠀⢸⠇⢳⣿⢳⣿⣿⣿⣿⣿⣿⡆⢹⡇⣿⡇⠀⡆⣠⣼⡏⢰⣿⣿⣿⣿⣦⠀⠀⠀⠈⠳⣅⠀
//⠀⣸⡀⢸⣿⢸⣿⣿⣿⣿⣿⣿⡇⣸⡇⣿⡇⠀⡟⣻⢳⣷⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠘⣧
//⢰⡟⡿⡆⠹⣧⡙⢿⣿⣿⠿⡟⢡⣿⢷⣿⣧⠾⢠⣿⣾⣿⣿⣿⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⠘
//⠀⠻⡽⣦⠀⠈⠙⠳⢶⣦⡶⠞⢻⡟⡸⠟⠁⢠⠟⠉⠉⠙⠿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⡴
//⠀⠀⢸⣿⡇⠀⠀⣀⣠⠀⢀⡀⠸⣹⠇⠀⣰⡟⡀⠀⠈⠛⠻⢿⣻⣿⡿⠀⠀⠀⠀⠀⠀⡠⠁
//⠀ ⢸⣿⣇⣴⢿⣿⣿⣿⣮⣿⣷⡟⠀⣰⣿⢰⠀⣀⠀⠀⠀⢀⣉⣿⡇⠀⠀⠀⠀⠀⣸⠃⠀
//⠀ ⢸⣿⡟⣯⠸⣿⣿⣿⣿⢈⣿⡇⣼⣿⠇⣸⡦⣙⣷⣦⣴⣯⠿⠛⢷⡀⠀⠀⠀⣰⡟⠀⠀
//⠀ ⠘⣿⣿⡸⣷⣝⠻⠟⢋⣾⣟⣰⡏⣠⣤⡟⠀⠀⠈⠉⠁⠀⠀⠀⠀⢻⣶⠀⢀⣿⠁⠀⠀
//⠀⠀⠀⢸⡿⣿⣦⣽⣛⣛⣛⣭⣾⣷⡶⠞⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⡟⠀⠀⠀⠀
//⠀ ⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠁⢸⢻⠁⠀⠀⠀⠀
//⠀⠀⠀⠀⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣤⣤⣀⣀⣀⣀⣀⣠⣤⠶⠛⠁⢀⣾⡟⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⢿⣻⣿⣿⣿⣿⣿⣿⣎⣿⡅⠀⠈⠉⠉⠉⠉⠉⠁⠀⠀⠀⠀⣼⣿⠁⠀⠀⠀⠀⠀
// ⠀⠀⠀⠈⢻⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⡷⠟⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠙⢿⣿⣿⠻⢿⣿⣿⣟⣂⣀⣀⣀⣀⣀⣀⣤⠴⠋⠁⣾⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠈⢻⣿⣷⣷⡄⠀⠀⠀⠉⠉⠉⠉⠉⠀⠀⠀⢀⡞⠁⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
//⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣷⣤⣤⣤⣤⣄⣤⣤⡤⠴⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
// =========================================================

  async function adminDeletePost(id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (
      !confirm(
        'Delete?\n\nThis cannot be undone.'
      )
    ) {

      return;
    }

    try {
      const res =await fetch(`/api/posts/${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders()
          }
        );

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

      if (
        postFeed &&
        fetchAndRenderFeed
      ) {

        fetchAndRenderFeed();
      }
      loadUserPosts();

    } catch (err) {
      console.error(
        'Error:',
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