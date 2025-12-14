const express = require('express');
const {signup, login, logout, refreshAccessToken} = require('../Auth/authenticate');

const AuthRouter = express.Router();

AuthRouter.post('/signup', signup);
AuthRouter.post('/login', login);
AuthRouter.post('/refresh-token', refreshAccessToken);
AuthRouter.post('/logout', logout);

module.exports = AuthRouter;