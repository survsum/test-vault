const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw new ApiError(404, 'Notification not found');
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();
  res.json({ success: true, data: notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, data: null });
});

const clearRead = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id, isRead: true });
  res.json({ success: true, data: null });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  if (!result.deletedCount) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: null });
});

module.exports = { listNotifications, markAsRead, markAllAsRead, clearRead, deleteNotification };
