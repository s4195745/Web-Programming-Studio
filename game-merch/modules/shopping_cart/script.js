// JS script for future requirements

const productContainer = document.querySelector(".product-list");
const isProductDetailPage = document.querySelector(".product-detail");
const isCartPage = document.querySelector(".cart");
const isCheckoutPage = document.querySelector(".checkout-page");
const isConfirmationPage = document.querySelector(".confirmation-page");

// --- ROUTER ---
if (productContainer) {
    displayProducts();
} else if (isProductDetailPage) {
    displayProductDetail();
} else if (isCartPage) {
    displayCart();
    const sortSelect = document.querySelector("#cart-sort");
    if (sortSelect) sortSelect.addEventListener("change", displayCart);
} else if (isCheckoutPage) {
    displayCheckout();
} else if (isConfirmationPage) {
    displayConfirmation();
}

// --- CART COUNTER IN NAVBAR ---
function updateCartCount() {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartIcon = document.querySelector(".cart-icon");
    
    if (cartIcon) {
        let countSpan = cartIcon.querySelector(".cart-item-count");
        if (!countSpan) {
            countSpan = document.createElement("span");
            countSpan.classList.add("cart-item-count");
            cartIcon.appendChild(countSpan);
        }
        if (totalItems > 0) {
            countSpan.textContent = totalItems;
            countSpan.style.display = "block";
        } else {
            countSpan.style.display = "none";
        }
    }
}

// --- PRODUCT LIST (INDEX PAGE) ---
function displayProducts() {
    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");
        productCard.innerHTML = `
            <div class="img-box">
                <img src="${product.colors[0].mainImage}" alt="${product.title}">
            </div>
            <h2 class="title">${product.title}</h2>
            <span class="price">${product.price}</span>
        `;
        productContainer.appendChild(productCard);
        
        productCard.querySelector(".img-box").addEventListener("click", () => {
            sessionStorage.setItem("selectedProduct", JSON.stringify(product));
            window.location.href = "product-detail.html";
        });
    });
}

