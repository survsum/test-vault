const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

function caseScope(user) {
  return user.role === 'INVESTIGATOR' ? { assignedInvestigators: user._id, isDeleted: false } : { isDeleted: false };
}

async function evidenceScope(user) {
  if (user.role === 'INVESTIGATOR') return { uploadedBy: user._id, isDeleted: false };
  return { isDeleted: false };
}

const getStats = asyncHandler(async (req, res) => {
  const user = req.user;
  const caseFilter = caseScope(user);
  const evFilter = await evidenceScope(user);

  const [
    totalCases,
    openCases,
    closedCases,
    totalEvidence,
    pendingEvidence,
    approvedEvidence,
    rejectedEvidence,
    recentUploads,
    recentActivity,
    unreadNotifications,
  ] = await Promise.all([
    Case.countDocuments(caseFilter),
    Case.countDocuments({ ...caseFilter, status: 'OPEN' }),
    Case.countDocuments({ ...caseFilter, status: 'CLOSED' }),
    Evidence.countDocuments(evFilter),
    Evidence.countDocuments({ ...evFilter, status: 'PENDING' }),
    Evidence.countDocuments({ ...evFilter, status: 'APPROVED' }),
    Evidence.countDocuments({ ...evFilter, status: 'REJECTED' }),
    Evidence.find(evFilter).populate('case', 'caseNumber title').populate('uploadedBy', 'name').sort({ createdAt: -1 }).limit(5),
    user.role === 'INVESTIGATOR'
      ? AuditLog.find({ user: user._id }).sort({ createdAt: -1 }).limit(8)
      : AuditLog.find().populate('user', 'name role').sort({ createdAt: -1 }).limit(8),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  const monthly = await Evidence.aggregate([
    { $match: { ...evFilter, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalCases,
      openCases,
      closedCases,
      totalEvidence,
      pendingEvidence,
      approvedEvidence,
      rejectedEvidence,
      unreadNotifications,
      recentUploads,
      recentActivity,
      monthlyEvidence: monthly.map((m) => ({ year: m._id.year, month: m._id.month, count: m.count })),
    },
  });
});

module.exports = { getStats };
