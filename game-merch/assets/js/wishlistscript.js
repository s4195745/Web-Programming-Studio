document.addEventListener('DOMContentLoaded', () => {
    const wishlistPage = document.querySelector('.wishlist-page');
    if (!wishlistPage) return; // this script only runs on the wishlist page

    // --- DOM ELEMENTS ---
    const loginPrompt = document.getElementById('wishlist-login-prompt');
    const content = document.getElementById('wishlist-content');
    const grid = document.getElementById('wishlist-grid');
    const emptyState = document.getElementById('wishlist-empty');
    const emptyHeading = document.getElementById('wishlist-empty-heading');
    const emptyText = document.getElementById('wishlist-empty-text');
    const resultCount = document.getElementById('wishlist-result-count');
    const statSaved = document.getElementById('stat-saved');
    const statValue = document.getElementById('stat-value');
    const statPurchased = document.getElementById('stat-purchased');

    const searchInput = document.getElementById('wishlist-search');
    const sortSelect = document.getElementById('wishlist-sort');
    const statusSelect = document.getElementById('wishlist-status');

    // Full, unfiltered list fetched from the server. All search/sort/filter
    // below runs against this cached copy on the client, no extra server calls.
    let allItems = [];

    // --- WEB STORAGE: remember the user's sort/filter/search choices ---
    const STORAGE_KEY = 'wishlistToolbarState';

    function loadToolbarState() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
            if (!saved) return;
            if (typeof saved.search === 'string') searchInput.value = saved.search;
            if (saved.sort) sortSelect.value = saved.sort;
            if (saved.status) statusSelect.value = saved.status;
        } catch (err) {
            // ignore malformed storage
        }
    }

    function saveToolbarState() {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            search: searchInput.value,
            sort: sortSelect.value,
            status: statusSelect.value
        }));
    }

    // --- TOAST NOTIFICATION (mirrors the shopping cart module's toast) ---
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

    // --- CART COUNT BADGE (reads the same sessionStorage cart the Shopping Cart module uses) ---
    function updateCartCount() {
        const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelectorAll('.cart-icon .cart-item-count').forEach(countSpan => {
            if (totalItems > 0) {
                countSpan.textContent = totalItems;
                countSpan.classList.add('active');
            } else {
                countSpan.classList.remove('active');
            }
        });
    }

    // --- LOAD WISHLIST FROM SERVER ---
    async function loadWishlist() {
        try {
            const response = await fetch('/api/wishlist', { credentials: 'same-origin' });

            if (response.status === 401) {
                loginPrompt.hidden = false;
                content.hidden = true;
                return;
            }

            if (!response.ok) throw new Error('Failed to load wishlist');

            allItems = await response.json();
            loginPrompt.hidden = true;
            content.hidden = false;
            loadToolbarState();
            renderWishlist();
        } catch (err) {
            console.error('Error loading wishlist:', err);
            loginPrompt.hidden = true;
            content.hidden = false;
            grid.innerHTML = '';
            emptyState.hidden = false;
            emptyHeading.textContent = 'Unable to load your wishlist';
            emptyText.textContent = 'Something went wrong. Please refresh the page and try again.';
        }
    }

    // --- CLIENT-SIDE SEARCH + SORT + FILTER (no server round-trip) ---
    function getFilteredItems() {
        const query = searchInput.value.trim().toLowerCase();
        const status = statusSelect.value;
        const sort = sortSelect.value;

        let items = allItems.filter(item => {
            // Partial, case-insensitive match against the product title
            const matchesSearch = query === '' || item.product.title.toLowerCase().includes(query);
            const matchesStatus =
                status === 'all' ||
                (status === 'purchased' && item.purchased) ||
                (status === 'saved' && !item.purchased);
            return matchesSearch && matchesStatus;
        });

        items = items.slice().sort((a, b) => {
            if (sort === 'price-asc') return a.product.price - b.product.price;
            if (sort === 'price-desc') return b.product.price - a.product.price;
            // date-added (newest first)
            return new Date(b.addedAt) - new Date(a.addedAt);
        });

        return items;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function renderWishlist() {
        const filtered = getFilteredItems();

        // --- Summary stats always reflect the FULL wishlist, not the filtered view ---
        const savedCount = allItems.filter(i => !i.purchased).length;
        const purchasedCount = allItems.filter(i => i.purchased).length;
        const totalValue = allItems.filter(i => !i.purchased).reduce((sum, i) => sum + i.product.price, 0);
        statSaved.textContent = savedCount;
        statPurchased.textContent = purchasedCount;
        statValue.textContent = `$${totalValue.toFixed(2)}`;

        resultCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

        if (allItems.length === 0) {
            grid.innerHTML = '';
            emptyState.hidden = false;
            emptyHeading.textContent = 'Your wishlist is empty';
            emptyText.textContent = 'Browse the shop and save something you like to see it here.';
            return;
        }

        if (filtered.length === 0) {
            grid.innerHTML = '';
            emptyState.hidden = false;
            emptyHeading.textContent = 'No items match your search';
            emptyText.textContent = 'Try a different keyword or clear the filters above.';
            return;
        }

        emptyState.hidden = true;
        grid.innerHTML = filtered.map(item => {
            const statusLabel = item.purchased ? 'Purchased' : 'Saved';
            const statusClass = item.purchased ? 'badge-purchased' : 'badge-saved';

            const actions = item.purchased
                ? `
                    <button type="button" class="btn btn-outline btn-sm btn-block" disabled aria-disabled="true">Already purchased</button>
                    <div style="display:flex; gap:8px; width:100%;">
                        <button type="button" class="btn btn-success btn-sm" style="flex:1;" disabled aria-disabled="true">Purchased &#10003;</button>
                        <button type="button" class="btn btn-danger btn-sm" style="flex:1;" data-action="remove" data-id="${item.id}">Remove</button>
                    </div>`
                : `
                    <button type="button" class="btn btn-primary btn-sm btn-block" data-action="move-to-cart" data-id="${item.id}">Move to Cart</button>
                    <div style="display:flex; gap:8px; width:100%;">
                        <button type="button" class="btn btn-success btn-sm" style="flex:1;" data-action="mark-purchased" data-id="${item.id}">Mark as Purchased</button>
                        <button type="button" class="btn btn-danger btn-sm" style="flex:1;" data-action="remove" data-id="${item.id}">Remove</button>
                    </div>`;

            return `
                <li class="product-card wishlist-item" data-purchased="${item.purchased}">
                    <article>
                        <div class="product-card__media">
                            <span class="wishlist-item__status badge ${statusClass}">${statusLabel}</span>
                            <img src="${item.product.image || ''}" alt="${item.product.title}">
                        </div>
                        <div class="product-card__body">
                            <h3 class="product-card__title">${item.product.title}</h3>
                            <p class="product-card__category">${item.product.category} &middot; added ${formatDate(item.addedAt)}</p>
                            <p class="product-card__price">$${item.product.price.toFixed(2)}</p>
                        </div>
                        <div class="product-card__actions" style="flex-direction: column; padding-top: 12px;">
                            ${actions}
                        </div>
                    </article>
                </li>`;
        }).join('');
    }

    // --- ACTIONS: move to cart / mark as purchased / remove ---
    async function markPurchased(itemId) {
        try {
            const response = await fetch(`/api/wishlist/${itemId}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ purchased: true })
            });
            const data = await response.json();
            if (!response.ok) {
                showToast(data.error || 'Could not update item.');
                return;
            }
            showToast('Marked as purchased.');
            await loadWishlist();
        } catch (err) {
            console.error(err);
            showToast('Something went wrong. Please try again.');
        }
    }

    async function removeItem(itemId) {
        try {
            const response = await fetch(`/api/wishlist/${itemId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            const data = await response.json();
            if (!response.ok) {
                showToast(data.error || 'Could not remove item.');
                return;
            }
            showToast('Removed from wishlist.');
            await loadWishlist();
        } catch (err) {
            console.error(err);
            showToast('Something went wrong. Please try again.');
        }
    }

    async function moveToCart(itemId) {
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;

        // Add to the same sessionStorage cart the Shopping Cart module reads from
        const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        const existing = cart.find(c => c.id === item.product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: item.product.id,
                title: item.product.title,
                price: item.product.price,
                color: 'Default',
                size: 'M',
                quantity: 1,
                image: item.product.image
            });
        }
        sessionStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        // Remove it from the wishlist once it's in the cart
        try {
            const response = await fetch(`/api/wishlist/${itemId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (!response.ok) {
                const data = await response.json();
                showToast(data.error || 'Added to cart, but could not remove from wishlist.');
            } else {
                showToast(`${item.product.title} moved to cart.`);
            }
            await loadWishlist();
        } catch (err) {
            console.error(err);
            showToast('Added to cart, but something went wrong updating your wishlist.');
        }
    }

    grid.addEventListener('click', (event) => {
        const btn = event.target.closest('button[data-action]');
        if (!btn) return;
        const itemId = parseInt(btn.dataset.id, 10);
        const action = btn.dataset.action;

        if (action === 'move-to-cart') moveToCart(itemId);
        else if (action === 'mark-purchased') markPurchased(itemId);
        else if (action === 'remove') removeItem(itemId);
    });

    // --- LIVE search/sort/filter: re-render instantly, no page reload, no server call ---
    searchInput.addEventListener('input', () => { saveToolbarState(); renderWishlist(); });
    sortSelect.addEventListener('change', () => { saveToolbarState(); renderWishlist(); });
    statusSelect.addEventListener('change', () => { saveToolbarState(); renderWishlist(); });

    document.getElementById('wishlist-toolbar').addEventListener('submit', (e) => e.preventDefault());

    loadWishlist();
});
