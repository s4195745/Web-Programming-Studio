const Thread = require('../models/thread');
const Product = require('../models/product');
 
// Normalize a thread (with populated authorId -> avatar) into an object returned to the client
function formatThread(t, viewerId) {
    const author = t.authorId;
    const heartedBy = t.heartedBy || [];
 
    return {
        ...t,
        authorId: author && author._id ? String(author._id) : (author ? String(author) : null),
        authorAvatar: author && author.avatar ? author.avatar : null,
        heartedBy: undefined,
        heartCount: heartedBy.length,
        heartedByMe: viewerId ? heartedBy.some((id) => String(id) === String(viewerId)) : false,
        replies: (t.replies || []).map((r) => {
            const rAuthor = r.authorId;
            const rHeartedBy = r.heartedBy || [];
            return {
                ...r,
                authorId: rAuthor && rAuthor._id ? String(rAuthor._id) : (rAuthor ? String(rAuthor) : null),
                authorAvatar: rAuthor && rAuthor.avatar ? rAuthor.avatar : null,
                heartedBy: undefined,
                heartCount: rHeartedBy.length,
                heartedByMe: viewerId ? rHeartedBy.some((id) => String(id) === String(viewerId)) : false
            };
        })
    };
}
 
// GET /api/forum/threads - List of threads (public, authentication not required).
async function getThreads(req, res) {
    try {
        const viewerId = req.session?.user?.id || null;
        const threads = await Thread.find({ hidden: { $ne: true } })
            .sort({ pinned: -1, createdAt: -1 })
            .populate('authorId', 'avatar')
            .populate('replies.authorId', 'avatar')
            .lean();
 
        res.status(200).json(threads.map((t) => formatThread(t, viewerId)));
    } catch (error) {
        console.error('Failed to load threads:', error);
        res.status(500).json({ error: 'Failed to load threads from database.' });
    }
}
 
// GET /api/forum/threads/:id - thread details (public)
async function getThreadById(req, res) {
    try {
        const viewerId = req.session?.user?.id || null;
        const thread = await Thread.findOne({ _id: req.params.id, hidden: { $ne: true } })
            .populate('authorId', 'avatar')
            .populate('replies.authorId', 'avatar')
            .lean();
 
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }
        res.status(200).json(formatThread(thread, viewerId));
    } catch (error) {
        console.error('Failed to load thread:', error);
        res.status(400).json({ error: 'Invalid thread id.' });
    }
}
 
// GET /api/forum/related-products - sidebar related products (public)
async function getRelatedProducts(req, res) {
    try {
        const products = await Product.find({}).limit(3);
        res.status(200).json(products);
    } catch (error) {
        console.error('Failed to load related products:', error);
        res.status(500).json({ error: 'Failed to load related products.' });
    }
}
 
// POST /api/forum/threads/:id/like - React on thread
async function toggleHeart(req, res) {
    try {
        const thread = await Thread.findOne({ _id: req.params.id, hidden: { $ne: true } });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }
 
        if (!thread.heartedBy) thread.heartedBy = [];
 
        const userId = req.currentUser._id;
        const alreadyHearted = thread.heartedBy.some((id) => String(id) === String(userId));
 
        if (alreadyHearted) {
            thread.heartedBy = thread.heartedBy.filter((id) => String(id) !== String(userId));
        } else {
            thread.heartedBy.push(userId);
        }
        await thread.save();
 
        res.status(200).json({
            heartCount: thread.heartedBy.length,
            heartedByMe: !alreadyHearted
        });
    } catch (error) {
        console.error('Failed to update tym:', error);
        res.status(400).json({ error: 'Invalid thread id.' });
    }
}

// POST /api/forum/threads/:id/reply/:replyId/like - React on a reply
async function toggleReplyHeart(req, res) {
    try {
        const thread = await Thread.findOne({ _id: req.params.id, hidden: { $ne: true } });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }

        const reply = thread.replies.id(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found.' });
        }

        if (!reply.heartedBy) reply.heartedBy = [];

        const userId = req.currentUser._id;
        const alreadyHearted = reply.heartedBy.some((id) => String(id) === String(userId));

        if (alreadyHearted) {
            reply.heartedBy = reply.heartedBy.filter((id) => String(id) !== String(userId));
        } else {
            reply.heartedBy.push(userId);
        }
        await thread.save();

        res.status(200).json({
            heartCount: reply.heartedBy.length,
            heartedByMe: !alreadyHearted
        });
    } catch (error) {
        console.error('Failed to update tym for reply:', error);
        res.status(400).json({ error: 'Invalid thread or reply id.' });
    }
}
 
