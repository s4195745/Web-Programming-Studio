const express = require('express');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use(express.json({ limit: '10mb' })); // Increased limit to accept Base64 Avatar images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- MOCK IN-MEMORY DATABASE ---
const products = [
    {
        id: 1,
        title: "Hollow Knight",
        price: 32.00,
        category: "Plushies", 
        description: "Find a home for the Knight that's a little less dangerous than Hallownest.",
        colors: [
            {
                name: "White",
                mainImage: "../../assets/cart.images/white/white_hk_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/white/white_hk_photo1.jpg",
                    "../../assets/cart.images/white/white_hk_photo2.jpg",
                    "../../assets/cart.images/white/white_hk_photo3.jpg"
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: "Yellow",
                mainImage: "../../assets/cart.images/yellow/yellow_hk_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/yellow/yellow_hk_photo1.jpg",
                    "../../assets/cart.images/yellow/yellow_hk_photo2.jpg",
                    "../../assets/cart.images/yellow/yellow_hk_photo3.jpg"
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: "Red",
                mainImage: "../../assets/cart.images/red/red_hk_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/red/red_hk_photo1.jpg",
                    "../../assets/cart.images/red/red_hk_photo1.jpg",
                    "../../assets/cart.images/red/red_hk_photo1.jpg"
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: "Purple",
                mainImage: "../../assets/cart.images/purple/purple_hk_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/purple/purple_hk_photo1.jpg",
                    "../../assets/cart.images/purple/purple_hk_photo2.jpg",
                    "../../assets/cart.images/purple/purple_hk_photo3.jpg"
                ],
                sizes: ["S", "L"]
            },
            {
                name: "Black",
                mainImage: "../../assets/cart.images/black/black_hk_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/black/black_hk_photo1.jpg",
                    "../../assets/cart.images/black/black_hk_photo2.jpg",
                    "../../assets/cart.images/black/black_hk_photo3.jpg"
                ],
                sizes: ["M", "L", "XL"]
            }
        ]
    },
    {
        id: 2,
        title: "Arknights: Endfield - PoofyShan Plushie - The Lost Heirloom Inn ",
        price: 35.00,
        category: "Plushies",
        description: "PoofyShan Plushie - The Lost Heirloom Inn",
        colors: [
            {
                name: "Brown",
                mainImage: "../../assets/cart.images/brown/enfi_brown_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/brown/enfi_brown_photo1.jpg",
                    "../../assets/cart.images/brown/enfi_brown_photo2.jpg",
                    "../../assets/cart.images/brown/enfi_brown_photo3.jpg"
                ],
                sizes: ["S", "M", "L"]
            },
            {
                name: "Red",
                mainImage: "../../assets/cart.images/red/enfi_red_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/red/enfi_red_photo1.jpg",
                    "../../assets/cart.images/red/enfi_red_photo2.jpg",
                    "../../assets/cart.images/red/enfi_red_photo3.jpg"
                ],
                sizes: ["S", "M", "L"]
            },
            {
                name: "Blue",
                mainImage: "../../assets/cart.images/blue/enfi_blue_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/blue/enfi_blue_photo1.jpg",
                    "../../assets/cart.images/blue/enfi_blue_photo2.jpg",
                    "../../assets/cart.images/blue/enfi_blue_photo3.jpg"
                ],
                sizes: ["S","M", "L"]
            }
        ]
    },
    {
        id: 3,
        title: "Pengu Garen Figure",
        price: 35.99,
        category: "Figures", 
        description: "Whether you think Pengu Garen was the best thing to happen to League of Legends since AP Master Yi or a questionable model of champion readability, our Pengu Garen Figure is here to remind you to speak Pengu and carry a big sword.",
        colors: [
            {
                name: "White",
                mainImage: "../../assets/cart.images/white/pengu_white_main.jpg",
                thumbnails: [
                    "../../assets/cart.images/white/pengu_white_photo1.jpg",
                    "../../assets/cart.images/white/pengu_white_photo2.jpg",
                    "../../assets/cart.images/white/pengu_white_photo3.jpg"
                ],
                sizes: ["S", "M", "L"]
            }
        ]
    }
];


