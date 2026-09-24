const fs = require('fs');
const path = require('path');
const Evidence = require('../models/Evidence');
const Case = require('../models/Case');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
const { recordSecurityEvent } = require('../utils/security');
const { notifyUsers } = require('../utils/notify');
const { sha256File } = require('../utils/hash');
const { uploadDir } = require('../middleware/upload');

async function assertCaseAccess(caseId, user) {
  const caseDoc = await Case.findOne({ _id: caseId, isDeleted: false });
  if (!caseDoc) throw new ApiError(404, 'Case not found');
  if (user.role === 'INVESTIGATOR' && !caseDoc.assignedInvestigators.map(String).includes(String(user._id))) {
    throw new ApiError(403, 'You are not assigned to this case');
  }
  return caseDoc;
}

function scopeEvidenceToUser(filter, user) {
  if (user.role === 'INVESTIGATOR') {
    filter.uploadedBy = user._id;
  }
  return filter;
}

async function assertEvidenceAccess(req, evidence) {
  const uploaderId = evidence.uploadedBy?._id || evidence.uploadedBy;
  if (req.user.role === 'INVESTIGATOR' && String(uploaderId) !== String(req.user._id)) {
    await recordSecurityEvent({
      req,
      eventType: 'AUTHORIZATION',
      action: 'UNAUTHORIZED_ACCESS',
      resourceType: 'Evidence',
      resourceId: evidence._id,
      status: 'BLOCKED',
      riskLevel: 'HIGH',
      description: 'Investigator attempted to access evidence they did not upload',
    });
    throw new ApiError(403, 'You are not authorized to access this evidence');
  }
}

const uploadEvidence = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'A file is required');
  const { caseId, description } = req.body;

  const caseDoc = await assertCaseAccess(caseId, req.user);

  const filePath = path.join(uploadDir, req.file.filename);
  const sha256 = await sha256File(filePath);

  const evidence = await Evidence.create({
    case: caseDoc._id,
    originalFilename: req.file.originalname,
    storedFilename: req.file.filename,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    sha256,
    uploadedBy: req.user._id,
    description: description || '',
  });

  await recordAudit({
    req,
    action: 'EVIDENCE_UPLOADED',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    details: { caseId: caseDoc._id, sha256, filename: req.file.originalname },
  });
  await recordSecurityEvent({
    req,
    eventType: 'EVIDENCE',
    action: 'EVIDENCE_UPLOAD',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: `Evidence uploaded to case ${caseDoc.caseNumber}`,
  });

  const supervisorsAndAdmins = [...caseDoc.assignedInvestigators.map(String), String(caseDoc.createdBy)];
  await notifyUsers(supervisorsAndAdmins.filter((id) => id !== String(req.user._id)), {
    type: 'EVIDENCE_UPLOADED',
    message: `New evidence uploaded to case ${caseDoc.caseNumber}`,
    link: `/evidence/${evidence._id}`,
  });

  res.status(201).json({ success: true, data: evidence });
});

const listEvidence = asyncHandler(async (req, res) => {
  const { status, caseId, search, page = 1, limit = 20 } = req.query;
  let filter = { isDeleted: false };
  if (status) filter.status = status;
  if (caseId) filter.case = caseId;
  if (search) filter.originalFilename = new RegExp(search, 'i');
  filter = scopeEvidenceToUser(filter, req.user);

  const skip = (Number(page) - 1) * Number(limit);
  const [evidence, total] = await Promise.all([
    Evidence.find(filter)
      .populate('case', 'caseNumber title status')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Evidence.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: evidence,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

const getEvidence = asyncHandler(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.id, isDeleted: false })
    .populate('case', 'caseNumber title status assignedInvestigators')
    .populate('uploadedBy', 'name email')
    .populate('reviewedBy', 'name email');
  if (!evidence) throw new ApiError(404, 'Evidence not found');

  await assertEvidenceAccess(req, evidence);
  await recordAudit({ req, action: 'EVIDENCE_VIEWED', resourceType: 'Evidence', resourceId: evidence._id });

  const chainOfCustody = await AuditLog.find({ resourceType: 'Evidence', resourceId: evidence._id })
    .populate('user', 'name email role')
    .sort({ createdAt: 1 });

  res.json({ success: true, data: { evidence, chainOfCustody } });
});

const approveEvidence = asyncHandler(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.id, isDeleted: false });
  if (!evidence) throw new ApiError(404, 'Evidence not found');
  if (evidence.status !== 'PENDING') throw new ApiError(400, 'Evidence has already been reviewed');

  evidence.status = 'APPROVED';
  evidence.reviewedBy = req.user._id;
  evidence.reviewedAt = new Date();
  await evidence.save();

  await recordAudit({ req, action: 'EVIDENCE_APPROVED', resourceType: 'Evidence', resourceId: evidence._id });
  await recordSecurityEvent({
    req,
    eventType: 'EVIDENCE',
    action: 'EVIDENCE_APPROVED',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    status: 'SUCCESS',
    riskLevel: 'LOW',
  });
  await notifyUsers([evidence.uploadedBy], {
    type: 'EVIDENCE_APPROVED',
    message: 'Your evidence submission was approved',
    link: `/evidence/${evidence._id}`,
  });

  res.json({ success: true, data: evidence });
});

