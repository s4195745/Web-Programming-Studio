document.addEventListener('DOMContentLoaded', () => {
    const reviewPage = document.querySelector('.review-page');
    if (!reviewPage) return; // this script only runs on the product review page

    // --- DOM ELEMENTS ---
    const loginPrompt = document.getElementById('review-login-prompt');
    const formSection = document.getElementById('review-form-section');
    const form = document.getElementById('review-form');
    const editIdInput = document.getElementById('review-edit-id');
    const productSelect = document.getElementById('review-product');
    const titleInput = document.getElementById('review-title');
    const descriptionInput = document.getElementById('review-description');
    const ratingInputs = document.querySelectorAll('#review-rating-input input[type="radio"]');
    const submitBtn = document.getElementById('review-submit-btn');
    const cancelEditBtn = document.getElementById('review-cancel-edit-btn');

    const list = document.getElementById('review-list');
    const resultCount = document.getElementById('review-result-count');
    const emptyState = document.getElementById('review-empty');
    const emptyHeading = document.getElementById('review-empty-heading');
    const emptyText = document.getElementById('review-empty-text');

    const detailSection = document.getElementById('review-detail-section');
    const detailBox = document.getElementById('review-detail');

    const searchInput = document.getElementById('review-search');
    const ratingFilter = document.getElementById('review-rating-filter');
    const sortSelect = document.getElementById('review-sort');

    let allReviews = [];
    let products = [];

    // --- WEB STORAGE: remember the user's search/filter/sort choices ---
    const STORAGE_KEY = 'reviewToolbarState';

    function loadToolbarState() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
            if (!saved) return;
            if (typeof saved.search === 'string') searchInput.value = saved.search;
            if (saved.rating) ratingFilter.value = saved.rating;
            if (saved.sort) sortSelect.value = saved.sort;
        } catch (err) { /* ignore malformed storage */ }
    }

    function saveToolbarState() {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            search: searchInput.value,
            rating: ratingFilter.value,
            sort: sortSelect.value
        }));
    }

    // --- TOAST NOTIFICATION ---
    function showToast(message) {
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- LOAD PRODUCTS (to populate the review form's product dropdown) ---
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to load products');
            products = await response.json();

            productSelect.innerHTML = '<option value="">Select a product you purchased</option>' +
                products.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
        } catch (err) {
            console.error('Error loading products:', err);
        }
    }

    // --- LOAD REVIEWS ---
    async function loadReviews() {
        try {
            const response = await fetch('/api/reviews');
            if (!response.ok) throw new Error('Failed to load reviews');
            allReviews = await response.json();
            loadToolbarState();
            renderReviews();
        } catch (err) {
            console.error('Error loading reviews:', err);
            list.innerHTML = '';
            emptyState.hidden = false;
            emptyHeading.textContent = 'Unable to load reviews';
            emptyText.textContent = 'Something went wrong. Please refresh the page and try again.';
        }
    }

    // --- CLIENT-SIDE SEARCH + SORT + FILTER (no server round-trip) ---
    function getFilteredReviews() {
        const query = searchInput.value.trim().toLowerCase();
        const minRating = ratingFilter.value ? parseInt(ratingFilter.value, 10) : 0;
        const sort = sortSelect.value;

        let items = allReviews.filter(r => {
            const haystack = `${r.title} ${r.product ? r.product.title : ''} ${r.reviewerUsername}`.toLowerCase();
            const matchesSearch = query === '' || haystack.includes(query);
            const matchesRating = r.rating >= minRating;
            return matchesSearch && matchesRating;
        });

        items = items.slice().sort((a, b) => {
            if (sort === 'highest') return b.rating - a.rating;
            if (sort === 'lowest') return a.rating - b.rating;
            if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            return new Date(b.createdAt) - new Date(a.createdAt); // newest
        });

        return items;
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function starsMarkup(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '&#9733;' : '<span class="star-empty">&#9733;</span>';
        }
        return `<span class="rating-stars" aria-label="Rated ${rating} out of 5 stars"><span aria-hidden="true">${stars}</span><span class="rating-number">${rating.toFixed(1)}</span></span>`;
    }

    function isOwnReview(review) {
        return window.__isLoggedIn && review.reviewerUsername === window.__currentUsername;
    }

    function renderReviews() {
        const filtered = getFilteredReviews();
        resultCount.textContent = `${filtered.length} review${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            list.innerHTML = '';
            emptyState.hidden = false;
            emptyHeading.textContent = allReviews.length === 0 ? 'No reviews yet' : 'No reviews match your search';
            emptyText.textContent = allReviews.length === 0
                ? 'Be the first to share what you think of a product.'
                : 'Try a different keyword or clear the filters above.';
            return;
        }

        emptyState.hidden = true;
        list.innerHTML = filtered.map(review => {
            const own = isOwnReview(review);
            const image = review.image || (review.product && review.product.image) || '';
            const productTitle = review.product ? review.product.title : 'Unknown product';

            return `
                <li class="review-card">
                    <article>
                        <div class="review-card__media">
                            <img src="${image}" alt="${productTitle}, reviewed by ${review.reviewerUsername}">
                        </div>
                        <div class="review-card__body">
                            <p class="review-card__product">${productTitle}</p>
                            <h3 class="review-card__title"><a href="#review-detail-section" data-action="view" data-id="${review.id}">${review.title}</a></h3>
                            ${starsMarkup(review.rating)}
                            <p class="review-card__summary">${review.description}</p>
                        </div>
                        <div class="review-card__meta">
                            <span>${review.reviewerUsername}${own ? ' <span class="badge badge-saved">You</span>' : ''}</span>
                            <span>${formatDate(review.createdAt)}</span>
                        </div>
                        ${own ? `
                        <div class="review-card__actions">
                            <button type="button" class="btn btn-outline btn-sm" style="flex:1;" data-action="edit" data-id="${review.id}">Edit</button>
                            <button type="button" class="btn btn-danger btn-sm" style="flex:1;" data-action="delete" data-id="${review.id}">Delete</button>
                        </div>` : ''}
                    </article>
                </li>`;
        }).join('');
    }

    function renderDetail(review) {
        const own = isOwnReview(review);
        const image = review.image || (review.product && review.product.image) || '';
        const productTitle = review.product ? review.product.title : 'Unknown product';

        detailBox.innerHTML = `
            <div class="review-detail__media">
                <img src="${image}" alt="${productTitle}, full-size photo">
            </div>
            <div>
                <div class="review-detail__header">
                    <h2>${review.title}</h2>
                    ${own ? '<span class="badge badge-saved">Your review</span>' : ''}
                </div>
                <p class="review-detail__meta">
                    Product: ${productTitle} &middot; Reviewed by ${review.reviewerUsername} &middot; ${formatDate(review.createdAt)}
                </p>
                ${starsMarkup(review.rating)}
                <p class="review-detail__body">${review.description}</p>
                ${own ? `
                <div class="review-detail__actions">
                    <button type="button" class="btn btn-outline" data-action="edit" data-id="${review.id}">Edit Review</button>
                    <button type="button" class="btn btn-danger" data-action="delete" data-id="${review.id}">Delete Review</button>
                </div>` : ''}
            </div>`;

        detailSection.hidden = false;
    }

    // --- FORM: live validation (reuses the global helpers from auth-validation.js) ---
    function validateProductLive() {
        if (!productSelect.value) { window.showError('review-product', 'Please select a product.'); return false; }
        window.clearError('review-product');
        return true;
    }

    function validateTitleLive() {
        const value = titleInput.value.trim();
        if (!value) { window.showError('review-title', 'Review title is required.'); return false; }
        if (value.length > 80) { window.showError('review-title', 'Title must be 80 characters or fewer.'); return false; }
        window.clearError('review-title');
        return true;
    }

    function validateDescriptionLive() {
        if (!descriptionInput.value.trim()) { window.showError('review-description', 'Please write your review.'); return false; }
        window.clearError('review-description');
        return true;
    }

    function validateRatingLive() {
        const errorSpan = document.getElementById('review-rating-error');
        const checked = document.querySelector('#review-rating-input input[type="radio"]:checked');
        if (!checked) {
            if (errorSpan) { errorSpan.textContent = 'Please choose a star rating.'; errorSpan.classList.add('show-error'); }
            return false;
        }
        if (errorSpan) { errorSpan.textContent = ''; errorSpan.classList.remove('show-error'); }
        return true;
    }

    productSelect.addEventListener('change', validateProductLive);
    titleInput.addEventListener('input', validateTitleLive);
    descriptionInput.addEventListener('input', validateDescriptionLive);
    ratingInputs.forEach(input => input.addEventListener('change', validateRatingLive));

    function resetForm() {
        form.reset();
        editIdInput.value = '';
        submitBtn.textContent = 'Submit Review';
        cancelEditBtn.hidden = true;
        ['review-product', 'review-title', 'review-description'].forEach(id => window.clearError(id));
        const ratingError = document.getElementById('review-rating-error');
        if (ratingError) { ratingError.textContent = ''; ratingError.classList.remove('show-error'); }
    }

    function startEdit(review) {
        editIdInput.value = review.id;
        productSelect.value = review.productId;
        titleInput.value = review.title;
        descriptionInput.value = review.description;
        const target = document.getElementById(`rate-${review.rating}`);
        if (target) target.checked = true;
        submitBtn.textContent = 'Update Review';
        cancelEditBtn.hidden = false;
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    cancelEditBtn.addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const validProduct = validateProductLive();
        const validTitle = validateTitleLive();
        const validDescription = validateDescriptionLive();
        const validRating = validateRatingLive();

        if (!validProduct || !validTitle || !validDescription || !validRating) {
            showToast('Please fix the highlighted fields before submitting.');
            return;
        }

        const checkedRating = document.querySelector('#review-rating-input input[type="radio"]:checked');
        const payload = {
            productId: productSelect.value,
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            rating: checkedRating.value
        };

        const editId = editIdInput.value;
        const url = editId ? `/api/reviews/${editId}` : '/api/reviews';
        const method = editId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) {
                showToast(data.error || 'Could not save your review.');
                return;
            }

            showToast(editId ? 'Review updated.' : 'Review submitted, thank you!');
            resetForm();
            await loadReviews();
        } catch (err) {
            console.error(err);
            showToast('Something went wrong. Please try again.');
        }
    });

    // --- ACTIONS: view detail / edit / delete (event delegation) ---
    async function deleteReview(reviewId) {
        if (!window.confirm('Delete this review? This cannot be undone.')) return;

        try {
            const response = await fetch(`/api/reviews/${reviewId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            const data = await response.json();
            if (!response.ok) {
                showToast(data.error || 'Could not delete review.');
                return;
            }
            showToast('Review deleted.');
            detailSection.hidden = true;
            await loadReviews();
        } catch (err) {
            console.error(err);
            showToast('Something went wrong. Please try again.');
        }
    }

    function handleAction(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        const reviewId = parseInt(target.dataset.id, 10);
        const review = allReviews.find(r => r.id === reviewId);
        if (!review) return;

        const action = target.dataset.action;
        if (action === 'view') renderDetail(review);
        else if (action === 'edit') startEdit(review);
        else if (action === 'delete') deleteReview(reviewId);
    }

    list.addEventListener('click', handleAction);
    detailBox.addEventListener('click', handleAction);

    // --- LIVE search/sort/filter: re-render instantly, no page reload, no server call ---
    searchInput.addEventListener('input', () => { saveToolbarState(); renderReviews(); });
    ratingFilter.addEventListener('change', () => { saveToolbarState(); renderReviews(); });
    sortSelect.addEventListener('change', () => { saveToolbarState(); renderReviews(); });
    document.getElementById('review-toolbar').addEventListener('submit', (e) => e.preventDefault());

    // --- INIT ---
    if (window.__isLoggedIn) {
        loginPrompt.hidden = true;
        formSection.hidden = false;
    } else {
        loginPrompt.hidden = false;
        formSection.hidden = true;
    }

    loadProducts();
    loadReviews();
});
