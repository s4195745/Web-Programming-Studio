const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

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
    {
        id: 1,
        email: "nguyenthechinh2807@gmail.com",
        password: hashPassword("Password123!"),
        role: "customer",
        username: "Nguyen The Chinh",
        description: "Information Technology student.",
        avatar: null,
        token: null,
        isLocked: false
    },
    {
        id: 2,
        email: "admin@lootbox.com",
        password: hashPassword("AdminPassword1!"),
        role: "admin",
        username: "Admin",
        description: "Site Administrator",
        avatar: null,
        token: null,
        isLocked: false
    },
    {
        id: 3,
        email: "Hothanh@gmail.com",
        password: hashPassword("Test123"),
        role: "customer",
        username: "ThanhHo",
        description: "customer",
        avatar: null,
        token: null,
        isLocked: false
    }
];

async function getAllUsers() {
    return users;
}

async function updateUserLockStatus(id, isLocked) {
    const user = users.find(u => u.id === parseInt(id, 10));

    if (!user) {
        return null;
    }

    user.isLocked = Boolean(isLocked);
    return user;
}

async function getUserById(id) {
    const user = users.find(u => u.id === parseInt(id, 10));

    if (!user) {
        return null;
    }

    const { password, token, ...safeUser } = user;
    return safeUser;
}

const wishlist = [
    // Sample data: Nguyen The Chinh (user id 1) already has 2 saved items
    { id: 1, userId: 1, productId: 1, purchased: false, addedAt: "2026-08-01T10:00:00.000Z" },
    { id: 2, userId: 1, productId: 3, purchased: true, addedAt: "2026-07-20T10:00:00.000Z" }
];

const orders = [];

const reviews = [
    {
        id: 1,
        userId: 1,
        productId: 1,
        rating: 5,
        title: "Great plush, exactly as pictured",
        description: "The fabric feels premium and the stitching is really clean. Bigger than I expected too.",
        image: null,
        createdAt: "2026-07-10T09:00:00.000Z"
    },
    {
        id: 2,
        userId: 3,
        productId: 3,
        rating: 4,
        title: "Solid figure, good detail",
        description: "The sculpt and paint work are sharper than I expected at this size, though the base feels a bit light.",
        image: null,
        createdAt: "2026-07-05T09:00:00.000Z"
    },
    {
        id: 3,
        userId: 2,
        productId: 2,
        rating: 5,
        title: "Super soft, great gift",
        description: "Bought this as a gift and it did not disappoint, colours are vivid and it's very cuddly.",
        image: null,
        createdAt: "2026-06-28T09:00:00.000Z"
    }
];

//Forum threads

const threads = [
    {
        id: 1, pinned: true,
        title: "Forum rules & how to get the best support for your order",
        content: "Pleadse read this before posting: how to describe your issue, attach proof of purchase, and what response to expect from the team.",
        images:[], author: "Admin", timestamp: "2026-07-19T08:00", hidden: false, replies: []  
    },
    {
        id: 2, pinned: false,
        title: "Just got the Garen figure with the glowing sword — is the blade detail as sharp as in the photos?",
        content: "", images: ["/assets/Product Images/Garen_figure.webp"],
        author: "Oliver Holigate", timestamp: "2026-07-19T15:58", pinned: false, hidden: false,
        replies: [
            { author: "Alex", timestamp: "2026-07-19T16:00", image: "/assets/Product Images/reply for garen figure.jpg",
              content: "Got mine today — the blade edge actually has a nice gradient, not flat purple like some photos show." }
        ]
    },
    {
        id: 3, pinned: false,
        title: "Can the horned plush be machine washed, or just spot-cleaned?",
        content: "", images: ["/assets/Product Images/Orn_plush.webp"],
        author: "Hoang Dang", timestamp: "2026-07-19T11:15", pinned: false, hidden: false,
        replies: [
            { author: "Jacob", timestamp: "2026-07-19T13:00", image: null,
              content: "Wouldn't risk the washing machine, the fur tangles easily. I used a damp cloth with mild soap." }
        ]
    },
    {
        id: 4, pinned: false,
        title: "Between Garen and Galio, which one has better paint quality?",
        content: "", images: ["/assets/Product Images/Galio_figure.webp"],
        author: "Apex", timestamp: "2026-07-16T02:00", pinned: false, hidden: false,
        replies: [
            { author: "Pauloramte", timestamp: "2026-07-18T03:00", image: null,
              content: "Own both. Garen's sword has a nicer gradient, Galio's gold trim lines are cleaner overall." }
        ]
    },
    {
        id: 5, pinned: false,
        title: "Ordered the bundle of all 3 (Garen, Ornn, Galio) — will they ship safely in one box?",
        content: "",
        images: ["/assets/Product Images/Galio_figure.webp", "/assets/Product Images/Garen_figure.webp", "/assets/Product Images/Orn_plush.webp"],
        author: "Beryl", timestamp: "2026-07-10T09:00", pinned: false, hidden: false,
        replies: [
            { author: "Sophia", timestamp: "2026-07-17T15:00", image: null,
              content: "Ordered the same bundle last week, everything arrived intact — each item was foam-wrapped." }
        ]
    }
];


module.exports = {
    hashPassword,
    products,
    users,
    orders,
    wishlist,
    threads,
    reviews,
    getAllUsers,
    updateUserLockStatus,
    getUserById
};