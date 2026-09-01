const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString().slice(0, 16) }
});

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  images: [{ type: String }],
  pinned: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  timestamp: { type: String, default: () => new Date().toISOString().slice(0, 16) },
  replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('Thread', threadSchema);