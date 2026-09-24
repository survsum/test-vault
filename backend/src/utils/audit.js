const AuditLog = require('../models/AuditLog');

async function recordAudit({ req, user, action, resourceType, resourceId, details }) {
  await AuditLog.create({
    user: user || (req?.user?._id ?? null),
    action,
    resourceType,
    resourceId: resourceId || null,
    details: details || {},
    ip: req?.ip || '',
    userAgent: req?.headers?.['user-agent'] || '',
  });
}

module.exports = { recordAudit };
