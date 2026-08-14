const express = require('express');
const app = express();
const PORT = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Serve static assets
app.use('/assets', express.static('assets'));

// Parse incoming JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MOCK IN-MEMORY DATABASE ---
const products = [
    {
        id: 1,
        title: "Hollow Knight Plushie",
        price: 32.00,
        category: "Plushies", 
        description: "Find a home for the Knight that's a little less dangerous than Hallownest.",
        colors: [
            {
                name: "White",
                mainImage: "/assets/cart.images/white/white_hk_main.webp",
                thumbnails: [
                    "/assets/cart.images/white/white_hk_photo1.webp",
                    "/assets/cart.images/white/white_hk_photo2.webp",
                    "/assets/cart.images/white/white_hk_photo3.webp"
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: "Yellow",
                mainImage: "/assets/cart.images/yellow/yellow_hk_main.jpg",
                thumbnails: [
                    "/assets/cart.images/yellow/yellow_hk_photo1.jpg",
                    "/assets/cart.images/yellow/yellow_hk_photo2.jpg",
                    "/assets/cart.images/yellow/yellow_hk_photo3.jpg"
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: "Red",
                mainImage: "/assets/cart.images/red/red_hk_main.jpg",
                thumbnails: [
                    "/assets/cart.images/red/red_hk_photo1.jpg",
                    "/assets/cart.images/red/red_hk_photo2.jpg",
                    "/assets/cart.images/red/red_hk_photo3.jpg"
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            }
        ]
    },
    {
        id: 2,
        title: "PoofyShan Plushie - Endfield",
        price: 35.00,
        category: "Plushies",
        description: "PoofyShan Plushie - The Lost Heirloom Inn collection.",
        colors: [
            {
                name: "Brown",
                mainImage: "/assets/cart.images/brown/enfi_brown_main.avif",
                thumbnails: [
                    "/assets/cart.images/brown/enfi_brown_photo1.avif",
                    "/assets/cart.images/brown/enfi_brown_photo2.avif",
                    "/assets/cart.images/brown/enfi_brown_photo3.avif"
                ],
                sizes: ["S", "M", "L"]
            },
            {
                name: "Red",
                mainImage: "/assets/cart.images/red/enfi_red_main.webp",
                thumbnails: [
                    "/assets/cart.images/red/enfi_red_photo1.avif",
                    "/assets/cart.images/red/enfi_red_photo2.avif",
                    "/assets/cart.images/red/enfi_red_photo3.avif"
                ],
                sizes: ["S", "M", "L"]
            }
        ]
    },
    {
        id: 3,
        title: "Pengu Garen Figure",
        price: 35.99,
        category: "Figures", 
        description: "Exclusive collectible League of Legends Pengu Garen Figure with removable sword.",
        colors: [
            {
                name: "White",
                mainImage: "/assets/cart.images/white/pengu_white_main.webp",
                thumbnails: [
                    "/assets/cart.images/white/pengu_white_photo1.webp",
                    "/assets/cart.images/white/pengu_white_photo2.webp",
                    "/assets/cart.images/white/pengu_white_photo3.webp"
                ],
                sizes: ["S", "M", "L"]
            }
        ]
    }
];

const users = [
    { id: 1, email: "nguyenthechinh2807@gmail.com", password: "Password123!", role: "customer", username: "Nguyen The Chinh", description: "Information Technology student." },
    { id: 2, email: "admin@lootbox.com", password: "AdminPassword1!", role: "admin", username: "Admin", description: "Site Administrator" }
];

const orders = [];

// --- VIEW ROUTES ---
app.get('/', (req, res) => { res.render('index'); });

// Shopping Cart Views
app.get('/shop', (req, res) => { res.render('modules/shopping_cart/index'); });
app.get('/cart', (req, res) => { res.render('modules/shopping_cart/cart'); });
app.get('/product_detail', (req, res) => { res.render('modules/shopping_cart/product_detail'); });
app.get('/checkout', (req, res) => { res.render('modules/shopping_cart/checkout'); });
app.get('/confirmation', (req, res) => { res.render('modules/shopping_cart/confirmation'); });

// User Account Views
app.get('/login', (req, res) => { res.render('modules/user_account_manage/login'); });
app.get('/register', (req, res) => { res.render('modules/user_account_manage/register'); });
app.get('/profile', (req, res) => { res.render('modules/user_account_manage/profile'); });
app.get('/edit_profile', (req, res) => { res.render('modules/user_account_manage/edit_profile'); });
app.get('/change_password', (req, res) => { res.render('modules/user_account_manage/change_password'); });
app.get('/verify_password', (req, res) => { res.render('modules/user_account_manage/verify_password'); });
app.get('/forgot_password', (req, res) => { res.render('modules/user_account_manage/forgot_password'); });
app.get('/forgot_password_confirm', (req, res) => { res.render('modules/user_account_manage/forgot_password_confirm'); });
app.get('/delete_account', (req, res) => { res.render('modules/user_account_manage/delete_account'); });

// --- API ENDPOINTS (CRUD with Server-Side Validation) ---

// 1. READ Products (Catalog Retrieval)
app.get('/api/products', (req, res) => {
    res.status(200).json(products);
});

// 2. READ Single Product
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
});

// 3. User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password are required!" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email format!" });

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        return res.status(200).json({ 
            message: "Login successful", 
            user: { email: user.email, role: user.role, username: user.username, description: user.description } 
        });
    } else {
        return res.status(401).json({ error: "Invalid email or password." });
    }
});

