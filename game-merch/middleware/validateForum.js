// Request validation for the Discussion Forum module.
// Runs before the controller so forumController only ever sees a well-formed
 
function validateCreateThread(req, res, next) {
    const { thread_title, thread_content } = req.body;
    if (!thread_title || !thread_title.trim()) {
        return res.status(400).json({ error: 'Title is required.' });
    }
    if (!thread_content || !thread_content.trim()) {
        return res.status(400).json({ error: 'Content is required.' });
    }
    next();
}
 
function validateReply(req, res, next) {
    const { reply_content } = req.body;
    if (!reply_content || !reply_content.trim()) {
        return res.status(400).json({ error: 'Reply content is required.' });
    }
    next();
}
 
module.exports = {
    validateCreateThread,
    validateReply
};