// POST /api/forum/threads - Create thread
async function createThread(req, res) {
    try {
        const { thread_title, thread_content } = req.body;
 
        // Store images as Base64 strings directly in document (multer uses memoryStorage()).
        const images = req.files ? req.files.map((f) => {
            const base64Data = f.buffer.toString('base64');
            return `data:${f.mimetype};base64,${base64Data}`;
        }) : [];
 
        const newThread = await Thread.create({
            title: thread_title,
            content: thread_content,
            images,
            author: req.currentUser.username,
            authorId: req.currentUser._id,
            hidden: false,
            replies: []
        });
 
        res.status(201).json({ message: 'Thread created successfully.', thread: newThread });
    } catch (error) {
        console.error('Failed to create thread:', error);
        res.status(500).json({ error: 'Failed to create thread.' });
    }
}
 
// POST /api/forum/threads/:id/reply - Reply to a thread or a specific reply
async function replyToThread(req, res) {
    try {
        const { reply_content, parent_reply_id } = req.body;
 
        const thread = await Thread.findOne({ _id: req.params.id, hidden: { $ne: true } });
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }
 
        // If parent_reply_id exists, verify it actually belongs to this thread
        if (parent_reply_id) {
            const parentExists = thread.replies.some((r) => String(r._id) === String(parent_reply_id));
            if (!parentExists) {
                return res.status(400).json({ error: 'The reply you are replying to no longer exists.' });
            }
        }
 
        const newReply = {
            author: req.currentUser.username,
            authorId: req.currentUser._id,
            content: reply_content,
            parentReplyId: parent_reply_id || null
        };
 
        thread.replies.push(newReply);
        await thread.save();
 
        res.status(201).json({
            message: 'Reply posted successfully.',
            reply: newReply,
            thread
        });
    } catch (error) {
        console.error('Failed to post reply:', error);
        res.status(500).json({ error: 'Failed to post reply.' });
    }
}
 
// POST /api/forum/threads/:id - Edit thread
async function editThread(req, res) {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }
 
        if (String(thread.authorId) !== String(req.currentUser._id)) {
            return res.status(403).json({ error: 'You can only edit your own posts.' });
        }
 
        const { thread_title, thread_content } = req.body;
        thread.title = thread_title || thread.title;
        thread.content = thread_content || thread.content;
 
        if (req.files && req.files.length > 0) {
            // Convert new images to Base64 (multer uses memoryStorage())
            const newImages = req.files.map((f) => {
                const base64Data = f.buffer.toString('base64');
                return `data:${f.mimetype};base64,${base64Data}`;
            });
            // Overwrite existing images with newly uploaded ones (not appended).
            // Retain original images if no new files are provided.
            thread.images = newImages;
        }
 
        await thread.save();
        res.status(200).json({ message: 'Thread updated successfully.', thread });
    } catch (error) {
        console.error('Failed to update thread:', error);
        res.status(500).json({ error: 'Failed to update thread.' });
    }
}
 
// POST /api/forum/threads/:id/delete - Delete own thread (soft-delete).
async function deleteThread(req, res) {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }
 
        if (String(thread.authorId) !== String(req.currentUser._id)) {
            return res.status(403).json({ error: 'You can only delete your own posts.' });
        }
 
        thread.hidden = true;
        await thread.save();
 
        res.status(200).json({ message: 'Thread hidden successfully.' });
    } catch (error) {
        console.error('Failed to delete thread:', error);
        res.status(500).json({ error: 'Failed to delete thread.' });
    }
}
 
// POST /api/forum/threads/:id/admin-delete - Admin soft-deletes another user's thread.
async function adminDeleteThread(req, res) {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ error: 'Thread not found.' });
        }
 
        if (thread.pinned) {
            return res.status(403).json({ error: 'Pinned posts cannot be deleted.' });
        }
 
        thread.hidden = true;
        await thread.save();
 
        res.status(200).json({ message: 'Thread deleted successfully by admin.' });
    } catch (error) {
        console.error('Failed to admin-delete thread:', error);
        res.status(500).json({ error: 'Failed to delete thread.' });
    }
}
 
module.exports = {
    getThreads,
    getThreadById,
    getRelatedProducts,
    toggleHeart,
    toggleReplyHeart,
    createThread,
    replyToThread,
    editThread,
    deleteThread,
    adminDeleteThread
};
 