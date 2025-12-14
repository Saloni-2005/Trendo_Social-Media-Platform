const Notification = require('../Models/notifications.schema');

const createNotification = async (req, recipientId, type, payload) => {
  try {
    const senderId = req.user.id;
    if (senderId === recipientId.toString()) return; // Don't notify self

    const notification = new Notification({
      userId: recipientId,
      type,
      payload: {
        ...payload,
        senderId,
        senderUsername: req.user.username,
        senderAvatar: req.user.avatarUrl
      }
    });

    await notification.save();

    const socketService = req.app.get('socketService');
    if (socketService) {
      socketService.sendNotificationToUser(recipientId.toString(), notification);
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

module.exports = { createNotification };
