const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token = req.cookies.token;
  
  // If no cookie, try Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;