const mongoose = require('mongoose');

// comment schema
const commentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

// post schema
const blogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    author: {
      type: String,
      required: true
    },
    dateAdded: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    categoryIcon: String,
    summary: String,
    content: {
      type: String,
      required: true
    },
    imageUrl: String,
    secondaryImage: {
      type: String,
      default: ''
    },
    comments: {
      type: [commentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Blog', blogSchema);