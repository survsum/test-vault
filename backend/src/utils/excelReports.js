const ExcelJS = require('exceljs');
const SecurityEvent = require('../models/SecurityEvent');
const AuditLog = require('../models/AuditLog');
const Evidence = require('../models/Evidence');

function addSheet(workbook, name, columns) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  return sheet;
}

async function buildSecurityReportWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Digital Evidence Vault';
  workbook.created = new Date();

  const [events, auditLogs, evidenceItems] = await Promise.all([
    SecurityEvent.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(2000),
    AuditLog.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(2000),
    Evidence.find({ isDeleted: false }).populate('case', 'caseNumber').populate('uploadedBy', 'name').populate('reviewedBy', 'name'),
  ]);

  const summarySheet = addSheet(workbook, 'Summary', [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 15 },
  ]);
  const totalEvents = events.length;
  const failedLogins = events.filter((e) => e.action === 'LOGIN_FAILED').length;
  const successfulLogins = events.filter((e) => e.action === 'LOGIN_SUCCESS').length;
  const unauthorizedAccess = events.filter((e) => e.action === 'UNAUTHORIZED_ACCESS' || e.action === 'FORBIDDEN_ACTION').length;
  const integrityFailures = events.filter((e) => e.action === 'INTEGRITY_FAILURE').length;
  const highRisk = events.filter((e) => e.riskLevel === 'HIGH').length;
  const criticalRisk = events.filter((e) => e.riskLevel === 'CRITICAL').length;

  summarySheet.addRows([
    { metric: 'Total Security Events', value: totalEvents },
    { metric: 'Failed Logins', value: failedLogins },
    { metric: 'Successful Logins', value: successfulLogins },
    { metric: 'Unauthorized Access Attempts', value: unauthorizedAccess },
    { metric: 'Integrity Failures', value: integrityFailures },
    { metric: 'High Risk Events', value: highRisk },
    { metric: 'Critical Events', value: criticalRisk },
    { metric: 'Report Generated', value: new Date().toLocaleString() },
  ]);

  const eventsSheet = addSheet(workbook, 'Security Events', [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Event Type', key: 'eventType', width: 16 },
    { header: 'Action', key: 'action', width: 22 },
    { header: 'Resource', key: 'resource', width: 16 },
    { header: 'IP Address', key: 'ip', width: 16 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Risk', key: 'risk', width: 10 },
    { header: 'Description', key: 'description', width: 40 },
  ]);
  events.forEach((e) => {
    eventsSheet.addRow({
      timestamp: e.createdAt.toLocaleString(),
      user: e.user?.name || e.emailAttempted || 'Unknown',
      role: e.userRole || '—',
      eventType: e.eventType,
      action: e.action,
      resource: e.resourceType || '—',
      ip: e.ip,
      status: e.status,
      risk: e.riskLevel,
      description: e.description,
    });
  });

  const loginSheet = addSheet(workbook, 'Login Activity', [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Result', key: 'result', width: 12 },
    { header: 'IP Address', key: 'ip', width: 16 },
    { header: 'User Agent', key: 'userAgent', width: 40 },
  ]);
  events
    .filter((e) => e.eventType === 'AUTHENTICATION' && (e.action === 'LOGIN_SUCCESS' || e.action === 'LOGIN_FAILED'))
    .forEach((e) => {
      loginSheet.addRow({
        timestamp: e.createdAt.toLocaleString(),
        email: e.user?.email || e.emailAttempted || 'Unknown',
        result: e.action === 'LOGIN_SUCCESS' ? 'Success' : 'Failed',
        ip: e.ip,
        userAgent: e.userAgent,
      });
    });

  const auditSheet = addSheet(workbook, 'Audit Logs', [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Action', key: 'action', width: 24 },
    { header: 'Resource', key: 'resource', width: 16 },
    { header: 'Resource ID', key: 'resourceId', width: 26 },
  ]);
  auditLogs.forEach((log) => {
    auditSheet.addRow({
      timestamp: log.createdAt.toLocaleString(),
      user: log.user?.name || 'System',
      role: log.user?.role || '—',
      action: log.action,
      resource: log.resourceType,
      resourceId: log.resourceId ? String(log.resourceId) : '—',
    });
  });

  const evidenceSheet = addSheet(workbook, 'Evidence Activity', [
    { header: 'Case', key: 'caseNumber', width: 18 },
    { header: 'Filename', key: 'filename', width: 30 },
    { header: 'Uploaded By', key: 'uploadedBy', width: 20 },
    { header: 'Uploaded At', key: 'uploadedAt', width: 22 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'SHA-256', key: 'sha256', width: 66 },
  ]);
  evidenceItems.forEach((ev) => {
    evidenceSheet.addRow({
      caseNumber: ev.case?.caseNumber || '—',
      filename: ev.originalFilename,
      uploadedBy: ev.uploadedBy?.name || 'Unknown',
      uploadedAt: ev.createdAt.toLocaleString(),
      status: ev.status,
      sha256: ev.sha256,
    });
  });

  const integritySheet = addSheet(workbook, 'Integrity Checks', [
    { header: 'Filename', key: 'filename', width: 30 },
    { header: 'Last Checked', key: 'checkedAt', width: 22 },
    { header: 'Result', key: 'result', width: 12 },
  ]);
  evidenceItems
    .filter((ev) => ev.lastIntegrityCheck?.checkedAt)
    .forEach((ev) => {
      integritySheet.addRow({
        filename: ev.originalFilename,
        checkedAt: ev.lastIntegrityCheck.checkedAt.toLocaleString(),
        result: ev.lastIntegrityCheck.valid ? 'Valid' : 'Failed',
      });
    });

  const violationsSheet = addSheet(workbook, 'Access Violations', [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Action', key: 'action', width: 22 },
    { header: 'Resource', key: 'resource', width: 16 },
    { header: 'IP Address', key: 'ip', width: 16 },
    { header: 'Description', key: 'description', width: 40 },
  ]);
  events
    .filter((e) => e.action === 'UNAUTHORIZED_ACCESS' || e.action === 'FORBIDDEN_ACTION')
    .forEach((e) => {
      violationsSheet.addRow({
        timestamp: e.createdAt.toLocaleString(),
        user: e.user?.name || 'Unknown',
        role: e.userRole || '—',
        action: e.action,
        resource: e.resourceType || '—',
        ip: e.ip,
        description: e.description,
      });
    });

  const userActivitySheet = addSheet(workbook, 'User Activity', [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Action', key: 'action', width: 24 },
  ]);
  auditLogs
    .filter((log) => log.resourceType === 'User')
    .forEach((log) => {
      userActivitySheet.addRow({
        timestamp: log.createdAt.toLocaleString(),
        user: log.user?.name || 'System',
        role: log.user?.role || '—',
        action: log.action,
      });
    });

  return workbook;
}

