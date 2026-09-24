const SecurityEvent = require('../models/SecurityEvent');

const DEFAULT_RISK = {
  LOGIN_SUCCESS: 'LOW',
  LOGIN_FAILED: 'LOW',
  LOGOUT: 'LOW',
  TOKEN_REFRESH: 'LOW',
  TOKEN_REVOKED: 'LOW',
  REPEATED_FAILED_LOGIN: 'HIGH',
  FORBIDDEN_ACTION: 'HIGH',
  UNAUTHORIZED_ACCESS: 'HIGH',
  EVIDENCE_UPLOAD: 'LOW',
  EVIDENCE_DOWNLOAD: 'LOW',
  EVIDENCE_VERIFY: 'LOW',
  INTEGRITY_FAILURE: 'CRITICAL',
  EVIDENCE_APPROVED: 'LOW',
  EVIDENCE_REJECTED: 'LOW',
  REPORT_GENERATED: 'LOW',
};

function ipFromReq(req) {
  return req?.ip || '';
}

async function recordSecurityEvent({
  req,
  user,
  userRole,
  emailAttempted,
  eventType,
  action,
  resourceType,
  resourceId,
  status,
  riskLevel,
  description,
  metadata,
}) {
  await SecurityEvent.create({
    user: user || req?.user?._id || null,
    userRole: userRole || req?.user?.role || null,
    emailAttempted: emailAttempted || null,
    eventType,
    action,
    resourceType: resourceType || null,
    resourceId: resourceId || null,
    ip: ipFromReq(req),
    userAgent: req?.headers?.['user-agent'] || '',
    status,
    riskLevel: riskLevel || DEFAULT_RISK[action] || 'LOW',
    description: description || '',
    metadata: metadata || {},
  });
}

async function checkFailedLoginThreshold(req, email) {
  const threshold = Number(process.env.FAILED_LOGIN_THRESHOLD || 5);
  const windowMinutes = Number(process.env.FAILED_LOGIN_WINDOW_MINUTES || 10);
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const ip = ipFromReq(req);

  const recentFailures = await SecurityEvent.countDocuments({
    action: 'LOGIN_FAILED',
    ip,
    createdAt: { $gte: since },
  });

  if (recentFailures < threshold) return;

  const alreadyFlagged = await SecurityEvent.findOne({
    action: 'REPEATED_FAILED_LOGIN',
    ip,
    createdAt: { $gte: since },
  });
  if (alreadyFlagged) return;

  await recordSecurityEvent({
    req,
    emailAttempted: email,
    eventType: 'SECURITY',
    action: 'REPEATED_FAILED_LOGIN',
    status: 'BLOCKED',
    riskLevel: 'HIGH',
    description: `${recentFailures} failed login attempts from this IP in the last ${windowMinutes} minutes`,
    metadata: { failureCount: recentFailures, windowMinutes, threshold },
  });
}

module.exports = { recordSecurityEvent, checkFailedLoginThreshold, DEFAULT_RISK };
