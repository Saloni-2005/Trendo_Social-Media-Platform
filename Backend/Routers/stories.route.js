const express = require('express');
const StoriesRouter = express.Router();
const tokenPresence = require('../Middlewares/tokenPresence');
const { createStory, getStoriesFeed, viewStory, getUserStories, deleteStory } = require('../controllers/stories.controller');

StoriesRouter.post('/create', tokenPresence, createStory);
StoriesRouter.get('/feed', tokenPresence, getStoriesFeed);
StoriesRouter.get('/user/:userId', tokenPresence, getUserStories);
StoriesRouter.post('/:id/view', tokenPresence, viewStory);
StoriesRouter.delete('/:id', tokenPresence, deleteStory);

module.exports = StoriesRouter;
