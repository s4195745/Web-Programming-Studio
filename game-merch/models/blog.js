const mongoose = require('mongoose');

// post schema
const postSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    dateAdded: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    categoryIcon: {
        type: String,
        default: ''
    },
    summary: {
        type: String,
        default: ''
    },
    content: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    secondaryImage: {
        type: String,
        default: ''
    },
    comments: [commentSchema]
}, {
    timestamps: true
});


// comments schema
const commentSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
});

module.exports = mongoose.model('Post', postSchema);