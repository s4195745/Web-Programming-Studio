const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  content: { type: String, required: true },
}, {timestamps: true});

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  images: [{ type: String }],
  pinned: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('Thread', threadSchema);