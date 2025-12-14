const Notification = require('../Models/notifications.schema');

// List notifications for logged-in user
const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Mark notifications as read
const markNotificationsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body; // array of notification _id
    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: req.user.id },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications read:", error);
    res.status(500).json({ message: "Error marking notifications read" });
  }
};

module.exports = { listNotifications, markNotificationsRead };