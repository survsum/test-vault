const SecurityEvent = require('../models/SecurityEvent');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { recordSecurityEvent } = require('../utils/security');
const { buildSecurityReportWorkbook, buildAuditLogWorkbook, buildEvidenceActivityWorkbook } = require('../utils/excelReports');

function buildDateFilter(from, to) {
  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) filter.$lte = new Date(to);
  return Object.keys(filter).length ? filter : null;
}

const getStats = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    totalEvents,
    failedLogins,
    successfulLogins,
    unauthorizedAccess,
    integrityFailures,
    suspiciousActivity,
    accountEvents,
    evidenceAccessEvents,
    highRisk,
    critical,
    recentEvents,
    byRiskLevel,
    byEventType,
    byDay,
  ] = await Promise.all([
    SecurityEvent.countDocuments({}),
    SecurityEvent.countDocuments({ action: 'LOGIN_FAILED' }),
    SecurityEvent.countDocuments({ action: 'LOGIN_SUCCESS' }),
    SecurityEvent.countDocuments({ action: { $in: ['UNAUTHORIZED_ACCESS', 'FORBIDDEN_ACTION'] } }),
    SecurityEvent.countDocuments({ action: 'INTEGRITY_FAILURE' }),
    SecurityEvent.countDocuments({ action: 'REPEATED_FAILED_LOGIN' }),
    SecurityEvent.countDocuments({ eventType: 'USER' }),
    SecurityEvent.countDocuments({ action: { $in: ['EVIDENCE_DOWNLOAD', 'EVIDENCE_VERIFY'] } }),
    SecurityEvent.countDocuments({ riskLevel: 'HIGH' }),
    SecurityEvent.countDocuments({ riskLevel: 'CRITICAL' }),
    SecurityEvent.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(10),
    SecurityEvent.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
    SecurityEvent.aggregate([{ $group: { _id: '$eventType', count: { $sum: 1 } } }]),
    SecurityEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalEvents,
      failedLogins,
      successfulLogins,
      unauthorizedAccess,
      integrityFailures,
      suspiciousActivity,
      accountEvents,
      evidenceAccessEvents,
      highRisk,
      critical,
      recentEvents,
      byRiskLevel: byRiskLevel.map((r) => ({ riskLevel: r._id, count: r.count })),
      byEventType: byEventType.map((r) => ({ eventType: r._id, count: r.count })),
      eventsOverTime: byDay.map((d) => ({ date: d._id, count: d.count })),
    },
  });
});

const listEvents = asyncHandler(async (req, res) => {
  const { eventType, riskLevel, action, from, to, search, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (eventType) filter.eventType = eventType;
  if (riskLevel) filter.riskLevel = riskLevel;
  if (action) filter.action = action;
  const dateFilter = buildDateFilter(from, to);
  if (dateFilter) filter.createdAt = dateFilter;
  if (search) {
    filter.$or = [{ description: new RegExp(search, 'i') }, { ip: new RegExp(search, 'i') }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    SecurityEvent.find(filter).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    SecurityEvent.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: events,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await SecurityEvent.findById(req.params.id).populate('user', 'name email role');
  if (!event) throw new ApiError(404, 'Security event not found');
  res.json({ success: true, data: event });
});

const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await SecurityEvent.find({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, data: alerts });
});

const getLoginActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const filter = { eventType: 'AUTHENTICATION', action: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] } };

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    SecurityEvent.find(filter).populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    SecurityEvent.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: events,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

async function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

const exportSecurityReport = asyncHandler(async (req, res) => {
  const workbook = await buildSecurityReportWorkbook();
  const filename = `security-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  await recordSecurityEvent({
    req,
    eventType: 'SYSTEM',
    action: 'REPORT_GENERATED',
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: 'Security report exported to Excel',
  });
  await sendWorkbook(res, workbook, filename);
});

const exportAuditLogs = asyncHandler(async (req, res) => {
  const workbook = await buildAuditLogWorkbook();
  await recordSecurityEvent({
    req,
    eventType: 'SYSTEM',
    action: 'REPORT_GENERATED',
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: 'Audit logs exported to Excel',
  });
  await sendWorkbook(res, workbook, `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`);
});

const exportEvidenceActivity = asyncHandler(async (req, res) => {
  const workbook = await buildEvidenceActivityWorkbook();
  await recordSecurityEvent({
    req,
    eventType: 'SYSTEM',
    action: 'REPORT_GENERATED',
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: 'Evidence activity exported to Excel',
  });
  await sendWorkbook(res, workbook, `evidence-activity-${new Date().toISOString().slice(0, 10)}.xlsx`);
});

module.exports = {
  getStats,
  listEvents,
  getEvent,
  getAlerts,
  getLoginActivity,
  exportSecurityReport,
  exportAuditLogs,
  exportEvidenceActivity,
};