// 4. User Registration (Create)
app.post('/api/register', (req, res) => {
    const { username, email, password, description } = req.body;

    if (!username || !email || !password || !description) return res.status(400).json({ error: "All fields are required!" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email format!" });
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters with 1 letter and 1 number." });
    }

    if (users.find(u => u.email === email)) return res.status(409).json({ error: "Email is already registered." });

    const newUser = { id: users.length + 1, username, email, password, description, role: "customer" };
    users.push(newUser);

    res.status(201).json({ message: "Registration successful" });
});

// 5. User Profile Update (Update)
app.put('/api/profile', (req, res) => {
    const { currentEmail, currentPassword, newUsername, newEmail, newDescription } = req.body;

    if (!currentEmail || !currentPassword) return res.status(400).json({ error: "User identification required." });

    // Server-Side Validation: Ensure the user owns the account they are trying to edit
    const userIndex = users.findIndex(u => u.email === currentEmail && u.password === currentPassword);
    if (userIndex === -1) return res.status(401).json({ error: "Unauthorized request. Session may be invalid." });

    if (newEmail && newEmail !== currentEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: "Invalid email format!" });
        if (users.find(u => u.email === newEmail)) return res.status(409).json({ error: "Email already taken." });
    }

    users[userIndex].username = newUsername || users[userIndex].username;
    users[userIndex].email = newEmail || users[userIndex].email;
    users[userIndex].description = newDescription || users[userIndex].description;

    res.status(200).json({ message: "Profile updated successfully", user: users[userIndex] });
});

// 6. User Password Update (Update)
app.put('/api/change-password', (req, res) => {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) return res.status(400).json({ error: "Missing required fields." });
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
        return res.status(400).json({ error: "Password must be at least 8 characters with 1 letter and 1 number." });
    }

    // Server-Side Validation: Ensure the user owns the account
    const user = users.find(u => u.email === email && u.password === currentPassword);
    if (!user) return res.status(401).json({ error: "Unauthorized request. Session may be invalid." });

    user.password = newPassword;
    res.status(200).json({ message: "Password updated successfully." });
});

// 7. User Account Deletion (Delete)
app.delete('/api/account', (req, res) => {
    const { email, currentPassword } = req.body;

    if (!email || !currentPassword) return res.status(400).json({ error: "Missing required fields." });

    // Server-Side Validation: Ensure the user owns the account
    const userIndex = users.findIndex(u => u.email === email && u.password === currentPassword);
    if (userIndex === -1) return res.status(401).json({ error: "Unauthorized request. Session may be invalid." });

    users.splice(userIndex, 1);
    res.status(200).json({ message: "Account deleted successfully." });
});

// 8. Order Checkout (Create)
app.post('/api/checkout', (req, res) => {
    const { customerName, customerAddress, items, totalPaid, paymentDetails } = req.body;

    if (!customerName || !customerAddress || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing order information or cart is empty." });
    }

    if (!paymentDetails || 
        !/^[0-9\s]{16,}$/.test(paymentDetails.card) || 
        !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(paymentDetails.expiry) || 
        !/^[0-9]{3,4}$/.test(paymentDetails.cvv)) {
        return res.status(400).json({ error: "Invalid payment details." });
    }

    const newOrder = { id: orders.length + 1, customerName, customerAddress, items, totalPaid, date: new Date() };
    orders.push(newOrder);

    res.status(200).json({ message: "Order placed successfully", order: newOrder });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});