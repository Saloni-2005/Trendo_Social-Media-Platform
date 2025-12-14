const jwt = require('jsonwebtoken');
const User = require('../models/users.schema');
const Conversation = require('../models/conversations.schema');
const Message = require('../models/messages.schema');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Map of userId to socketId
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for Socket.IO
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      socket.join(`user_${socket.userId}`);

      // Handle joining conversation rooms
      socket.on('join_conversation', (data) => {
        const { conversationId } = data;
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on('leave_conversation', (data) => {
        const { conversationId } = data;
        socket.leave(`conversation_${conversationId}`);
        console.log(`User ${socket.user.username} left conversation ${conversationId}`);
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const { conversationId, content, messageType = 'text', replyTo, attachments } = data;
          
          // Verify user is participant of this conversation
          const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: socket.userId
          });

          if (!conversation) {
            socket.emit('error', { message: 'Access denied to this conversation' });
            return;
          }

          // Create new message
          const message = new Message({
            conversation: conversationId,
            sender: socket.userId,
            content,
            messageType,
            attachments: attachments || [],
            replyTo
          });

          await message.save();
          await message.populate('sender', 'username displayName avatarUrl');
          await message.populate('replyTo');

          // Update conversation's last message
          conversation.lastMessage = message._id;
          conversation.lastMessageAt = new Date();
          await conversation.save();

          // Emit message to all participants in the conversation
          this.io.to(`conversation_${conversationId}`).emit('new_message', {
            message: message,
            conversationId: conversationId
          });

          // Emit typing stopped event
          socket.to(`conversation_${conversationId}`).emit('typing_stopped', {
            userId: socket.userId,
            username: socket.user.username
          });

        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { conversationId } = data;
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          conversationId: conversationId
        });
      });

      socket.on('typing_stop', (data) => {
        const { conversationId } = data;
        socket.to(`conversation_${conversationId}`).emit('typing_stopped', {
          userId: socket.userId,
          username: socket.user.username,
          conversationId: conversationId
        });
      });

      // Handle message read receipts
      socket.on('mark_messages_read', async (data) => {
        try {
          const { conversationId } = data;
          
          // Verify user is participant of this conversation
          const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: socket.userId
          });

          if (!conversation) {
            socket.emit('error', { message: 'Access denied to this conversation' });
            return;
          }

          // Mark all unread messages in this conversation as read
          await Message.updateMany(
            {
              conversation: conversationId,
              sender: { $ne: socket.userId },
              'isRead.user': { $ne: socket.userId }
            },
            {
              $push: {
                isRead: {
                  user: socket.userId,
                  readAt: new Date()
                }
              }
            }
          );

          // Notify other participants that messages have been read
          socket.to(`conversation_${conversationId}`).emit('messages_read', {
            userId: socket.userId,
            username: socket.user.username,
            conversationId: conversationId
          });

        } catch (error) {
          console.error('Error marking messages as read:', error);
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle online status
      socket.on('set_online_status', (data) => {
        const { isOnline } = data;
        socket.to(`user_${socket.userId}`).emit('user_status_changed', {
          userId: socket.userId,
          username: socket.user.username,
          isOnline: isOnline
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected`);
        this.connectedUsers.delete(socket.userId);
        
        // Notify other users that this user went offline
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          username: socket.user.username
        });
        
        // socket.broadcast.emit('call_ended'); // REMOVED: potentially annoying global broadcast
      });

      // --- Calling Events ---
      
      // Initiate Call
      socket.on('call_user', async (data) => {
          const { userToCall, signalData, from, name, isVideo, conversationId } = data;
          const socketId = this.connectedUsers.get(userToCall);
          
          if (socketId) {
              this.io.to(socketId).emit('call_user', { 
                  signal: signalData, 
                  from, 
                  name,
                  isVideo,
                  conversationId // Pass to receiver too just in case
              });

              // Create system message for Call Started
              if (conversationId) {
                  try {
                      const content = isVideo ? 'Video Call Started' : 'Voice Call Started';
                      const message = new Message({
                          conversation: conversationId,
                          sender: from,
                          content: content,
                          messageType: 'system'
                      });
                      await message.save();

                      this.io.to(`conversation_${conversationId}`).emit('new_message', {
                          message: message,
                          conversationId: conversationId
                      });
                  } catch (err) {
                      console.error("Error saving call start message", err);
                  }
              }
          } else {
              socket.emit('call_failed', { message: 'User is offline' });
          }
      });

      // Answer Call
      socket.on('answer_call', (data) => {
          const { to, signal } = data;
          const socketId = this.connectedUsers.get(to);
          
          if (socketId) {
              this.io.to(socketId).emit('call_accepted', signal);
          }
      });

      // ... (other handlers)

      // End Call
      socket.on('end_call', async (data) => {
          const { to, conversationId, isVideo, initiator } = data; // Receive new fields
          const socketId = this.connectedUsers.get(to);
          
          if (socketId) {
              this.io.to(socketId).emit('call_ended');
          }
          
          if (conversationId && initiator) { // Only log if we have info
              try {
                  const content = isVideo ? 'Video Call' : 'Voice Call';
                  
                  const message = new Message({
                    conversation: conversationId,
                    sender: initiator, // The person who STARTED the call
                    content: content,
                    messageType: 'system'
                  });
                  await message.save();
                  
                  // Notify conversation
                  this.io.to(`conversation_${conversationId}`).emit('new_message', {
                    message: message,
                    conversationId: conversationId
                  });
              } catch(err) {
                  console.error("Error saving system message", err);
              }
          }
      });
    });
  }

  // Method to send notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Method to send message to conversation participants
  sendMessageToConversation(conversationId, message) {
    this.io.to(`conversation_${conversationId}`).emit('new_message', message);
  }

  // Method to get online users
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Method to check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketService;

