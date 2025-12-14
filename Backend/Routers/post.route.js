const express = require("express");
const PostRouter = express.Router();
const tokenPresence = require('../Middlewares/tokenPresence.js')
const {
  createPost,
  getPostById,
  getHomeFeed,
  deletePost,
  likePost,
  unlikePost,
  commentOnPost,
  getUserPosts,
  savePost,
  unsavePost,
  getSavedPosts
} = require("../controllers/posts.controller");
const ownPost = require("../Middlewares/ownPost.js");

PostRouter.post("/create", tokenPresence, createPost);
PostRouter.get("/feed/home", tokenPresence, getHomeFeed);
PostRouter.get("/user/:userId", tokenPresence, getUserPosts);
PostRouter.get("/saved/:userId", tokenPresence, getSavedPosts);
PostRouter.get("/:id", tokenPresence, getPostById);
PostRouter.delete("/:id", tokenPresence, ownPost, deletePost);
PostRouter.post("/:id/like", tokenPresence, likePost);
PostRouter.post("/:id/unlike", tokenPresence, unlikePost);
PostRouter.post("/:id/comment", tokenPresence, commentOnPost);
PostRouter.post("/:id/save", tokenPresence, savePost);
PostRouter.post("/:id/unsave", tokenPresence, unsavePost);

module.exports = PostRouter;