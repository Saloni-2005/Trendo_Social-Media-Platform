const Story = require('../Models/stories.schema');
const User = require('../Models/users.schema');

const createStory = async (req, res) => {
    try {
        const { mediaUrl, mediaType } = req.body;
        const story = new Story({
            userId: req.user.id,
            mediaUrl,
            mediaType
        });
        await story.save();
        res.status(201).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating story" });
    }
};

const getStoriesFeed = async (req, res) => {
    try {
        // Get current user's following list
        const user = await User.findById(req.user.id);
        const followingIds = user.following || [];
        
        // Include self
        const targetIds = [...followingIds, req.user.id];

        const stories = await Story.find({
            userId: { $in: targetIds },
            expiresAt: { $gt: new Date() }
        })
        .sort({ createdAt: 1 })
        .populate('userId', 'username avatarUrl');

        // Group by user
        const groupedStories = stories.reduce((acc, story) => {
            const uId = story.userId._id.toString();
            if (!acc[uId]) {
                acc[uId] = {
                    user: story.userId,
                    stories: []
                };
            }
            acc[uId].stories.push(story);
            return acc;
        }, {});

        res.status(200).json(Object.values(groupedStories));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching stories" });
    }
};

const viewStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: "Story not found" });

        if (!story.viewers.includes(req.user.id)) {
            story.viewers.push(req.user.id);
            await story.save();
        }
        res.status(200).json({ message: "Viewed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error viewing story" });
    }
};

const getUserStories = async (req, res) => {
    try {
        const stories = await Story.find({
            userId: req.params.userId,
            expiresAt: { $gt: new Date() }
        })
        .sort({ createdAt: 1 })
        .populate('userId', 'username avatarUrl');
        
        res.status(200).json(stories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching user stories" });
    }
};

module.exports = { createStory, getStoriesFeed, viewStory, getUserStories };
