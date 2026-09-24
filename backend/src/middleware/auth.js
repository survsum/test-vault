const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { recordSecurityEvent } = require('../utils/security');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new ApiError(401, 'Access token expired');
      throw new ApiError(401, 'Invalid access token');
    }

    const user = await User.findById(payload.sub);
    if (!user || user.isDeleted || !user.isActive) {
      throw new ApiError(401, 'User no longer has access');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      recordSecurityEvent({
        req,
        eventType: 'AUTHORIZATION',
        action: 'FORBIDDEN_ACTION',
        resourceType: req.baseUrl?.split('/').pop() || null,
        resourceId: req.params?.id || null,
        status: 'BLOCKED',
        riskLevel: 'HIGH',
        description: `${req.user.role} attempted ${req.method} ${req.originalUrl}`,
      }).catch(() => {});
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
