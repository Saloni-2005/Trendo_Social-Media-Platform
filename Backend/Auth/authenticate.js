const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Models/users.schema');
require('dotenv').config();

const signup = async (req, res) => {
  const { username, email, password, fullName, gender } = req.body;
  try {
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      displayName: fullName, // Map fullName to displayName
      bio: "",
      avatarUrl: "", // Check if we want a default avatar based on gender later
    });
    await newUser.save();
    
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };
    
    res.cookie('token', token, cookieOptions);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error signing up' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body; // email field holds "email or username"
  try {
    // Check if input is email or username
    const user = await User.findOne({ 
        $or: [
            { email: email }, 
            { username: email }
        ] 
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
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
    
    // Return token and user in response for frontend context
    res.status(200).json({ 
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
  
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.status(200).json({ message: 'Logout successful' });
};

const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

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

    // Send new token
    res.cookie('token', newAccessToken, cookieOptions);
    res.status(200).json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

module.exports = { signup, login, logout, refreshAccessToken };