const User = require("../models/users.schema");
const { createNotification } = require('../services/notificationService');

getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};


updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
};

deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUserId = req.user.id;

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow._id.toString() === currentUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // Check if already following
    if (userToFollow.followers.includes(currentUserId)) {
        return res.status(400).json({ message: "Already following" });
    }

    // Check if already requested
    if (userToFollow.followRequests && userToFollow.followRequests.includes(currentUserId)) {
        return res.status(400).json({ message: "Follow request already sent" });
    }

    if (userToFollow.settings && userToFollow.settings.private) {
        // Send Follow Request
        userToFollow.followRequests.push(currentUserId);
        await userToFollow.save();
        await createNotification(req, userToFollow._id, 'follow_request', {});
        return res.status(200).json({ message: "Follow request sent", status: 'requested' });
    } else {
        // Direct Follow
        userToFollow.followers.push(currentUserId);
        userToFollow.followersCount = userToFollow.followers.length;
        
        currentUser.following.push(userToFollow._id);
        currentUser.followingCount = currentUser.following.length;

        await userToFollow.save();
        await currentUser.save();

        await createNotification(req, userToFollow._id, 'follow', {});
        return res.status(200).json({ message: "User followed successfully", status: 'following' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error following user" });
  }
};

unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUserId = req.user.id;

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToUnfollow._id.toString() === currentUserId) {
      return res.status(400).json({ message: "Cannot unfollow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);
    userToUnfollow.followersCount = userToUnfollow.followers.length;

    currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
    currentUser.followingCount = currentUser.following.length;

    await userToUnfollow.save();
    await currentUser.save();
    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

updateUserSettings = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.settings = { ...user.settings, ...req.body.settings };
    await user.save();
    res.status(200).json({ message: "User settings updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user settings" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    }).limit(20).select('username displayName avatarUrl followersCount followers');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error searching users" });
  }
};

const getUserConnections = async (req, res) => {
  try {
    const { id, type } = req.params; // type = 'followers' or 'following'
    
    const user = await User.findById(id).populate(type, 'username displayName avatarUrl');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user[type] || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching connections" });
  }
};

const acceptFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const requester = await User.findById(requesterId);

    if (!currentUser || !requester) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.followRequests.includes(requesterId)) {
      return res.status(400).json({ message: "No request found" });
    }

    // Remove from requests
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
    
    // Add to followers/following
    currentUser.followers.push(requesterId);
    currentUser.followersCount = currentUser.followers.length;
    
    requester.following.push(currentUserId);
    requester.followingCount = requester.following.length;

    await currentUser.save();
    await requester.save();

    await createNotification(req, requesterId, 'follow_accept', {}); // Notify requester their request was accepted

    res.status(200).json({ message: "Request accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error accepting request" });
  }
};

const rejectFollowRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
    await currentUser.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting request" });
  }
};

const getFollowRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('followRequests', 'username displayName avatarUrl');
    res.status(200).json(user.followRequests || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching requests" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  followUser,
  unfollowUser,
  updateUserSettings,
  searchUsers,
  getUserConnections,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowRequests
};
