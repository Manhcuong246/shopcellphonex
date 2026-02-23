const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({});
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { ...decoded, role: decoded.role === 'user' ? 'customer' : decoded.role };
    next();
  } catch {
    res.status(401).json({});
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

const adminOnly = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(403).json({}));
const staffOnly = (req, res, next) => ((req.user?.role === 'staff' || req.user?.role === 'admin') ? next() : res.status(403).json({}));

module.exports = { auth, optionalAuth, adminOnly, staffOnly };
