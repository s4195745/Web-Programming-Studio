require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

async function fixAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Test123", salt);
    
    await User.findOneAndUpdate(
        { email: "Hothanh@gmail.com" },
        { password: hashedPassword, role: "customer", isLocked: false }
    );
    
    console.log("Admin password successfully reset to: Admin123!");
    process.exit(0);
}
fixAdmin();