const users = [
    { id: 1, email: "nguyenthechinh2807@gmail.com", password: hashPassword("Password123!"), role: "customer", username: "Nguyen The Chinh", description: "Information Technology student.", avatar: null, token: null },
    { id: 2, email: "admin@lootbox.com", password: hashPassword("AdminPassword1!"), role: "admin", username: "Admin", description: "Site Administrator", avatar: null, token: null }
];
const orders = [];
const orders = [];

// --- VIEW ROUTES ---
app.get('/', (req, res) => { res.render('index'); });
app.get('/shop', (req, res) => { res.render('modules/shopping_cart/index'); });
app.get('/cart', (req, res) => { res.render('modules/shopping_cart/cart'); });
app.get('/product_detail', (req, res) => { res.render('modules/shopping_cart/product_detail'); });
app.get('/checkout', (req, res) => { res.render('modules/shopping_cart/checkout'); });
app.get('/confirmation', (req, res) => { res.render('modules/shopping_cart/confirmation'); });
app.get('/login', (req, res) => { res.render('modules/user_account_manage/login'); });
app.get('/register', (req, res) => { res.render('modules/user_account_manage/register'); });
app.get('/profile', (req, res) => { res.render('modules/user_account_manage/profile'); });
app.get('/edit_profile', (req, res) => { res.render('modules/user_account_manage/edit_profile'); });
app.get('/change_password', (req, res) => { res.render('modules/user_account_manage/change_password'); });
app.get('/verify_password', (req, res) => { res.render('modules/user_account_manage/verify_password'); });
app.get('/forgot_password', (req, res) => { res.render('modules/user_account_manage/forgot_password'); });
app.get('/forgot_password_confirm', (req, res) => { res.render('modules/user_account_manage/forgot_password_confirm'); });
app.get('/delete_account', (req, res) => { res.render('modules/user_account_manage/delete_account'); });

// --- API ENDPOINTS ---

app.get('/api/products', (req, res) => { res.status(200).json(products); });

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
});

// REGISTER: Create a new user account
app.post('/api/register', (req, res) => {
    const { username, email, password, description } = req.body;

    // 1. Validate inputs
    if (!username || !email || !password || !description) return res.status(400).json({ error: "All fields are required!" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email format!" });
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
        return res.status(400).json({ error: "Password must be at least 8 characters with 1 letter and 1 number." });
    }

    // 2. Check if user already exists
    if (users.find(u => u.email === email)) return res.status(409).json({ error: "Email is already registered." });

    // 3. Create and store new user
    const newUser = { 
        id: users.length + 1, 
        username, 
        email, 
        password: hashPassword(password), 
        description, 
        role: "customer",
        avatar: null,
        token: null
    };
    users.push(newUser);

    res.status(201).json({ message: "Registration successful" });
});

// LOGIN: Generates and returns a secure token
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required!" });
    
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        // Generate mock JWT Token
        const token = "mock_token_" + Buffer.from(user.email + Date.now()).toString('base64');
        user.token = token; 
        
        return res.status(200).json({ 
            message: "Login successful", 
            token: token,
            user: { email: user.email, role: user.role, username: user.username, description: user.description, avatar: user.avatar } 
        });
    } else {
        return res.status(401).json({ error: "Invalid email or password." });
    }
});

