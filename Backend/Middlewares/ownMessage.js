const Message = require("../Models/messages.schema");

const ownMessage = async (req, res, next) => {
  try {
    const messageId = req.params.messageId || req.params.id;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    req.message = message;
    next();
  } catch (error) {
    console.error("Message ownership check failed:", error);
    res.status(500).json({ message: "Error verifying message ownership" });
  }
};

module.exports = ownMessage;
