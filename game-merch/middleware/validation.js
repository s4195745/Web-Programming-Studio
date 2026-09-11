function validateRegister(req, res, next) {
    const { username, email, password, description } = req.body;
    if (!username || !email || !password || !description) {
        return res.status(400).json({ error: 'All fields are required!' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format!' });
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with 1 letter and 1 number.' });
    }
    next();
}

function validateLogin(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required!' });
    }
    next();
}

function validateProfileUpdate(req, res, next) {
    const { newEmail } = req.body;
    if (newEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return res.status(400).json({ error: 'Invalid email format!' });
        }
    }
    next();
}

function validatePasswordChange(req, res, next) {
    const { newPassword } = req.body;
    if (!newPassword) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
        return res.status(400).json({ error: 'Weak password.' });
    }
    next();
}

function validateAddToCart(req, res, next) {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
        return res.status(400).json({ error: 'Missing productId or quantity.' });
    }
    if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }
    next();
}

function validateUpdateQuantity(req, res, next) {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
        return res.status(400).json({ error: 'Missing productId or quantity.' });
    }
    if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }
    next();
}

function validateRemoveFromCart(req, res, next) {
    const { productId } = req.body;
    if (!productId) {
        return res.status(400).json({ error: 'Missing productId.' });
    }
    next();
}

function validateCheckout(req, res, next) {
    const { customerName, customerAddress, paymentDetails } = req.body;
    if (!customerName || !customerAddress || !paymentDetails) {
        return res.status(400).json({ error: 'Missing checkout information.' });
    }
    if (!paymentDetails.card || paymentDetails.card.length < 4) {
        return res.status(400).json({ error: 'Invalid payment details.' });
    }
    next();
}

module.exports = {
    validateRegister,
    validateLogin,
    validateProfileUpdate,
    validatePasswordChange,
    validateAddToCart,
    validateUpdateQuantity,
    validateRemoveFromCart,
    validateCheckout
};
