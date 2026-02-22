const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({});
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    req.user = { ...decoded, role: decoded.role === 'user' ? 'customer' : decoded.role };
    next();
  } catch {
    res.status(401).json({});
  }
};

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({});
};

const staffOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) return next();
  res.status(403).json({});
};

module.exports = { auth, optionalAuth, adminOnly, staffOnly };
