const PDFDocument = require('pdfkit');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
const { recordSecurityEvent } = require('../utils/security');

function startPdf(res, filename, title) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('gray').text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });
  doc.fillColor('black').moveDown();
  return doc;
}

const caseSummaryReport = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findOne({ _id: req.params.caseId, isDeleted: false })
    .populate('assignedInvestigators', 'name email')
    .populate('createdBy', 'name email');
  if (!caseDoc) throw new ApiError(404, 'Case not found');

  const evidence = await Evidence.find({ case: caseDoc._id, isDeleted: false }).populate('uploadedBy', 'name');

  const doc = startPdf(res, `case-${caseDoc.caseNumber}.pdf`, `Case Summary Report`);
  doc.fontSize(12).text(`Case Number: ${caseDoc.caseNumber}`);
  doc.text(`Title: ${caseDoc.title}`);
  doc.text(`Status: ${caseDoc.status}`);
  doc.text(`Created By: ${caseDoc.createdBy?.name || 'Unknown'}`);
  doc.text(`Assigned Investigators: ${caseDoc.assignedInvestigators.map((i) => i.name).join(', ') || 'None'}`);
  doc.moveDown();
  doc.text(`Description:`);
  doc.text(caseDoc.description || 'No description provided.');
  doc.moveDown();

  doc.fontSize(14).text('Evidence Items', { underline: true });
  doc.moveDown(0.5);
  evidence.forEach((e, i) => {
    doc.fontSize(11).text(`${i + 1}. ${e.originalFilename} — ${e.status}`);
    doc.fontSize(9).fillColor('gray').text(`   Uploaded by ${e.uploadedBy?.name || 'unknown'} on ${e.createdAt.toLocaleString()}`);
    doc.text(`   SHA-256: ${e.sha256}`);
    doc.fillColor('black').moveDown(0.3);
  });

  await recordAudit({ req, action: 'REPORT_GENERATED', resourceType: 'Case', resourceId: caseDoc._id, details: { report: 'case-summary' } });
  await recordSecurityEvent({ req, eventType: 'SYSTEM', action: 'REPORT_GENERATED', resourceType: 'Case', resourceId: caseDoc._id, status: 'SUCCESS', riskLevel: 'LOW', description: 'Case summary PDF generated' });
  doc.end();
});

const evidenceSummaryReport = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.user.role === 'INVESTIGATOR') filter.uploadedBy = req.user._id;

  const evidence = await Evidence.find(filter).populate('case', 'caseNumber title').populate('uploadedBy', 'name');

  const doc = startPdf(res, 'evidence-summary.pdf', 'Evidence Summary Report');
  const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  evidence.forEach((e) => counts[e.status]++);
  doc.fontSize(12).text(`Total Evidence: ${evidence.length}`);
  doc.text(`Pending: ${counts.PENDING}  Approved: ${counts.APPROVED}  Rejected: ${counts.REJECTED}`);
  doc.moveDown();

  evidence.forEach((e, i) => {
    doc.fontSize(11).text(`${i + 1}. ${e.originalFilename} (${e.status}) — Case ${e.case?.caseNumber || 'N/A'}`);
    doc.fontSize(9).fillColor('gray').text(`   Uploaded by ${e.uploadedBy?.name || 'unknown'} on ${e.createdAt.toLocaleString()}`);
    doc.fillColor('black').moveDown(0.3);
  });

  await recordAudit({ req, action: 'REPORT_GENERATED', resourceType: 'Evidence', resourceId: null, details: { report: 'evidence-summary' } });
  await recordSecurityEvent({ req, eventType: 'SYSTEM', action: 'REPORT_GENERATED', resourceType: 'Evidence', status: 'SUCCESS', riskLevel: 'LOW', description: 'Evidence summary PDF generated' });
  doc.end();
});

const chainOfCustodyReport = asyncHandler(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.evidenceId, isDeleted: false }).populate('case', 'caseNumber title');
  if (!evidence) throw new ApiError(404, 'Evidence not found');

  const logs = await AuditLog.find({ resourceType: 'Evidence', resourceId: evidence._id }).populate('user', 'name role').sort({ createdAt: 1 });

  const doc = startPdf(res, `chain-of-custody-${evidence._id}.pdf`, 'Chain of Custody Report');
  doc.fontSize(12).text(`Evidence: ${evidence.originalFilename}`);
  doc.text(`Case: ${evidence.case?.caseNumber || 'N/A'} — ${evidence.case?.title || ''}`);
  doc.text(`SHA-256: ${evidence.sha256}`);
  doc.moveDown();
  doc.fontSize(14).text('Custody Trail', { underline: true });
  doc.moveDown(0.5);

  logs.forEach((log, i) => {
    doc.fontSize(11).text(`${i + 1}. ${log.action}`);
    doc.fontSize(9).fillColor('gray').text(`   By ${log.user?.name || 'system'} (${log.user?.role || '-'}) at ${log.createdAt.toLocaleString()}`);
    doc.fillColor('black').moveDown(0.3);
  });

  await recordAudit({ req, action: 'REPORT_GENERATED', resourceType: 'Evidence', resourceId: evidence._id, details: { report: 'chain-of-custody' } });
  await recordSecurityEvent({ req, eventType: 'SYSTEM', action: 'REPORT_GENERATED', resourceType: 'Evidence', resourceId: evidence._id, status: 'SUCCESS', riskLevel: 'LOW', description: 'Chain of custody PDF generated' });
  doc.end();
});

const auditReport = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(500);

  const doc = startPdf(res, 'audit-report.pdf', 'System Audit Report');
  doc.fontSize(10);
  logs.forEach((log, i) => {
    doc.text(`${i + 1}. [${log.createdAt.toLocaleString()}] ${log.user?.name || 'system'} — ${log.action} (${log.resourceType})`);
  });

  await recordAudit({ req, action: 'REPORT_GENERATED', resourceType: 'AuditLog', resourceId: null, details: { report: 'audit-report' } });
  await recordSecurityEvent({ req, eventType: 'SYSTEM', action: 'REPORT_GENERATED', resourceType: 'AuditLog', status: 'SUCCESS', riskLevel: 'LOW', description: 'System audit PDF generated' });
  doc.end();
});

module.exports = { caseSummaryReport, evidenceSummaryReport, chainOfCustodyReport, auditReport };
