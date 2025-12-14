const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 24*60*60*1000 } // 24 hours
});

module.exports = mongoose.model('Story', storySchema);
