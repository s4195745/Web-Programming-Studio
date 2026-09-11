document.addEventListener("DOMContentLoaded", function() {
 
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
 
    function getCurrentUser() {
        const idRaw = sessionStorage.getItem('userId');
        return {
            userId: idRaw || null,
            username: sessionStorage.getItem('username') || null,
            role: (sessionStorage.getItem('userRole') || '').toLowerCase()
        };
    }
 
    function showToast(message) {
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();
 
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
 
        setTimeout(function () { toast.classList.add('show'); }, 10);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }
 
 
 
    function bindLikeHandlers(container) {
        if (!container || container.dataset.likeBound === 'true') return;
        container.dataset.likeBound = 'true';
 
        container.addEventListener('change', function (e) {
            const checkbox = e.target;
            if (!checkbox.classList || !checkbox.classList.contains('reaction_toggle_checkbox')) return;
 
            const currentUser = getCurrentUser();
            const wasChecked = !checkbox.checked; // State BEFORE the user clicks 
 
            if (!currentUser.userId) {
                checkbox.checked = wasChecked; // Revert if the user is not logged in; unauthenticated users cannot react.
                showToast('Please log in to tym this post.');
                return;
            }
 
            const threadId = checkbox.dataset.threadId;
            const countEl = checkbox.parentElement.querySelector('.like_count');
 
            fetch('/api/forum/threads/' + threadId + '/like', { 
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type' : 'application/json'}
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.error) {
                        checkbox.checked = wasChecked;
                        showToast(data.error);
                        return;
                    }
                    checkbox.checked = data.heartedByMe;
                    if (countEl) countEl.textContent = data.heartCount;
                })
                .catch(function () {
                    checkbox.checked = wasChecked;
                    showToast('Something went wrong.');
                });
        });
    }
 
    const DEFAULT_AVATAR = '/assets/Product Images/avatar.jpg';
 
    function getAvatarSrc(entity) {
        return (entity && entity.authorAvatar) ? entity.authorAvatar : DEFAULT_AVATAR;
    }
 
    // Store timestamps in UTC on the server; convert to Vietnam time for display.
    function formatVNTime(dateVal) {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
 
    function getThreadIdFromPath() {
        const match = window.location.pathname.match(/\/forum\/([a-fA-F0-9]{24})/);
        return match ? match[1] : null;
    }
 
    // Sidebar: related products
    function renderRelatedProducts() {
        const container = document.getElementById('forum_related_products');
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
                });
                container.appendChild(fragment);
            })
            .catch(function (err) {
                console.error('Error loading related products:', err);
            });
    }
    
    // Build HTML for thread card
    function buildReplyHtml(threadId, reply, isNested) {
        return `
            <div class="reply_item${isNested ? ' nested_reply' : ''}" data-reply-id="${escapeHtml(reply._id)}">
                <div class="reply_header">
                    <img src="${escapeHtml(getAvatarSrc(reply))}" alt="${escapeHtml(reply.author)} avatar" class="avatar">
                    <span class="author_name">${escapeHtml(reply.author)}</span>
                    <time class="post_time" datetime="${escapeHtml(reply.createdAt)}">${escapeHtml(formatVNTime(reply.createdAt))}</time>
                </div>
                <div class="reply_content">
                    <p>${escapeHtml(reply.content)}</p>
                </div>
                <div class="reply_footer">
                    <input type="checkbox" id="reply-like-${threadId}-${reply._id}" class="reaction_toggle_checkbox" hidden>
                    <label for="reply-like-${threadId}-${reply._id}" class="reaction_btn">
                        <i class="ri-heart-line icon_outline"></i>
                        <i class="ri-heart-fill icon_filled"></i>
                    </label>
                    <button type="button" class="reply_to_btn" data-reply-id="${escapeHtml(reply._id)}">
                        <i class="ri-reply-line"></i> Reply
                    </button>
                </div>
                <div class="quick_reply_slot" id="quick_reply_slot_${escapeHtml(reply._id)}"></div>
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
                }).join('')}
            </div> 
        `;
    }
 
    function buildThreadCardHtml(t, currentUser) {
        const isOwner = currentUser.userId !== null && currentUser.userId === t.authorId;
        const isAdmin = currentUser.role === 'admin';
        const threadId = t._id;
 
        const optionsMenuHtml = (!t.pinned && isOwner) ? `
            <div class="options_menu">
                <input type="checkbox" id="menu_post_${threadId}" class="options_toggle_checkbox" hidden>
                <label for="menu_post_${threadId}" class="options_trigger">
                    <i class="ri-more-2-fill"></i>
                </label>
                <div class="options_dropdown">
                    <a href="/forum/${threadId}/edit" class="options_item"><i class="ri-edit-line"></i>Edit</a>
                    <a href="#" class="options_item delete_item" data-id="${threadId}"><i class="ri-delete-bin-line"></i>Delete</a>
                </div>
            </div>
            ` : '';
 
        const adminMenuHtml = (isAdmin && !t.pinned) ? `
            <div class="options_menu admin_options_menu">
                <input type="checkbox" id="admin_menu_post_${threadId}" class="options_toggle_checkbox" hidden>
                <label for="admin_menu_post_${threadId}" class="options_trigger">
                    <i class="ri-shield-star-line"></i>
                </label>
                <div class="options_dropdown">
                    <a href="#" class="options_item admin_delete_item" data-id="${threadId}">
                        <i class="ri-delete-bin-line"></i>Delete
                    </a>
                </div>
            </div>
            ` : '';
 
        const repliesHtml = (t.replies && t.replies.length) ? `
            <section class="replies_section">
                <h4 class="replies_heading">Reply</h4>
                ${t.replies.map(function (r, i) { return buildReplyHtml(threadId, r, i); }).join('')} 
            </section>
        ` : '';
 
        return `
            <article class="thread_card ${t.pinned ? 'pinned' : ''}">
                <a href="/forum/${threadId}" class="card_stretch_link" aria-label="View thread: ${escapeHtml(t.title)}"></a>
                ${t.pinned ? '<span class="pinned_badge"><i class="ri-pushpin-fill"></i>Pinned</span>' : ''}
 
                <div class="card_header">
                    <img src="${escapeHtml(getAvatarSrc(t))}" alt="${escapeHtml(t.author)} avatar" class="avatar">
                    <span class="author_name">${escapeHtml(t.author)}</span>
                    <time class="post_time" datetime="${escapeHtml(t.createdAt)}">${escapeHtml(formatVNTime(t.createdAt))}</time>
                    ${optionsMenuHtml}
                    ${adminMenuHtml}
                </div>
 
                <h3 class="thread_title">${escapeHtml(t.title)}</h3>
 
                <div class="thread_content">
                    ${t.content ? `<p>${escapeHtml(t.content)}</p>` : ''}
                    ${buildThreadImagesHtml(t)}
                </div>
 
                <div class="card_footer">
                    <input type="checkbox" id="like_thread_${threadId}" class="reaction_toggle_checkbox" data-thread-id="${threadId}" ${t.heartedByMe ? 'checked' : ''} hidden>
                    <label for="like_thread_${threadId}" class="reaction_btn">
                        <i class="ri-heart-line icon_outline"></i>
                        <i class="ri-heart-fill icon_filled"></i>
                        <span class="like_count">${t.heartCount || 0}</span>
                    </label>
                    <a href="/forum/${threadId}" class="comment_btn"><i class="ri-chat-3-line"></i>Comment</a>
                </div>
            </article>
            ${repliesHtml}
        `;
    }
 
    // Thread list
    const threadListEl = document.getElementById('forum_thread_list');
    const loadMoreBtn = document.querySelector('.load_more_btn');
    const THREADS_PAGE_SIZE = 6;
    let currentSortedThreads = [];
    let currentVisibleCount = THREADS_PAGE_SIZE;
 
    function getLastActivityDate(t) {
        let latest = t.createdAt ? new Date(t.createdAt).getTime() : 0;
        if (t.replies && t.replies.length) {
            t.replies.forEach(function (r) {
                const replyTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                if (replyTime > latest) latest = replyTime;
            });
        }
        return latest;
    }
 
    // Only render the threads currently marked as "visible"
    function renderVisibleThreads() {
        const currentUser = getCurrentUser();
        const toShow = currentSortedThreads.slice(0, currentVisibleCount);
 
        threadListEl.innerHTML = toShow.map(function (t) { return buildThreadCardHtml(t, currentUser); }).join('');
        bindDeleteHandlers();
        bindLikeHandlers(threadListEl);
 
        if (loadMoreBtn) {
            loadMoreBtn.style.display = (currentVisibleCount < currentSortedThreads.length) ? '' : 'none';
        }
    }
 
    function loadThreadList() {
        threadListEl.innerHTML = '<p class="status-msg">Loading threads...</p>';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
 
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
                        return (t.title && t.title.toLowerCase().includes(q)) || 
                               (t.content && t.content.toLowerCase().includes(q));
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
                    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                    return;
                }
 
                // Reset to the first page whenever search/sort changes (re-fetch from scratch)
                currentSortedThreads = result;
                currentVisibleCount = THREADS_PAGE_SIZE;
                renderVisibleThreads();
            })
            .catch(function (err) {
                console.error('Error loading threads:', err);
                threadListEl.innerHTML = '<p class="status-msg error">Unable to load threads. Please try again later.</p>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            });
    }
 
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            currentVisibleCount += THREADS_PAGE_SIZE;
            renderVisibleThreads();
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
 
    // Thread detail
    const threadDetailContainer = document.getElementById('thread_detail_container');
 
    function renderThreadDetail(thread) {
        const currentUser = getCurrentUser();
        const isOwner = currentUser.userId !== null && currentUser.userId === thread.authorId;
        const threadId = thread._id;
 
        const optionsMenuHtml = (!thread.pinned && isOwner) ? `
            <div class="options_menu">
                <input type="checkbox" id="menu_post_${threadId}" class="options_toggle_checkbox" hidden>
                <label for="menu_post_${threadId}" class="options_trigger">
                    <i class="ri-more-2-fill"></i>
                </label>
                <div class="options_dropdown">
                    <a href="/forum/${threadId}/edit" class="options_item"><i class="ri-edit-line"></i>Edit</a>
                    <a href="#" class="options_item delete_item" data-id="${threadId}"><i class="ri-delete-bin-line"></i>Delete</a>
                </div>
            </div>
        ` : '';
 
        threadDetailContainer.innerHTML = `
            <article class="thread_card thread_detail_post ${thread.pinned ? 'pinned' : ''}">
                ${thread.pinned ? '<span class="pinned_badge"><i class="ri-pushpin-fill"></i>Pinned</span>' : ''}
                <div class="card_header">
                    <img src="${escapeHtml(getAvatarSrc(thread))}" alt="${escapeHtml(thread.author)} avatar" class="avatar">
                    <span class="author_name">${escapeHtml(thread.author)}</span>
                    <time class="post_time" datetime="${escapeHtml(thread.createdAt)}">${escapeHtml(formatVNTime(thread.createdAt))}</time>
                    ${optionsMenuHtml}
                </div>
 
                <h1 class="thread_title">${escapeHtml(thread.title)}</h1>
 
                <div class="thread_content">
                    ${thread.content ? `<p>${escapeHtml(thread.content)}</p>` : ''}
                    ${buildThreadImagesHtml(thread)}
                </div>
 
                <div class="card_footer">
                    <input type="checkbox" id="like_thread_${threadId}" class="reaction_toggle_checkbox" data-thread-id="${threadId}" ${thread.heartedByMe ? 'checked' : ''}>
                    <label for="like_thread_${threadId}" class="reaction_btn">
                        <i class="ri-heart-line icon_outline"></i>
                        <i class="ri-heart-fill icon_filled"></i>
                        <span class="like_count">${thread.heartCount || 0}</span>
                    </label>
                </div>
            </article>
        `;
 
        renderReplies(thread);
        bindDeleteHandlers();
        bindLikeHandlers(threadDetailContainer);
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
 
        // Replies are stored as a flat array in DB
        const childrenByParent = {};
        replies.forEach(function (r) {
            const key = r.parentReplyId ? String(r.parentReplyId) : 'root';
            if (!childrenByParent[key]) childrenByParent[key] = [];
            childrenByParent[key].push(r);
        });
 
        function renderBranch(parentKey, isNested) {
            const list = childrenByParent[parentKey] || [];
            return list.map(function (r) {
                return buildReplyHtml(thread._id, r, isNested) + renderBranch(String(r._id), true);
            }).join('');
        }
 
        repliesSection.innerHTML = `
            <h2 class="replies_heading">${heading}</h2>
            ${renderBranch('root', false)}
        `;
 
        bindQuickReplyHandlers(thread._id);
    }
 
    // Handle the "Reply" button under each reply: clicking displays a small form (quick_reply_form)
    function bindQuickReplyHandlers(threadId) {
        const repliesSection = document.getElementById('replies_section');
        if (!repliesSection || repliesSection.dataset.quickReplyBound === 'true') return;
        repliesSection.dataset.quickReplyBound = 'true';
 
        repliesSection.addEventListener('click', function (e) {
            const btn = e.target.closest('.reply_to_btn');
            if (!btn) return;
 
            const parentReplyId = btn.dataset.replyId;
            const slot = document.getElementById('quick_reply_slot_' + parentReplyId);
            if (!slot) return;
 
            // Clicking the same Reply button again closes the form (toggle)
            if (slot.innerHTML.trim()) {
                slot.innerHTML = '';
                return;
            }
 
            const currentUser = getCurrentUser();
            if (!currentUser.userId) {
                showToast('Please log in to reply.');
                return;
            }
 
            slot.innerHTML = `
                <form class="quick_reply_form">
                    <input type="text" class="quick_reply_input" placeholder="Write a reply..." required>
                    <button type="submit" class="quick_reply_btn"><i class="ri-send-plane-fill"></i></button>
                </form>
            `;
 
            const form = slot.querySelector('.quick_reply_form');
            const input = slot.querySelector('.quick_reply_input');
            input.focus();
 
            form.addEventListener('submit', function (evt) {
                evt.preventDefault();
                const content = input.value.trim();
                if (!content) return;
 
                const body = new URLSearchParams();
                body.append('reply_content', content);
                body.append('parent_reply_id', parentReplyId);
 
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
                        renderReplies(data.thread);
                    })
                    .catch(function () {
                        showToast('Something went wrong.');
                    });
            });
        });
    }
 
    function loadThreadDetail(id) {
        if (!id) {
            threadDetailContainer.innerHTML = '<p class="status-msg error">Invalid Thread ID.</p>';
            return;
        }
 
        threadDetailContainer.innerHTML = '<p class="status-msg">Loading thread...</p>';
 
        fetch('/api/forum/threads/' + id)
            .then(function (res) {
                if (!res.ok) throw new Error('Thread not found');
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
        const replyLoginNotice = document.getElementById('reply_login_notice');
        const currentUserForReply = getCurrentUser();
 
         if (!currentUserForReply.userId) {
            if (replyForm) replyForm.style.display = 'none';
            if (replyLoginNotice) replyLoginNotice.style.display = 'block';
        }
 
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
    const newThreadForm = document.getElementById('new_thread_forum') || document.getElementById('new_thread_form');
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
                    setTimeout(function () { 
                        window.location.href = '/forum/' + result.data.thread._id; 
                    }, 800);
                })
                .catch(function (err) {
                    console.error(err);
                    showToast('Something went wrong.');
                });
        });
    }
    
    // Edit thread (forum/:id/edit)
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
 
    // Delete handlers
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
            if (modal) modal.classList.remove('active');
            pendingDeleteId = null;
        });
    }
 
    const confirmDeleteBtn = document.getElementById('confirm_delete_btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            if (!pendingDeleteId) return;
 
            fetch('/api/forum/threads/' + pendingDeleteId + '/delete', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'  // Send cookies session from Express to backend 
            })
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