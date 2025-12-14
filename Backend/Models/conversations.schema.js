const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    required: function() {
      return this.isGroup;
    }
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
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

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
