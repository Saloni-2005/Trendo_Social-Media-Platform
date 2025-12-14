const express = require('express');
const NotificationRouter = express.Router();
const tokenPresence = require('../Middlewares/tokenPresence');
const { listNotifications, markNotificationsRead } = require('../controllers/notifications.controller');

NotificationRouter.get('/', tokenPresence, listNotifications);
NotificationRouter.post('/mark-read', tokenPresence, markNotificationsRead);

module.exports = NotificationRouter;