// PROFILE UPDATE: Now processes Base64 Avatar uploads securely via Token
app.put('/api/profile', (req, res) => {
    const { currentEmail, token, newUsername, newEmail, newDescription, newAvatar } = req.body;
    if (!currentEmail || !token) return res.status(401).json({ error: "Authentication required." });

    const userIndex = users.findIndex(u => u.email === currentEmail && u.token === token);
    if (userIndex === -1) return res.status(401).json({ error: "Invalid or expired session." });

    if (newEmail && newEmail !== currentEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: "Invalid email format!" });
        if (users.find(u => u.email === newEmail)) return res.status(409).json({ error: "Email already taken." });
    }

    users[userIndex].username = newUsername || users[userIndex].username;
    users[userIndex].email = newEmail || users[userIndex].email;
    users[userIndex].description = newDescription || users[userIndex].description;
    if (newAvatar !== undefined) users[userIndex].avatar = newAvatar; // Accepts null or Base64

    res.status(200).json({ message: "Profile updated successfully", user: users[userIndex] });
});

// VERIFY PASSWORD: Required before changing password
app.post('/api/verify-password', (req, res) => {
    const { email, token, password } = req.body;
    const user = users.find(u => u.email === email && u.token === token);
    if (!user) return res.status(401).json({ error: "Invalid session." });
    if (user.password !== hashPassword(password)) return res.status(401).json({ error: "Incorrect current password." });
    res.status(200).json({ message: "Verified." });
});

app.put('/api/change-password', (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: "Missing required fields." });
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) return res.status(400).json({ error: "Weak password." });

    const user = users.find(u => u.email === email && u.token === token);
    if (!user) return res.status(401).json({ error: "Invalid session." });

    user.password = hashPassword(newPassword);
    res.status(200).json({ message: "Password updated successfully." });
});

app.delete('/api/account', (req, res) => {
    const { email, token } = req.body;
    const userIndex = users.findIndex(u => u.email === email && u.token === token);
    if (userIndex === -1) return res.status(401).json({ error: "Invalid session." });

    users.splice(userIndex, 1);
    res.status(200).json({ message: "Account deleted successfully." });
});

// FORGOT PASSWORD
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "If this email exists, a reset link was sent." }); // Security best practice
    res.status(200).json({ message: "Reset link sent." });
});

// CHECKOUT
app.post('/api/checkout', (req, res) => {
    const { userEmail, token, customerName, customerAddress, items, paymentDetails } = req.body;

    // 1. Authentication Check
    if (!userEmail || !token) return res.status(401).json({ error: "Authentication required." });
    const user = users.find(u => u.email === userEmail && u.token === token);
    if (!user) return res.status(401).json({ error: "Session expired or invalid." });

    // 2. Input Validation
    if (!customerName || !customerAddress || !items || items.length === 0) {
        return res.status(400).json({ error: "Missing order information or cart is empty." });
    }

    if (!paymentDetails || 
        !/^[0-9\s]{16,}$/.test(paymentDetails.card) || 
        !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(paymentDetails.expiry) || 
        !/^[0-9]{3,4}$/.test(paymentDetails.cvv)) {
        return res.status(400).json({ error: "Invalid payment details." });
    }

    try {
        // 3. SERVER-SIDE VALIDATION: Recalculate total securely using DB prices
        let secureTotalPaid = 0;
        const verifiedItems = items.map(clientItem => {
            if (!clientItem.quantity || clientItem.quantity < 1 || isNaN(clientItem.quantity)) {
                throw new Error("Invalid item quantity detected.");
            }

            const dbProduct = products.find(p => p.id === clientItem.id);
            if (!dbProduct) throw new Error(`Product ${clientItem.id} not found in database.`);
            
            secureTotalPaid += (dbProduct.price * clientItem.quantity);
            
            return { ...clientItem, price: dbProduct.price };
        });

        const newOrder = { 
            id: orders.length + 1, 
            userId: user.id, 
            customerName, 
            customerAddress, 
            items: verifiedItems, 
            totalPaid: secureTotalPaid, 
            date: new Date() 
        };
        
        orders.push(newOrder);
        res.status(200).json({ message: "Order placed successfully", order: newOrder });
        
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => { console.log(`Server is running at http://localhost:${PORT}`); });