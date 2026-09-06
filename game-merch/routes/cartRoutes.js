const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Cart = require('../models/cart');

// --- HELPER: Authenticate User ---
async function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    
    const user = await User.findOne({ token: token });
    if (!user) return res.status(401).json({ error: "Session expired." });
    
    req.user = user;
    next();
}

// GET ALL PRODUCTS
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        const formattedProducts = products.map(p => ({ ...p.toObject(), id: p._id.toString() }));
        res.status(200).json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: "Failed to load products." });
    }
});

// GET SINGLE PRODUCT
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.status(200).json({ ...product.toObject(), id: product._id.toString() });
    } catch (error) {
        res.status(500).json({ error: "Invalid ID." });
    }
});

// GET USER CART (READ)
router.get('/cart', authenticate, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
        if (!cart) {
            cart = await Cart.create({ userId: req.user._id, items: [] });
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch cart." });
    }
});

// ADD TO CART (CREATE)
router.post('/cart', authenticate, async (req, res) => {
    const { productId, color, size, quantity, price } = req.body;
    
    try {
        let cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) cart = new Cart({ userId: req.user._id, items: [] });

        const existingItemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId && 
            item.color === color && 
            item.size === size
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ productId, color, size, quantity, price });
        }

        await cart.save();
        res.status(200).json({ message: "Added to cart", cart });
    } catch (error) {
        res.status(500).json({ error: "Failed to update cart." });
    }
});

// UPDATE CART QUANTITY (UPDATE)
router.put('/cart', authenticate, async (req, res) => {
    const { productId, color, size, quantity } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) return res.status(404).json({ error: "Cart not found." });

        const item = cart.items.find(i => 
            i.productId.toString() === productId && i.color === color && i.size === size
        );

        if (item) {
            item.quantity = quantity;
            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(404).json({ error: "Item not found in cart." });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update quantity." });
    }
});

// REMOVE FROM CART (DELETE)
router.delete('/cart', authenticate, async (req, res) => {
    const { productId, color, size } = req.body;
    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart) return res.status(404).json({ error: "Cart not found." });

        cart.items = cart.items.filter(i => 
            !(i.productId.toString() === productId && i.color === color && i.size === size)
        );

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: "Failed to remove item." });
    }
});

// CHECKOUT (CREATE)
router.post('/checkout', authenticate, async (req, res) => {
    const { customerName, customerAddress, paymentDetails } = req.body;

    try {
        const cart = await Cart.findOne({ userId: req.user._id });
        if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty." });

        if (!customerName || !customerAddress || !paymentDetails) {
            return res.status(400).json({ error: "Missing checkout information." });
        }

        let secureTotalPaid = 0;
        const verifiedItems = [];

        for (const cartItem of cart.items) {
            const dbProduct = await Product.findById(cartItem.productId);
            if (!dbProduct) continue; 
            
            secureTotalPaid += (dbProduct.price * cartItem.quantity);
            
            verifiedItems.push({
                productId: dbProduct._id,
                title: dbProduct.title,
                price: dbProduct.price,
                color: cartItem.color,
                size: cartItem.size,
                quantity: cartItem.quantity,
                image: dbProduct.colors.find(c => c.name === cartItem.color)?.mainImage
            });
        }

        const newOrder = await Order.create({
            userId: req.user._id,
            customerName,
            customerAddress,
            items: verifiedItems,
            totalPaid: secureTotalPaid,
            paymentDetails: { cardLast4: paymentDetails.card.slice(-4) }
        });
        
        cart.items = [];
        await cart.save();
        
        res.status(200).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
        res.status(500).json({ error: "Checkout failed." });
    }
});

module.exports = router;