const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/securityController');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN', 'SUPERVISOR'));

router.get('/stats', ctrl.getStats);
router.get('/events', ctrl.listEvents);
router.get('/events/:id', ctrl.getEvent);
router.get('/alerts', ctrl.getAlerts);
router.get('/login-activity', ctrl.getLoginActivity);
router.get('/export/security-report', ctrl.exportSecurityReport);
router.get('/export/audit-logs', ctrl.exportAuditLogs);
router.get('/export/evidence-activity', ctrl.exportEvidenceActivity);

module.exports = router;
