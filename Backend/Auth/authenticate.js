const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/users.schema');
const { catchAsync } = require('../Middlewares/errorHandler');
const { 
  ValidationError, 
  AuthenticationError, 
  ConflictError 
} = require('../utils/errors');
require('dotenv').config();

const signup = catchAsync(async (req, res, next) => {
  const { username, email, password, fullName, gender } = req.body;
  
  // Validate required fields
  if (!username || !email || !password) {
    throw new ValidationError('Username, email, and password are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    throw new ConflictError('User with this email or username already exists');
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    displayName: fullName,
    bio: "",
    avatarUrl: "",
  });
  await newUser.save();
  
  // Generate token
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
  
  res.cookie('token', token, cookieOptions);
  res.status(201).json({ 
    status: 'success',
    message: 'User created successfully',
    token,
    user: {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      avatarUrl: newUser.avatarUrl
    }
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user by email or username
  const user = await User.findOne({ 
    $or: [
      { email: email }, 
      { username: email }
    ] 
  });

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }
  
  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AuthenticationError('Invalid credentials');
  }
  
  // Generate tokens
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
  
  res.cookie('token', token, cookieOptions);
  res.cookie('refreshToken', refreshToken, cookieOptions);
  
  res.status(200).json({ 
    status: 'success',
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl
    }
  });
});

const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
  
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({ 
    status: 'success',
    message: 'Logout successful' 
  });
};

const refreshAccessToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    throw new AuthenticationError('No refresh token provided');
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

  // Generate new access token
  const newAccessToken = jwt.sign(
    { id: decoded.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('token', newAccessToken, cookieOptions);
  res.status(200).json({ 
    status: 'success',
    message: 'Token refreshed successfully',
    token: newAccessToken
  });
});

module.exports = { signup, login, logout, refreshAccessToken };
