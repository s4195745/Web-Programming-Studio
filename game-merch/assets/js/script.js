document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const productContainer = document.querySelector(".product-list");
    const isProductDetailPage = document.querySelector(".product-detail");
    const isCartPage = document.querySelector(".cart");
    const isCheckoutPage = document.querySelector(".checkout-page");
    const isConfirmationPage = document.querySelector(".confirmation-page");

    // --- GLOBAL SEARCH & FILTER STATE ---
    let currentCategoryFilter = "all";
    let currentSearchQuery = "";

    // --- TOAST NOTIFICATION ---
    function showToast(message) {
        const existingToast = document.querySelector(".toast-message");
        if (existingToast) {
            existingToast.remove();
        }

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
            if(window.location.pathname.includes("landing_page.html")) {
                window.location.href = "/shop";
            } else {
                window.location.href = "/shop";
            }
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

    // --- CART COUNTER IN NAVBAR ---
    function updateCartCount() {
        const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
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
                countSpan.style.display = "flex";
            } else {
                countSpan.style.display = "none";
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
        
        // NEW FILTER EVENT LISTENER
        const filterInput = document.querySelector("#cart-filter");
        if (filterInput) filterInput.addEventListener("input", displayCart);
        
    } else if (isCheckoutPage) {
        displayCheckout();
    } else if (isConfirmationPage) {
        displayConfirmation();
    }

    // --- PRODUCT LIST & FILTERING (INDEX PAGE) ---
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

    // --- PRODUCT DETAIL PAGE ---
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
                img.setAttribute("aria-label", `Select color ${color.name}`);
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
                btn.setAttribute("aria-label", `Select size ${size}`);
                if (size === selectedSize) {
                    btn.classList.add("selected");
                    btn.setAttribute("aria-pressed", "true");
                } else {
                    btn.setAttribute("aria-pressed", "false");
                }
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".size-options button").forEach(b => {
                        b.classList.remove("selected");
                        b.setAttribute("aria-pressed", "false");
                    });
                    btn.classList.add("selected");
                    btn.setAttribute("aria-pressed", "true");
                    selectedSize = size;
                });
                sizeContainer.appendChild(btn);
            });
        }

        updateProductDisplay(selectedColor);

        // ADD TO CART
        addToCartBtn.addEventListener("click", () => {
            let cart = JSON.parse(sessionStorage.getItem("cart")) || [];
            const existingItem = cart.find(item => item.id === productData.id && item.color === selectedColor.name && item.size === selectedSize);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: productData.id,
                    title: productData.title,
                    price: safePrice,
                    color: selectedColor.name,
                    size: selectedSize,
                    quantity: 1,
                    image: selectedColor.mainImage
                });
            }
            
            sessionStorage.setItem("cart", JSON.stringify(cart));
            updateCartCount(); 
            showToast(`${productData.title} added to cart!`); 
            
            addToCartBtn.style.position = "relative"; 
            const plusOne = document.createElement("span");
            plusOne.textContent = "+1";
            plusOne.classList.add("plus-one-anim");
            addToCartBtn.appendChild(plusOne);
            
            setTimeout(() => {
                plusOne.remove();
            }, 800);
        });
    }

    // --- CART PAGE ---
    function displayCart() {
        let cart = JSON.parse(sessionStorage.getItem("cart")) || [];
        const cartItemsContainer = document.querySelector(".cart-items");
        const subtotalEl = document.querySelector(".Subtotal");
        const grandTotalEl = document.querySelector(".grand-total");

        if (!cartItemsContainer || !subtotalEl || !grandTotalEl) return;
        cartItemsContainer.innerHTML = "";

        const proceedBtn = document.querySelector(".cart-total .btn");

        // FILTER LOGIC
        const filterInput = document.querySelector("#cart-filter");
        if (filterInput && filterInput.value.trim() !== "") {
            const searchTerm = filterInput.value.toLowerCase().trim();
            cart = cart.filter(item => item.title.toLowerCase().includes(searchTerm));
        }

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>No items found.</p>";
            subtotalEl.textContent = "$0.00";
            grandTotalEl.textContent = "$0.00";
            updateCartCount();
            if (proceedBtn) proceedBtn.style.display = "none";
            return;
        } else {
            if (proceedBtn) proceedBtn.style.display = "block";
        }

        const sortSelect = document.querySelector("#cart-sort");
        if (sortSelect) {
            const sortValue = sortSelect.value;
            cart.sort((a, b) => {
                const priceA = getSafePrice(a.price);
                const priceB = getSafePrice(b.price);

                if (sortValue === "title-asc") return a.title.localeCompare(b.title);
                if (sortValue === "title-desc") return b.title.localeCompare(a.title);
                if (sortValue === "price-asc") return priceA - priceB;
                if (sortValue === "price-desc") return priceB - priceA;
                if (sortValue === "qty-asc") return a.quantity - b.quantity;
                if (sortValue === "qty-desc") return b.quantity - a.quantity;
                return 0;
            });
        }

        const fragment = document.createDocumentFragment();
        let subtotal = 0;
        
        cart.forEach((item) => {
            const itemPrice = getSafePrice(item.price);
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            const cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");
            cartItem.innerHTML = `
                <div class="product">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="item-detail">
                        <p>${item.title}</p>
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

            cartItem.querySelector('input[type="number"]').addEventListener("change", (e) => {
                let newQuantity = Math.floor(Number(e.target.value));
                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1;
                    e.target.value = 1; 
                }
                
                let freshCart = JSON.parse(sessionStorage.getItem("cart")) || [];
                let itemIndex = freshCart.findIndex(c => c.id === item.id && c.color === item.color && c.size === item.size);
                
                if (itemIndex !== -1) {
                    freshCart[itemIndex].quantity = newQuantity;
                    sessionStorage.setItem("cart", JSON.stringify(freshCart));
                    displayCart();
                }
            });

            cartItem.querySelector(".remove").addEventListener("click", () => {
                showToast("Item removed from cart"); 
                
                let freshCart = JSON.parse(sessionStorage.getItem("cart")) || [];
                let itemIndex = freshCart.findIndex(c => c.id === item.id && c.color === item.color && c.size === item.size);
                
                if (itemIndex !== -1) {
                    freshCart.splice(itemIndex, 1);
                    sessionStorage.setItem("cart", JSON.stringify(freshCart));
                    displayCart();
                }
            });
        });

        cartItemsContainer.appendChild(fragment);

        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        grandTotalEl.textContent = `$${subtotal.toFixed(2)}`;
        updateCartCount();

        if (proceedBtn) {
            proceedBtn.addEventListener("click", () => {
                window.location.href = "/checkout";
            });
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

        // CLEAN INLINE UI MESSAGE HELPER (Uses External CSS Classes)
        function showCheckoutMessage(message, isError = true) {
            let existingMsg = document.querySelector('.system-msg');
            if (existingMsg) existingMsg.remove();

            const msgDiv = document.createElement('div');
            msgDiv.className = `system-msg ${isError ? 'msg-error' : 'msg-success'}`;
            msgDiv.textContent = message;

            checkoutForm.insertBefore(msgDiv, checkoutForm.firstChild);
        }

        // Web Storage API for Checkout Form Retention
        const checkoutFields = [
            { el: nameInput, key: "checkout-name" },
            { el: addressInput, key: "checkout-address" }
        ];

        checkoutFields.forEach(field => {
            if (field.el) {
                const savedData = sessionStorage.getItem(field.key);
                if (savedData) field.el.value = savedData;
                
                field.el.addEventListener('input', (e) => {
                    sessionStorage.setItem(field.key, e.target.value);
                });
            }
        });

        // CLEAN INPUT VALIDATION (Uses External CSS Classes)
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
            
            const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
            if (cart.length === 0) {
                showCheckoutMessage("Your cart is empty!", true);
                setTimeout(() => window.location.href = "/cart", 2000);
                return;
            }

            if (!/^[0-9\s]+$/.test(cardInput.value) || 
                !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiryInput.value) || 
                !/^[0-9]{3,4}$/.test(cvvInput.value)) {
                showCheckoutMessage("Please verify your payment details!", true);
                return;
            }

            // FETCH CREDENTIALS FROM SESSION STORAGE
            const userEmail = sessionStorage.getItem("userEmail");
            const token = sessionStorage.getItem("token") || sessionStorage.getItem("userPass"); 

            // SECURE PAYLOAD
            const orderPayload = {
                userEmail: userEmail,
                token: token,
                customerName: nameInput.value,
                customerAddress: addressInput.value,
                items: cart,
                paymentDetails: {
                    card: cardInput.value,
                    expiry: expiryInput.value,
                    cvv: cvvInput.value
                }
            };

            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload)
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem("latestOrder", JSON.stringify(data.order));
                    sessionStorage.removeItem("cart"); 
                    sessionStorage.removeItem("checkout-name");
                    sessionStorage.removeItem("checkout-address");
                    
                    showCheckoutMessage("Payment Successful! Redirecting to receipt...", false);
                    setTimeout(() => window.location.href = "/confirmation", 1500);
                } else {
                    showCheckoutMessage(`Checkout Failed: ${data.error}`, true);
                }
            } catch (error) {
                console.error("Error during checkout:", error);
                showCheckoutMessage("An error occurred while processing your order. Please try again.", true);
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