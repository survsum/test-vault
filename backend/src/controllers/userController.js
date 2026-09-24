const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
const { recordSecurityEvent } = require('../utils/security');
const { publicUser } = require('./authController');

const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (status === 'deleted') filter.isDeleted = true;
  if (status !== 'deleted') filter.isDeleted = false;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users.map(publicUser),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: publicUser(user) });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'A user with that email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role, createdBy: req.user._id });

  await recordAudit({ req, action: 'USER_CREATED', resourceType: 'User', resourceId: user._id, details: { role } });
  await recordSecurityEvent({
    req,
    eventType: 'USER',
    action: 'USER_CREATED',
    resourceType: 'User',
    resourceId: user._id,
    status: 'SUCCESS',
    riskLevel: 'LOW',
    description: `Created ${role} account for ${email}`,
  });
  res.status(201).json({ success: true, data: publicUser(user) });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) throw new ApiError(404, 'User not found');

  const wasActive = user.isActive;
  Object.assign(user, req.body);
  await user.save();

  await recordAudit({ req, action: 'USER_UPDATED', resourceType: 'User', resourceId: user._id, details: req.body });
  if (wasActive && user.isActive === false) {
    await recordSecurityEvent({
      req,
      eventType: 'USER',
      action: 'USER_DEACTIVATED',
      resourceType: 'User',
      resourceId: user._id,
      status: 'SUCCESS',
      riskLevel: 'MEDIUM',
      description: `${user.email} was deactivated`,
    });
  }
  res.json({ success: true, data: publicUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) throw new ApiError(404, 'User not found');
  if (String(user._id) === String(req.user._id)) throw new ApiError(400, 'You cannot delete your own account');

  user.isDeleted = true;
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  await recordAudit({ req, action: 'USER_DELETED', resourceType: 'User', resourceId: user._id });
  await recordSecurityEvent({
    req,
    eventType: 'USER',
    action: 'USER_DEACTIVATED',
    resourceType: 'User',
    resourceId: user._id,
    status: 'SUCCESS',
    riskLevel: 'MEDIUM',
    description: `${user.email} was soft-deleted`,
  });
  res.json({ success: true, data: null });
});

const restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !user.isDeleted) throw new ApiError(404, 'Deleted user not found');

  user.isDeleted = false;
  user.isActive = true;
  user.deletedAt = null;
  await user.save();

  await recordAudit({ req, action: 'USER_RESTORED', resourceType: 'User', resourceId: user._id });
  res.json({ success: true, data: publicUser(user) });
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.isDeleted) throw new ApiError(404, 'User not found');

  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.mustChangePassword = true;
  await user.save();

  await recordAudit({ req, action: 'USER_PASSWORD_RESET', resourceType: 'User', resourceId: user._id });
  await recordSecurityEvent({
    req,
    eventType: 'USER',
    action: 'PASSWORD_RESET',
    resourceType: 'User',
    resourceId: user._id,
    status: 'SUCCESS',
    riskLevel: 'MEDIUM',
    description: `Password reset for ${user.email} by admin`,
  });
  res.json({ success: true, data: null });
});

const listInvestigators = asyncHandler(async (req, res) => {
  const investigators = await User.find({ role: 'INVESTIGATOR', isDeleted: false, isActive: true }).select('name email');
  res.json({ success: true, data: investigators });
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  resetPassword,
  listInvestigators,
};