const rejectEvidence = asyncHandler(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.id, isDeleted: false });
  if (!evidence) throw new ApiError(404, 'Evidence not found');
  if (evidence.status !== 'PENDING') throw new ApiError(400, 'Evidence has already been reviewed');

  evidence.status = 'REJECTED';
  evidence.reviewedBy = req.user._id;
  evidence.reviewedAt = new Date();
  evidence.rejectionReason = req.body.reason;
  await evidence.save();

  await recordAudit({
    req,
    action: 'EVIDENCE_REJECTED',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    details: { reason: req.body.reason },
  });
  await recordSecurityEvent({
    req,
    eventType: 'EVIDENCE',
    action: 'EVIDENCE_REJECTED',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: req.body.reason,
  });
  await notifyUsers([evidence.uploadedBy], {
    type: 'EVIDENCE_REJECTED',
    message: `Your evidence submission was rejected: ${req.body.reason}`,
    link: `/evidence/${evidence._id}`,
  });

  res.json({ success: true, data: evidence });
});

const verifyIntegrity = asyncHandler(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.id, isDeleted: false });
  if (!evidence) throw new ApiError(404, 'Evidence not found');
  await assertEvidenceAccess(req, evidence);

  const filePath = path.join(uploadDir, evidence.storedFilename);
  if (!fs.existsSync(filePath)) {
    evidence.lastIntegrityCheck = { checkedAt: new Date(), valid: false };
    await evidence.save();
    await recordAudit({
      req,
      action: 'INTEGRITY_FAILURE',
      resourceType: 'Evidence',
      resourceId: evidence._id,
      details: { reason: 'File missing from storage' },
    });
    await recordSecurityEvent({
      req,
      eventType: 'EVIDENCE',
      action: 'INTEGRITY_FAILURE',
      resourceType: 'Evidence',
      resourceId: evidence._id,
      status: 'FAILURE',
      riskLevel: 'CRITICAL',
      description: 'Evidence file missing from storage during integrity check',
    });
    throw new ApiError(410, 'Evidence file is missing from storage');
  }

  const currentHash = await sha256File(filePath);
  const valid = currentHash === evidence.sha256;

  evidence.lastIntegrityCheck = { checkedAt: new Date(), valid };
  await evidence.save();

  await recordAudit({
    req,
    action: valid ? 'EVIDENCE_INTEGRITY_VERIFIED' : 'INTEGRITY_FAILURE',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    details: { originalHash: evidence.sha256, currentHash },
  });

  await recordSecurityEvent({
    req,
    eventType: 'EVIDENCE',
    action: valid ? 'EVIDENCE_VERIFY' : 'INTEGRITY_FAILURE',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    status: valid ? 'SUCCESS' : 'FAILURE',
    riskLevel: valid ? 'LOW' : 'CRITICAL',
    description: valid ? 'Evidence integrity verified' : 'Evidence hash mismatch detected on verification',
    metadata: { originalHash: evidence.sha256, currentHash },
  });

  if (!valid) {
    await notifyUsers([evidence.uploadedBy], {
      type: 'INTEGRITY_FAILURE',
      message: `Integrity check failed for evidence in ${evidence.storedFilename}`,
      link: `/evidence/${evidence._id}`,
    });
  }

  res.json({ success: true, data: { valid, currentHash, originalHash: evidence.sha256, checkedAt: evidence.lastIntegrityCheck.checkedAt } });
});

const downloadEvidence = asyncHandler(async (req, res) => {
  const evidence = await Evidence.findOne({ _id: req.params.id, isDeleted: false });
  if (!evidence) throw new ApiError(404, 'Evidence not found');
  await assertEvidenceAccess(req, evidence);

  const filePath = path.join(uploadDir, evidence.storedFilename);
  if (!fs.existsSync(filePath)) throw new ApiError(410, 'Evidence file is missing from storage');

  const currentHash = await sha256File(filePath);
  const valid = currentHash === evidence.sha256;
  evidence.lastIntegrityCheck = { checkedAt: new Date(), valid };
  await evidence.save();

  if (!valid) {
    await recordAudit({
      req,
      action: 'INTEGRITY_FAILURE',
      resourceType: 'Evidence',
      resourceId: evidence._id,
      details: { originalHash: evidence.sha256, currentHash, context: 'download blocked' },
    });
    await recordSecurityEvent({
      req,
      eventType: 'EVIDENCE',
      action: 'INTEGRITY_FAILURE',
      resourceType: 'Evidence',
      resourceId: evidence._id,
      status: 'BLOCKED',
      riskLevel: 'CRITICAL',
      description: 'Download blocked — hash mismatch on integrity check',
      metadata: { originalHash: evidence.sha256, currentHash },
    });
    throw new ApiError(409, 'Integrity check failed — download blocked to protect chain of custody');
  }

  await recordAudit({ req, action: 'EVIDENCE_DOWNLOADED', resourceType: 'Evidence', resourceId: evidence._id });
  await recordSecurityEvent({
    req,
    eventType: 'EVIDENCE',
    action: 'EVIDENCE_DOWNLOAD',
    resourceType: 'Evidence',
    resourceId: evidence._id,
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: 'Evidence downloaded after passing integrity check',
  });

  res.download(filePath, evidence.originalFilename);
});

module.exports = {
  uploadEvidence,
  listEvidence,
  getEvidence,
  approveEvidence,
  rejectEvidence,
  verifyIntegrity,
  downloadEvidence,
};
