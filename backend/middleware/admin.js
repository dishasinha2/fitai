const { getUserById } = require('../db');

const adminMiddleware = (req, res, next) => {
  const user = getUserById(req.user.id);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  req.adminUser = user;
  return next();
};

module.exports = adminMiddleware;
