const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  displayName: {type: String, required: true},
  bio: {type: String, default: ""},
  avatarUrl: {type: String, default: ""},
  followersCount: {type: Number, default: 0},
  followingCount: {type: Number, default: 0},
  followers: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  following: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  savedPosts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
  followRequests: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  settings: {
    private: {type: Boolean, default: false},
    notifications: {type: Object, default: {}},
  },
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);