const Post = require("../models/posts.schema");

const ownPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    req.post = post;
    next();
  } catch (error) {
    console.error("Ownership check failed:", error);
    res.status(500).json({ message: "Error verifying post ownership" });
  }
};

module.exports = ownPost;