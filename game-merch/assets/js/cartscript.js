document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const productContainer = document.querySelector(".product-list");
    const isProductDetailPage = document.querySelector(".product-detail");
    const isCartPage = document.querySelector(".cart");
    const isCheckoutPage = document.querySelector(".checkout-page");
    const isConfirmationPage = document.querySelector(".confirmation-page");

    function setupDynamicAdminPanel() {
        const user = JSON.parse(sessionStorage.getItem('user'));
        const adminToggleBtn = document.getElementById('admin-panel-toggle-btn');
        const adminSidePanel = document.getElementById('admin-side-panel');
        const userTableBody = document.querySelector('#admin-users-table tbody');

        if (!user || user.role !== 'admin') {
            if (adminToggleBtn) adminToggleBtn.style.display = 'none';
            if (adminSidePanel) adminSidePanel.style.display = 'none';
            return;
        }

        if (adminToggleBtn) adminToggleBtn.style.display = 'block';

        window.toggleAdminPanel = function () {
            if (adminSidePanel) {
                adminSidePanel.classList.toggle('active');
                if (adminSidePanel.classList.contains('active')) loadAdminUsers();
            }
        };

        async function loadAdminUsers() {
            if (!userTableBody) return;
            userTableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

            try {
                const response = await fetch('/api/admin/users', {
                    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
                });
                if (!response.ok) throw new Error('Failed to load users');

                const users = await response.json();
                userTableBody.innerHTML = '';

                users.forEach(u => {
                    const tr = document.createElement('tr');
                    const isLocked = u.isLocked;

                    tr.innerHTML = `
                        <td>${u.id}</td>
                        <td>${u.username} (${u.email})</td>
                        <td><span class="status-badge ${isLocked ? 'locked' : 'active'}">${isLocked ? 'Locked' : 'Active'}</span></td>
                        <td>
                            <button class="btn-action ${isLocked ? 'unlock' : 'lock'}" onclick="toggleUserLock('${u.id}', ${isLocked})">
                                ${isLocked ? 'Unlock' : 'Lock'}
                            </button>
                        </td>
                    `;
                    userTableBody.appendChild(tr);
                });
            } catch (err) {
                console.error(err);
                userTableBody.innerHTML = '<tr><td colspan="4" class="error">Failed to load user list.</td></tr>';
            }
        }

        window.toggleUserLock = async function (userId, currentlyLocked) {
            const action = currentlyLocked ? 'unlock' : 'lock';
            try {
                const response = await fetch(`/api/admin/users/${userId}/${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    loadAdminUsers();
                } else {
                    alert(`Failed to ${action} user.`);
                }
            } catch (err) {
                console.error(err);
            }
        };
    }

    setupDynamicAdminPanel();

    // --- GLOBAL SEARCH & FILTER STATE ---
    let currentCategoryFilter = "all";
    let currentSearchQuery = "";

    // --- TOAST NOTIFICATION ---
    function showToast(message) {
        const existingToast = document.querySelector(".toast-message");
        if (existingToast) existingToast.remove();

        const toast = document.createElement("div");
        toast.className = "toast-message";
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- MOBILE MENU TOGGLE LOGIC ---
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            const icon = menuToggle.querySelector("i");
            if (icon) {
                icon.className = navLinks.classList.contains("active") ? "ri-close-line" : "ri-menu-line";
            }
        });

        document.addEventListener("click", (event) => {
            if (!menuToggle.contains(event.target) && !navLinks.contains(event.target)) {
                navLinks.classList.remove("active");
                const icon = menuToggle.querySelector("i");
                if (icon) icon.className = "ri-menu-line";
            }
        });
    }

    // --- SEARCH BAR LOGIC ---
    const searchInputs = document.querySelectorAll(".search-bar input");
    const searchButtons = document.querySelectorAll(".search-bar button");

    function executeSearch(query) {
        currentSearchQuery = query.toLowerCase().trim();
        if (productContainer) {
            displayProducts();
        } else {
            sessionStorage.setItem("pendingSearch", currentSearchQuery);
            window.location.href = "/shop";
        }
    }

    searchButtons.forEach((btn, index) => {
        btn.addEventListener("click", () => executeSearch(searchInputs[index].value));
    });

    searchInputs.forEach(input => {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") executeSearch(e.target.value);
        });
    });

    // --- CATEGORY FILTER LOGIC ---
    const categoryFilterDropdown = document.querySelector("#category-filter");
    if (categoryFilterDropdown) {
        categoryFilterDropdown.addEventListener("change", (e) => {
            currentCategoryFilter = e.target.value;
            displayProducts();
        });
    }

    // --- HELPER: BULLETPROOF PRICE PARSER ---
    function getSafePrice(priceVal) {
        if (typeof priceVal === 'number') return priceVal;
        if (!priceVal) return 0;
        return parseFloat(priceVal.toString().replace(/[^0-9.-]+/g, ""));
    }

    // --- CART COUNTER (PERSISTENT CRUD READ) ---
    async function updateCartCount() {
        const token = sessionStorage.getItem("token");
        let totalItems = 0;
        
        if (token) {
            try {
                const res = await fetch('/api/cart', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const cart = await res.json();
                    totalItems = (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);
                }
            } catch (e) {
                console.error("Failed to fetch cart count:", e);
            }
        }

        const cartIcons = document.querySelectorAll(".cart-icon");
        cartIcons.forEach(cartIcon => {
            let countSpan = cartIcon.querySelector(".cart-item-count");
            if (!countSpan) {
                countSpan = document.createElement("span");
                countSpan.classList.add("cart-item-count");
                cartIcon.appendChild(countSpan);
            }
            if (totalItems > 0) {
                countSpan.textContent = totalItems;
                countSpan.classList.add("active");
            } else {
                countSpan.classList.remove("active");
            }
        });
    }

    // --- ROUTER ---
    if (productContainer) {
        const pendingSearch = sessionStorage.getItem("pendingSearch");
        if (pendingSearch) {
            currentSearchQuery = pendingSearch;
            searchInputs.forEach(input => input.value = currentSearchQuery);
            sessionStorage.removeItem("pendingSearch");
        }
        displayProducts();
    } else if (isProductDetailPage) {
        displayProductDetail();
    } else if (isCartPage) {
        displayCart();
        const sortSelect = document.querySelector("#cart-sort");
        if (sortSelect) sortSelect.addEventListener("change", displayCart);
        
        const filterInput = document.querySelector("#cart-filter");
        if (filterInput) filterInput.addEventListener("input", displayCart);
        
    } else if (isCheckoutPage) {
        displayCheckout();
    } else if (isConfirmationPage) {
        displayConfirmation();
    }

    // --- PRODUCT LIST (INDEX PAGE) ---
    async function displayProducts() {
        productContainer.innerHTML = "<p class='status-msg'>Loading products...</p>";
        
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error("Failed to fetch products");
            
            const products = await response.json();
    
            const filteredProducts = products.filter(product => {
                const matchesCategory = currentCategoryFilter === "all" || product.category === currentCategoryFilter;
                const matchesSearch = product.title.toLowerCase().includes(currentSearchQuery) || 
                                      product.description.toLowerCase().includes(currentSearchQuery);
                return matchesCategory && matchesSearch;
            });
    
            const resultText = document.getElementById("search-result-text");
            if (resultText) {
                if (currentSearchQuery !== "") {
                    resultText.textContent = `Found ${filteredProducts.length} results for "${currentSearchQuery}"`;
                } else {
                    resultText.textContent = `Showing ${filteredProducts.length} products`;
                }
            }
    
            if (filteredProducts.length === 0) {
                productContainer.innerHTML = "<p class='status-msg'>No products found matching your criteria.</p>";
                return;
            }
    
            productContainer.innerHTML = ""; 
            const fragment = document.createDocumentFragment();
    
            filteredProducts.forEach(product => {
                const productCard = document.createElement("div");
                productCard.classList.add("product-card");
                
                const safePrice = getSafePrice(product.price);
    
                productCard.innerHTML = `
                    <div class="img-box">
                        <img src="${product.colors[0].mainImage}" alt="${product.title}">
                    </div>
                    <h2 class="title">${product.title}</h2>
                    <span class="price">$${safePrice.toFixed(2)}</span>
                `;
                
                fragment.appendChild(productCard);
                
                productCard.querySelector(".img-box").addEventListener("click", () => {
                    sessionStorage.setItem("selectedProduct", JSON.stringify(product));
                    window.location.href = "/product_detail";
                });
            });
    
            productContainer.appendChild(fragment);
            
        } catch (error) {
            console.error("Error loading products:", error);
            productContainer.innerHTML = "<p class='status-msg error'>Unable to load products. Please try again later.</p>";
        }
    }

    // --- PRODUCT DETAIL PAGE (CREATE CRUD) ---
    function displayProductDetail() {
        const productData = JSON.parse(sessionStorage.getItem("selectedProduct"));
        if (!productData) {
            window.location.href = "/shop";
            return;
        }

        const safePrice = getSafePrice(productData.price);

        document.querySelector(".title").textContent = productData.title;
        document.querySelector(".price").textContent = `$${safePrice.toFixed(2)}`;
        document.querySelector(".description").textContent = productData.description;

        const mainImageContainer = document.querySelector(".main-img");
        const thumbnailContainer = document.querySelector(".thumbnail-list");
        const colorContainer = document.querySelector(".color-options");
        const sizeContainer = document.querySelector(".size-options");
        const addToCartBtn = document.querySelector("#add-cart-btn");

        let selectedColor = productData.colors[0];
        let selectedSize = selectedColor.sizes[0];

        function updateProductDisplay(colorData) {
            if (!colorData.sizes.includes(selectedSize)) selectedSize = colorData.sizes[0];

            mainImageContainer.innerHTML = `<img src="${colorData.mainImage}" alt="${productData.title}">`;
            thumbnailContainer.innerHTML = "";

            const allImages = [colorData.mainImage, ...colorData.thumbnails];
            allImages.forEach(image => {
                const img = document.createElement("img");
                img.src = image;
                img.alt = `Thumbnail of ${productData.title}`;
                img.addEventListener("click", () => mainImageContainer.innerHTML = `<img src="${image}" alt="${productData.title}">`);
                thumbnailContainer.appendChild(img);
            });
        
            colorContainer.innerHTML = "";
            productData.colors.forEach(color => {
                const img = document.createElement("img");
                img.src = color.mainImage;
                img.alt = `Color ${color.name}`;
                if (color.name === colorData.name) img.classList.add("selected");
                img.addEventListener("click", () => {
                    selectedColor = color;
                    updateProductDisplay(color);
                });
                colorContainer.appendChild(img);
            });

            sizeContainer.innerHTML = "";
            colorData.sizes.forEach(size => {
                const btn = document.createElement("button");
                btn.textContent = size;
                if (size === selectedSize) btn.classList.add("selected");
                
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".size-options button").forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                    selectedSize = size;
                });
                sizeContainer.appendChild(btn);
            });
        }

        updateProductDisplay(selectedColor);

        // ADD TO CART (Sends POST to MongoDB)
        addToCartBtn.addEventListener("click", async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                showToast("Please log in to add items to your cart.");
                setTimeout(() => window.location.href = "/login", 1500);
                return;
            }

            const payload = {
                productId: productData.id || productData._id,
                color: selectedColor.name,
                size: selectedSize,
                quantity: 1,
                price: safePrice
            };

            try {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    await updateCartCount(); 
                    showToast(`${productData.title} added to cart!`); 
                    
                    addToCartBtn.classList.add("p-relative"); 
                    const plusOne = document.createElement("span");
                    plusOne.textContent = "+1";
                    plusOne.classList.add("plus-one-anim");
                    addToCartBtn.appendChild(plusOne);
                    
                    setTimeout(() => {
                        plusOne.remove();
                        addToCartBtn.classList.remove("p-relative");
                    }, 800);
                } else {
                    const data = await response.json();
                    showToast(data.error || "Failed to add item to cart.");
                }
            } catch (error) {
                console.error("Cart Error:", error);
                showToast("Network error occurred.");
            }
        });
    }

    // --- CART PAGE (READ, UPDATE, DELETE CRUD) ---
    async function displayCart() {
        const cartItemsContainer = document.querySelector(".cart-items");
        const subtotalEl = document.querySelector(".Subtotal");
        const grandTotalEl = document.querySelector(".grand-total");
        const proceedBtn = document.querySelector(".cart-total .btn");

        if (!cartItemsContainer || !subtotalEl || !grandTotalEl) return;

        const token = sessionStorage.getItem("token");
        if (!token) {
            cartItemsContainer.innerHTML = "<p>Please log in to view your cart.</p>";
            subtotalEl.textContent = "$0.00";
            grandTotalEl.textContent = "$0.00";
            if (proceedBtn) proceedBtn.classList.add("d-none");
            return;
        }

        cartItemsContainer.innerHTML = "<p>Loading cart...</p>";

        try {
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to load cart");
            const cartData = await response.json();
            let items = cartData.items || [];

            // IN-MEMORY FILTERING
            const filterInput = document.querySelector("#cart-filter");
            if (filterInput && filterInput.value.trim() !== "") {
                const searchTerm = filterInput.value.toLowerCase().trim();
                items = items.filter(item => item.productId.title.toLowerCase().includes(searchTerm));
            }

            if (items.length === 0) {
                cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
                subtotalEl.textContent = "$0.00";
                grandTotalEl.textContent = "$0.00";
                updateCartCount();
                if (proceedBtn) proceedBtn.classList.add("d-none");
                return;
            } else {
                if (proceedBtn) proceedBtn.classList.remove("d-none");
            }

            // IN-MEMORY SORTING
            const sortSelect = document.querySelector("#cart-sort");
            if (sortSelect) {
                const sortValue = sortSelect.value;
                items.sort((a, b) => {
                    const priceA = getSafePrice(a.price);
                    const priceB = getSafePrice(b.price);
                    const titleA = a.productId.title;
                    const titleB = b.productId.title;

                    if (sortValue === "title-asc") return titleA.localeCompare(titleB);
                    if (sortValue === "title-desc") return titleB.localeCompare(titleA);
                    if (sortValue === "price-asc") return priceA - priceB;
                    if (sortValue === "price-desc") return priceB - priceA;
                    if (sortValue === "qty-asc") return a.quantity - b.quantity;
                    if (sortValue === "qty-desc") return b.quantity - a.quantity;
                    return 0;
                });
            }

            cartItemsContainer.innerHTML = "";
            const fragment = document.createDocumentFragment();
            let subtotal = 0;
            
            items.forEach((item) => {
                const itemPrice = getSafePrice(item.price);
                const itemTotal = itemPrice * item.quantity;
                subtotal += itemTotal;

                // Extract correct mainImage from the populated product reference
                const colorData = item.productId.colors.find(c => c.name === item.color);
                const itemImage = colorData ? colorData.mainImage : '';

                const cartItem = document.createElement("div");
                cartItem.classList.add("cart-item");
                cartItem.innerHTML = `
                    <div class="product">
                        <img src="${itemImage}" alt="${item.productId.title}">
                        <div class="item-detail">
                            <p>${item.productId.title}</p>
                            <div class="item-variants">
                                <span class="size">${item.size}</span>
                                <span class="color">${item.color}</span>
                            </div>
                        </div>
                    </div>
                    <span class="price">$${itemPrice.toFixed(2)}</span>
                    <div class="quantity">
                        <input type="number" value="${item.quantity}" min="1" aria-label="Quantity">
                    </div>
                    <span class="total-price">$${itemTotal.toFixed(2)}</span>
                    <button class="remove" aria-label="Remove item"><i class="ri-close-line"></i></button>
                `;

                fragment.appendChild(cartItem);

                // UPDATE QUANTITY (Sends PUT to MongoDB)
                cartItem.querySelector('input[type="number"]').addEventListener("change", async (e) => {
                    let newQuantity = Math.floor(Number(e.target.value));
                    if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
                    
                    try {
                        await fetch('/api/cart', {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                                productId: item.productId._id || item.productId.id,
                                color: item.color,
                                size: item.size,
                                quantity: newQuantity
                            })
                        });
                        displayCart(); // Re-render from updated database state
                    } catch (err) {
                        console.error("Failed to update quantity");
                    }
                });

                // REMOVE ITEM (Sends DELETE to MongoDB)
                cartItem.querySelector(".remove").addEventListener("click", async () => {
                    try {
                        await fetch('/api/cart', {
                            method: 'DELETE',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({
                                productId: item.productId._id || item.productId.id,
                                color: item.color,
                                size: item.size
                            })
                        });
                        showToast("Item removed from cart"); 
                        displayCart(); // Re-render from updated database state
                    } catch (err) {
                        console.error("Failed to delete item");
                    }
                });
            });

            cartItemsContainer.appendChild(fragment);

            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            grandTotalEl.textContent = `$${subtotal.toFixed(2)}`;
            updateCartCount();

            if (proceedBtn) {
                // Prevent duplicate listeners on re-render by replacing the button clone
                const newBtn = proceedBtn.cloneNode(true);
                proceedBtn.parentNode.replaceChild(newBtn, proceedBtn);
                newBtn.addEventListener("click", () => {
                    window.location.href = "/checkout";
                });
            }

        } catch (error) {
            console.error("Error loading cart:", error);
            cartItemsContainer.innerHTML = "<p class='error-msg show-error'>Error loading cart from server.</p>";
        }
    }

    // --- CHECKOUT PAGE LOGIC ---
    function displayCheckout() {
        const checkoutForm = document.getElementById("checkout-form");
        if (!checkoutForm) return;

        const nameInput = document.getElementById("name");
        const addressInput = document.getElementById("address");
        const cardInput = document.getElementById("card");
        const expiryInput = document.getElementById("expiry");
        const cvvInput = document.getElementById("cvv");

        const displayMessage = window.showAuthMessage || function(container, message, isError = true) {
            let existingMsg = container.querySelector('.system-msg');
            if (existingMsg) existingMsg.remove();
            const msgDiv = document.createElement('div');
            msgDiv.className = `system-msg ${isError ? 'msg-error' : 'msg-success'}`;
            msgDiv.textContent = message;
            container.insertBefore(msgDiv, container.firstChild);
        };

        const checkoutFields = [
            { el: nameInput, key: "checkout-name" },
            { el: addressInput, key: "checkout-address" }
        ];

        checkoutFields.forEach(field => {
            if (field.el) {
                const savedData = sessionStorage.getItem(field.key);
                if (savedData) field.el.value = savedData;
                field.el.addEventListener('input', (e) => sessionStorage.setItem(field.key, e.target.value));
            }
        });

        function showError(input, isValid) {
            if (!isValid) {
                input.classList.add('input-error');
                input.classList.remove('input-success');
            } else {
                input.classList.add('input-success');
                input.classList.remove('input-error');
            }
        }

        if (cardInput) {
            cardInput.addEventListener("input", (e) => {
                const isValid = /^[0-9\s]+$/.test(e.target.value) && e.target.value.length >= 16;
                showError(cardInput, isValid);
            });
        }

        if (expiryInput) {
            expiryInput.addEventListener("input", (e) => {
                const isValid = /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(e.target.value);
                showError(expiryInput, isValid);
            });
        }

        if (cvvInput) {
            cvvInput.addEventListener("input", (e) => {
                const isValid = /^[0-9]{3,4}$/.test(e.target.value);
                showError(cvvInput, isValid);
            });
        }

        checkoutForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            
            const token = sessionStorage.getItem("token"); 
            if (!token) {
                displayMessage(checkoutForm, "Session expired. Please log in to complete checkout.", true);
                setTimeout(() => window.location.href = "/login", 2000);
                return;
            }

            if (!/^[0-9\s]+$/.test(cardInput.value) || 
                !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiryInput.value) || 
                !/^[0-9]{3,4}$/.test(cvvInput.value)) {
                displayMessage(checkoutForm, "Please verify your payment details!", true);
                return;
            }

            // Note: The backend pulls it directly from the Cart model.
            const orderPayload = {
                token: token,
                customerName: nameInput.value,
                customerAddress: addressInput.value,
                paymentDetails: {
                    card: cardInput.value,
                    expiry: expiryInput.value,
                    cvv: cvvInput.value
                }
            };

            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(orderPayload)
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem("latestOrder", JSON.stringify(data.order));
                    sessionStorage.removeItem("checkout-name");
                    sessionStorage.removeItem("checkout-address");
                    updateCartCount(); // Count drops to 0 since cart is cleared on backend
                    
                    displayMessage(checkoutForm, "Payment Successful! Redirecting to receipt...", false);
                    setTimeout(() => window.location.href = "/confirmation", 1500);
                } else {
                    displayMessage(checkoutForm, `Checkout Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error during checkout:", error);
                displayMessage(checkoutForm, "An error occurred while processing your order. Please try again.", true);
            }
        });
    }

    // --- CONFIRMATION PAGE LOGIC ---
    function displayConfirmation() {
        const orderBox = document.getElementById("order-summary");
        if (!orderBox) return;

        const latestOrder = JSON.parse(sessionStorage.getItem("latestOrder"));

        if (!latestOrder) {
            orderBox.innerHTML = "<p>No recent orders found.</p>";
            return;
        }

        let itemsHTML = latestOrder.items.map(item => `
            <div class="receipt-item">
                <div class="receipt-item-details">
                    <img src="${item.image}" class="receipt-item-img" alt="${item.title}">
                    <div>
                        <p class="receipt-item-title">${item.title}</p>
                        <p class="receipt-item-meta">Qty: ${item.quantity} | ${item.color} | ${item.size}</p>
                    </div>
                </div>
                <span class="receipt-price">$${(getSafePrice(item.price) * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        orderBox.innerHTML = `
            <h3>Shipping To:</h3>
            <p><strong>${latestOrder.customerName}</strong></p>
            <p class="mb-20">${latestOrder.customerAddress}</p>
            
            <h3>Items Purchased:</h3>
            ${itemsHTML}
            
            <div class="receipt-total">
                <strong>Total Paid:</strong>
                <strong class="amount">$${latestOrder.totalPaid.toFixed(2)}</strong>
            </div>
        `;
    }

    updateCartCount();
});