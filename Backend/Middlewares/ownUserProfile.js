const User = require("../models/users.schema");

const ownUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;

    if (userId !== currentUserId) {
      return res.status(403).json({ message: "You can only modify your own profile" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.targetUser = user;
    next();
  } catch (error) {
    console.error("User ownership check failed:", error);
    res.status(500).json({ message: "Error verifying user ownership" });
  }
};

module.exports = ownUserProfile;