async function buildAuditLogWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Digital Evidence Vault';
  workbook.created = new Date();

  const logs = await AuditLog.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(5000);

  const sheet = addSheet(workbook, 'Audit Logs', [
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'User', key: 'user', width: 20 },
    { header: 'Role', key: 'role', width: 14 },
    { header: 'Action', key: 'action', width: 24 },
    { header: 'Resource', key: 'resource', width: 16 },
    { header: 'Resource ID', key: 'resourceId', width: 26 },
    { header: 'IP Address', key: 'ip', width: 16 },
    { header: 'Description', key: 'description', width: 40 },
  ]);

  logs.forEach((log) => {
    sheet.addRow({
      timestamp: log.createdAt.toLocaleString(),
      user: log.user?.name || 'System',
      role: log.user?.role || '—',
      action: log.action,
      resource: log.resourceType,
      resourceId: log.resourceId ? String(log.resourceId) : '—',
      ip: log.ip,
      description: JSON.stringify(log.details || {}),
    });
  });

  return workbook;
}

async function buildEvidenceActivityWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Digital Evidence Vault';
  workbook.created = new Date();

  const evidenceItems = await Evidence.find({ isDeleted: false })
    .populate('case', 'caseNumber title')
    .populate('uploadedBy', 'name email')
    .populate('reviewedBy', 'name email');

  const sheet = addSheet(workbook, 'Evidence Activity', [
    { header: 'Evidence ID', key: 'id', width: 26 },
    { header: 'Case', key: 'caseNumber', width: 16 },
    { header: 'Original Filename', key: 'filename', width: 28 },
    { header: 'Uploaded By', key: 'uploadedBy', width: 20 },
    { header: 'Upload Time', key: 'uploadedAt', width: 22 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'SHA-256', key: 'sha256', width: 66 },
    { header: 'Last Integrity Check', key: 'lastCheck', width: 22 },
    { header: 'Integrity Result', key: 'integrityResult', width: 16 },
    { header: 'Reviewed By', key: 'reviewedBy', width: 20 },
    { header: 'Rejection Reason', key: 'rejectionReason', width: 30 },
  ]);

  evidenceItems.forEach((ev) => {
    sheet.addRow({
      id: String(ev._id),
      caseNumber: ev.case?.caseNumber || '—',
      filename: ev.originalFilename,
      uploadedBy: ev.uploadedBy?.name || 'Unknown',
      uploadedAt: ev.createdAt.toLocaleString(),
      status: ev.status,
      sha256: ev.sha256,
      lastCheck: ev.lastIntegrityCheck?.checkedAt ? ev.lastIntegrityCheck.checkedAt.toLocaleString() : 'Never',
      integrityResult: ev.lastIntegrityCheck?.valid === null || ev.lastIntegrityCheck?.valid === undefined
        ? '—'
        : ev.lastIntegrityCheck.valid
          ? 'Valid'
          : 'Failed',
      reviewedBy: ev.reviewedBy?.name || '—',
      rejectionReason: ev.rejectionReason || '—',
    });
  });

  return workbook;
}

module.exports = { buildSecurityReportWorkbook, buildAuditLogWorkbook, buildEvidenceActivityWorkbook };
