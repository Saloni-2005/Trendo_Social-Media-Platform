const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "audio", "video", "system"],
    default: "text"
  },
  attachments: [{
    url: String,
    filename: String,
    fileType: String,
    fileSize: Number
  }],
  isRead: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
