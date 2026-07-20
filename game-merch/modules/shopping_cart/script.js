const productContainer = document.querySelector(".product-list");
const isProductDetailPage = document.querySelector(".product-detail");

if (productContainer) {
    displayProducts();
} else if (isProductDetailPage) {
    displayProductDetail();
} else if (isCartPage) {
    displayCart();
}


//  PRODUCT LIST

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
            sessionStorage.setItem(
                "selectedProduct",
                JSON.stringify(product)
            );

            window.location.href = "product-detail.html";
        });
    });
}

//  PRODUCT DETAIL 

function displayProductDetail() {
    const productData = JSON.parse(sessionStorage.getItem("selectedProduct"));

    if (!productData) {
        window.location.href = "index.html";
        return;
    }

    const titleEl = document.querySelector(".title");
    const priceEl = document.querySelector(".price");
    const descriptionEl = document.querySelector(".description");

    const mainImageContainer = document.querySelector(".main-img");
    const thumbnailContainer = document.querySelector(".thumbnail-list");
    const colorContainer = document.querySelector(".color-options");
    const sizeContainer = document.querySelector(".size-options");

    const addToCartBtn = document.querySelector("#add-cart-btn");

    titleEl.textContent = productData.title;
    priceEl.textContent = productData.price;
    descriptionEl.textContent = productData.description;

    let selectedColor = productData.colors[0];
    let selectedSize = selectedColor.sizes[0];

    function updateProductDisplay(colorData) {

        if (!colorData.sizes.includes(selectedSize)) {
            selectedSize = colorData.sizes[0];
        }

        mainImageContainer.innerHTML = `
            <img src="${colorData.mainImage}" alt="${productData.title}">
        `;

        thumbnailContainer.innerHTML = "";

        const allImages = [
            colorData.mainImage,
            ...colorData.thumbnails
        ];

        allImages.forEach(image => {
            const img = document.createElement("img");
            img.src = image;

            img.addEventListener("click", () => {
                mainImageContainer.innerHTML = `
                    <img src="${image}" alt="${productData.title}">
                `;
            });

            thumbnailContainer.appendChild(img);
        });
    
        colorContainer.innerHTML = "";

        productData.colors.forEach(color => {
            const img = document.createElement("img");

            img.src = color.mainImage;

            if (color.colorName === colorData.colorName) {
                img.classList.add("selected");
            }

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

            if (size === selectedSize) {
                btn.classList.add("selected");
            }

            btn.addEventListener("click", () => {

                document
                    .querySelectorAll(".size-options button")
                    .forEach(button => button.classList.remove("selected"));

                btn.classList.add("selected");

                selectedSize = size;
            });

            sizeContainer.appendChild(btn);
        });
    }

    updateProductDisplay(selectedColor);

    //  ADD TO CART 
    function addToCart(product, color, size) {
        let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

        const existingItem = cart.find(item => item.id === product.id && item.color === color.name && item.size === size);
        if (existingItem) {
            existingItem.quantity +=1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: color.name,
                size: size,
                quantity: 1
            });
        }
    }
    sessionStorage.setItem("cart", JSON.stringify(cart));
}


function displayCart() {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    const cartItemsContainer = document.querySelector(".cart-items");
    const subtotalEl = document.querySelector(".subtotal");
    const grandTotalEl = document.querySelector(".grand-total")

    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty.</p>";
        subtotalEl.textContent ="$0";
        grandTotalEl.textContent ="$0";
        return;
    }

    let subtotal = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = parseFloat(item.price.replace("$", "")) * item.quantity;
        subtotal += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <img src="../../assets/cart.images/product_HK_knight_plush_main.webp">
                <div class="${item.image}">
                    <p>${item.title}</p>
                    <div class="item-detail">
                        <span class="size">${item.size}</span>
                        <span class="color">${item.color}</span>
                    </div>
                </div>
            </div>
            
            <span class="price">${item.price}</span>
            <div class="quantity"><input type="number" value="${item.quantity}" min="1"> data-index="${index}"</div>
            <span class="total-price">$${itemTotal}</span>
            <button class="remove" data-index= "${index}><i class="ri-close-line"></i></button>

        `;   

        cartItemsContainer.appendChild(cartItem);
    });

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`
    grandTotalEl.textContent = `$${subtotal.toFixed(2)}`
}