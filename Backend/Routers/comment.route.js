const express = require('express');
const CommentRouter = express.Router();
const tokenPresence = require('../Middlewares/tokenPresence.js');
const ownComment = require('../Middlewares/ownComment.js');
const { addComment, getCommentsByPost, deleteComment } = require('../controllers/comments.controller');

CommentRouter.post('/', tokenPresence, addComment); 
CommentRouter.get('/:postId', getCommentsByPost);
CommentRouter.delete('/:id', tokenPresence, ownComment, deleteComment); 

module.exports = CommentRouter;