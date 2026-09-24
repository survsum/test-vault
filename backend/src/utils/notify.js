const Notification = require('../models/Notification');

async function notifyUsers(userIds, { type, message, link = '' }) {
  const ids = [...new Set(userIds.filter(Boolean).map(String))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map((recipient) => ({ recipient, type, message, link })));
}

module.exports = { notifyUsers };
