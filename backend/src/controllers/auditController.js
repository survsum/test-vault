const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, resourceType, userId, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (resourceType) filter.resourceType = resourceType;
  if (userId) filter.user = userId;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

module.exports = { listAuditLogs };
