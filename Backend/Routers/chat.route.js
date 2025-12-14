const express = require('express');
const router = express.Router();
const {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount
} = require('../controllers/chat.controller');
const tokenPresence = require('../Middlewares/tokenPresence');
const ownMessage = require('../Middlewares/ownMessage');

router.use(tokenPresence);

router.post('/conversations', createOrGetConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/messages', sendMessage);
router.put('/conversations/:conversationId/read', markMessagesAsRead);
router.put('/messages/:messageId', ownMessage, editMessage);
router.delete('/messages/:messageId', ownMessage, deleteMessage);
router.get('/unread-count', getUnreadCount);

module.exports = router;
