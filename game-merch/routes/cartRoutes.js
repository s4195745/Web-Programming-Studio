const express = require('express');
const router = express.Router();
const { products, users, orders } = require('../data/mockDB');

// GET ALL PRODUCTS
router.get('/products', (req, res) => { 
    res.status(200).json(products); 
});

// GET SINGLE PRODUCT
router.get('/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
});

// CHECKOUT
router.post('/checkout', (req, res) => {
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
        // 3. SERVER-SIDE VALIDATION
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

module.exports = router;