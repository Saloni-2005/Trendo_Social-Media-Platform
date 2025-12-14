const Comment = require("../Models/comments.schema");

const ownComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.authorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to modify this comment" });
    }

    req.comment = comment;
    next();
  } catch (error) {
    console.error("Comment ownership check failed:", error);
    res.status(500).json({ message: "Error verifying comment ownership" });
  }
};

module.exports = ownComment;
