const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { listAuditLogs } = require('../controllers/auditController');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN', 'SUPERVISOR'));
router.get('/', listAuditLogs);

module.exports = router;
