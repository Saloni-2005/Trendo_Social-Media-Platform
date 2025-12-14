// Centralized Error Handling Middleware

const errorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR 💥:', err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return res.status(400).json({
      status: 'fail',
      message,
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
    return res.status(409).json({
      status: 'fail',
      message
    });
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json({
      status: 'fail',
      message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your token has expired. Please log in again.'
    });
  }

  // Operational errors (trusted errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or unknown errors (don't leak error details)
  console.error('UNEXPECTED ERROR 💥:', err);
  
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Something went wrong on the server'
  });
};

// Async error wrapper to catch errors in async route handlers
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  error.status = 'fail';
  error.isOperational = true;
  next(error);
};

module.exports = {
  errorHandler,
  catchAsync,
  notFound
};
