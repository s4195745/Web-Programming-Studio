const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');

// GET ALL PRODUCTS (Read)
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({});
        // Map _id to id so frontend JavaScript continues to work seamlessly
        const formattedProducts = products.map(p => ({ ...p.toObject(), id: p._id.toString() }));
        res.status(200).json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: "Failed to load products from database." });
    }
});

// GET SINGLE PRODUCT (Read)
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        res.status(200).json({ ...product.toObject(), id: product._id.toString() });
    } catch (error) {
        res.status(500).json({ error: "Invalid product ID format." });
    }
});

// CHECKOUT (Create)
router.post('/checkout', async (req, res) => {
    const { userEmail, token, customerName, customerAddress, items, paymentDetails } = req.body;

    try {
        // 1. Authentication Check via MongoDB
        const user = await User.findOne({ email: userEmail, token: token });
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

        // 3. Server-Side Validation against MongoDB
        let secureTotalPaid = 0;
        const verifiedItems = [];

        for (const clientItem of items) {
            if (!clientItem.quantity || clientItem.quantity < 1 || isNaN(clientItem.quantity)) {
                return res.status(400).json({ error: "Invalid item quantity detected." });
            }

            const dbProduct = await Product.findById(clientItem.id);
            if (!dbProduct) return res.status(400).json({ error: `Product not found in database.` });
            
            const isValidVariant = dbProduct.colors.some(colorObj => 
                colorObj.name === clientItem.color && colorObj.sizes.includes(clientItem.size)
            );

            if (!isValidVariant) return res.status(400).json({ error: "Invalid product variant selected." });
            
            secureTotalPaid += (dbProduct.price * clientItem.quantity);
            
            // Map the frontend item format to our Order Schema format
            verifiedItems.push({
                productId: dbProduct._id,
                title: clientItem.title,
                price: dbProduct.price,
                color: clientItem.color,
                size: clientItem.size,
                quantity: clientItem.quantity,
                image: clientItem.image
            });
        }

        // 4. Save to Database
        const newOrder = await Order.create({
            userId: user._id,
            customerName,
            customerAddress,
            items: verifiedItems,
            totalPaid: secureTotalPaid,
            paymentDetails: { cardLast4: paymentDetails.card.slice(-4) } // Never store full CC in plain text
        });
        
        res.status(200).json({ message: "Order placed successfully", order: newOrder });
        
    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).json({ error: "Internal server error during checkout." });
    }
});

module.exports = router;