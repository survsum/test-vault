const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { recordAudit } = require('../utils/audit');
const { recordSecurityEvent, checkFailedLoginThreshold } = require('../utils/security');

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, isDeleted: false });
  if (!user || !user.isActive) {
    await recordSecurityEvent({
      req,
      emailAttempted: email,
      eventType: 'AUTHENTICATION',
      action: 'LOGIN_FAILED',
      status: 'FAILURE',
      description: !user ? 'Login attempt with unknown email' : 'Login attempt on inactive account',
    });
    await checkFailedLoginThreshold(req, email);
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await recordSecurityEvent({
      req,
      user: user._id,
      userRole: user.role,
      emailAttempted: email,
      eventType: 'AUTHENTICATION',
      action: 'LOGIN_FAILED',
      status: 'FAILURE',
      description: 'Incorrect password',
    });
    await checkFailedLoginThreshold(req, email);
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decoded = jwt.decode(refreshToken);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  await recordAudit({ req, user: user._id, action: 'USER_LOGIN', resourceType: 'User', resourceId: user._id });
  await recordSecurityEvent({
    req,
    user: user._id,
    userRole: user.role,
    emailAttempted: email,
    eventType: 'AUTHENTICATION',
    action: 'LOGIN_SUCCESS',
    status: 'SUCCESS',
  });

  res.json({ success: true, data: { user: publicUser(user), accessToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token missing');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token is no longer valid');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.isDeleted || !user.isActive) throw new ApiError(401, 'User no longer has access');

  const newRefreshToken = signRefreshToken(user);
  const decoded = jwt.decode(newRefreshToken);

  stored.revokedAt = new Date();
  stored.replacedByHash = hashToken(newRefreshToken);
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(decoded.exp * 1000),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });

  res.cookie('refreshToken', newRefreshToken, refreshCookieOptions());
  const accessToken = signAccessToken(user);
  await recordSecurityEvent({
    req,
    user: user._id,
    userRole: user.role,
    eventType: 'TOKEN',
    action: 'TOKEN_REFRESH',
    status: 'SUCCESS',
  });
  res.json({ success: true, data: { accessToken, user: publicUser(user) } });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await RefreshToken.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { revokedAt: new Date() });
  }
  res.clearCookie('refreshToken', { path: '/api/auth' });
  if (req.user) {
    await recordAudit({ req, user: req.user._id, action: 'USER_LOGOUT', resourceType: 'User', resourceId: req.user._id });
    await recordSecurityEvent({
      req,
      user: req.user._id,
      userRole: req.user.role,
      eventType: 'AUTHENTICATION',
      action: 'LOGOUT',
      status: 'SUCCESS',
    });
  }
  res.json({ success: true, data: null });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: publicUser(req.user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!valid) throw new ApiError(400, 'Current password is incorrect');

  req.user.passwordHash = await bcrypt.hash(newPassword, 12);
  req.user.mustChangePassword = false;
  await req.user.save();

  await recordAudit({ req, user: req.user._id, action: 'PASSWORD_CHANGED', resourceType: 'User', resourceId: req.user._id });
  res.json({ success: true, data: null });
});

module.exports = { login, refresh, logout, me, changePassword, publicUser, hashToken };
