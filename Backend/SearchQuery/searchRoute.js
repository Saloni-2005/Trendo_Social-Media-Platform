const express = require('express');
const SearchRouter = express.Router();
const tokenPresence = require('../Middlewares/tokenPresence');
const Post = require('../models/posts.schema');
const User = require('../models/users.schema');

SearchRouter.get('/', tokenPresence, async (req, res) => {
  const { q, type } = req.query;
  try {
    if (!q) return res.status(400).json({ message: "Query missing" });

    let results = [];
    if (type === "users") {
      results = await User.find({ username: { $regex: q, $options: "i" } }).limit(10);
    } else if (type === "posts") {
      results = await Post.find({ text: { $regex: q, $options: "i" } }).limit(10);
    } else if (type === "hashtags") {
      results = await Post.find({ hashtags: { $regex: q, $options: "i" } }).limit(10);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Search error" });
  }
});

module.exports = SearchRouter;