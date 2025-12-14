# Centralized Error Handling System

This document explains the centralized error handling system implemented in the Trendo backend.

## Overview

The error handling system provides:
- **Custom error classes** for different error types
- **Centralized error middleware** for consistent error responses
- **Async error wrapper** to eliminate try-catch boilerplate
- **Automatic error transformation** for common errors (Mongoose, JWT, etc.)

## Custom Error Classes

Located in `utils/errors.js`:

### AppError (Base Class)
Base class for all operational errors.

```javascript
const { AppError } = require('../utils/errors');
throw new AppError('Something went wrong', 500);
```

### ValidationError (400)
For input validation errors.

```javascript
const { ValidationError } = require('../utils/errors');
throw new ValidationError('Email and password are required');
```

### AuthenticationError (401)
For authentication failures.

```javascript
const { AuthenticationError } = require('../utils/errors');
throw new AuthenticationError('Invalid credentials');
```

### AuthorizationError (403)
For permission/authorization errors.

```javascript
const { AuthorizationError } = require('../utils/errors');
throw new AuthorizationError('You do not have permission to delete this post');
```

### NotFoundError (404)
For resource not found errors.

```javascript
const { NotFoundError } = require('../utils/errors');
throw new NotFoundError('User not found');
```

### ConflictError (409)
For resource conflicts (e.g., duplicate entries).

```javascript
const { ConflictError } = require('../utils/errors');
throw new ConflictError('User with this email already exists');
```

### DatabaseError (500)
For database operation failures.

```javascript
const { DatabaseError } = require('../utils/errors');
throw new DatabaseError('Failed to save user');
```

## Error Handling Middleware

Located in `Middlewares/errorHandler.js`:

### catchAsync
Wrapper for async route handlers - eliminates try-catch blocks.

**Before:**
```javascript
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

**After:**
```javascript
const { catchAsync } = require('../Middlewares/errorHandler');
const { NotFoundError } = require('../utils/errors');

const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
});
```

### errorHandler
Global error handling middleware that:
- Transforms Mongoose errors (validation, duplicate key, cast errors)
- Transforms JWT errors (invalid token, expired token)
- Handles custom operational errors
- Prevents error details leakage in production

### notFound
404 handler for undefined routes.

## Usage Examples

### Example 1: Authentication Controller

```javascript
const { catchAsync } = require('../Middlewares/errorHandler');
const { ValidationError, AuthenticationError } = require('../utils/errors');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }
  
  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AuthenticationError('Invalid credentials');
  }
  
  // Success response
  res.json({ token, user });
});
```

### Example 2: Post Controller

```javascript
const { catchAsync } = require('../Middlewares/errorHandler');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

const deletePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  if (post.author.toString() !== req.user.id) {
    throw new AuthorizationError('You can only delete your own posts');
  }
  
  await post.remove();
  res.json({ message: 'Post deleted successfully' });
});
```

### Example 3: User Controller

```javascript
const { catchAsync } = require('../Middlewares/errorHandler');
const { ConflictError, NotFoundError } = require('../utils/errors');

const updateUser = catchAsync(async (req, res) => {
  const { username, email } = req.body;
  
  // Check for duplicate username/email
  const existing = await User.findOne({
    _id: { $ne: req.params.id },
    $or: [{ username }, { email }]
  });
  
  if (existing) {
    throw new ConflictError('Username or email already in use');
  }
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json(user);
});
```

## Error Response Format

All errors return a consistent JSON format:

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "fail",  // or "error" for 5xx
  "message": "Error description"
}
```

### Validation Error Response
```json
{
  "status": "fail",
  "message": "Invalid input data. Field is required. Email must be valid.",
  "errors": [
    "Field is required",
    "Email must be valid"
  ]
}
```

## Automatic Error Transformations

The error handler automatically transforms common errors:

### Mongoose Validation Error
```javascript
// Mongoose error
{
  name: 'ValidationError',
  errors: { email: { message: 'Email is required' } }
}

// Transformed response (400)
{
  "status": "fail",
  "message": "Invalid input data. Email is required.",
  "errors": ["Email is required"]
}
```

### Mongoose Duplicate Key Error
```javascript
// MongoDB error
{ code: 11000, keyValue: { email: 'test@example.com' } }

// Transformed response (409)
{
  "status": "fail",
  "message": "Duplicate field value: email = \"test@example.com\". Please use another value."
}
```

### Mongoose Cast Error (Invalid ID)
```javascript
// Mongoose error
{ name: 'CastError', path: '_id', value: 'invalid-id' }

// Transformed response (400)
{
  "status": "fail",
  "message": "Invalid _id: invalid-id"
}
```

### JWT Errors
```javascript
// Invalid token
{
  "status": "fail",
  "message": "Invalid token. Please log in again."
}

// Expired token
{
  "status": "fail",
  "message": "Your token has expired. Please log in again."
}
```

## Best Practices

1. **Always use catchAsync** for async route handlers
2. **Throw appropriate error classes** instead of sending responses directly
3. **Use specific error types** (ValidationError, NotFoundError, etc.) instead of generic AppError
4. **Don't catch errors** in controllers - let the global handler manage them
5. **Validate input early** and throw ValidationError for invalid data
6. **Use meaningful error messages** that help users understand what went wrong

## Migration Guide

To migrate existing controllers:

1. Import catchAsync and error classes:
```javascript
const { catchAsync } = require('../Middlewares/errorHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
```

2. Wrap async handlers with catchAsync:
```javascript
// Before
const handler = async (req, res) => { ... }

// After
const handler = catchAsync(async (req, res) => { ... });
```

3. Replace error responses with thrown errors:
```javascript
// Before
if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

// After
if (!user) {
  throw new NotFoundError('User not found');
}
```

4. Remove try-catch blocks - catchAsync handles them automatically.
