document.addEventListener("DOMContentLoaded", function() {

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    function getCurrentUser() {
        return{
            username: sessionStorage.getItem('username') || null,
            role: (sessionStorage.getItem('userRole') || '').toLowerCase()
        };
    };

    function showToast(message) {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function () {toast.classList.add('show');}, 10);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {toast.remove();}, 300);
        }, 3000);
    };

    // name
    function getThreadIdFromPath() {
        const match = window.location.pathname.match(/\/forum\/thread\/(\d+)/);
        return match ? Number(match[1]) : null;
    }

    //Sidebar: related products
    function renderRelatedProducts() {
        const container = document.getElementById('forum-related-products');
        if (!container) return;

        fetch('/api/forum/related-products')
            .then(function(res) { 
                return res.json(); 
            })
            .then(function(products) {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();

                products.forEach(function (p) {
                    const a = document.createElement('a');
                    a.href = `/product_detail`;
                    a.className = 'product_item js-related-products';
                    a.dataset.product = JSON.stringify(p);

                    const img = p.colors ? p.colors[0].mainImage.replace('../../assets', '/assets') : '';
                    a.innerHTML = `
                        <div class="product_thumb">
                            <img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}">
                        </div>
                        <div class="product_info">
                            <div class="product_name">${escapeHtml(p.title)}</div>
                            <div class="product_price">$${Number(p.price).toFixed(2)}</div>
                        </div>  
                    `;

                    a.addEventListener('click', function() {
                        sessionStorage.setItem('selectedProduct', JSON.stringify(p));
                    });

                    fragment.appendChild(a);
                })
                container.appendChild(fragment);
            })
            .catch(function (err) {
                console.error('Error loading related products:', err)
            });
    }
    
    // Build HTML for thread card

    function buildReplyHtml(threadId, reply, index) {
        return `
            <div class="reply_item">
                <div class="reply_header">
                    <img src="/assets/Product Images/avatar.jpg" alt="${escapeHtml(reply.author)} avatar" class="avatar">
                    <span class="author_name">${escapeHtml(reply.author)}</span>
                    <time class="post_time" datetime="${escapeHtml(reply.timestamp)}">${escapeHtml(reply.timestamp)}</time>
                </div>
                <div class="reply_content">
                    <p>${escapeHtml(reply.content)}</p>
                </div>
                <div class="reply_footer">
                    <input type="checkbox" id="reply-like-${threadId}-${index}" class="reply_toggle_checkbox" hidden>
                    <label for="like_reply_${threadId}_${index}" class="reaction_btn">
                        <i class="ri-heart-line icon_outline"></i>
                        <i class="ri_heart_fill icon_filled"></i>
                    </label>
                </div>     
            </div>
        `;
    }

    function buildThreadImagesHtml(t) {
        if (!t.images || t.images.length === 0) return '';
        if (t.images.length === 1) {
            return `<img src="${escapeHtml(t.images[0])}" alt="Image attached to thread: ${escapeHtml(t.title)}" class="content_img">`;
        }
        return `
            <div class="content_gallery">
                ${t.images.map(function (img) {
                    return `<img src="${escapeHtml(img)}" alt="Image attached to thread: ${escapeHtml(t.title)}" class="content_img">`;
                })}
            </div> 
        `;
    }

    function buildThreadCardHtml(t, currentUser) {
        const isOwner = currentUser.username === t.author;
            currentUser.username.trim().toLowerCase() === String(t.author).trim().toLowerCase()
        const isAdmin = currentUser.role === 'admin';

        const optionsMenuHtml = (!t.pinned && isOwner) ? `
            <div class="options_menu">
                <input type="checkbox" id="menu_post_${t.id}" class="options_toggle_checkbox" hidden>
                <label for="menu_post_${t.id}" class="options_trigger">
                    <i class="ri-more-2-fill"></i>
                </label>
                <div class="options_dropdown">
                    <a href="/forum/${t.id}/edit" class="options_item"><i class="ri-edit-line"></i>Edit</a>
                    <a href="#" class="options_item delete_item" data-id="${t.id}"><i class="ri-delete-bin-line"></i>Delete</a>
                </div>
            </div>
            ` : '';

        const adminMenuHtml = (isAdmin && !t.pinned) ? `
            <div class="options_menu admin_options_menu">
                <input type="checkbox" id="admin_menu_post_${t.id}" class="options_toggle_checkbox" hidden>
                <label for="admin_menu_post_${t.id}" class="options_trigger">
                    <i class="ri-shield-star-line"></i>
                </label>
                <div class="options_dropdown">
                    <a href="#" class="options_item admin_delete_item" data-id="${t.id}">
                        <i class="ri-delete-bin-line"></i>Delete
                    </a>
                </div>
            </div>
            ` : '';

        const repliesHtml = (t.replies && t.replies.length) ? `
            <section class="replies_section">
                <h4 class="replies_heading">Reply</h4>
                ${t.pinned.replies(function (r, i) { return buildReplyHtml(t.id, r, i); }).join('')} 
            </section>
        ` : '';

        return `
            <article class="thread_card ${t.pinned ? 'pinned' : ''}">
                <a href="/forum ${t.id}" class="card_stretch_link" aria-label="View thread: ${escapeHtml(t.title)}"></a>
                ${t.pinned ? '<span class="pinned_badge"><i class="ri-pushpin-fill"></i>Pinned</span>' : ''}

                <div class="card_header">
                    <img src="/assets/Product Images/avatar.jpg" alt="${escapeHtml(t.author)} avatar" class="avatar">
                    <span class="author_name">${escapeHtml(t.author)}</span>
                <time class="post_time" datetime="${escapeHtml(t.timestamp)}">${escapeHtml(t.timestamp)}</time>
                ${optionsMenuHtml}
                ${adminMenuHtml}
                </div>

                <h3 class="thread_title">${escapeHtml(t.title)}</h3>

                <div class="thread_content">
                    ${t.content ? `<p>${escapeHtml(t.content)}</p>` : ''}
                    ${buildThreadImagesHtml(t)}
                </div>

                <div class="card_footer">
                    <input type="checkbox" id="like_thread_${t.id}" class="thread_toggle_checkbox" hidden>
                    <label for="like_thread_${t.id}" class="reaction_btn">
                        <i class="ri-heart-line icon_outline"></i>
                        <i class="ri-heart-fill icon-filled"></i>
                    </label>
                    <a href="/forum/${t.id}" class="comment_btn"><i class="ri-chat-3-line"></i>Comment</a>
                </div>
            </article>
            ${repliesHtml}
        `;
    }

    // THREAD LIST
    const threadListEl = document.getElementById('forum_thread_list');

    function getLastActivityDate(t) {
        // Sap xep theo bai dang moi nhat trong thread (bao gom ca reply),
        // khong chi theo ngay tao thread
        let latest = new Date(t.timestamp).getTime();
        if (t.replies && t.replies.length) {
            t.replies.forEach(function (r) {
                const replyTime = new Date(r.timestamp).getTime();
                if (replyTime > latest) latest = replyTime;
            });
        }
        return latest;
    }

    function loadThreadList() {
        threadListEl.innerHTML = '<p class="status-msg">Loading threads...</p>';

        const searchInput = document.getElementById('forum_search_input');
        const sortSelect = document.getElementById('forum_sort_select');
        const resultMeta = document.getElementById('forum_result_meta');
        const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
        const sort = sortSelect ? sortSelect.value : 'newest';

        fetch('/api/forum/threads')
            .then(function (res) { return res.json(); })
            .then(function (threads) {
                let result = threads;

                if (q) {
                    result = result.filter(function (t) {
                        return t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
                    });
                }

                result = result.slice().sort(function (a, b) {
                    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                    const diff = getLastActivityDate(b) - getLastActivityDate(a);
                    return sort === 'oldest' ? -diff : diff;
                });

                if (resultMeta) {
                    resultMeta.innerHTML = `Showing ${result.length} threads &middot; sorted by <strong>${sort === 'oldest' ? 'Oldest post' : 'Newest post'}</strong>`;
                }

                if (result.length === 0) {
                    threadListEl.innerHTML = `
                        <div class="empty_state">
                            <i class="ri-search-eye-line"></i>
                            <p>No threads found. Try a different title or contents!</p>
                        </div>
                    `;
                    return;
                }

                const currentUser = getCurrentUser();
                threadListEl.innerHTML = result.map(function (t) { return buildThreadCardHtml(t, currentUser); }).join('');
                bindDeleteHandlers(); // cac the .delete_item/.admin_delete_item vua duoc tao moi, can gan lai listener
            })
            .catch(function (err) {
                console.error('Error loading threads:', err);
                threadListEl.innerHTML = '<p class="status-msg error">Unable to load threads. Please try again later.</p>';
            });
    }

    if (threadListEl) {
        loadThreadList();
        renderRelatedProducts();

        const filterForm = document.getElementById('forum_filter_form');
        if (filterForm) {
            filterForm.addEventListener('submit', function (e) {
                e.preventDefault();
                loadThreadList();
            });
        }
    }

    //A thread page details
    const threadDetailContainer = document.getElementById('thread_detail_container');

    function renderThreadDetail(thread) {
        const currentUser = getCurrentUser();
        const isOwner = currentUser.username && thread.author &&
            currentUser.username.trim().toLowerCase() === String(thread.author).trim().toLowerCase();

        const optionsMenuHtml = (!thread.pinned && isOwner) ? `
            <div class="options_menu">
                <input type="checkbox" id="menu_post_${thread.id}" class="options_toggle_checkbox" hidden>
                <label for="menu_post_${thread.id}" class="options_trigger">
                    <i class="ri-more-2-fill"></i>
                </label>
                <div class="options_dropdown">
                    <a href="/forum/${thread.id}/edit" class="options_item"><i class="ri-edit-line"></i>Edit</a>
                    <a href="#" class="options_item delete_item" data-id="${thread.id}"><i class="ri-delete-bin-line"></i>Delete</a>
                </div>
            </div>
        ` : '';

        threadDetailContainer.innerHTML = `
            <article class="thread_card thread_detail_post ${thread.pinned ? 'pinned' : ''}">
                ${thread.pinned ? '<span class="pinned_badged"><i class="ri-pushpin-fill"></i>Pinned</span>' : ''}
                <div class="card_header">
                    <img src="/assets/Product Images/avatar.jpg" alt="${escapeHtml(thread.author)} avatar" class="avatar">
                    <span class="author_name">${escapeHtml(thread.author)}</span>
                    <time class="post_time" datetime="${escapeHtml(thread.timestamp)}">${escapeHtml(thread.timestamp)}</time>
                    ${optionsMenuHtml}
                </div>

                <h1 class="thread_title">${escapeHtml(thread.title)}</h1>

                <div class="thread_content">
                    ${thread.content ? `<p>${escapeHtml(thread.content)}</p>` : ''}
                    ${buildThreadImagesHtml(thread)}
                </div>

                <div class="card_footer">
                    <input type="checkbox" id="like_thread_${thread.id}" class="reaction_toggle_checkbox">
                    <label for="like_thread_${thread.id}" class="reaction_btn">
                        <i class="ri-heart-line icon_outline"></i>
                        <i class="ri-heart-fill icon_filled"></i>
                    </label>
                </div>
            </article>
        `;

        renderReplies(thread);
        bindDeleteHandlers();
    }

    function renderReplies(thread) {
        const repliesSection = document.getElementById('replies_section');
        if (!repliesSection) return;

        const replies = thread.replies || [];
        const heading = `${replies.length} Repl${replies.length === 1 ? 'y' : 'ies'}`;

        if (replies.length === 0) {
            repliesSection.innerHTML = `
                <h2 class="replies_heading">${heading}</h2>
                <div class="empty_state">
                    <i class="ri-chat-3-line"></i>
                    <p>No replies yet. Be the first to reply! </p>
                </div>
            `;
            return;
        }

        repliesSection.innerHTML = `
            <h2 class="replies_heading">${heading}</h2>
            ${replies.map(function (r, i) { return buildReplyHtml(thread.id, r, i); }).join('')}
        `;
    }

    function loadThreadDetail(id) {
        threadDetailContainer.innerHTML = '<p class="status-msg">Loading thread...</p>';

        fetch('/api/forum/threads/' + id)
            .then(function (res) {
                if (res.status === 404) throw new Error('Thread not found');
                return res.json();
            })
            .then(function (thread) {
                renderThreadDetail(thread);
            })
            .catch(function (err) {
                console.error('Error loading thread:', err);
                threadDetailContainer.innerHTML = '<p class="status-msg error">Thread not found.</p>';
            });
    }

    if (threadDetailContainer) {
        const threadId = getThreadIdFromPath();
        loadThreadDetail(threadId);
        renderRelatedProducts();

        const replyForm = document.getElementById('reply_form');
        if (replyForm) {
            replyForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const formData = new FormData(replyForm);
                const body = new URLSearchParams();
                formData.forEach(function (value, key) { body.append(key, value); });

                fetch('/api/forum/threads/' + threadId + '/reply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body.toString()
                })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (data.error) {
                            showToast(data.error);
                            return;
                        }
                        showToast('Reply posted successfully.');
                        replyForm.reset();
                        renderReplies(data.thread);
                    })
                    .catch(function (err) {
                        console.error(err);
                        showToast('Something went wrong.');
                    });
            });
        }
    }

    // Create a new thread 
    const newThreadForm = document.getElementById('new_thread_form');
    if (newThreadForm) {
        newThreadForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(newThreadForm);

            fetch('/api/forum/threads', {
                method: 'POST',
                body: formData
            })
                .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
                .then(function (result) {
                    if (!result.ok) {
                        showToast(result.data.error || 'Unable to create thread.');
                        return;
                    }
                    showToast('Thread created successfully.');
                    setTimeout(function () { window.location.href = '/forum/' + result.data.thread.id; }, 800);
                })
                .catch(function (err) {
                    console.error(err);
                    showToast('Something went wrong.');
                });
        });
    }
    
    //Edit thread (forum/:id/edit)
    const editThreadForm = document.getElementById('edit_thread_form');
    if (editThreadForm) {
        const threadId = getThreadIdFromPath();

        const backLink = document.getElementById('edit_back_link');
        const cancelLink = document.getElementById('edit_cancel_link');
        if (backLink) backLink.href = '/forum/' + threadId;
        if (cancelLink) cancelLink.href = '/forum/' + threadId;

        fetch('/api/forum/threads/' + threadId)
            .then(function (res) { return res.json(); })
            .then(function (thread) {
                document.getElementById('thread_title_input').value = thread.title;
                document.getElementById('thread_content_input').value = thread.content;
            })
            .catch(function (err) {
                console.error('Error loading thread for edit:', err);
                showToast('Unable to load thread data.');
            });

        editThreadForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(editThreadForm);

            fetch('/api/forum/threads/' + threadId, {
                method: 'POST',
                body: formData
            })
                .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
                .then(function (result) {
                    if (!result.ok) {
                        showToast(result.data.error || 'Unable to update thread.');
                        return;
                    }
                    showToast('Thread updated successfully.');
                    setTimeout(function () { window.location.href = '/forum/' + threadId; }, 800);
                })
                .catch(function (err) {
                    console.error(err);
                    showToast('Something went wrong.');
                });
        });
    }


    // Confirmation of delete thread + admin delete 
    const modal = document.getElementById('delete_modal');
    let pendingDeleteId = null;

    function bindDeleteHandlers() {
        document.querySelectorAll('.delete_item').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                pendingDeleteId = el.getAttribute('data-id');
                if (modal) modal.classList.add('active');
            });
        });

        document.querySelectorAll('.admin_delete_item').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                const id = el.getAttribute('data-id');

                if (!confirm('Delete?\nThis cannot be undone.')) return;

                fetch('/api/forum/threads/' + id + '/admin-delete', { method: 'POST' })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (data.error) {
                            showToast(data.error);
                        } else {
                            showToast('Thread deleted successfully.');
                            setTimeout(function () {
                                const isSingleThreadView = document.body.hasAttribute('data-single-thread');
                                if (isSingleThreadView) {
                                    window.location.href = '/forum';
                                } else {
                                    loadThreadList();
                                }
                            }, 800);
                        }
                    })
                    .catch(function (err) {
                        console.error('Error:', err);
                        showToast('Error.');
                    });
            });
        });
    }

    const cancelDeleteBtn = document.getElementById('cancel_delete_btn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function () {
            modal.classList.remove('active');
            pendingDeleteId = null;
        });
    }

    const confirmDeleteBtn = document.getElementById('confirm_delete_btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            if (!pendingDeleteId) return;

            fetch('/api/forum/threads/' + pendingDeleteId + '/delete', { method: 'POST' })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (modal) modal.classList.remove('active');

                    if (data.error) {
                        showToast(data.error);
                        return;
                    }

                    showToast('Thread deleted successfully.');

                    const isSingleThreadView = document.body.hasAttribute('data-single-thread');
                    setTimeout(function () {
                        if (isSingleThreadView) {
                            window.location.href = '/forum';
                        } else {
                            loadThreadList();
                        }
                    }, 800);
                })
                .catch(function (err) {
                    console.error(err);
                    showToast('Something went wrong.');
                });
        });
    }

    bindDeleteHandlers();

});
