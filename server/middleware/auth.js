const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireDM(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'dm') {
      return res.status(403).json({ error: 'DM access required' });
    }
    next();
  });
}

function requirePlayer(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'player') {
      return res.status(403).json({ error: 'Player access required' });
    }
    next();
  });
}

module.exports = { requireAuth, requireDM, requirePlayer, JWT_SECRET };