// --- PRODUCT DETAIL PAGE ---
function displayProductDetail() {
    const productData = JSON.parse(sessionStorage.getItem("selectedProduct"));
    if (!productData) {
        window.location.href = "index.html";
        return;
    }

    document.querySelector(".title").textContent = productData.title;
    document.querySelector(".price").textContent = productData.price;
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
            img.addEventListener("click", () => mainImageContainer.innerHTML = `<img src="${image}" alt="${productData.title}">`);
            thumbnailContainer.appendChild(img);
        });
    
        colorContainer.innerHTML = "";
        productData.colors.forEach(color => {
            const img = document.createElement("img");
            img.src = color.mainImage;
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

    // ADD TO CART WITH ANIMATION
    addToCartBtn.addEventListener("click", () => {
        let cart = JSON.parse(sessionStorage.getItem("cart")) || [];
        const existingItem = cart.find(item => item.id === productData.id && item.color === selectedColor.name && item.size === selectedSize);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productData.id,
                title: productData.title,
                price: productData.price,
                color: selectedColor.name,
                size: selectedSize,
                quantity: 1,
                image: selectedColor.mainImage
            });
        }
        
        sessionStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount(); // Instant counter update
        
        // Floating +1 Animation
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
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
    const cartItemsContainer = document.querySelector(".cart-items");
    const subtotalEl = document.querySelector(".Subtotal");
    const grandTotalEl = document.querySelector(".grand-total");

    if (!cartItemsContainer || !subtotalEl || !grandTotalEl) return;
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        subtotalEl.textContent = "$0.00";
        grandTotalEl.textContent = "$0.00";
        updateCartCount();
        return;
    }

    const sortSelect = document.querySelector("#cart-sort");
    if (sortSelect) {
        const sortValue = sortSelect.value;
        cart.sort((a, b) => {
            const priceA = parseFloat(a.price.replace("$", ""));
            const priceB = parseFloat(b.price.replace("$", ""));
            
            if (sortValue === "title-asc") return a.title.localeCompare(b.title);
            if (sortValue === "title-desc") return b.title.localeCompare(a.title);
            if (sortValue === "price-asc") return priceA - priceB;
            if (sortValue === "price-desc") return priceB - priceA;
            if (sortValue === "qty-asc") return a.quantity - b.quantity;
            if (sortValue === "qty-desc") return b.quantity - a.quantity;
            return 0;
        });
    }

    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = parseFloat(item.price.replace("$", "")) * item.quantity;
        subtotal += itemTotal;

        const product = typeof products !== 'undefined' ? products.find(p => p.id === item.id) : null;
        const colorData = product ? product.colors.find(c => c.name === item.color) : null;
        const imgSrc = item.image || (colorData ? colorData.mainImage : "");

        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <div class="product">
                <img src="${imgSrc}" alt="${item.title}">
                <div class="item-detail">
                    <p>${item.title}</p>
                    <div style="margin-top: 8px;">
                        <span class="size">${item.size}</span>
                        <span class="color" style="margin-left: 8px;">${item.color}</span>
                    </div>
                </div>
            </div>
            <span class="price">${item.price}</span>
            <div class="quantity">
                <input type="number" value="${item.quantity}" min="1" data-index="${index}">
            </div>
            <span class="total-price">$${itemTotal.toFixed(2)}</span>
            <button class="remove" data-index="${index}"><i class="ri-close-line"></i></button>
        `;

        cartItemsContainer.appendChild(cartItem);

        cartItem.querySelector('input[type="number"]').addEventListener("change", (e) => {
            const newQuantity = parseInt(e.target.value);
            if (newQuantity >= 1) {
                cart[index].quantity = newQuantity; 
                sessionStorage.setItem("cart", JSON.stringify(cart)); 
                displayCart(); 
            }
        });

        cartItem.querySelector(".remove").addEventListener("click", () => {
            cart.splice(index, 1); 
            sessionStorage.setItem("cart", JSON.stringify(cart)); 
            displayCart(); 
        });
    });

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    grandTotalEl.textContent = `$${subtotal.toFixed(2)}`;
    updateCartCount();

    // Link Checkout Button
    const proceedBtn = document.querySelector(".cart-total .btn");
    if (proceedBtn) {
        proceedBtn.addEventListener("click", () => {
            window.location.href = "checkout.html";
        });
    }
}

// --- CHECKOUT PAGE LOGIC ---
function displayCheckout() {
    const checkoutForm = document.getElementById("checkout-form");
    if (!checkoutForm) return;

    checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault(); 
        
        const cart = JSON.parse(sessionStorage.getItem("cart")) || [];
        if (cart.length === 0) {
            alert("Your cart is empty!");
            window.location.href = "cart.html";
            return;
        }

        const name = document.getElementById("name").value;
        const address = document.getElementById("address").value;
        
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.replace("$", "")) * item.quantity), 0);

        const orderData = {
            customerName: name,
            customerAddress: address,
            items: cart,
            totalPaid: subtotal
        };

        sessionStorage.setItem("latestOrder", JSON.stringify(orderData));
        sessionStorage.removeItem("cart"); // Empty the cart
        
        window.location.href = "confirmation.html";
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
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee;">
            <div style="display: flex; gap: 15px; align-items: center;">
                <img src="${item.image}" style="width: 50px; border-radius: 5px;">
                <div>
                    <p style="font-weight: 600; margin-bottom: 5px;">${item.title}</p>
                    <p style="font-size: 14px; color: #666;">Qty: ${item.quantity} | ${item.color} | ${item.size}</p>
                </div>
            </div>
            <span style="font-weight: bold;">$${(parseFloat(item.price.replace("$", "")) * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    orderBox.innerHTML = `
        <h3 style="margin-bottom: 10px;">Shipping To:</h3>
        <p style="margin-bottom: 5px;"><strong>${latestOrder.customerName}</strong></p>
        <p style="margin-bottom: 25px; color: #555;">${latestOrder.customerAddress}</p>
        
        <h3 style="margin-bottom: 15px;">Items Purchased:</h3>
        ${itemsHTML}
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 20px;">
            <strong>Total Paid:</strong>
            <strong style="color: #e35f26;">$${latestOrder.totalPaid.toFixed(2)}</strong>
        </div>
    `;
}

// Run immediately on page load for all pages to ensure navbar count is accurate
updateCartCount();