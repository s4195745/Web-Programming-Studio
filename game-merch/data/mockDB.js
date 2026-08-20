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

const orders = [];

module.exports = {
    hashPassword,
    products,
    users,
    orders,
    getAllUsers,
    updateUserLockStatus,
    getUserById
};