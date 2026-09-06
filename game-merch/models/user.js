const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    description: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    avatar: {
        type: String,
        default: null
    },
    
    isLocked: {
        type: Boolean,
        default: false
    },
    token: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);