const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
const { recordSecurityEvent } = require('../utils/security');
const { notifyUsers } = require('../utils/notify');

async function nextCaseNumber() {
  const year = new Date().getFullYear();
  const count = await Case.countDocuments({ caseNumber: new RegExp(`^CASE-${year}-`) });
  return `CASE-${year}-${String(count + 1).padStart(4, '0')}`;
}

function scopeToUser(filter, user) {
  if (user.role === 'INVESTIGATOR') {
    filter.assignedInvestigators = user._id;
  }
  return filter;
}

const listCases = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  let filter = { isDeleted: false };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };
  filter = scopeToUser(filter, req.user);

  const skip = (Number(page) - 1) * Number(limit);
  const [cases, total] = await Promise.all([
    Case.find(filter)
      .populate('assignedInvestigators', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Case.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: cases,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

const getCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findOne({ _id: req.params.id, isDeleted: false })
    .populate('assignedInvestigators', 'name email')
    .populate('createdBy', 'name email');
  if (!caseDoc) throw new ApiError(404, 'Case not found');

  if (req.user.role === 'INVESTIGATOR' && !caseDoc.assignedInvestigators.some((i) => String(i._id) === String(req.user._id))) {
    await recordSecurityEvent({
      req,
      eventType: 'AUTHORIZATION',
      action: 'UNAUTHORIZED_ACCESS',
      resourceType: 'Case',
      resourceId: caseDoc._id,
      status: 'BLOCKED',
      riskLevel: 'HIGH',
      description: `Investigator attempted to access case ${caseDoc.caseNumber} without assignment`,
    });
    throw new ApiError(403, 'You are not authorized to access this case');
  }

  const evidence = await Evidence.find({ case: caseDoc._id, isDeleted: false })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

  const activity = await AuditLog.find({ resourceType: 'Case', resourceId: caseDoc._id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, data: { case: caseDoc, evidence, activity } });
});

const createCase = asyncHandler(async (req, res) => {
  const { title, description, assignedInvestigators } = req.body;
  const caseNumber = await nextCaseNumber();

  const caseDoc = await Case.create({
    caseNumber,
    title,
    description,
    assignedInvestigators,
    createdBy: req.user._id,
  });

  await recordAudit({ req, action: 'CASE_CREATED', resourceType: 'Case', resourceId: caseDoc._id, details: { caseNumber } });
  if (assignedInvestigators.length) {
    await notifyUsers(assignedInvestigators, {
      type: 'CASE_ASSIGNED',
      message: `You were assigned to case ${caseNumber}: ${title}`,
      link: `/cases/${caseDoc._id}`,
    });
  }

  res.status(201).json({ success: true, data: caseDoc });
});

const updateCase = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findOne({ _id: req.params.id, isDeleted: false });
  if (!caseDoc) throw new ApiError(404, 'Case not found');

  const previousStatus = caseDoc.status;
  Object.assign(caseDoc, req.body);
  if (req.body.status === 'CLOSED' && previousStatus !== 'CLOSED') caseDoc.closedAt = new Date();
  if (req.body.status && req.body.status !== 'CLOSED') caseDoc.closedAt = null;
  await caseDoc.save();

  const action = req.body.status === 'CLOSED' && previousStatus !== 'CLOSED'
    ? 'CASE_CLOSED'
    : req.body.status && previousStatus === 'CLOSED' && req.body.status !== 'CLOSED'
      ? 'CASE_REOPENED'
      : 'CASE_UPDATED';

  await recordAudit({ req, action, resourceType: 'Case', resourceId: caseDoc._id, details: req.body });

  if (caseDoc.assignedInvestigators.length) {
    await notifyUsers(caseDoc.assignedInvestigators, {
      type: 'CASE_UPDATED',
      message: `Case ${caseDoc.caseNumber} was updated`,
      link: `/cases/${caseDoc._id}`,
    });
  }

  res.json({ success: true, data: caseDoc });
});

const assignInvestigators = asyncHandler(async (req, res) => {
  const caseDoc = await Case.findOne({ _id: req.params.id, isDeleted: false });
  if (!caseDoc) throw new ApiError(404, 'Case not found');

  const { investigatorIds } = req.body;
  const newOnes = investigatorIds.filter((id) => !caseDoc.assignedInvestigators.map(String).includes(id));
  caseDoc.assignedInvestigators = [...new Set([...caseDoc.assignedInvestigators.map(String), ...investigatorIds])];
  await caseDoc.save();

  await recordAudit({
    req,
    action: 'INVESTIGATOR_ASSIGNED',
    resourceType: 'Case',
    resourceId: caseDoc._id,
    details: { investigatorIds },
  });

  if (newOnes.length) {
    await notifyUsers(newOnes, {
      type: 'CASE_ASSIGNED',
      message: `You were assigned to case ${caseDoc.caseNumber}: ${caseDoc.title}`,
      link: `/cases/${caseDoc._id}`,
    });
  }

  res.json({ success: true, data: caseDoc });
});

module.exports = { listCases, getCase, createCase, updateCase, assignInvestigators };
