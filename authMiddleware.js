const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'swahili codes';

export const checkAuth = (roles) => {
  return (req, res, next) => {
    const token = req.cookies?.auth;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, SECRET);
      if (roles.includes(decoded.role)) {
        req.user = decoded;
        return next();
      }
      return res.status(403).json({ message: 'Forbidden' });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
};
