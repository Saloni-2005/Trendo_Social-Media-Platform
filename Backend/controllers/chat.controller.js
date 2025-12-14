const Conversation = require('../models/conversations.schema');
const Message = require('../models/messages.schema');
const User = require('../models/users.schema');

const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.id;

    if (currentUserId === participantId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantId] },
      isGroup: false
    }).populate('participants', 'username displayName avatarUrl');

    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, participantId],
        isGroup: false
      });
      await conversation.save();
      await conversation.populate('participants', 'username displayName avatarUrl');
    }

    res.status(200).json({
      message: "Conversation retrieved successfully",
      conversation
    });
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUserConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
    .populate('participants', 'username displayName avatarUrl')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Conversation.countDocuments({
      participants: currentUserId
    });

    res.status(200).json({
      message: "Conversations retrieved successfully",
      conversations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
    .populate('sender', 'username displayName avatarUrl')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    });

    res.status(200).json({
      message: "Messages retrieved successfully",
      conversation: await conversation.populate('participants', 'username displayName avatarUrl'),
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType = 'text', replyTo, attachments } = req.body;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const message = new Message({
      conversation: conversationId,
      sender: currentUserId,
      content,
      messageType,
      attachments: attachments || [],
      replyTo
    });

    await message.save();
    await message.populate('sender', 'username displayName avatarUrl');
    await message.populate('replyTo');

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({
      message: "Message sent successfully",
      messageData: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        'isRead.user': { $ne: currentUserId }
      },
      {
        $push: {
          isRead: {
            user: currentUserId,
            readAt: new Date()
          }
        }
      }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = req.message; 

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username displayName avatarUrl');

    res.status(200).json({
      message: "Message edited successfully",
      messageData: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = req.message; 

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const unreadCount = await Message.countDocuments({
      conversation: { $in: await Conversation.find({ participants: currentUserId }).distinct('_id') },
      sender: { $ne: currentUserId },
      'isRead.user': { $ne: currentUserId },
      isDeleted: false
    });

    res.status(200).json({
      message: "Unread count retrieved successfully",
      unreadCount
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  getUnreadCount
};
