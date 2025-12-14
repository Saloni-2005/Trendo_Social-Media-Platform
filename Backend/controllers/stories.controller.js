const Story = require('../models/stories.schema');
const User = require('../models/users.schema');
const { catchAsync } = require('../Middlewares/errorHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');

const createStory = catchAsync(async (req, res) => {
    const { mediaUrl, mediaType } = req.body;
    
    // Validate required fields
    if (!mediaUrl || !mediaType) {
        throw new ValidationError('Media URL and type are required');
    }
    
    const story = new Story({
        userId: req.user.id,
        mediaUrl,
        mediaType
    });
    
    await story.save();
    
    res.status(201).json({
        status: 'success',
        message: 'Story created successfully',
        data: story
    });
});

const getStoriesFeed = catchAsync(async (req, res) => {
    // Get current user's following list
    const user = await User.findById(req.user.id);
    
    if (!user) {
        throw new NotFoundError('User not found');
    }
    
    const followingIds = user.following || [];
    
    // Include self
    const targetIds = [...followingIds, req.user.id];

    const stories = await Story.find({
        userId: { $in: targetIds },
        expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('userId', 'username avatarUrl displayName');

    // Group by user
    const groupedStories = stories.reduce((acc, story) => {
        // Skip stories where user is null (deleted user)
        if (!story.userId) return acc;
        
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

    res.status(200).json({
        status: 'success',
        data: Object.values(groupedStories)
    });
});

const viewStory = catchAsync(async (req, res) => {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
        throw new NotFoundError('Story not found');
    }
    
    // Check if story has expired
    if (story.expiresAt < new Date()) {
        throw new NotFoundError('Story has expired');
    }

    // Add viewer if not already viewed
    if (!story.viewers.includes(req.user.id)) {
        story.viewers.push(req.user.id);
        await story.save();
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Story viewed',
        data: {
            viewCount: story.viewers.length
        }
    });
});

const getUserStories = catchAsync(async (req, res) => {
    const stories = await Story.find({
        userId: req.params.userId,
        expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('userId', 'username avatarUrl displayName');
    
    res.status(200).json({
        status: 'success',
        data: stories
    });
});

const deleteStory = catchAsync(async (req, res) => {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
        throw new NotFoundError('Story not found');
    }
    
    // Check if user owns the story
    if (story.userId.toString() !== req.user.id) {
        throw new AuthorizationError('You can only delete your own stories');
    }
    
    await story.deleteOne();
    
    res.status(200).json({
        status: 'success',
        message: 'Story deleted successfully'
    });
});

module.exports = { createStory, getStoriesFeed, viewStory, getUserStories, deleteStory };
