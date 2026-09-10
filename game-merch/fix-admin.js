require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

async function fixAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("AdminPassword1!", salt);
    
    await User.findOneAndUpdate(
        { email: "admin@lootbox.comHothanh@gmail.com" },
        { password: hashedPassword, role: "admin", isLocked: false }
    );
    
    console.log("Admin password successfully reset to: AdminPassword1!");
    process.exit(0);
}
fixAdmin();