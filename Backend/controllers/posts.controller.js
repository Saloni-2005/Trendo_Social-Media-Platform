const Post = require("../Models/posts.schema");
const User = require("../Models/users.schema");
const { createNotification } = require('../services/notificationService');

const createPost = async (req, res) => {
  try {
    const { text, hashtags, visibility, media } = req.body;
    const authorId = req.user.id;

    const newPost = new Post({
      authorId,
      text,
      hashtags,
      visibility,
      media,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
       .populate('authorId', 'username avatarUrl')
       .populate('comments.user', 'username avatarUrl');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error fetching post" });
  }
};

const getHomeFeed = async (req, res) => {
  try {
    const pageSize = 10;
    const pageToken = req.query.pageToken ? parseInt(req.query.pageToken) : 0;
    const posts = await Post.find({ visibility: "public" })
      .sort({ createdAt: -1 })
      .skip(pageToken * pageSize)
      .limit(pageSize)
      .populate('authorId', 'username avatarUrl')
      .lean();
    
    // Check if saved by current user
    const user = await User.findById(req.user.id);
    const postsWithStatus = posts.map(post => ({
        ...post,
        saved: user?.savedPosts?.map(id => id.toString()).includes(post._id.toString()) || false,
        liked: post.likes?.map(id => id.toString()).includes(req.user.id) || false
    }));

    res.status(200).json(postsWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching home feed" });
  }
};

const savePost = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.savedPosts.includes(req.params.id)) {
            user.savedPosts.push(req.params.id);
            await user.save();
        }
        res.status(200).json({ message: "Post saved" });
    } catch (error) {
        res.status(500).json({ message: "Error saving post" });
    }
};

const unsavePost = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.savedPosts = user.savedPosts.filter(id => id.toString() !== req.params.id);
        await user.save();
        res.status(200).json({ message: "Post unsaved" });
    } catch (error) {
        res.status(500).json({ message: "Error unsaving post" });
    }
};

const getSavedPosts = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate({
            path: 'savedPosts',
            populate: { path: 'authorId', select: 'username avatarUrl' }
        });
        res.status(200).json(user.savedPosts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching saved posts" });
    }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (post.likes.includes(req.user.id)) {
        return res.status(400).json({ message: "Already liked" });
    }

    post.likes.push(req.user.id);
    post.likesCount = post.likes.length;
    await post.save();
    
    await createNotification(req, post.authorId, 'like', { postId: post._id, postImage: post.media?.[0]?.url });

    res.status(200).json({ message: "Post liked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error liking post" });
  }
};

const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    post.likesCount = post.likes.length;
    await post.save();
    res.status(200).json({ message: "Post unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unliking post" });
  }
};

const commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
        user: req.user.id,
        text: req.body.text
    };

    post.comments.push(comment);
    post.commentsCount = post.comments.length;
    await post.save();

    await post.populate('comments.user', 'username avatarUrl');
    await post.populate('authorId', 'username avatarUrl');

    await createNotification(req, post.authorId, 'comment', { postId: post._id, commentText: req.body.text, postImage: post.media?.[0]?.url });

    res.status(200).json(post); // Return full post so frontend can update comments
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error commenting on post" });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = req.post; 
    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('authorId', 'username avatarUrl');
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user posts" });
  }
};

module.exports = {
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
  getSavedPosts,
};