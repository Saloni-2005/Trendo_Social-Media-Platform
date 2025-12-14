const Comment = require("../models/comments.schema");
const Post = require("../models/posts.schema");

const addComment = async (req, res) => {
  try {
    const { postId, text } = req.body;
    const authorId = req.user.id; 

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = new Comment({ postId, authorId, text });
    await comment.save();

    post.commentsCount += 1;
    await post.save();

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = req.comment; 
    const postId = comment.postId;

    await comment.deleteOne();

    const post = await Post.findById(postId);
    if (post) {
      post.commentsCount = Math.max(0, post.commentsCount - 1);
      await post.save();
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

module.exports = { addComment, getCommentsByPost, deleteComment };